import os
import pandas as pd
from fastapi import APIRouter, HTTPException, Query
import logging

from ..models.schemas import InsightsResponse, ForecastMetrics, FeatureImportance
from ..models.database import (
    get_job, get_latest_forecast, save_insights, get_latest_insights
)
from ..services.insights_generator import InsightsGenerator

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/insights", response_model=InsightsResponse)
async def get_insights(job_id: str = Query(..., description="Job ID from forecast")):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    forecast = get_latest_forecast(job_id)
    if not forecast:
        raise HTTPException(
            status_code=404, 
            detail="No forecast found. Please run a forecast first."
        )
    
    try:
        existing_insights = get_latest_insights(job_id)
        if existing_insights:
            return InsightsResponse(
                job_id=job_id,
                title=existing_insights['title'],
                summary=existing_insights['summary'],
                kpis=existing_insights['kpis'],
                bullets=existing_insights['bullets'],
                recommendations=existing_insights['recommendations'],
                generated_at=existing_insights['created_at']
            )
        
        df = pd.read_csv(job['file_path'])
        df['date'] = pd.to_datetime(df['date'])
        
        if 'month' not in df.columns:
            df['month'] = df['date'].dt.month
        
        metrics = ForecastMetrics(**forecast['metrics'])
        
        feature_importance = None
        if forecast['feature_importance']:
            feature_importance = [
                FeatureImportance(**fi) for fi in forecast['feature_importance']
            ]
        
        generator = InsightsGenerator(
            historical_df=df,
            forecast_data=forecast['forecast_data'],
            metrics=metrics,
            target_column=forecast['target_column'],
            feature_importance=feature_importance
        )
        
        insights = generator.generate_insights()
        
        save_insights(
            job_id=job_id,
            title=insights['title'],
            summary=insights['summary'],
            kpis=insights['kpis'],
            bullets=insights['bullets'],
            recommendations=insights['recommendations']
        )
        
        return InsightsResponse(
            job_id=job_id,
            **insights
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Insights generation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating insights: {str(e)}")


@router.post("/insights/regenerate")
async def regenerate_insights(job_id: str = Query(...)):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    forecast = get_latest_forecast(job_id)
    if not forecast:
        raise HTTPException(status_code=404, detail="No forecast found")
    
    try:
        df = pd.read_csv(job['file_path'])
        df['date'] = pd.to_datetime(df['date'])
        
        if 'month' not in df.columns:
            df['month'] = df['date'].dt.month
        
        metrics = ForecastMetrics(**forecast['metrics'])
        
        feature_importance = None
        if forecast['feature_importance']:
            feature_importance = [
                FeatureImportance(**fi) for fi in forecast['feature_importance']
            ]
        
        generator = InsightsGenerator(
            historical_df=df,
            forecast_data=forecast['forecast_data'],
            metrics=metrics,
            target_column=forecast['target_column'],
            feature_importance=feature_importance
        )
        
        insights = generator.generate_insights()
        
        save_insights(
            job_id=job_id,
            title=insights['title'],
            summary=insights['summary'],
            kpis=insights['kpis'],
            bullets=insights['bullets'],
            recommendations=insights['recommendations']
        )
        
        return InsightsResponse(
            job_id=job_id,
            **insights
        )
        
    except Exception as e:
        logger.error(f"Insights regeneration error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error regenerating insights: {str(e)}")
