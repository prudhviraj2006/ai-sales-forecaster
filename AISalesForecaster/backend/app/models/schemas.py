from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum


class AggregationType(str, Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"


class ModelType(str, Enum):
    PROPHET = "prophet"
    LIGHTGBM = "lightgbm"


class HorizonType(int, Enum):
    THREE_MONTHS = 3
    SIX_MONTHS = 6
    TWELVE_MONTHS = 12


class ValidationResult(BaseModel):
    is_valid: bool
    errors: List[str] = []
    warnings: List[str] = []
    row_count: int = 0
    column_count: int = 0
    date_range: Optional[Dict[str, str]] = None
    missing_values: Dict[str, int] = {}


class UploadResponse(BaseModel):
    job_id: str
    validation: ValidationResult
    preview: List[Dict[str, Any]]
    columns: List[str]
    numeric_columns: List[str]
    categorical_columns: List[str]


class ForecastRequest(BaseModel):
    job_id: str
    aggregation: AggregationType = AggregationType.MONTHLY
    model: ModelType = ModelType.PROPHET
    horizon: int = Field(default=6, ge=1, le=24)
    target_column: str = "revenue"
    group_by: Optional[str] = None


class ForecastMetrics(BaseModel):
    mae: float
    rmse: float
    mape: float
    train_size: int
    test_size: int
    confidence_score: Optional[float] = None
    risk_level: Optional[str] = None
    overprediction_bias: Optional[float] = None
    underprediction_bias: Optional[float] = None


class ForecastPoint(BaseModel):
    date: str
    actual: Optional[float] = None
    predicted: float
    lower_bound: Optional[float] = None
    upper_bound: Optional[float] = None


class DecompositionData(BaseModel):
    trend: List[Dict[str, Any]]
    seasonal: List[Dict[str, Any]]
    residual: List[Dict[str, Any]]
    weekly: Optional[List[Dict[str, Any]]] = None
    holiday_impact: Optional[List[Dict[str, Any]]] = None


class FeatureImportance(BaseModel):
    feature: str
    importance: float


class ForecastResponse(BaseModel):
    job_id: str
    model_type: str
    aggregation: str
    horizon: int
    target_column: str
    metrics: ForecastMetrics
    forecast: List[ForecastPoint]
    historical: List[ForecastPoint]
    decomposition: Optional[DecompositionData] = None
    feature_importance: Optional[List[FeatureImportance]] = None
    top_products: Optional[List[Dict[str, Any]]] = None
    top_regions: Optional[List[Dict[str, Any]]] = None


class InsightBullet(BaseModel):
    icon: str
    text: str
    severity: str = "info"


class Recommendation(BaseModel):
    category: str
    title: str
    description: str
    priority: str = "medium"


class KPISnapshot(BaseModel):
    name: str
    value: str
    change: Optional[str] = None
    trend: str = "neutral"


class InsightsResponse(BaseModel):
    job_id: str
    title: str
    summary: str
    kpis: List[KPISnapshot]
    bullets: List[InsightBullet]
    recommendations: List[Recommendation]
    generated_at: str


class DownloadFormat(str, Enum):
    CSV = "csv"
    PDF = "pdf"
