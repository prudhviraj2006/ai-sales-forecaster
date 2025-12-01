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
- 2025-12-01: Added UX Enhancements:
  - **Dark Mode Toggle**: Moon/Sun icon in header toggles dark/light theme
  - Theme preference saved to localStorage and persists across sessions
  - All components support dark mode with appropriate color schemes
  - **Refresh Data Button**: Added to Upload and Preview pages for quick data reloading
  - **Reset Button**: Added to Configuration page to reset all settings to defaults
  - **Compare Models Button**: Added to Dashboard header for side-by-side Prophet vs LightGBM comparison
  - Compare Models modal shows both model forecasts overlaid with metrics table
  - **Help Tooltips**: Added contextual help icons next to key fields:
    - Target Column, Forecast Model, Forecast Horizon on Configuration page
    - MAE, RMSE, MAPE, Accuracy on Dashboard metrics panel
  - Created reusable Tooltip component with hover-triggered info popups
- 2025-11-30: Enhanced PDF & CSV Exports with All Graphs:
  - **PDF Export** now includes:
    - Page 1: Forecast Summary + Main Forecast Trend Chart
    - Page 2: Residuals Chart + Historical vs Forecast Comparison
    - Page 3: Top Products Bar Chart + Top Regions Pie Chart
    - Page 4: Decomposition Charts (Trend + Seasonal) + Feature Importance
    - Page 5: Business Insights & Recommendations
    - Page 6: Complete Forecast Data Table
  - **CSV Export** now includes:
    - Complete forecast summary and metrics
    - Full historical data with all columns
    - Full forecast data with confidence intervals
    - Feature importance rankings
    - Top products and regions data
    - Decomposition data (trend + seasonal)
    - Business insights and recommendations
  - Uses matplotlib for chart generation in PDF
  - Professional multi-page report format
- 2025-11-30: Added Bottom Pagination Controls to Dashboard with:
  - Previous/Next buttons at bottom center of dashboard
  - Page indicator dots showing current page (1/4, 2/4, 3/4, 4/4)
  - Click dots to jump to any page
  - Smooth scroll to top when changing pages
  - Disabled states for first/last pages
  - Blue gradient for Previous, Purple gradient for Next
  - Available on all 4 dashboard pages for easy navigation
- 2025-11-30: Cleaned Up Left Sidebar Navigation with:
  - Removed "Settings" menu item
  - Removed "Help Center" menu item
  - Sidebar now shows: Dashboard, Forecast, Insights, Upload Data, Reports
  - Cleaner, focused navigation for project needs
- 2025-11-30: Moved "Start Over" Button to Left Sidebar with:
  - Removed "Start Over" button from header (top right)
  - Added "Start Over" button to left sidebar above Dashboard menu item
  - Button uses amber/orange gradient for visibility
  - Only shows when user is past the upload step
  - Positioned above all menu items with clear separation
- 2025-11-30: Added Comprehensive Forecast Analysis Charts with:
  - **Page 1 (Overview)**: Main forecast chart with confidence intervals + 4 KPI cards (Revenue, Growth, Top Driver, Accuracy)
  - **Page 2 (Detailed Analysis)**: Multiple new visualizations:
    - Residuals chart (forecast errors visualization)
    - Historical vs Forecast average comparison bar chart
    - Performance metrics summary (MAE, RMSE, MAPE, Accuracy)
    - Top Products bar chart
    - Top Regions pie chart
  - **Page 3 (Decomposition)**: Time-series decomposition (trend & seasonal) + Feature importance
  - **Page 4 (Insights)**: AI-generated business insights and recommendations
  - Expanded from 2 pages to 4 pages for comprehensive analysis
  - All charts use glassmorphic design with gradient backgrounds
- 2025-11-30: Redesigned Sidebar with Professional Menu (V2) with:
  - Profile section at top with avatar and app title
  - Menu items: Dashboard, Forecast, Insights, Upload Data, Reports, Settings, Help Center
  - Dark slate background with gradient accents
  - Active menu item highlighted with blue gradient
  - Smart disabling based on data availability
  - Menu icons from Lucide React
  - App version info in footer
  - Proper width (256px) for readability
  - Smooth hover and transition effects
- 2025-11-30: Added Vertical Left-Side Navigation with:
  - Vertical stepper sidebar on left (Upload → Preview → Configure → Dashboard)
  - Click any step to navigate to that page
  - Smart disabling: steps disabled until prerequisites are met
  - Animated step indicators with glow effects
  - Connection lines between steps for visual flow
  - Removed bottom pagination buttons in favor of sidebar
  - Main content auto-adjusts with left margin for sidebar
- 2025-11-30: Fixed LightGBM JSON Serialization Error with:
  - Added `_clean_nan_inf()` helper method in Forecaster class
  - Cleaned all LightGBM predictions, feature importances, and standard deviations
  - Applied recursive NaN/infinity cleaning to all API responses
  - LightGBM forecasts now work correctly without serialization errors
- 2025-11-30: Added Page Navigation with:
  - Previous/Next buttons at bottom center
  - Page indicator dots showing current position
  - Smooth scrolling between pages
  - Page 1: Header + Forecast chart + KPI cards
  - Page 2: Time Series Decomposition / Feature Importance tabs
  - Page 3: Business Insights feed (observations + recommendations)
  - Disabled navigation at boundaries (prev/next disabled on first/last page)
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
