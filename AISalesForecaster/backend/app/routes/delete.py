import logging
from fastapi import APIRouter, HTTPException
from ..models.database import get_connection

logger = logging.getLogger(__name__)
router = APIRouter()


@router.delete("/job/{job_id}")
async def delete_job(job_id: str):
    """Delete a job and all its associated data (forecasts, uploads)"""
    try:
        with get_connection() as conn:
            cursor = conn.cursor()
            
            # Delete forecast data
            cursor.execute("DELETE FROM forecasts WHERE job_id = ?", (job_id,))
            
            # Delete insights data
            cursor.execute("DELETE FROM insights WHERE job_id = ?", (job_id,))
            
            # Delete job
            cursor.execute("DELETE FROM jobs WHERE job_id = ?", (job_id,))
            
            conn.commit()
        
        logger.info(f"Deleted job {job_id} and all associated data")
        return {"status": "success", "message": f"Job {job_id} deleted"}
        
    except Exception as e:
        logger.error(f"Error deleting job {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to delete job: {str(e)}")
