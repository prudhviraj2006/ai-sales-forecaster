import os
import io
import pandas as pd
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from datetime import datetime
import logging

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT

from ..models.schemas import DownloadFormat
from ..models.database import get_job, get_latest_forecast, get_latest_insights

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/download")
async def download_report(
    job_id: str = Query(..., description="Job ID"),
    format: DownloadFormat = Query(DownloadFormat.CSV, description="Download format")
):
    job = get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    forecast = get_latest_forecast(job_id)
    if not forecast:
        raise HTTPException(status_code=404, detail="No forecast found")
    
    try:
        if format == DownloadFormat.CSV:
            return await generate_csv(job_id, forecast)
        else:
            return await generate_pdf(job_id, job, forecast)
            
    except Exception as e:
        logger.error(f"Download error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating download: {str(e)}")


async def generate_csv(job_id: str, forecast: dict) -> StreamingResponse:
    historical_data = forecast.get('historical_data', [])
    forecast_data = forecast.get('forecast_data', [])
    
    all_data = []
    
    for point in historical_data:
        all_data.append({
            'date': point['date'],
            'actual': point.get('actual'),
            'predicted': point.get('predicted'),
            'lower_bound': point.get('lower_bound'),
            'upper_bound': point.get('upper_bound'),
            'type': 'historical'
        })
    
    for point in forecast_data:
        all_data.append({
            'date': point['date'],
            'actual': None,
            'predicted': point.get('predicted'),
            'lower_bound': point.get('lower_bound'),
            'upper_bound': point.get('upper_bound'),
            'type': 'forecast'
        })
    
    df = pd.DataFrame(all_data)
    
    buffer = io.StringIO()
    df.to_csv(buffer, index=False)
    buffer.seek(0)
    
    filename = f"forecast_{job_id}_{datetime.now().strftime('%Y%m%d')}.csv"
    
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


async def generate_pdf(job_id: str, job: dict, forecast: dict) -> StreamingResponse:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#1e40af'),
        spaceAfter=20,
        alignment=TA_CENTER
    )
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#1f2937'),
        spaceBefore=15,
        spaceAfter=10
    )
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#374151'),
        spaceAfter=8
    )
    
    elements = []
    
    elements.append(Paragraph("AI Sales Forecaster Report", title_style))
    elements.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y')}", body_style))
    elements.append(Spacer(1, 20))
    
    elements.append(Paragraph("Forecast Summary", heading_style))
    
    metrics = forecast.get('metrics', {})
    summary_data = [
        ['Model Type', forecast.get('model_type', 'N/A').upper()],
        ['Aggregation', forecast.get('aggregation', 'N/A').title()],
        ['Horizon', f"{forecast.get('horizon', 'N/A')} months"],
        ['Target Column', forecast.get('target_column', 'N/A').title()],
        ['MAE', f"{metrics.get('mae', 'N/A')}"],
        ['RMSE', f"{metrics.get('rmse', 'N/A')}"],
        ['MAPE', f"{metrics.get('mape', 'N/A')}%"],
    ]
    
    summary_table = Table(summary_data, colWidths=[2*inch, 3*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#1f2937')),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
    ]))
    elements.append(summary_table)
    elements.append(Spacer(1, 20))
    
    insights = get_latest_insights(job_id)
    if insights:
        elements.append(Paragraph("Business Insights", heading_style))
        elements.append(Paragraph(insights.get('summary', ''), body_style))
        elements.append(Spacer(1, 10))
        
        bullets = insights.get('bullets', [])
        for bullet in bullets:
            text = bullet.get('text', '') if isinstance(bullet, dict) else str(bullet)
            elements.append(Paragraph(f"• {text}", body_style))
        
        elements.append(Spacer(1, 15))
        
        elements.append(Paragraph("Recommendations", heading_style))
        recommendations = insights.get('recommendations', [])
        for i, rec in enumerate(recommendations, 1):
            if isinstance(rec, dict):
                title = rec.get('title', '')
                desc = rec.get('description', '')
                elements.append(Paragraph(f"{i}. <b>{title}</b>: {desc}", body_style))
            else:
                elements.append(Paragraph(f"{i}. {rec}", body_style))
    
    elements.append(Spacer(1, 20))
    
    elements.append(Paragraph("Forecast Data (Preview)", heading_style))
    
    forecast_data = forecast.get('forecast_data', [])[:10]
    if forecast_data:
        table_data = [['Date', 'Predicted', 'Lower Bound', 'Upper Bound']]
        for point in forecast_data:
            table_data.append([
                point.get('date', ''),
                f"{point.get('predicted', 0):,.2f}",
                f"{point.get('lower_bound', 0):,.2f}",
                f"{point.get('upper_bound', 0):,.2f}"
            ])
        
        forecast_table = Table(table_data, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
        forecast_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')]),
        ]))
        elements.append(forecast_table)
    
    doc.build(elements)
    buffer.seek(0)
    
    filename = f"forecast_report_{job_id}_{datetime.now().strftime('%Y%m%d')}.pdf"
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
