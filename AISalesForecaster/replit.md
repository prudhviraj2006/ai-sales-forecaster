# AI Sales Forecaster & Business Insight Generator

## Overview
A production-capable prototype app that helps non-technical business users upload historical sales data, get reliable forecasts using Prophet or LightGBM models, and receive automated, actionable business insights.

## Project Structure
```
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI application entry point
│   │   ├── models/          # Database models and Pydantic schemas
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic (forecaster, data pipeline, insights)
│   │   └── utils/           # Helper functions
│   ├── tests/               # Pytest unit tests
│   ├── data/                # Demo data and SQLite database
│   └── generate_demo_data.py # Demo data generation script
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── services/        # API client
│   │   └── App.jsx          # Main application
│   └── package.json         # Frontend dependencies
└── README.md                # Documentation
```

## Tech Stack
- **Backend**: FastAPI, Python 3.11, Prophet, LightGBM, SQLite
- **Frontend**: React, Vite, Tailwind CSS, Recharts
- **ML/Stats**: Prophet (time-series), LightGBM (gradient boosting), scikit-learn

## Running the Application
The app runs on two servers:
1. **Backend API**: Port 8000 (FastAPI with Uvicorn)
2. **Frontend**: Port 5000 (Vite dev server)

## Key Features
- CSV upload with data validation and preview
- Configurable forecasting (3/6/12 month horizons, daily/weekly/monthly aggregation)
- Prophet and LightGBM model options
- Interactive charts with historical vs forecast comparison
- Time-series decomposition (trend, seasonality)
- Auto-generated business insights with KPIs and recommendations
- CSV and PDF export functionality

## API Endpoints
- `POST /api/upload` - Upload CSV file
- `POST /api/forecast` - Run forecast with parameters
- `GET /api/insights?job_id=` - Get generated insights
- `GET /api/download?job_id=&format=csv|pdf` - Download report

## Environment Variables
- `DATABASE_PATH` - SQLite database path (default: backend/data/forecaster.db)
- `UPLOAD_DIR` - Upload directory (default: backend/uploads)

## Recent Changes
- Initial project setup with full-stack implementation
- Created backend with FastAPI, Prophet, and LightGBM models
- Built React frontend with Recharts visualization
- Implemented data pipeline with feature engineering
- Added insights generator with business recommendations
