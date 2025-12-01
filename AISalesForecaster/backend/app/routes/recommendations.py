import logging
import pandas as pd
import json
from fastapi import APIRouter, HTTPException
from ..models.database import get_latest_forecast
from ..services.anomaly_detector import AnomalyDetector, RecommendationEngine, ScenarioSimulator

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/anomalies/{job_id}")
async def get_anomalies(job_id: str):
    """Get detected anomalies for a forecast"""
    try:
        forecast = get_latest_forecast(job_id)
        if not forecast:
            raise HTTPException(status_code=404, detail="Forecast not found")
        
        historical_data = json.loads(forecast['historical_data'])
        anomalies = AnomalyDetector.detect_anomalies(
            pd.DataFrame(historical_data),
            value_column='actual'
        )
        
        return {
            'job_id': job_id,
            'anomalies': anomalies,
            'count': len(anomalies)
        }
    except Exception as e:
        logger.error(f"Error detecting anomalies: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommendations/{job_id}")
async def get_recommendations(job_id: str):
    """Get AI recommendations for revenue optimization"""
    try:
        forecast = get_latest_forecast(job_id)
        if not forecast:
            raise HTTPException(status_code=404, detail="Forecast not found")
        
        forecast_data = json.loads(forecast['forecast_data'])
        historical_data = json.loads(forecast['historical_data'])
        feature_importance = json.loads(forecast['feature_importance']) if forecast['feature_importance'] else None
        
        recommendations = RecommendationEngine.generate_recommendations(
            forecast_data,
            historical_data,
            feature_importance
        )
        
        return {
            'job_id': job_id,
            'recommendations': recommendations,
            'count': len(recommendations)
        }
    except Exception as e:
        logger.error(f"Error generating recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scenario/{job_id}")
async def run_scenario(job_id: str, scenario_params: dict):
    """Simulate forecast with parameter changes"""
    try:
        forecast = get_latest_forecast(job_id)
        if not forecast:
            raise HTTPException(status_code=404, detail="Forecast not found")
        
        forecast_data = json.loads(forecast['forecast_data'])
        
        result = ScenarioSimulator.simulate_scenario(forecast_data, scenario_params)
        
        return result
    except Exception as e:
        logger.error(f"Error simulating scenario: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
