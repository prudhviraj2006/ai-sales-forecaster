import pytest
import pandas as pd
import numpy as np
from datetime import datetime
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.insights_generator import InsightsGenerator
from app.models.schemas import ForecastMetrics, FeatureImportance


def create_sample_historical_df(n_rows=365):
    dates = pd.date_range(start='2023-01-01', periods=n_rows, freq='D')
    
    return pd.DataFrame({
        'date': dates,
        'month': dates.month,
        'revenue': np.random.uniform(1000, 5000, n_rows).round(2),
        'units_sold': np.random.randint(50, 200, n_rows),
        'price': np.random.uniform(20, 50, n_rows).round(2),
        'promotion_flag': np.random.choice([0, 1], n_rows, p=[0.85, 0.15])
    })


def create_sample_forecast():
    return [
        {'date': '2024-01-01', 'predicted': 5000.0, 'lower_bound': 4500.0, 'upper_bound': 5500.0},
        {'date': '2024-02-01', 'predicted': 5200.0, 'lower_bound': 4700.0, 'upper_bound': 5700.0},
        {'date': '2024-03-01', 'predicted': 5500.0, 'lower_bound': 5000.0, 'upper_bound': 6000.0},
    ]


def create_sample_metrics():
    return ForecastMetrics(
        mae=150.5,
        rmse=200.3,
        mape=8.5,
        train_size=280,
        test_size=70
    )


class TestInsightsGenerator:
    @pytest.fixture
    def sample_generator(self):
        df = create_sample_historical_df()
        forecast = create_sample_forecast()
        metrics = create_sample_metrics()
        
        return InsightsGenerator(
            historical_df=df,
            forecast_data=forecast,
            metrics=metrics,
            target_column='revenue'
        )
    
    def test_generate_title(self, sample_generator):
        title = sample_generator.generate_title()
        
        assert isinstance(title, str)
        assert len(title) > 0
        assert 'Forecast' in title
    
    def test_generate_summary(self, sample_generator):
        summary = sample_generator.generate_summary()
        
        assert isinstance(summary, str)
        assert len(summary) > 0
        assert 'revenue' in summary.lower()
    
    def test_generate_kpis(self, sample_generator):
        kpis = sample_generator.generate_kpis()
        
        assert isinstance(kpis, list)
        assert len(kpis) > 0
        
        for kpi in kpis:
            assert hasattr(kpi, 'name')
            assert hasattr(kpi, 'value')
            assert hasattr(kpi, 'trend')
    
    def test_generate_bullets(self, sample_generator):
        bullets = sample_generator.generate_bullets()
        
        assert isinstance(bullets, list)
        assert len(bullets) > 0
        
        for bullet in bullets:
            assert hasattr(bullet, 'icon')
            assert hasattr(bullet, 'text')
            assert hasattr(bullet, 'severity')
    
    def test_generate_recommendations(self, sample_generator):
        recommendations = sample_generator.generate_recommendations()
        
        assert isinstance(recommendations, list)
        assert len(recommendations) == 3
        
        for rec in recommendations:
            assert hasattr(rec, 'category')
            assert hasattr(rec, 'title')
            assert hasattr(rec, 'description')
            assert hasattr(rec, 'priority')
    
    def test_generate_insights_complete(self, sample_generator):
        insights = sample_generator.generate_insights()
        
        assert 'title' in insights
        assert 'summary' in insights
        assert 'kpis' in insights
        assert 'bullets' in insights
        assert 'recommendations' in insights
        assert 'generated_at' in insights
    
    def test_with_feature_importance(self):
        df = create_sample_historical_df()
        forecast = create_sample_forecast()
        metrics = create_sample_metrics()
        
        feature_importance = [
            FeatureImportance(feature='month', importance=25.5),
            FeatureImportance(feature='revenue_lag_1', importance=20.3),
            FeatureImportance(feature='day_of_week', importance=15.2),
        ]
        
        generator = InsightsGenerator(
            historical_df=df,
            forecast_data=forecast,
            metrics=metrics,
            target_column='revenue',
            feature_importance=feature_importance
        )
        
        bullets = generator.generate_bullets()
        
        driver_bullet = [b for b in bullets if 'driver' in b.text.lower()]
        assert len(driver_bullet) > 0


class TestInsightsQuality:
    def test_high_accuracy_title(self):
        df = create_sample_historical_df()
        forecast = create_sample_forecast()
        
        metrics = ForecastMetrics(mae=50, rmse=70, mape=5.0, train_size=280, test_size=70)
        
        generator = InsightsGenerator(df, forecast, metrics, 'revenue')
        title = generator.generate_title()
        
        assert 'High-Confidence' in title
    
    def test_low_accuracy_title(self):
        df = create_sample_historical_df()
        forecast = create_sample_forecast()
        
        metrics = ForecastMetrics(mae=500, rmse=700, mape=35.0, train_size=280, test_size=70)
        
        generator = InsightsGenerator(df, forecast, metrics, 'revenue')
        title = generator.generate_title()
        
        assert 'Indicative' in title
    
    def test_seasonality_detection(self):
        dates = pd.date_range(start='2023-01-01', periods=365, freq='D')
        
        seasonal_pattern = np.sin(np.linspace(0, 4*np.pi, 365)) * 500 + 2000
        
        df = pd.DataFrame({
            'date': dates,
            'month': dates.month,
            'revenue': seasonal_pattern,
            'units_sold': (seasonal_pattern / 20).astype(int),
            'price': 20.0,
            'promotion_flag': 0
        })
        
        generator = InsightsGenerator(
            df, 
            create_sample_forecast(), 
            create_sample_metrics(),
            'revenue'
        )
        
        bullets = generator.generate_bullets()
        seasonal_bullets = [b for b in bullets if 'peak' in b.text.lower() or 'seasonal' in b.text.lower()]
        assert len(seasonal_bullets) > 0


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
