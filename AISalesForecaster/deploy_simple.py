#!/usr/bin/env python3
"""
Simple production deployment for AI Sales Forecaster
Serves both backend API and frontend from a single server
"""
import os
import sys
import subprocess
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

def setup_production_server():
    """Setup and start production server"""
    print("🚀 Setting up AI Sales Forecaster Production Server")
    print("=" * 50)
    
    # Create necessary directories
    os.makedirs("backend/uploads", exist_ok=True)
    os.makedirs("backend/data", exist_ok=True)
    
    # Set environment variables
    os.environ['PYTHONPATH'] = str(Path.cwd())
    os.environ['OPENROUTER_API_KEY'] = os.environ.get('OPENROUTER_API_KEY', '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')
    
    # Install Python dependencies
    print("📦 Installing Python dependencies...")
    try:
        subprocess.run(['uv', 'sync'], cwd="backend", check=True)
        print("✅ Dependencies installed")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        return False
    
    return True

def create_production_app():
    """Create a production FastAPI app that serves frontend"""
    from backend.app.main import app
    
    # Mount frontend static files if they exist
    frontend_dist = Path("frontend/dist")
    if frontend_dist.exists():
        app.mount("/static", StaticFiles(directory=str(frontend_dist)), name="static")
        
        @app.get("/")
        async def read_index():
            return FileResponse(str(frontend_dist / "index.html"))
        
        @app.get("/{path:path}")
        async def read_static(path: str):
            file_path = frontend_dist / path
            if file_path.exists() and file_path.is_file():
                return FileResponse(str(file_path))
            return FileResponse(str(frontend_dist / "index.html"))
    
    return app

def main():
    """Main deployment function"""
    if not setup_production_server():
        sys.exit(1)
    
    print("🌐 Starting production server...")
    print("📍 Server will be available at: http://localhost:8000")
    print("🔄 API endpoints at: http://localhost:8000/api")
    print("🛑 Press Ctrl+C to stop the server")
    print("=" * 50)
    
    try:
        import uvicorn
        app = create_production_app()
        
        uvicorn.run(
            app,
            host="0.0.0.0",
            port=8000,
            workers=1,
            access_log=True
        )
    except ImportError:
        print("❌ uvicorn not available")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")

if __name__ == "__main__":
    main()
