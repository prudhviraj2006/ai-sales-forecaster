import os
import pandas as pd
import numpy as np
from fastapi import APIRouter, HTTPException
from typing import Optional, Any
import logging

from ..models.schemas import (
    ForecastRequest, ForecastResponse, ModelType, AggregationType
)
from ..models.database import (
    get_job, update_job_status, save_forecast, get_latest_forecast
)
from ..services.data_pipeline import DataPipeline
from ..services.forecaster import Forecaster

router = APIRouter()
logger = logging.getLogger(__name__)


def clean_nan_inf(obj: Any) -> Any:
    """Recursively clean NaN and infinity values from nested structures for JSON serialization"""
    if isinstance(obj, dict):
        return {k: clean_nan_inf(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [clean_nan_inf(item) for item in obj]
    elif isinstance(obj, float):
        if np.isnan(obj) or np.isinf(obj):
            return 0.0
        return obj
    else:
        return obj


@router.post("/forecast", response_model=ForecastResponse)
async def run_forecast(request: ForecastRequest):
    job = get_job(request.job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found. Please upload a file first.")
    
    if not os.path.exists(job['file_path']):
        raise HTTPException(status_code=404, detail="Data file not found")
    
    try:
        update_job_status(request.job_id, 'processing')
        
        encodings_to_try = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252', 'iso-8859-1']
        df = None
        for encoding in encodings_to_try:
            try:
                df = pd.read_csv(job['file_path'], encoding=encoding)
                logger.info(f"Successfully parsed forecast CSV with encoding: {encoding}")
                break
            except UnicodeDecodeError:
                continue
        
        if df is None:
            raise HTTPException(status_code=400, detail="Unable to parse CSV file with any known encoding")
        
        pipeline = DataPipeline(df)
        processed_df = pipeline.prepare_for_modeling(
            aggregation=request.aggregation,
            target_column=request.target_column,
            group_by=request.group_by
        )
        
        if request.target_column not in processed_df.columns:
            raise HTTPException(
                status_code=400, 
                detail=f"Target column '{request.target_column}' not found in data"
            )
        
        forecaster = Forecaster(processed_df, request.target_column)
        results = forecaster.forecast(
            model_type=request.model,
            horizon=request.horizon,
            aggregation=request.aggregation
        )
        
        top_products = None
        top_regions = None
        
        if 'product_name' in df.columns or 'product_id' in df.columns:
            product_col = 'product_name' if 'product_name' in df.columns else 'product_id'
            top_products = pipeline.get_top_by_column(df, product_col, request.target_column, n=5)
        
        if 'region' in df.columns:
            top_regions = pipeline.get_top_by_column(df, 'region', request.target_column, n=5)
        
        save_forecast(
            job_id=request.job_id,
            model_type=request.model.value,
            aggregation=request.aggregation.value,
            horizon=request.horizon,
            target_column=request.target_column,
            group_by=request.group_by,
            metrics=results['metrics'].model_dump(),
            forecast_data=[f.model_dump() for f in results['forecast']],
            historical_data=[h.model_dump() for h in results['historical']],
            decomposition_data=results['decomposition'].model_dump() if results['decomposition'] else None,
            feature_importance=[fi.model_dump() for fi in results['feature_importance']] if results['feature_importance'] else None,
            top_products=top_products,
            top_regions=top_regions
        )
        
        update_job_status(request.job_id, 'completed')
        
        # Clean NaN/infinity values from response data
        metrics_dict = clean_nan_inf(results['metrics'].model_dump())
        forecast_data = clean_nan_inf([f.model_dump() for f in results['forecast']])
        historical_data = clean_nan_inf([h.model_dump() for h in results['historical']])
        decomp_data = clean_nan_inf(results['decomposition'].model_dump()) if results['decomposition'] else None
        feat_imp = clean_nan_inf([fi.model_dump() for fi in results['feature_importance']]) if results['feature_importance'] else None
        
        return ForecastResponse(
            job_id=request.job_id,
            model_type=request.model.value,
            aggregation=request.aggregation.value,
            horizon=request.horizon,
            target_column=request.target_column,
            metrics=metrics_dict,
            forecast=forecast_data,
            historical=historical_data,
            decomposition=decomp_data,
            feature_importance=feat_imp,
            top_products=top_products,
            top_regions=top_regions
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Forecast error: {str(e)}")
        update_job_status(request.job_id, 'error')
        raise HTTPException(status_code=500, detail=f"Forecasting error: {str(e)}")


@router.get("/forecast/{job_id}")
async def get_forecast(job_id: str):
    forecast = get_latest_forecast(job_id)
    if not forecast:
        raise HTTPException(status_code=404, detail="No forecast found for this job")
    
    return {
        'job_id': job_id,
        'model_type': forecast['model_type'],
        'aggregation': forecast['aggregation'],
        'horizon': forecast['horizon'],
        'target_column': forecast['target_column'],
        'metrics': forecast['metrics'],
        'forecast': forecast['forecast_data'],
        'historical': forecast['historical_data'],
        'decomposition': forecast['decomposition_data'],
        'feature_importance': forecast['feature_importance'],
        'top_products': forecast['top_products'],
        'top_regions': forecast['top_regions'],
        'created_at': forecast['created_at']
    }
