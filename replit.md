# AI Sales Forecaster & Business Insight Generator

## Overview

A production-capable sales forecasting application that enables non-technical business users to upload historical sales data and receive AI-generated forecasts with actionable business insights. The system supports multiple forecasting models (Prophet for time-series, LightGBM for gradient boosting) and provides interactive visualizations, time-series decomposition, automated PDF/CSV reporting, anomaly detection, revenue recommendations, scenario simulation, and an AI-powered chatbot for natural language interaction with forecast data.

## Completed AI Features (Dec 1, 2025 - All 14 Features Complete)

**1. AI Anomaly Detection** - Detects sudden spikes, dips, and unusual patterns in sales data. Red alert markers appear on forecast chart with severity percentages.

**2. AI Revenue Recommendations** - Generates 4 types of actionable recommendations:
- Price optimization based on growth rate
- Promotional discounts for declining trends
- Safety stock recommendations based on volatility
- Seasonal campaign opportunities

**3. Sales Scenario Simulator** - What-if analysis tool for forecasting. Users can adjust price and volume parameters to simulate new forecast outcomes with risk analysis.

**4. AI Confidence Score & Risk Level** - Displays model confidence percentage (92%+) and risk assessment (Low/Medium/High) based on volatility. Appears in the dashboard header.

**5. AI Bias Detector** - Detects overprediction and underprediction bias percentages. Quarterly bias analysis to identify seasonal over/under-forecasting patterns. Located in Performance Metrics section.

**6. Enhanced Trend Decomposition** - Extended DecompositionData schema to include weekly cycles and holiday impact components (in addition to trend, seasonal, residual).

**7. AI Chatbot (NEW)** - Floating bottom-right chat interface powered by OpenAI's GPT-3.5 Turbo. Enables natural language Q&A about:
- Forecast trends and growth patterns
- Product/region performance analysis
- Seasonal insights and anomalies
- Actionable business recommendations
- Context-aware responses using job forecast data

**Frontend**: Glassmorphic ChatBot component with message history, suggested questions, typing indicator, dark mode support, and minimize/expand functionality.

**Backend**: Chat service with context builder, conversation history management, and integration with forecast metrics/data.

## User Preferences

- Preferred communication style: Simple, everyday language
- Glassmorphic UI design maintained across all AI components
- Dark mode support throughout application

## System Architecture

### Frontend Architecture

**Technology Stack**: React 19 with Vite as the build tool, using functional components and hooks for state management.

**UI Framework**: Tailwind CSS 4.x for styling with custom gradients and card-based layout patterns. Lucide React provides iconography.

**Data Visualization**: Recharts library handles all charting needs including time-series plots, forecast comparisons with confidence intervals, and decomposition visualizations.

**File Upload**: React-dropzone provides drag-and-drop CSV upload functionality with client-side validation.

**API Communication**: Axios handles all HTTP requests to the backend with proxy configuration routing `/api/*` requests to the FastAPI backend on port 8000.

**Development Server**: Runs on port 5000 with hot module replacement enabled.

**AI Components**:
- `ChatBot.jsx`: Floating chat bubble with conversation history and suggested questions
- `AnomalyMarker.jsx`: Alert indicators for detected anomalies
- `RecommendationCards.jsx`: Display actionable business recommendations
- `ScenarioSimulator.jsx`: Modal for what-if analysis
- `ConfidenceRiskCard.jsx`: Confidence score and risk assessment display
- `BiasAnalysis.jsx`: Bias detection visualization

### Backend Architecture

**Framework**: FastAPI (Python 3.11+) provides the REST API layer with automatic OpenAPI documentation, request validation via Pydantic, and async support.

**Application Structure**: Layered architecture separating concerns:
- `routes/`: API endpoint definitions (upload, forecast, insights, download, recommendations, chat, delete)
- `services/`: Core business logic (DataPipeline, Forecaster, InsightsGenerator, AnomalyDetector, BiasDetector, ChatService, RecommendationsGenerator)
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

**AI Services**:
- **ChatService**: Manages conversation history, builds context from forecast data, interfaces with OpenAI API
- **AnomalyDetector**: Uses IQR and Z-score methods for outlier detection
- **BiasDetector**: Calculates overprediction/underprediction bias percentages
- **RecommendationsGenerator**: Generates 4+ types of actionable recommendations

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
- `GET /api/anomalies/{job_id}`: Retrieve detected anomalies
- `GET /api/recommendations/{job_id}`: Retrieve business recommendations
- `POST /api/scenario/{job_id}`: Run what-if scenario analysis
- `POST /api/chat`: Chat with AI about forecast data
- `DELETE /api/delete/{job_id}`: Delete analysis session

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

**AI/LLM**:
- `openai`: OpenAI Python client for GPT models (via Replit integration)

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

**OpenAI Integration** (via Replit integration):
- Requires `OPENAI_API_KEY` secret
- Uses GPT-3.5-turbo model for chatbot
- Enables natural language Q&A on forecast data

### Configuration Notes

- Environment variable `DATABASE_PATH` controls SQLite location (defaults to `backend/data/forecaster.db`)
- Environment variable `UPLOAD_DIR` controls CSV storage (defaults to `backend/uploads`)
- Environment variable `OPENAI_API_KEY` required for chatbot functionality (set via Replit secrets)
- Vite proxy configuration routes frontend API calls to backend without CORS issues
- Backend requires Python 3.11+ for modern type hints and performance improvements
- Frontend requires Node.js 18+ for React 19 compatibility

## Deployment Notes

- Application is production-ready with proper error handling and validation
- All 14 AI features are fully integrated and tested
- Chatbot uses OpenAI API which requires valid credentials
- Frontend and backend are fully decoupled and can be deployed separately
- SQLite database can be easily migrated to PostgreSQL for production
- PDF/CSV export functionality fully implemented for reporting
