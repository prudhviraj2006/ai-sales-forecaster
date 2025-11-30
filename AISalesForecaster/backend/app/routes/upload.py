import os
import pandas as pd
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
import logging

from ..models.schemas import UploadResponse, ValidationResult
from ..models.database import create_job, get_job, get_recent_jobs, get_job_with_forecast
from ..services.data_pipeline import DataPipeline
from ..utils.helpers import generate_job_id

router = APIRouter()
logger = logging.getLogger(__name__)

UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "backend/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/upload", response_model=UploadResponse)
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted")
    
    try:
        contents = await file.read()
        
        encodings_to_try = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252', 'iso-8859-1']
        df = None
        last_error = None
        
        for encoding in encodings_to_try:
            try:
                df = pd.read_csv(pd.io.common.BytesIO(contents), encoding=encoding)
                logger.info(f"Successfully parsed CSV with encoding: {encoding}")
                break
            except UnicodeDecodeError as e:
                last_error = e
                continue
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Error parsing CSV: {str(e)}")
        
        if df is None:
            raise HTTPException(status_code=400, detail=f"Unable to parse CSV file. Please ensure it's a valid CSV with text encoding (UTF-8, Latin-1, or Windows format).")
        
        if len(df) == 0:
            raise HTTPException(status_code=400, detail="CSV file is empty")
        
        job_id = generate_job_id()
        
        file_path = os.path.join(UPLOAD_DIR, f"{job_id}.csv")
        with open(file_path, 'wb') as f:
            f.write(contents)
        
        pipeline = DataPipeline(df)
        validation_result = pipeline.validate()
        
        all_columns, numeric_columns, categorical_columns = pipeline.get_column_info()
        preview = pipeline.get_preview(n=10)
        
        date_range = validation_result.date_range or {}
        
        create_job(
            job_id=job_id,
            file_path=file_path,
            original_filename=file.filename,
            row_count=validation_result.row_count,
            column_count=validation_result.column_count,
            columns=all_columns,
            date_range=date_range,
            validation_result=validation_result.model_dump()
        )
        
        return UploadResponse(
            job_id=job_id,
            validation=validation_result,
            preview=preview,
            columns=all_columns,
            numeric_columns=numeric_columns,
            categorical_columns=categorical_columns
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing file: {str(e)}")


@router.get("/job/{job_id}")
async def get_job_info(job_id: str):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.get("/recent-jobs")
async def get_recent_jobs_list(limit: int = 10):
    jobs = get_recent_jobs(limit=min(limit, 50))
    return {"jobs": jobs}


@router.get("/job/{job_id}/full")
async def get_job_full_data(job_id: str):
    data = get_job_with_forecast(job_id)
    if not data:
        raise HTTPException(status_code=404, detail="Job not found")
    return data
