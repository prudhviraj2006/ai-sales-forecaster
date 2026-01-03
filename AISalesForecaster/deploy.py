#!/usr/bin/env python3
"""
Production deployment script for AI Sales Forecaster
"""
import os
import sys
import subprocess
import shutil
from pathlib import Path

def check_dependencies():
    """Check if required dependencies are available"""
    try:
        import uvicorn
        import fastapi
        print("✅ Backend dependencies available")
    except ImportError as e:
        print(f"❌ Missing backend dependency: {e}")
        return False
    
    # Check if Node.js is available
    try:
        result = subprocess.run(['npm', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Node.js/npm available: {result.stdout.strip()}")
        else:
            print("❌ Node.js/npm not available")
            return False
    except FileNotFoundError:
        print("❌ Node.js/npm not found")
        return False
    
    return True

def build_frontend():
    """Build the frontend for production"""
    print("🔨 Building frontend...")
    frontend_dir = Path("frontend")
    
    if not frontend_dir.exists():
        print("❌ Frontend directory not found")
        return False
    
    try:
        # Install dependencies
        subprocess.run(['npm', 'install'], cwd=frontend_dir, check=True)
        
        # Build for production
        subprocess.run(['npm', 'run', 'build'], cwd=frontend_dir, check=True)
        
        print("✅ Frontend built successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Frontend build failed: {e}")
        return False

def setup_backend():
    """Setup backend for production"""
    print("🔧 Setting up backend...")
    
    # Create necessary directories
    os.makedirs("backend/uploads", exist_ok=True)
    os.makedirs("backend/data", exist_ok=True)
    
    # Install Python dependencies
    try:
        subprocess.run(['uv', 'sync'], cwd="backend", check=True)
        print("✅ Backend dependencies installed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Backend setup failed: {e}")
        return False

def start_production_server():
    """Start the production server"""
    print("🚀 Starting production server...")
    
    # Set environment variables
    os.environ['PYTHONPATH'] = str(Path.cwd())
    os.environ['OPENROUTER_API_KEY'] = os.environ.get('OPENROUTER_API_KEY', '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')
    
    try:
        # Start the server
        subprocess.run([
            'uv', 'run', 'uvicorn', 
            'backend.app.main:app',
            '--host', '0.0.0.0',
            '--port', '8000',
            '--workers', '1'
        ], check=True)
    except subprocess.CalledProcessError as e:
        print(f"❌ Server failed to start: {e}")
        return False
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
        return True

def main():
    """Main deployment function"""
    print("🚀 AI Sales Forecaster Deployment")
    print("=" * 40)
    
    # Check dependencies
    if not check_dependencies():
        sys.exit(1)
    
    # Build frontend
    if not build_frontend():
        sys.exit(1)
    
    # Setup backend
    if not setup_backend():
        sys.exit(1)
    
    # Start server
    start_production_server()

if __name__ == "__main__":
    main()
