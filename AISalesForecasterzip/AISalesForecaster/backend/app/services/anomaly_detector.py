import pandas as pd
import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class AnomalyDetector:
    """Detects anomalies in time series data using IQR and Z-score methods"""
    
    @staticmethod
    def detect_anomalies(df: pd.DataFrame, value_column: str = 'actual', 
                        method: str = 'iqr', threshold: float = 1.5) -> List[Dict[str, Any]]:
        """
        Detect anomalies in time series data
        
        Args:
            df: DataFrame with time series data
            value_column: Column name containing values to analyze
            method: 'iqr' or 'zscore'
            threshold: Sensitivity threshold (higher = fewer anomalies)
        
        Returns:
            List of anomaly dictionaries with date, value, anomaly_type, severity
        """
        anomalies = []
        
        if value_column not in df.columns or len(df) < 3:
            return anomalies
        
        values = df[value_column].dropna().values
        
        if method == 'iqr':
            Q1 = np.percentile(values, 25)
            Q3 = np.percentile(values, 75)
            IQR = Q3 - Q1
            
            lower_bound = Q1 - (threshold * IQR)
            upper_bound = Q3 + (threshold * IQR)
            
            for idx, row in df.iterrows():
                value = row[value_column]
                if pd.isna(value):
                    continue
                
                if value < lower_bound or value > upper_bound:
                    # Calculate percentage change from mean
                    mean_val = np.mean(values)
                    pct_change = ((value - mean_val) / mean_val * 100) if mean_val != 0 else 0
                    
                    anomaly_type = "spike" if value > upper_bound else "dip"
                    severity = abs(pct_change)
                    
                    anomalies.append({
                        'date': row['date'].strftime('%Y-%m-%d') if hasattr(row['date'], 'strftime') else str(row['date']),
                        'value': float(value),
                        'anomaly_type': anomaly_type,
                        'severity': round(severity, 1),
                        'description': f"AI detected {anomaly_type} on {row['date'].strftime('%Y-%m-%d')}: {abs(pct_change):.1f}% {'increase' if value > mean_val else 'decrease'}"
                    })
        
        elif method == 'zscore':
            mean = np.mean(values)
            std = np.std(values)
            
            if std == 0:
                return anomalies
            
            for idx, row in df.iterrows():
                value = row[value_column]
                if pd.isna(value):
                    continue
                
                z_score = abs((value - mean) / std)
                
                if z_score > threshold:
                    pct_change = ((value - mean) / mean * 100) if mean != 0 else 0
                    anomaly_type = "spike" if value > mean else "dip"
                    
                    anomalies.append({
                        'date': row['date'].strftime('%Y-%m-%d') if hasattr(row['date'], 'strftime') else str(row['date']),
                        'value': float(value),
                        'anomaly_type': anomaly_type,
                        'severity': round(abs(pct_change), 1),
                        'z_score': round(z_score, 2),
                        'description': f"AI detected {anomaly_type} on {row['date'].strftime('%Y-%m-%d')}: {abs(pct_change):.1f}% change"
                    })
        
        return sorted(anomalies, key=lambda x: x['severity'], reverse=True)[:10]  # Top 10 anomalies


class RecommendationEngine:
    """Generates revenue and business recommendations based on forecast data"""
    
    @staticmethod
    def generate_recommendations(forecast_data: List[Dict], historical_data: List[Dict],
                                feature_importance: List[Dict] = None) -> List[Dict[str, Any]]:
        """
        Generate actionable business recommendations
        
        Args:
            forecast_data: List of forecast points with predictions
            historical_data: List of historical data points
            feature_importance: List of important features
        
        Returns:
            List of recommendation dictionaries
        """
        recommendations = []
        
        if not forecast_data or not historical_data:
            return recommendations
        
        # Calculate growth trend
        avg_historical = np.mean([h.get('actual', 0) for h in historical_data[-12:] if h.get('actual')])
        avg_forecast = np.mean([f.get('predicted', 0) for f in forecast_data[:6]])
        growth_rate = ((avg_forecast - avg_historical) / avg_historical * 100) if avg_historical > 0 else 0
        
        # Recommendation 1: Growth-based pricing
        if growth_rate > 15:
            price_increase = min(growth_rate / 10, 8)  # Cap at 8%
            recommendations.append({
                'id': 'price_optimize',
                'title': 'Optimize Pricing',
                'description': f'Strong growth detected (+{growth_rate:.1f}%). Consider raising prices by {price_increase:.1f}% for maximum revenue.',
                'impact': 'high',
                'action': f'Increase prices by {price_increase:.1f}%',
                'expected_uplift': f'+{price_increase * 0.7:.1f}% revenue'
            })
        elif growth_rate < -10:
            discount = min(abs(growth_rate) / 5, 15)
            recommendations.append({
                'id': 'promotional_discount',
                'title': 'Launch Promotion',
                'description': f'Declining trend detected ({growth_rate:.1f}%). Offer {discount:.1f}% discount to boost volume.',
                'impact': 'high',
                'action': f'Apply {discount:.1f}% promotional discount',
                'expected_uplift': f'+{discount * 1.5:.1f}% volume'
            })
        
        # Recommendation 2: Based on volatility
        forecast_values = [f.get('predicted', 0) for f in forecast_data]
        if forecast_values:
            volatility = np.std(forecast_values) / (np.mean(forecast_values) or 1) * 100
            if volatility > 30:
                recommendations.append({
                    'id': 'inventory_buffer',
                    'title': 'Increase Safety Stock',
                    'description': f'High volatility detected ({volatility:.1f}%). Recommend {int(volatility / 5)} weeks of buffer inventory.',
                    'impact': 'medium',
                    'action': 'Increase safety stock',
                    'expected_uplift': 'Reduce stockout risk by ~40%'
                })
        
        # Recommendation 3: Seasonal opportunity
        if len(historical_data) > 30:
            max_month = max([h.get('actual', 0) for h in historical_data[-12:]])
            min_month = min([h.get('actual', 0) for h in historical_data[-12:]])
            seasonality = ((max_month - min_month) / min_month * 100) if min_month > 0 else 0
            
            if seasonality > 30:
                recommendations.append({
                    'id': 'seasonal_campaign',
                    'title': 'Launch Seasonal Campaign',
                    'description': f'Seasonal pattern detected ({seasonality:.1f}% variation). Target peak season with premium products.',
                    'impact': 'medium',
                    'action': 'Focus marketing on peak season',
                    'expected_uplift': f'+{min(seasonality * 0.3, 25):.1f}% peak period revenue'
                })
        
        # Recommendation 4: Feature-driven opportunity
        if feature_importance and len(feature_importance) > 0:
            top_feature = feature_importance[0]
            if top_feature.get('importance', 0) > 0.2:
                feature_name = top_feature.get('feature', 'Top Driver')
                recommendations.append({
                    'id': 'feature_focus',
                    'title': f'Focus on {feature_name}',
                    'description': f'{feature_name} is the strongest predictor ({top_feature.get("importance", 0):.1%} importance). Optimize this lever.',
                    'impact': 'medium',
                    'action': f'Optimize {feature_name} strategy',
                    'expected_uplift': f'+{min(top_feature.get("importance", 0) * 100, 20):.1f}% accuracy improvement'
                })
        
        return recommendations[:4]  # Return top 4 recommendations


class ScenarioSimulator:
    """Simulates forecast scenarios with parameter changes"""
    
    @staticmethod
    def simulate_scenario(forecast_data: List[Dict], scenario_params: Dict[str, float]) -> Dict[str, Any]:
        """
        Simulate forecast with parameter changes
        
        Args:
            forecast_data: Original forecast data
            scenario_params: Dict with 'price_change' and/or 'volume_change' as percentages
        
        Returns:
            Scenario result with new forecast and impact analysis
        """
        price_change = scenario_params.get('price_change', 0) / 100
        volume_change = scenario_params.get('volume_change', 0) / 100
        
        original_revenue = sum(f.get('predicted', 0) for f in forecast_data)
        
        # Simulate elasticity: for every 1% price change, volume changes by -0.5% (typical elasticity)
        actual_volume_change = volume_change - (price_change * 0.5)
        
        new_forecast = []
        for point in forecast_data:
            new_predicted = point.get('predicted', 0) * (1 + actual_volume_change) * (1 + price_change)
            new_forecast.append({
                **point,
                'predicted_scenario': new_predicted
            })
        
        new_revenue = sum(f.get('predicted_scenario', 0) for f in new_forecast)
        revenue_change = new_revenue - original_revenue
        revenue_change_pct = (revenue_change / original_revenue * 100) if original_revenue > 0 else 0
        
        return {
            'scenario_name': f"Price +{price_change*100:.1f}%, Volume +{volume_change*100:.1f}%",
            'forecast': new_forecast,
            'original_revenue': round(original_revenue, 2),
            'new_revenue': round(new_revenue, 2),
            'revenue_change': round(revenue_change, 2),
            'revenue_change_pct': round(revenue_change_pct, 2),
            'risk_level': 'high' if abs(revenue_change_pct) > 50 else 'medium' if abs(revenue_change_pct) > 20 else 'low'
        }
