import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Optional, Any
from datetime import datetime, timedelta
import logging
import warnings

from prophet import Prophet
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error

# Lazy import of lightgbm to avoid loading system libraries at module level
lgb = None

from ..models.schemas import (
    ModelType, AggregationType, ForecastMetrics, 
    ForecastPoint, DecompositionData, FeatureImportance
)
from .bias_detector import BiasDetector

warnings.filterwarnings('ignore')
logger = logging.getLogger(__name__)


def _import_lightgbm():
    """Lazy import LightGBM to avoid system library loading at module init"""
    global lgb
    if lgb is None:
        try:
            import lightgbm as lgb_module
            lgb = lgb_module
        except (ImportError, OSError) as e:
            logger.error(f"Failed to import lightgbm: {e}")
            raise
    return lgb


class Forecaster:
    def __init__(self, df: pd.DataFrame, target_column: str = 'revenue'):
        self.df = df.copy()
        self.target_column = target_column
        self.model = None
        self.model_type = None
        self.metrics = None
        self.feature_importance = None
    
    def _calculate_metrics(self, y_true: np.ndarray, y_pred: np.ndarray, dates: list = None) -> ForecastMetrics:
        mae = mean_absolute_error(y_true, y_pred)
        rmse = np.sqrt(mean_squared_error(y_true, y_pred))
        
        with np.errstate(divide='ignore', invalid='ignore'):
            mape = np.mean(np.abs((y_true - y_pred) / np.where(y_true == 0, 1, y_true))) * 100
            mape = min(mape, 100.0)
        
        # Calculate bias metrics
        bias_metrics = BiasDetector.calculate_bias_metrics(y_true, y_pred, dates)
        
        return ForecastMetrics(
            mae=round(mae, 2),
            rmse=round(rmse, 2),
            mape=round(mape, 2),
            train_size=len(y_true),
            test_size=len(y_pred),
            confidence_score=bias_metrics.get('confidence_score'),
            risk_level=bias_metrics.get('risk_level'),
            overprediction_bias=bias_metrics.get('overprediction_bias'),
            underprediction_bias=bias_metrics.get('underprediction_bias')
        )
    
    def _get_forecast_periods(self, horizon: int, aggregation: AggregationType, 
                               last_date: datetime) -> pd.DatetimeIndex:
        if aggregation == AggregationType.DAILY:
            periods = horizon * 30
            freq = 'D'
        elif aggregation == AggregationType.WEEKLY:
            periods = horizon * 4
            freq = 'W'
        else:
            periods = horizon
            freq = 'M'
        
        future_dates = pd.date_range(
            start=last_date + timedelta(days=1),
            periods=periods,
            freq=freq
        )
        return future_dates
    
    def train_prophet(self, horizon: int = 6, 
                      aggregation: AggregationType = AggregationType.MONTHLY) -> Dict[str, Any]:
        self.model_type = ModelType.PROPHET
        
        prophet_df = self.df[['date', self.target_column]].copy()
        prophet_df.columns = ['ds', 'y']
        prophet_df = prophet_df.dropna()
        
        train_size = int(len(prophet_df) * 0.8)
        train_df = prophet_df.iloc[:train_size]
        test_df = prophet_df.iloc[train_size:]
        
        self.model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=aggregation == AggregationType.DAILY,
            daily_seasonality=False,
            changepoint_prior_scale=0.05,
            seasonality_prior_scale=10,
            interval_width=0.95
        )
        
        if 'promotion_flag' in self.df.columns:
            self.model.add_regressor('promotion_flag')
            train_df = train_df.merge(
                self.df[['date', 'promotion_flag']].rename(columns={'date': 'ds'}),
                on='ds', how='left'
            ).fillna(0)
        
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            self.model.fit(train_df)
        
        test_forecast = self.model.predict(test_df[['ds']])
        self.metrics = self._calculate_metrics(
            test_df['y'].values, 
            test_forecast['yhat'].values
        )
        
        future_dates = self._get_forecast_periods(horizon, aggregation, prophet_df['ds'].max())
        future_df = pd.DataFrame({'ds': future_dates})
        
        if 'promotion_flag' in self.df.columns:
            future_df['promotion_flag'] = 0
        
        forecast = self.model.predict(future_df)
        
        forecast_points = []
        for _, row in forecast.iterrows():
            forecast_points.append(ForecastPoint(
                date=row['ds'].strftime('%Y-%m-%d'),
                predicted=max(0, round(row['yhat'], 2)),
                lower_bound=max(0, round(row['yhat_lower'], 2)),
                upper_bound=round(row['yhat_upper'], 2)
            ))
        
        historical_points = []
        historical_forecast = self.model.predict(prophet_df[['ds']])
        for (_, row), (_, hist_row) in zip(prophet_df.iterrows(), historical_forecast.iterrows()):
            historical_points.append(ForecastPoint(
                date=row['ds'].strftime('%Y-%m-%d'),
                actual=round(row['y'], 2),
                predicted=max(0, round(hist_row['yhat'], 2)),
                lower_bound=max(0, round(hist_row['yhat_lower'], 2)),
                upper_bound=round(hist_row['yhat_upper'], 2)
            ))
        
        decomposition = self._extract_prophet_decomposition(prophet_df)
        
        return {
            'forecast': forecast_points,
            'historical': historical_points,
            'metrics': self.metrics,
            'decomposition': decomposition,
            'feature_importance': None
        }
    
    def _extract_prophet_decomposition(self, df: pd.DataFrame) -> DecompositionData:
        forecast = self.model.predict(df[['ds']])
        
        trend_data = []
        seasonal_data = []
        residual_data = []
        
        for idx, row in forecast.iterrows():
            date_str = row['ds'].strftime('%Y-%m-%d')
            actual = df.iloc[idx]['y'] if idx < len(df) else None
            
            trend_data.append({
                'date': date_str,
                'value': round(row['trend'], 2)
            })
            
            yearly_seasonal = row.get('yearly', 0)
            weekly_seasonal = row.get('weekly', 0) if 'weekly' in row else 0
            total_seasonal = yearly_seasonal + weekly_seasonal
            
            seasonal_data.append({
                'date': date_str,
                'value': round(total_seasonal, 2)
            })
            
            if actual is not None:
                residual = actual - row['yhat']
                residual_data.append({
                    'date': date_str,
                    'value': round(residual, 2)
                })
        
        return DecompositionData(
            trend=trend_data,
            seasonal=seasonal_data,
            residual=residual_data
        )
    
    def _clean_nan_inf(self, value: float) -> float:
        """Clean NaN and infinity values for JSON serialization"""
        if value is None:
            return 0.0
        if np.isnan(value) or np.isinf(value):
            return 0.0
        return float(value)

    def train_lightgbm(self, horizon: int = 6,
                       aggregation: AggregationType = AggregationType.MONTHLY) -> Dict[str, Any]:
        _import_lightgbm()
        
        self.model_type = ModelType.LIGHTGBM
        
        df = self.df.copy()
        df = df.sort_values('date')
        
        exclude_cols = ['date', self.target_column, 'holiday_name']
        if 'product_id' in df.columns:
            exclude_cols.append('product_id')
        if 'product_name' in df.columns:
            exclude_cols.append('product_name')
        if 'region' in df.columns:
            exclude_cols.append('region')
        
        feature_cols = [col for col in df.columns 
                       if col not in exclude_cols 
                       and df[col].dtype in ['int64', 'float64', 'int32', 'float32']]
        
        X = df[feature_cols].fillna(0)
        y = df[self.target_column].fillna(0)
        
        train_size = int(len(df) * 0.8)
        X_train, X_test = X.iloc[:train_size], X.iloc[train_size:]
        y_train, y_test = y.iloc[:train_size], y.iloc[train_size:]
        
        params = {
            'objective': 'regression',
            'metric': 'rmse',
            'boosting_type': 'gbdt',
            'num_leaves': 31,
            'learning_rate': 0.05,
            'feature_fraction': 0.8,
            'bagging_fraction': 0.8,
            'bagging_freq': 5,
            'verbose': -1,
            'n_estimators': 100
        }
        
        self.model = lgb.LGBMRegressor(**params)
        self.model.fit(X_train, y_train, eval_set=[(X_test, y_test)])
        
        y_pred = self.model.predict(X_test)
        y_pred = np.array([self._clean_nan_inf(v) for v in y_pred])
        self.metrics = self._calculate_metrics(y_test.values, y_pred)
        
        importances = self.model.feature_importances_
        importance_sum = float(np.sum(importances)) if np.sum(importances) > 0 else 1.0
        self.feature_importance = [
            FeatureImportance(
                feature=feat, 
                importance=round(self._clean_nan_inf(imp) / importance_sum * 100, 2)
            )
            for feat, imp in sorted(zip(feature_cols, importances), 
                                   key=lambda x: x[1], reverse=True)[:10]
        ]
        
        last_date = df['date'].max()
        future_dates = self._get_forecast_periods(horizon, aggregation, last_date)
        
        last_row = df.iloc[-1].copy()
        forecast_points = []
        
        for future_date in future_dates:
            future_features = self._create_future_features(last_row, future_date, feature_cols)
            prediction = max(0, self.model.predict([future_features])[0])
            prediction = self._clean_nan_inf(prediction)
            
            std_dev = self._clean_nan_inf(np.std(y) * 0.1)
            forecast_points.append(ForecastPoint(
                date=future_date.strftime('%Y-%m-%d'),
                predicted=round(prediction, 2),
                lower_bound=max(0, round(prediction - 1.96 * std_dev, 2)),
                upper_bound=round(prediction + 1.96 * std_dev, 2)
            ))
            
            last_row[self.target_column] = prediction
        
        historical_points = []
        y_hist_pred = self.model.predict(X)
        y_hist_pred = np.array([self._clean_nan_inf(v) for v in y_hist_pred])
        
        for idx, (_, row) in enumerate(df.iterrows()):
            std_dev = self._clean_nan_inf(np.std(y) * 0.1)
            historical_points.append(ForecastPoint(
                date=row['date'].strftime('%Y-%m-%d'),
                actual=round(row[self.target_column], 2),
                predicted=max(0, round(y_hist_pred[idx], 2)),
                lower_bound=max(0, round(y_hist_pred[idx] - 1.96 * std_dev, 2)),
                upper_bound=round(y_hist_pred[idx] + 1.96 * std_dev, 2)
            ))
        
        return {
            'forecast': forecast_points,
            'historical': historical_points,
            'metrics': self.metrics,
            'decomposition': None,
            'feature_importance': self.feature_importance
        }
    
    def _create_future_features(self, last_row: pd.Series, 
                                future_date: pd.Timestamp,
                                feature_cols: List[str]) -> List[float]:
        features = []
        
        for col in feature_cols:
            if col == 'year':
                features.append(future_date.year)
            elif col == 'month':
                features.append(future_date.month)
            elif col == 'day':
                features.append(future_date.day)
            elif col == 'day_of_week':
                features.append(future_date.dayofweek)
            elif col == 'week_of_year':
                features.append(future_date.isocalendar()[1])
            elif col == 'quarter':
                features.append((future_date.month - 1) // 3 + 1)
            elif col == 'is_weekend':
                features.append(1 if future_date.dayofweek >= 5 else 0)
            elif col == 'is_month_start':
                features.append(1 if future_date.day == 1 else 0)
            elif col == 'is_month_end':
                features.append(1 if future_date.day == future_date.days_in_month else 0)
            elif col in last_row:
                features.append(float(last_row[col]) if pd.notna(last_row[col]) else 0)
            else:
                features.append(0)
        
        return features
    
    def forecast(self, model_type: ModelType, horizon: int = 6,
                 aggregation: AggregationType = AggregationType.MONTHLY) -> Dict[str, Any]:
        # If LightGBM is requested but unavailable, fall back to Prophet
        if model_type == ModelType.LIGHTGBM:
            try:
                _import_lightgbm()
            except Exception as e:
                logger.warning(f"LightGBM unavailable, falling back to Prophet: {e}")
                model_type = ModelType.PROPHET
        
        if model_type == ModelType.PROPHET:
            return self.train_prophet(horizon, aggregation)
        else:
            return self.train_lightgbm(horizon, aggregation)
