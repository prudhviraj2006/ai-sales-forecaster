import pytest
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.services.data_pipeline import DataPipeline
from app.models.schemas import AggregationType


def create_sample_df(n_rows=100):
    dates = pd.date_range(start='2023-01-01', periods=n_rows, freq='D')
    return pd.DataFrame({
        'date': dates,
        'product_id': ['SKU001'] * n_rows,
        'product_name': ['Product A'] * n_rows,
        'region': np.random.choice(['North', 'South', 'East', 'West'], n_rows),
        'units_sold': np.random.randint(10, 100, n_rows),
        'revenue': np.random.uniform(100, 1000, n_rows).round(2),
        'price': np.random.uniform(10, 50, n_rows).round(2),
        'promotion_flag': np.random.choice([0, 1], n_rows, p=[0.8, 0.2])
    })


class TestDataPipeline:
    def test_validate_valid_data(self):
        df = create_sample_df()
        pipeline = DataPipeline(df)
        result = pipeline.validate()
        
        assert result.is_valid == True
        assert len(result.errors) == 0
        assert result.row_count == 100
        assert result.column_count == 8
    
    def test_validate_missing_date_column(self):
        df = create_sample_df()
        df = df.drop(columns=['date'])
        pipeline = DataPipeline(df)
        result = pipeline.validate()
        
        assert result.is_valid == False
        assert any('date' in err.lower() for err in result.errors)
    
    def test_validate_date_range(self):
        df = create_sample_df()
        pipeline = DataPipeline(df)
        result = pipeline.validate()
        
        assert result.date_range is not None
        assert 'start' in result.date_range
        assert 'end' in result.date_range
    
    def test_clean_data(self):
        df = create_sample_df()
        df.loc[0, 'revenue'] = np.nan
        df.loc[1, 'units_sold'] = np.nan
        
        pipeline = DataPipeline(df)
        cleaned = pipeline.clean_data()
        
        assert cleaned['revenue'].isna().sum() == 0
        assert cleaned['units_sold'].isna().sum() == 0
    
    def test_handle_outliers(self):
        df = create_sample_df()
        df.loc[0, 'revenue'] = 1000000
        
        pipeline = DataPipeline(df)
        pipeline.clean_data()
        result = pipeline.handle_outliers(['revenue'])
        
        assert result['revenue'].max() < 1000000
    
    def test_aggregate_monthly(self):
        df = create_sample_df(n_rows=365)
        pipeline = DataPipeline(df)
        
        aggregated = pipeline.aggregate(AggregationType.MONTHLY, 'revenue')
        
        assert len(aggregated) <= 12
        assert 'date' in aggregated.columns
        assert 'revenue' in aggregated.columns
    
    def test_aggregate_weekly(self):
        df = create_sample_df(n_rows=100)
        pipeline = DataPipeline(df)
        
        aggregated = pipeline.aggregate(AggregationType.WEEKLY, 'revenue')
        
        assert len(aggregated) <= 15
        assert 'date' in aggregated.columns
    
    def test_engineer_features(self):
        df = create_sample_df()
        pipeline = DataPipeline(df)
        aggregated = pipeline.aggregate(AggregationType.DAILY, 'revenue')
        featured = pipeline.engineer_features(aggregated, 'revenue')
        
        assert 'year' in featured.columns
        assert 'month' in featured.columns
        assert 'day_of_week' in featured.columns
        assert 'revenue_lag_1' in featured.columns
        assert 'revenue_rolling_mean_7' in featured.columns
    
    def test_get_preview(self):
        df = create_sample_df()
        pipeline = DataPipeline(df)
        preview = pipeline.get_preview(n=5)
        
        assert len(preview) == 5
        assert isinstance(preview, list)
        assert isinstance(preview[0], dict)
    
    def test_get_column_info(self):
        df = create_sample_df()
        pipeline = DataPipeline(df)
        all_cols, numeric_cols, categorical_cols = pipeline.get_column_info()
        
        assert 'revenue' in numeric_cols
        assert 'units_sold' in numeric_cols
        assert 'region' in categorical_cols
    
    def test_prepare_for_modeling(self):
        df = create_sample_df(n_rows=100)
        pipeline = DataPipeline(df)
        result = pipeline.prepare_for_modeling(
            aggregation=AggregationType.DAILY,
            target_column='revenue'
        )
        
        assert 'date' in result.columns
        assert 'revenue' in result.columns
        assert len(result) > 0


class TestDataPipelineEdgeCases:
    def test_empty_dataframe(self):
        df = pd.DataFrame()
        pipeline = DataPipeline(df)
        result = pipeline.validate()
        
        assert result.row_count == 0
    
    def test_single_row(self):
        df = create_sample_df(n_rows=1)
        pipeline = DataPipeline(df)
        result = pipeline.validate()
        
        assert result.is_valid == True
        assert result.row_count == 1
    
    def test_missing_numeric_columns(self):
        df = pd.DataFrame({
            'date': pd.date_range(start='2023-01-01', periods=10),
            'category': ['A'] * 10
        })
        pipeline = DataPipeline(df)
        result = pipeline.validate()
        
        assert any('numeric' in w.lower() for w in result.warnings)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
