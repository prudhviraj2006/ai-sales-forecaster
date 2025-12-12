import sqlite3
import json
import os
from datetime import datetime
from typing import Optional, Dict, Any, List
from contextlib import contextmanager

DATABASE_PATH = os.environ.get("DATABASE_PATH", "backend/data/forecaster.db")


def init_database():
    os.makedirs(os.path.dirname(DATABASE_PATH), exist_ok=True)
    
    with get_connection() as conn:
        cursor = conn.cursor()
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS jobs (
                job_id TEXT PRIMARY KEY,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                file_path TEXT,
                original_filename TEXT,
                row_count INTEGER,
                column_count INTEGER,
                columns TEXT,
                date_range TEXT,
                validation_result TEXT
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS forecasts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                model_type TEXT,
                aggregation TEXT,
                horizon INTEGER,
                target_column TEXT,
                group_by TEXT,
                metrics TEXT,
                forecast_data TEXT,
                historical_data TEXT,
                decomposition_data TEXT,
                feature_importance TEXT,
                top_products TEXT,
                top_regions TEXT,
                FOREIGN KEY (job_id) REFERENCES jobs(job_id)
            )
        """)
        
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS insights (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                job_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                title TEXT,
                summary TEXT,
                kpis TEXT,
                bullets TEXT,
                recommendations TEXT,
                FOREIGN KEY (job_id) REFERENCES jobs(job_id)
            )
        """)
        
        conn.commit()


@contextmanager
def get_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def create_job(job_id: str, file_path: str, original_filename: str, 
               row_count: int, column_count: int, columns: List[str],
               date_range: Dict, validation_result: Dict) -> None:
    now = datetime.utcnow().isoformat()
    
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO jobs (job_id, created_at, updated_at, status, file_path,
                            original_filename, row_count, column_count, columns,
                            date_range, validation_result)
            VALUES (?, ?, ?, 'uploaded', ?, ?, ?, ?, ?, ?, ?)
        """, (
            job_id, now, now, file_path, original_filename,
            row_count, column_count, json.dumps(columns),
            json.dumps(date_range), json.dumps(validation_result)
        ))
        conn.commit()


def get_job(job_id: str) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM jobs WHERE job_id = ?", (job_id,))
        row = cursor.fetchone()
        
        if row:
            job = dict(row)
            job['columns'] = json.loads(job['columns']) if job['columns'] else []
            job['date_range'] = json.loads(job['date_range']) if job['date_range'] else {}
            job['validation_result'] = json.loads(job['validation_result']) if job['validation_result'] else {}
            return job
        return None


def update_job_status(job_id: str, status: str) -> None:
    now = datetime.utcnow().isoformat()
    
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            UPDATE jobs SET status = ?, updated_at = ? WHERE job_id = ?
        """, (status, now, job_id))
        conn.commit()


def save_forecast(job_id: str, model_type: str, aggregation: str, 
                  horizon: int, target_column: str, group_by: Optional[str],
                  metrics: Dict, forecast_data: List, historical_data: List,
                  decomposition_data: Optional[Dict], feature_importance: Optional[List],
                  top_products: Optional[List], top_regions: Optional[List]) -> int:
    now = datetime.utcnow().isoformat()
    
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO forecasts (job_id, created_at, model_type, aggregation,
                                  horizon, target_column, group_by, metrics,
                                  forecast_data, historical_data, decomposition_data,
                                  feature_importance, top_products, top_regions)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            job_id, now, model_type, aggregation, horizon, target_column, group_by,
            json.dumps(metrics), json.dumps(forecast_data), json.dumps(historical_data),
            json.dumps(decomposition_data) if decomposition_data else None,
            json.dumps(feature_importance) if feature_importance else None,
            json.dumps(top_products) if top_products else None,
            json.dumps(top_regions) if top_regions else None
        ))
        conn.commit()
        return cursor.lastrowid


def get_latest_forecast(job_id: str) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM forecasts WHERE job_id = ? ORDER BY created_at DESC LIMIT 1
        """, (job_id,))
        row = cursor.fetchone()
        
        if row:
            forecast = dict(row)
            forecast['metrics'] = json.loads(forecast['metrics']) if forecast['metrics'] else {}
            forecast['forecast_data'] = json.loads(forecast['forecast_data']) if forecast['forecast_data'] else []
            forecast['historical_data'] = json.loads(forecast['historical_data']) if forecast['historical_data'] else []
            forecast['decomposition_data'] = json.loads(forecast['decomposition_data']) if forecast['decomposition_data'] else None
            forecast['feature_importance'] = json.loads(forecast['feature_importance']) if forecast['feature_importance'] else None
            forecast['top_products'] = json.loads(forecast['top_products']) if forecast['top_products'] else None
            forecast['top_regions'] = json.loads(forecast['top_regions']) if forecast['top_regions'] else None
            return forecast
        return None


def save_insights(job_id: str, title: str, summary: str,
                  kpis: List, bullets: List, recommendations: List) -> int:
    now = datetime.utcnow().isoformat()
    
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO insights (job_id, created_at, title, summary, kpis, bullets, recommendations)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            job_id, now, title, summary,
            json.dumps(kpis), json.dumps(bullets), json.dumps(recommendations)
        ))
        conn.commit()
        return cursor.lastrowid


def get_latest_insights(job_id: str) -> Optional[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM insights WHERE job_id = ? ORDER BY created_at DESC LIMIT 1
        """, (job_id,))
        row = cursor.fetchone()
        
        if row:
            insights = dict(row)
            insights['kpis'] = json.loads(insights['kpis']) if insights['kpis'] else []
            insights['bullets'] = json.loads(insights['bullets']) if insights['bullets'] else []
            insights['recommendations'] = json.loads(insights['recommendations']) if insights['recommendations'] else []
            return insights
        return None


def get_recent_jobs(limit: int = 10) -> List[Dict[str, Any]]:
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT j.job_id, j.created_at, j.original_filename, j.row_count, 
                   j.column_count, j.status,
                   f.model_type, f.aggregation, f.horizon, f.target_column,
                   f.created_at as forecast_created_at
            FROM jobs j
            LEFT JOIN (
                SELECT job_id, model_type, aggregation, horizon, target_column, created_at,
                       ROW_NUMBER() OVER (PARTITION BY job_id ORDER BY created_at DESC) as rn
                FROM forecasts
            ) f ON j.job_id = f.job_id AND f.rn = 1
            ORDER BY j.created_at DESC
            LIMIT ?
        """, (limit,))
        
        rows = cursor.fetchall()
        result = []
        
        for row in rows:
            job = dict(row)
            job['has_forecast'] = job.get('model_type') is not None
            result.append(job)
        
        return result


def get_job_with_forecast(job_id: str) -> Optional[Dict[str, Any]]:
    job = get_job(job_id)
    if not job:
        return None
    
    forecast = get_latest_forecast(job_id)
    insights = get_latest_insights(job_id)
    
    return {
        'job': job,
        'forecast': forecast,
        'insights': insights
    }
