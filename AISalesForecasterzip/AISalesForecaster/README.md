# AI Sales Forecaster & Business Insight Generator

A production-capable prototype application for sales forecasting and business insights generation. Built with FastAPI, React, Prophet, and LightGBM.

## Features

- **Data Upload & Validation**: Upload CSV files with automatic schema validation and data cleaning
- **Flexible Forecasting**: Choose from Prophet (time-series) or LightGBM (gradient boosting) models
- **Configurable Parameters**: 3/6/12 month horizons with daily/weekly/monthly aggregation
- **Interactive Dashboard**: Visualize historical vs forecast data with confidence intervals
- **Time-Series Decomposition**: View trend, seasonality, and residual components
- **Feature Importance**: Understand key drivers of your forecasts (LightGBM)
- **Auto-Generated Insights**: KPI snapshots, data-driven observations, and actionable recommendations
- **Export Options**: Download forecasts as CSV or comprehensive PDF reports

## Tech Stack

### Backend
- FastAPI (Python 3.11+)
- Prophet (Facebook's time-series forecasting)
- LightGBM (gradient boosting)
- Pandas, NumPy, scikit-learn
- SQLite (demo) / PostgreSQL (production)
- ReportLab (PDF generation)

### Frontend
- React with Vite
- Tailwind CSS
- Recharts (interactive charts)
- Axios (API client)
- Lucide Icons

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ai-sales-forecaster
```

2. **Install Python dependencies**
```bash
pip install -r requirements.txt
```

3. **Install frontend dependencies**
```bash
cd frontend
npm install
```

4. **Generate demo data**
```bash
python backend/generate_demo_data.py
```

### Running Locally

1. **Start the backend server**
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

2. **Start the frontend server** (in a new terminal)
```bash
cd frontend
npm run dev
```

3. **Open the app**: Navigate to `http://localhost:5000`

## API Reference

### Upload CSV
```http
POST /api/upload
Content-Type: multipart/form-data

file: <csv-file>
```

### Run Forecast
```http
POST /api/forecast
Content-Type: application/json

{
  "job_id": "string",
  "aggregation": "daily|weekly|monthly",
  "model": "prophet|lightgbm",
  "horizon": 3|6|12,
  "target_column": "revenue"
}
```

### Get Insights
```http
GET /api/insights?job_id=<job_id>
```

### Download Report
```http
GET /api/download?job_id=<job_id>&format=csv|pdf
```

## CSV Format

Your input CSV should contain these columns:

| Column | Type | Required | Description |
|--------|------|----------|-------------|
| date | YYYY-MM-DD | Yes | Transaction date |
| product_id | string | No | Product identifier |
| product_name | string | No | Product name |
| region | string | No | Geographic region |
| units_sold | integer | Yes | Number of units sold |
| revenue | float | Yes | Revenue amount |
| price | float | No | Unit price |
| promotion_flag | 0/1 | No | Promotion indicator |

## Running Tests

```bash
cd backend
pytest tests/ -v
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| DATABASE_PATH | backend/data/forecaster.db | SQLite database location |
| UPLOAD_DIR | backend/uploads | File upload directory |
| SESSION_SECRET | (auto-generated) | Session encryption key |

## Model Selection Guide

### Prophet
- Best for: Strong seasonal patterns, holiday effects
- Handles: Missing data, outliers automatically
- Provides: Uncertainty intervals, decomposition

### LightGBM
- Best for: Complex patterns, many features
- Handles: Multivariate forecasting
- Provides: Feature importance rankings

## Deployment

### Replit
1. Fork this repository to Replit
2. The app will auto-start with the configured workflows
3. Use the web preview to access the application

### Docker
```bash
docker-compose up --build
```

## License

MIT License - See LICENSE file for details.
