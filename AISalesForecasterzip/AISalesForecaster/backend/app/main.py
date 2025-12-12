import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .models.database import init_database
from .routes import upload_router, forecast_router, insights_router, download_router, delete_router, recommendations_router, chat_router

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting AI Sales Forecaster API...")
    init_database()
    logger.info("Database initialized")
    yield
    logger.info("Shutting down AI Sales Forecaster API...")


app = FastAPI(
    title="AI Sales Forecaster & Business Insight Generator",
    description="Production-capable API for sales forecasting using Prophet and LightGBM models",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router, prefix="/api", tags=["Upload"])
app.include_router(forecast_router, prefix="/api", tags=["Forecast"])
app.include_router(insights_router, prefix="/api", tags=["Insights"])
app.include_router(download_router, prefix="/api", tags=["Download"])
app.include_router(delete_router, prefix="/api", tags=["Delete"])
app.include_router(recommendations_router, prefix="/api", tags=["AI Features"])
app.include_router(chat_router, prefix="/api", tags=["Chat"])


@app.get("/")
async def root():
    return {
        "name": "AI Sales Forecaster & Business Insight Generator",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "upload": "/api/upload",
            "forecast": "/api/forecast",
            "insights": "/api/insights",
            "download": "/api/download"
        }
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
