import pytest
import pandas as pd
import numpy as np
from datetime import datetime
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.forecaster import Forecaster
from app.services.data_pipeline import DataPipeline
from app.models.schemas import ModelType, AggregationType


def create_forecast_ready_df(n_rows=365):
    dates = pd.date_range(start='2023-01-01', periods=n_rows, freq='D')
    
    base_revenue = 1000
    seasonal = np.sin(np.linspace(0, 4*np.pi, n_rows)) * 200
    trend = np.linspace(0, 200, n_rows)
    noise = np.random.normal(0, 50, n_rows)
    
    revenue = base_revenue + seasonal + trend + noise
    revenue = np.maximum(revenue, 100)
    
    df = pd.DataFrame({
        'date': dates,
        'revenue': revenue.round(2),
        'units_sold': (revenue / 25).astype(int),
        'price': 25.0,
        'promotion_flag': np.random.choice([0, 1], n_rows, p=[0.85, 0.15])
    })
    
    pipeline = DataPipeline(df)
    return pipeline.prepare_for_modeling(
        aggregation=AggregationType.DAILY,
        target_column='revenue'
    )


class TestForecaster:
    @pytest.fixture
    def sample_df(self):
        return create_forecast_ready_df(n_rows=200)
    
    def test_forecaster_initialization(self, sample_df):
        forecaster = Forecaster(sample_df, 'revenue')
        
        assert forecaster.df is not None
        assert forecaster.target_column == 'revenue'
        assert forecaster.model is None
    
    def test_prophet_forecast(self, sample_df):
        forecaster = Forecaster(sample_df, 'revenue')
        results = forecaster.train_prophet(horizon=3, aggregation=AggregationType.DAILY)
        
        assert 'forecast' in results
        assert 'historical' in results
        assert 'metrics' in results
        assert len(results['forecast']) > 0
        
        assert results['metrics'].mae > 0
        assert results['metrics'].rmse > 0
        assert 0 <= results['metrics'].mape <= 100
    
    def test_lightgbm_forecast(self, sample_df):
        forecaster = Forecaster(sample_df, 'revenue')
        results = forecaster.train_lightgbm(horizon=3, aggregation=AggregationType.DAILY)
        
        assert 'forecast' in results
        assert 'historical' in results
        assert 'metrics' in results
        assert 'feature_importance' in results
        assert len(results['forecast']) > 0
    
    def test_forecast_with_model_type(self, sample_df):
        forecaster = Forecaster(sample_df, 'revenue')
        
        prophet_results = forecaster.forecast(
            model_type=ModelType.PROPHET,
            horizon=3,
            aggregation=AggregationType.DAILY
        )
        
        assert prophet_results is not None
        assert len(prophet_results['forecast']) > 0
    
    def test_forecast_points_structure(self, sample_df):
        forecaster = Forecaster(sample_df, 'revenue')
        results = forecaster.train_prophet(horizon=3, aggregation=AggregationType.DAILY)
        
        forecast_point = results['forecast'][0]
        assert hasattr(forecast_point, 'date')
        assert hasattr(forecast_point, 'predicted')
        assert hasattr(forecast_point, 'lower_bound')
        assert hasattr(forecast_point, 'upper_bound')
    
    def test_historical_points_have_actuals(self, sample_df):
        forecaster = Forecaster(sample_df, 'revenue')
        results = forecaster.train_prophet(horizon=3, aggregation=AggregationType.DAILY)
        
        hist_point = results['historical'][0]
        assert hasattr(hist_point, 'actual')
        assert hist_point.actual is not None
    
    def test_metrics_calculation(self, sample_df):
        forecaster = Forecaster(sample_df, 'revenue')
        results = forecaster.train_prophet(horizon=3, aggregation=AggregationType.DAILY)
        
        metrics = results['metrics']
        assert metrics.train_size > 0
        assert metrics.test_size > 0
        assert metrics.mae >= 0
        assert metrics.rmse >= 0
    
    def test_decomposition_for_prophet(self, sample_df):
        forecaster = Forecaster(sample_df, 'revenue')
        results = forecaster.train_prophet(horizon=3, aggregation=AggregationType.DAILY)
        
        assert results['decomposition'] is not None
        assert len(results['decomposition'].trend) > 0
        assert len(results['decomposition'].seasonal) > 0
    
    def test_feature_importance_for_lightgbm(self, sample_df):
        forecaster = Forecaster(sample_df, 'revenue')
        results = forecaster.train_lightgbm(horizon=3, aggregation=AggregationType.DAILY)
        
        assert results['feature_importance'] is not None
        assert len(results['feature_importance']) > 0
        
        fi = results['feature_importance'][0]
        assert hasattr(fi, 'feature')
        assert hasattr(fi, 'importance')


class TestForecasterEdgeCases:
    def test_small_dataset(self):
        df = create_forecast_ready_df(n_rows=50)
        forecaster = Forecaster(df, 'revenue')
        
        results = forecaster.train_prophet(horizon=1, aggregation=AggregationType.DAILY)
        assert results is not None
    
    def test_forecast_values_positive(self):
        df = create_forecast_ready_df(n_rows=200)
        forecaster = Forecaster(df, 'revenue')
        results = forecaster.train_prophet(horizon=3, aggregation=AggregationType.DAILY)
        
        for point in results['forecast']:
            assert point.predicted >= 0


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
