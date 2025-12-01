import pandas as pd
import numpy as np
from typing import Dict, Tuple, List, Any
import logging

logger = logging.getLogger(__name__)


class BiasDetector:
    """Detects prediction bias in forecasting models"""
    
    @staticmethod
    def calculate_bias_metrics(y_true: np.ndarray, y_pred: np.ndarray, 
                               dates: List[str] = None) -> Dict[str, Any]:
        """
        Calculate bias metrics for predictions
        
        Args:
            y_true: Actual values
            y_pred: Predicted values
            dates: Optional list of dates for quarterly analysis
        
        Returns:
            Dictionary with bias metrics
        """
        residuals = y_true - y_pred
        
        # Overall bias
        mean_bias = np.mean(residuals)
        overall_overprediction = np.sum(residuals < 0) / len(residuals) * 100
        overall_underprediction = np.sum(residuals > 0) / len(residuals) * 100
        
        # Bias percentage (signed percentage error)
        bias_pct = (mean_bias / np.mean(y_true)) * 100 if np.mean(y_true) != 0 else 0
        
        quarterly_bias = {}
        if dates:
            df_temp = pd.DataFrame({
                'date': pd.to_datetime(dates),
                'residual': residuals
            })
            df_temp['quarter'] = df_temp['date'].dt.to_period('Q')
            
            for quarter, group in df_temp.groupby('quarter'):
                q_bias = (np.mean(group['residual']) / np.mean(y_true)) * 100 if np.mean(y_true) != 0 else 0
                quarterly_bias[str(quarter)] = round(q_bias, 2)
        
        # Determine risk level based on volatility of residuals
        residual_std = np.std(residuals)
        residual_mean = np.mean(np.abs(residuals))
        
        if residual_std > residual_mean * 1.5:
            risk_level = 'high'
        elif residual_std > residual_mean * 0.8:
            risk_level = 'medium'
        else:
            risk_level = 'low'
        
        # Confidence score (inverse of MAPE-like metric)
        mean_absolute_percentage_error = np.mean(np.abs(residuals / (np.abs(y_true) + 1))) * 100
        confidence_score = max(0, 100 - mean_absolute_percentage_error)
        
        return {
            'confidence_score': round(confidence_score, 1),
            'risk_level': risk_level,
            'bias_percentage': round(bias_pct, 2),
            'overprediction_bias': round(overall_overprediction, 1),
            'underprediction_bias': round(overall_underprediction, 1),
            'quarterly_bias': quarterly_bias,
            'bias_summary': BiasDetector._generate_bias_summary(bias_pct, quarterly_bias)
        }
    
    @staticmethod
    def _generate_bias_summary(overall_bias: float, quarterly_bias: Dict) -> str:
        """Generate human-readable bias summary"""
        if overall_bias > 5:
            summary = f"Model tends to UNDERPREDICT by {abs(overall_bias):.1f}%"
        elif overall_bias < -5:
            summary = f"Model tends to OVERPREDICT by {abs(overall_bias):.1f}%"
        else:
            summary = f"Model has neutral bias ({overall_bias:.1f}%)"
        
        # Add quarterly insights
        if quarterly_bias:
            worst_quarter = max(quarterly_bias.items(), key=lambda x: abs(x[1]))
            if worst_quarter[1] != 0:
                direction = "underprediction" if worst_quarter[1] > 0 else "overprediction"
                summary += f". Worst bias in {worst_quarter[0]}: {direction} of {abs(worst_quarter[1]):.1f}%"
        
        return summary
