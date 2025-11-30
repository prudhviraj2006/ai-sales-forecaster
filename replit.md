# AI Sales Forecaster & Business Insight Generator

## Overview

A production-capable sales forecasting application that enables non-technical business users to upload historical sales data and receive AI-generated forecasts with actionable business insights. The system supports multiple forecasting models (Prophet for time-series, LightGBM for gradient boosting) and provides interactive visualizations, time-series decomposition, and automated PDF/CSV reporting.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack**: React 19 with Vite as the build tool, using functional components and hooks for state management.

**UI Framework**: Tailwind CSS 4.x for styling with custom gradients and card-based layout patterns. Lucide React provides iconography.

**Data Visualization**: Recharts library handles all charting needs including time-series plots, forecast comparisons with confidence intervals, and decomposition visualizations.

**File Upload**: React-dropzone provides drag-and-drop CSV upload functionality with client-side validation.

**API Communication**: Axios handles all HTTP requests to the backend with proxy configuration routing `/api/*` requests to the FastAPI backend on port 8000.

**Development Server**: Runs on port 5000 with hot module replacement enabled.

### Backend Architecture

**Framework**: FastAPI (Python 3.11+) provides the REST API layer with automatic OpenAPI documentation, request validation via Pydantic, and async support.

**Application Structure**: Layered architecture separating concerns:
- `routes/`: API endpoint definitions (upload, forecast, insights, download)
- `services/`: Core business logic (DataPipeline, Forecaster, InsightsGenerator)
- `models/`: Pydantic schemas for request/response validation and database operations
- `utils/`: Helper functions and holiday detection utilities

**Data Processing Pipeline**: Multi-stage pipeline implemented in `DataPipeline` class:
1. CSV parsing with multiple encoding fallbacks (UTF-8, Latin-1, Windows formats)
2. Column normalization (auto-detects date column aliases)
3. Data validation (required columns, date ranges, missing values)
4. Aggregation to daily/weekly/monthly granularity
5. Feature engineering (holiday flags, temporal features, lag variables)

**Forecasting Models**: Dual-model approach allows users to select based on use case:
- **Prophet**: Facebook's time-series model for seasonal data with trend decomposition
- **LightGBM**: Gradient boosting for feature-rich predictions with importance rankings

**Model Training**: Train/test split approach with configurable forecast horizons (3/6/12 months). Metrics calculation includes MAE, RMSE, and MAPE for model evaluation.

**Insights Generation**: Automated analysis engine (`InsightsGenerator`) produces:
- KPI snapshots (YoY growth, seasonality strength, forecast accuracy)
- Data-driven observations (trend direction, peak periods, volatility)
- Tactical recommendations based on forecast patterns and feature importance

**Report Generation**: ReportLab creates formatted PDF reports combining charts, metrics, and insights. CSV exports provide raw forecast data.

### Data Storage

**Database**: SQLite for development/prototyping with schema supporting PostgreSQL migration. Two primary tables:
- `jobs`: Tracks upload sessions with validation results and file metadata
- `forecasts`: Stores model outputs, metrics, and serialized predictions

**File Storage**: Uploaded CSVs stored in `backend/uploads/` with unique job IDs. Demo data generation script creates realistic synthetic sales data.

**Session Management**: Job-based workflow where each upload creates a job_id that tracks the entire analysis lifecycle from upload → forecast → insights → download.

### API Design

**RESTful Endpoints**:
- `POST /api/upload`: Multipart file upload with validation
- `POST /api/forecast`: Trigger model training with configuration
- `GET /api/insights?job_id=`: Retrieve generated insights
- `GET /api/download?job_id=&format=`: Export as CSV or PDF
- `GET /api/sessions`: List recent analysis sessions

**Request/Response**: Strongly typed via Pydantic models with enums for aggregation types, model selection, and forecast horizons.

**Error Handling**: HTTP exceptions with detailed messages for validation failures, missing data, and processing errors.

**CORS**: Configured for development with wildcard origins; should be restricted in production.

## External Dependencies

### Python Packages

**ML/Statistics**:
- `prophet`: Facebook's time-series forecasting library
- `lightgbm`: Microsoft's gradient boosting framework
- `scikit-learn`: Train/test splitting and metrics calculation
- `pandas`: Data manipulation and aggregation
- `numpy`: Numerical operations

**Web Framework**:
- `fastapi`: ASGI web framework
- `uvicorn`: ASGI server
- `pydantic`: Data validation and serialization

**Report Generation**:
- `reportlab`: PDF creation with tables and charts
- `matplotlib`: Chart generation for PDF embedding

**Database**:
- `sqlite3`: Built-in Python SQLite driver
- Schema designed for easy migration to PostgreSQL via connection string swap

### JavaScript Packages

**Core**:
- `react` & `react-dom` (v19): UI framework
- `vite`: Build tool and dev server
- `axios`: HTTP client

**UI Components**:
- `tailwindcss` (v4): Utility-first CSS framework
- `lucide-react`: Icon library
- `react-dropzone`: File upload component
- `recharts`: Charting library

**Development**:
- `eslint`: Code linting with React-specific rules
- `@vitejs/plugin-react`: Vite integration for React Fast Refresh

### Third-Party Services

**None currently integrated** - Application runs entirely self-contained. Potential future integrations:
- Cloud storage (S3, GCS) for uploaded files
- PostgreSQL/MySQL for production database
- Email service for report delivery
- Analytics platform for usage tracking

### Configuration Notes

- Environment variable `DATABASE_PATH` controls SQLite location (defaults to `backend/data/forecaster.db`)
- Environment variable `UPLOAD_DIR` controls CSV storage (defaults to `backend/uploads`)
- Vite proxy configuration routes frontend API calls to backend without CORS issues
- Backend requires Python 3.11+ for modern type hints and performance improvements
- Frontend requires Node.js 18+ for React 19 compatibility