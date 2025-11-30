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
- Recent Sessions: View and reload previously analyzed forecast sessions

## API Endpoints
- `POST /api/upload` - Upload CSV file
- `POST /api/forecast` - Run forecast with parameters
- `GET /api/insights?job_id=` - Get generated insights
- `GET /api/download?job_id=&format=csv|pdf` - Download report
- `GET /api/recent-jobs?limit=10` - Get recent forecast sessions
- `GET /api/job/{job_id}/full` - Get full job data with forecast and insights

## Environment Variables
- `DATABASE_PATH` - SQLite database path (default: backend/data/forecaster.db)
- `UPLOAD_DIR` - Upload directory (default: backend/uploads)

## Recent Changes
- 2025-11-30: Dashboard Layout Reorganization (Final) with:
  - Header: App title + Model/Horizon/Aggregation controls
  - Main section: Large forecast chart (left) + KPI cards (right)
  - KPI cards: Projected Revenue, Growth %, Top Driver, Accuracy
  - Switchable tabs: Time Series Decomposition vs Feature Importance
  - Insights feed: Key observations and actionable recommendations
  - Footer: Export buttons (PDF/CSV)
  - Responsive grid layout optimized for all screen sizes
- 2025-11-30: Creative & Professional Dashboard Redesign (V2) with:
  - Premium glassmorphism effects with backdrop blur on all cards
  - Animated metric cards with staggered entrance animations
  - Gradient text for headings (modern premium look)
  - Dynamic hover effects with shadow expansion and glow
  - Radial gradient background with ambient lighting
  - Enhanced color schemes with gradient accents on icons
  - Professional rounded corners (xl to 3xl) throughout
  - Interactive decomposition chart with smooth transitions
  - Ranked product/region cards with gradient backgrounds
  - Custom styled scrollbar and button shine effects
  - Premium tooltip styling with enhanced shadows
- 2025-11-30: Professional dashboard redesign with:
  - Enhanced gradient header with model info
  - Color-coded accuracy metrics (green/yellow/red indicators)
  - Improved forecast visualization with confidence intervals
  - Professional card-based layout for KPIs
  - Better typography and spacing
  - Refactored feature importance and time-series decomposition
  - Top products and regions with ranking badges
- 2025-11-30: Added Recent Sessions feature to view and reload past forecast sessions
- Initial project setup with full-stack implementation
- Created backend with FastAPI, Prophet, and LightGBM models
- Built React frontend with Recharts visualization
- Implemented data pipeline with feature engineering
- Added insights generator with business recommendations
