import pandas as pd
import numpy as np
from typing import Dict, List, Optional, Any
from datetime import datetime
import logging

from ..models.schemas import (
    InsightBullet, Recommendation, KPISnapshot,
    ForecastMetrics, FeatureImportance
)
from ..utils.helpers import format_number, format_percentage, calculate_change_percentage

logger = logging.getLogger(__name__)


class InsightsGenerator:
    def __init__(self, historical_df: pd.DataFrame, forecast_data: List[Dict],
                 metrics: ForecastMetrics, target_column: str = 'revenue',
                 feature_importance: Optional[List[FeatureImportance]] = None):
        self.historical_df = historical_df.copy()
        self.forecast_data = forecast_data
        self.metrics = metrics
        self.target_column = target_column
        self.feature_importance = feature_importance or []
    
    def generate_title(self) -> str:
        accuracy = 100 - self.metrics.mape
        if accuracy >= 90:
            quality = "High-Confidence"
        elif accuracy >= 80:
            quality = "Reliable"
        else:
            quality = "Indicative"
        
        return f"{quality} Sales Forecast Analysis"
    
    def generate_summary(self) -> str:
        total_historical = self.historical_df[self.target_column].sum()
        avg_historical = self.historical_df[self.target_column].mean()
        
        forecast_values = [f['predicted'] for f in self.forecast_data if 'predicted' in f]
        total_forecast = sum(forecast_values) if forecast_values else 0
        avg_forecast = np.mean(forecast_values) if forecast_values else 0
        
        growth = calculate_change_percentage(avg_forecast, avg_historical)
        
        trend = "growth" if growth > 0 else "decline" if growth < 0 else "stable performance"
        
        summary = (
            f"Based on analysis of {len(self.historical_df)} historical data points, "
            f"our model forecasts {format_number(total_forecast)} in projected {self.target_column} "
            f"over the next {len(self.forecast_data)} periods. "
            f"This represents a {abs(growth):.1f}% {trend} compared to historical averages. "
            f"Model accuracy: {100 - self.metrics.mape:.1f}% (MAPE: {self.metrics.mape:.1f}%)."
        )
        
        return summary
    
    def generate_kpis(self) -> List[KPISnapshot]:
        kpis = []
        
        current_year = self.historical_df['date'].dt.year.max()
        prev_year = current_year - 1
        
        current_year_data = self.historical_df[self.historical_df['date'].dt.year == current_year]
        prev_year_data = self.historical_df[self.historical_df['date'].dt.year == prev_year]
        
        current_total = current_year_data[self.target_column].sum()
        prev_total = prev_year_data[self.target_column].sum() if len(prev_year_data) > 0 else 0
        
        if prev_total > 0:
            yoy_growth = calculate_change_percentage(current_total, prev_total)
            kpis.append(KPISnapshot(
                name="Year-over-Year Growth",
                value=format_percentage(yoy_growth),
                trend="up" if yoy_growth > 0 else "down" if yoy_growth < 0 else "neutral"
            ))
        
        forecast_values = [f['predicted'] for f in self.forecast_data]
        if forecast_values:
            forecast_growth = calculate_change_percentage(
                np.mean(forecast_values),
                self.historical_df[self.target_column].mean()
            )
            kpis.append(KPISnapshot(
                name="Forecast vs Historical",
                value=format_percentage(forecast_growth),
                trend="up" if forecast_growth > 0 else "down" if forecast_growth < 0 else "neutral"
            ))
        
        kpis.append(KPISnapshot(
            name="Model Accuracy",
            value=f"{100 - self.metrics.mape:.1f}%",
            trend="up" if self.metrics.mape < 15 else "neutral" if self.metrics.mape < 25 else "down"
        ))
        
        kpis.append(KPISnapshot(
            name="MAE",
            value=format_number(self.metrics.mae),
            trend="neutral"
        ))
        
        if 'month' in self.historical_df.columns:
            monthly_avg = self.historical_df.groupby('month')[self.target_column].mean()
            peak_month = monthly_avg.idxmax()
            seasonality_strength = (monthly_avg.max() - monthly_avg.min()) / monthly_avg.mean() * 100
            
            kpis.append(KPISnapshot(
                name="Seasonality Strength",
                value=f"{seasonality_strength:.0f}%",
                change=f"Peak: Month {peak_month}",
                trend="up" if seasonality_strength > 30 else "neutral"
            ))
        
        return kpis
    
    def generate_bullets(self) -> List[InsightBullet]:
        bullets = []
        
        total = self.historical_df[self.target_column].sum()
        avg = self.historical_df[self.target_column].mean()
        
        bullets.append(InsightBullet(
            icon="chart-line",
            text=f"Total historical {self.target_column}: {format_number(total)} with average of {format_number(avg)} per period.",
            severity="info"
        ))
        
        if 'month' in self.historical_df.columns:
            monthly_data = self.historical_df.groupby('month')[self.target_column].mean()
            peak_month = monthly_data.idxmax()
            low_month = monthly_data.idxmin()
            
            month_names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                          'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
            
            peak_name = month_names[peak_month - 1] if 1 <= peak_month <= 12 else str(peak_month)
            low_name = month_names[low_month - 1] if 1 <= low_month <= 12 else str(low_month)
            
            variance = (monthly_data.max() - monthly_data.min()) / monthly_data.mean() * 100
            
            if variance > 30:
                bullets.append(InsightBullet(
                    icon="calendar-check",
                    text=f"Strong seasonal pattern detected: Peak sales in {peak_name}, lowest in {low_name} ({variance:.0f}% variance).",
                    severity="warning"
                ))
            else:
                bullets.append(InsightBullet(
                    icon="calendar",
                    text=f"Relatively stable sales across months with slight peaks in {peak_name}.",
                    severity="info"
                ))
        
        forecast_values = [f['predicted'] for f in self.forecast_data]
        if forecast_values:
            forecast_trend = np.polyfit(range(len(forecast_values)), forecast_values, 1)[0]
            
            if forecast_trend > 0:
                bullets.append(InsightBullet(
                    icon="trending-up",
                    text=f"Forecast shows upward trend with projected growth over the forecast period.",
                    severity="success"
                ))
            elif forecast_trend < 0:
                bullets.append(InsightBullet(
                    icon="trending-down",
                    text=f"Forecast indicates declining trend. Consider strategic interventions.",
                    severity="warning"
                ))
            else:
                bullets.append(InsightBullet(
                    icon="minus",
                    text="Forecast shows stable performance with minimal variation expected.",
                    severity="info"
                ))
        
        if self.feature_importance:
            top_features = self.feature_importance[:3]
            feature_names = [f.feature.replace('_', ' ').title() for f in top_features]
            
            bullets.append(InsightBullet(
                icon="zap",
                text=f"Top sales drivers: {', '.join(feature_names)}.",
                severity="info"
            ))
        
        if self.metrics.mape < 10:
            bullets.append(InsightBullet(
                icon="check-circle",
                text="Excellent model accuracy (<10% error). High confidence in forecasts.",
                severity="success"
            ))
        elif self.metrics.mape < 20:
            bullets.append(InsightBullet(
                icon="check",
                text="Good model accuracy. Forecasts are reliable for planning purposes.",
                severity="info"
            ))
        else:
            bullets.append(InsightBullet(
                icon="alert-triangle",
                text="Model accuracy is moderate. Consider using forecasts as directional guidance.",
                severity="warning"
            ))
        
        return bullets
    
    def generate_recommendations(self) -> List[Recommendation]:
        recommendations = []
        
        if 'month' in self.historical_df.columns:
            monthly_data = self.historical_df.groupby('month')[self.target_column].mean()
            peak_months = monthly_data.nlargest(3).index.tolist()
            low_months = monthly_data.nsmallest(3).index.tolist()
            
            month_names = ['January', 'February', 'March', 'April', 'May', 'June',
                          'July', 'August', 'September', 'October', 'November', 'December']
            
            peak_names = [month_names[m-1] for m in peak_months if 1 <= m <= 12]
            low_names = [month_names[m-1] for m in low_months if 1 <= m <= 12]
            
            recommendations.append(Recommendation(
                category="Inventory",
                title="Optimize Inventory Levels",
                description=f"Increase inventory 4-6 weeks before peak months ({', '.join(peak_names)}). "
                           f"Reduce stock commitments during {', '.join(low_names)} to minimize carrying costs.",
                priority="high"
            ))
        
        if 'promotion_flag' in self.historical_df.columns:
            promo_data = self.historical_df.groupby('promotion_flag')[self.target_column].mean()
            if len(promo_data) > 1 and 1 in promo_data.index and 0 in promo_data.index:
                promo_lift = (promo_data[1] - promo_data[0]) / promo_data[0] * 100
                
                if promo_lift > 20:
                    recommendations.append(Recommendation(
                        category="Promotion",
                        title="Scale Successful Promotions",
                        description=f"Promotions drive {promo_lift:.0f}% sales lift. "
                                   "Consider increasing promotion frequency during slow periods.",
                        priority="high"
                    ))
                else:
                    recommendations.append(Recommendation(
                        category="Promotion",
                        title="Reassess Promotion Strategy",
                        description=f"Current promotions show only {promo_lift:.0f}% lift. "
                                   "Test different promotion types or discount depths.",
                        priority="medium"
                    ))
        else:
            recommendations.append(Recommendation(
                category="Promotion",
                title="Implement Promotion Tracking",
                description="Start tracking promotion periods to measure ROI and optimize timing. "
                           "Consider strategic promotions during identified slow periods.",
                priority="medium"
            ))
        
        if 'price' in self.historical_df.columns:
            price_revenue_corr = self.historical_df['price'].corr(self.historical_df[self.target_column])
            
            if price_revenue_corr > 0.3:
                recommendations.append(Recommendation(
                    category="Pricing",
                    title="Premium Pricing Opportunity",
                    description="Higher prices correlate with higher revenue. Consider gradual price increases "
                               "or premium product tier development.",
                    priority="medium"
                ))
            elif price_revenue_corr < -0.3:
                recommendations.append(Recommendation(
                    category="Pricing",
                    title="Optimize Price Points",
                    description="Price sensitivity detected. Test lower price points or bundle offers "
                               "to maximize volume and total revenue.",
                    priority="high"
                ))
            else:
                recommendations.append(Recommendation(
                    category="Pricing",
                    title="Conduct Pricing Analysis",
                    description="Price-revenue relationship is not clear. Conduct A/B price testing "
                               "to identify optimal price points for different segments.",
                    priority="low"
                ))
        
        if len(recommendations) < 3:
            recommendations.append(Recommendation(
                category="Data Quality",
                title="Enhance Data Collection",
                description="Consider tracking additional variables like customer segments, "
                           "marketing channels, and competitor actions for improved forecasting.",
                priority="low"
            ))
        
        return recommendations[:3]
    
    def generate_insights(self) -> Dict[str, Any]:
        return {
            'title': self.generate_title(),
            'summary': self.generate_summary(),
            'kpis': [kpi.model_dump() for kpi in self.generate_kpis()],
            'bullets': [bullet.model_dump() for bullet in self.generate_bullets()],
            'recommendations': [rec.model_dump() for rec in self.generate_recommendations()],
            'generated_at': datetime.utcnow().isoformat()
        }
