# Use Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements
COPY backend/pyproject.toml backend/uv.lock ./

# Install uv and Python dependencies
RUN pip install uv
RUN uv sync --frozen

# Copy backend code
COPY backend/ ./backend/

# Copy frontend code
COPY frontend/ ./frontend/

# Install frontend dependencies and build
WORKDIR /app/frontend
RUN npm install
RUN npm run build

# Go back to app directory
WORKDIR /app

# Create necessary directories
RUN mkdir -p backend/uploads backend/data

# Expose ports
EXPOSE 8000

# Set environment variables
ENV PYTHONPATH=/app
ENV DATABASE_PATH=/app/backend/data/forecaster.db
ENV UPLOAD_DIR=/app/backend/uploads

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/ || exit 1

# Start the application
CMD ["uv", "run", "uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
