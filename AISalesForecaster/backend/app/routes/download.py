import os
import io
import json
import pandas as pd
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from datetime import datetime
import logging

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

from ..models.schemas import DownloadFormat
from ..models.database import get_job, get_latest_forecast, get_latest_insights

router = APIRouter()
logger = logging.getLogger(__name__)


def parse_json_field(value, default=None):
    if value is None:
        return default
    if isinstance(value, (list, dict)):
        return value
    if isinstance(value, str):
        try:
            return json.loads(value)
        except:
            return default
    return default


def create_forecast_chart(historical, forecast_data):
    fig, ax = plt.subplots(figsize=(10, 5))
    
    hist_dates = [h.get('date', '') for h in historical]
    hist_values = [h.get('actual', 0) for h in historical]
    
    fore_dates = [f.get('date', '') for f in forecast_data]
    fore_values = [f.get('predicted', 0) for f in forecast_data]
    lower_bounds = [f.get('lower_bound', 0) for f in forecast_data]
    upper_bounds = [f.get('upper_bound', 0) for f in forecast_data]
    
    ax.plot(range(len(hist_dates)), hist_values, 'b-', linewidth=2, label='Historical')
    
    fore_start = len(hist_dates)
    fore_range = range(fore_start, fore_start + len(fore_dates))
    ax.plot(fore_range, fore_values, 'purple', linestyle='--', linewidth=2, label='Forecast')
    ax.fill_between(fore_range, lower_bounds, upper_bounds, color='purple', alpha=0.2, label='Confidence Interval')
    
    all_dates = hist_dates + fore_dates
    step = max(1, len(all_dates) // 8)
    ax.set_xticks(range(0, len(all_dates), step))
    ax.set_xticklabels([all_dates[i][:10] for i in range(0, len(all_dates), step)], rotation=45, ha='right')
    
    ax.set_xlabel('Date')
    ax.set_ylabel('Value')
    ax.set_title('Forecast Trend - Historical vs Predictions', fontsize=14, fontweight='bold')
    ax.legend()
    ax.grid(True, alpha=0.3)
    
    plt.tight_layout()
    
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    buf.seek(0)
    return buf


def create_residuals_chart(historical):
    fig, ax = plt.subplots(figsize=(10, 4))
    
    recent = historical[-20:] if len(historical) > 20 else historical
    dates = [h.get('date', '')[:10] for h in recent]
    values = [h.get('actual', 0) for h in recent]
    
    mean_val = np.mean(values) if values else 0
    residuals = [v - mean_val for v in values]
    
    colors_list = ['#06b6d4' if r >= 0 else '#f43f5e' for r in residuals]
    ax.bar(range(len(residuals)), residuals, color=colors_list, alpha=0.8)
    
    ax.axhline(y=0, color='gray', linestyle='-', linewidth=1)
    ax.set_xlabel('Period')
    ax.set_ylabel('Residual Value')
    ax.set_title('Forecast Residuals (Deviation from Mean)', fontsize=14, fontweight='bold')
    ax.grid(True, alpha=0.3, axis='y')
    
    plt.tight_layout()
    
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    buf.seek(0)
    return buf


def create_comparison_chart(historical, forecast_data):
    fig, ax = plt.subplots(figsize=(8, 4))
    
    hist_total = sum(h.get('actual', 0) for h in historical)
    fore_total = sum(f.get('predicted', 0) for f in forecast_data)
    
    categories = ['Historical Total', 'Forecast Total']
    values = [hist_total, fore_total]
    colors_list = ['#3b82f6', '#8b5cf6']
    
    bars = ax.bar(categories, values, color=colors_list, width=0.6)
    
    for bar, val in zip(bars, values):
        height = bar.get_height()
        ax.annotate(f'{val:,.0f}',
                    xy=(bar.get_x() + bar.get_width() / 2, height),
                    xytext=(0, 3),
                    textcoords="offset points",
                    ha='center', va='bottom', fontsize=10, fontweight='bold')
    
    ax.set_ylabel('Total Value')
    ax.set_title('Historical vs Forecast Comparison', fontsize=14, fontweight='bold')
    ax.grid(True, alpha=0.3, axis='y')
    
    plt.tight_layout()
    
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    buf.seek(0)
    return buf


def create_feature_importance_chart(feature_importance):
    if not feature_importance:
        return None
    
    fig, ax = plt.subplots(figsize=(8, 5))
    
    features = [f.get('feature', '') for f in feature_importance[:10]]
    importance = [f.get('importance', 0) for f in feature_importance[:10]]
    
    features = features[::-1]
    importance = importance[::-1]
    
    colors_list = plt.cm.Blues(np.linspace(0.4, 0.9, len(features)))
    
    ax.barh(features, importance, color=colors_list)
    ax.set_xlabel('Importance (%)')
    ax.set_title('Feature Importance Rankings', fontsize=14, fontweight='bold')
    ax.grid(True, alpha=0.3, axis='x')
    
    plt.tight_layout()
    
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    buf.seek(0)
    return buf


def create_decomposition_charts(decomposition):
    if not decomposition:
        return None, None
    
    trend_buf = None
    seasonal_buf = None
    
    trend_data = decomposition.get('trend', [])
    if trend_data:
        fig, ax = plt.subplots(figsize=(10, 3))
        dates = range(len(trend_data))
        values = [t.get('value', 0) for t in trend_data]
        ax.plot(dates, values, 'b-', linewidth=2)
        ax.set_title('Trend Component', fontsize=14, fontweight='bold')
        ax.set_xlabel('Period')
        ax.set_ylabel('Value')
        ax.grid(True, alpha=0.3)
        plt.tight_layout()
        trend_buf = io.BytesIO()
        plt.savefig(trend_buf, format='png', dpi=150, bbox_inches='tight')
        plt.close(fig)
        trend_buf.seek(0)
    
    seasonal_data = decomposition.get('seasonal', [])
    if seasonal_data:
        fig, ax = plt.subplots(figsize=(10, 3))
        dates = range(len(seasonal_data))
        values = [s.get('value', 0) for s in seasonal_data]
        ax.fill_between(dates, values, alpha=0.5, color='purple')
        ax.plot(dates, values, 'purple', linewidth=2)
        ax.set_title('Seasonal Component', fontsize=14, fontweight='bold')
        ax.set_xlabel('Period')
        ax.set_ylabel('Value')
        ax.grid(True, alpha=0.3)
        plt.tight_layout()
        seasonal_buf = io.BytesIO()
        plt.savefig(seasonal_buf, format='png', dpi=150, bbox_inches='tight')
        plt.close(fig)
        seasonal_buf.seek(0)
    
    return trend_buf, seasonal_buf


def create_top_products_chart(top_products):
    if not top_products:
        return None
    
    fig, ax = plt.subplots(figsize=(8, 4))
    
    products = [p.get('name', '')[:15] for p in top_products[:5]]
    values = [p.get('value', 0) for p in top_products[:5]]
    
    products = products[::-1]
    values = values[::-1]
    
    colors_list = plt.cm.Greens(np.linspace(0.4, 0.9, len(products)))
    
    ax.barh(products, values, color=colors_list)
    ax.set_xlabel('Value')
    ax.set_title('Top Products by Revenue', fontsize=14, fontweight='bold')
    ax.grid(True, alpha=0.3, axis='x')
    
    plt.tight_layout()
    
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    buf.seek(0)
    return buf


def create_top_regions_chart(top_regions):
    if not top_regions:
        return None
    
    fig, ax = plt.subplots(figsize=(6, 6))
    
    regions = [r.get('name', '') for r in top_regions[:5]]
    values = [r.get('value', 0) for r in top_regions[:5]]
    
    colors_list = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981']
    
    ax.pie(values, labels=regions, autopct='%1.1f%%', colors=colors_list[:len(regions)], startangle=90)
    ax.set_title('Top Regions Distribution', fontsize=14, fontweight='bold')
    
    plt.tight_layout()
    
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight')
    plt.close(fig)
    buf.seek(0)
    return buf


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
    historical_data = parse_json_field(forecast.get('historical_data'), [])
    forecast_data = parse_json_field(forecast.get('forecast_data'), [])
    metrics = parse_json_field(forecast.get('metrics'), {})
    decomposition = parse_json_field(forecast.get('decomposition_data'), {})
    feature_importance = parse_json_field(forecast.get('feature_importance'), [])
    top_products = parse_json_field(forecast.get('top_products'), [])
    top_regions = parse_json_field(forecast.get('top_regions'), [])
    
    output = io.StringIO()
    
    output.write("=" * 60 + "\n")
    output.write("AI SALES FORECASTER - COMPLETE EXPORT\n")
    output.write(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    output.write("=" * 60 + "\n\n")
    
    output.write("### FORECAST SUMMARY ###\n")
    output.write(f"Model Type,{forecast.get('model_type', 'N/A')}\n")
    output.write(f"Aggregation,{forecast.get('aggregation', 'N/A')}\n")
    output.write(f"Horizon,{forecast.get('horizon', 'N/A')} months\n")
    output.write(f"Target Column,{forecast.get('target_column', 'N/A')}\n\n")
    
    output.write("### PERFORMANCE METRICS ###\n")
    output.write(f"MAE,{metrics.get('mae', 'N/A')}\n")
    output.write(f"RMSE,{metrics.get('rmse', 'N/A')}\n")
    output.write(f"MAPE,{metrics.get('mape', 'N/A')}%\n")
    mape = metrics.get('mape', 0)
    accuracy = 100 - mape if isinstance(mape, (int, float)) else 'N/A'
    output.write(f"Accuracy,{accuracy}%\n\n")
    
    output.write("### HISTORICAL DATA ###\n")
    output.write("date,actual,predicted,lower_bound,upper_bound,type\n")
    for point in historical_data:
        output.write(f"{point.get('date', '')},{point.get('actual', '')},{point.get('predicted', '')},{point.get('lower_bound', '')},{point.get('upper_bound', '')},historical\n")
    output.write("\n")
    
    output.write("### FORECAST DATA ###\n")
    output.write("date,predicted,lower_bound,upper_bound,type\n")
    for point in forecast_data:
        output.write(f"{point.get('date', '')},{point.get('predicted', '')},{point.get('lower_bound', '')},{point.get('upper_bound', '')},forecast\n")
    output.write("\n")
    
    if feature_importance:
        output.write("### FEATURE IMPORTANCE ###\n")
        output.write("feature,importance\n")
        for feat in feature_importance:
            output.write(f"{feat.get('feature', '')},{feat.get('importance', '')}\n")
        output.write("\n")
    
    if top_products:
        output.write("### TOP PRODUCTS ###\n")
        output.write("product_name,value\n")
        for prod in top_products:
            output.write(f"{prod.get('name', '')},{prod.get('value', '')}\n")
        output.write("\n")
    
    if top_regions:
        output.write("### TOP REGIONS ###\n")
        output.write("region_name,value\n")
        for reg in top_regions:
            output.write(f"{reg.get('name', '')},{reg.get('value', '')}\n")
        output.write("\n")
    
    if decomposition:
        trend_data = decomposition.get('trend', [])
        if trend_data:
            output.write("### TREND DECOMPOSITION ###\n")
            output.write("date,value\n")
            for t in trend_data:
                output.write(f"{t.get('date', '')},{t.get('value', '')}\n")
            output.write("\n")
        
        seasonal_data = decomposition.get('seasonal', [])
        if seasonal_data:
            output.write("### SEASONAL DECOMPOSITION ###\n")
            output.write("date,value\n")
            for s in seasonal_data:
                output.write(f"{s.get('date', '')},{s.get('value', '')}\n")
            output.write("\n")
    
    insights = get_latest_insights(job_id)
    if insights:
        output.write("### BUSINESS INSIGHTS ###\n")
        summary = insights.get('summary', '')
        if summary:
            output.write(f"Summary: {summary}\n\n")
        
        bullets = parse_json_field(insights.get('bullets'), [])
        if bullets:
            output.write("Key Observations:\n")
            for bullet in bullets:
                text = bullet.get('text', '') if isinstance(bullet, dict) else str(bullet)
                output.write(f"- {text}\n")
            output.write("\n")
        
        recommendations = parse_json_field(insights.get('recommendations'), [])
        if recommendations:
            output.write("Recommendations:\n")
            for i, rec in enumerate(recommendations, 1):
                if isinstance(rec, dict):
                    output.write(f"{i}. {rec.get('title', '')}: {rec.get('description', '')}\n")
                else:
                    output.write(f"{i}. {rec}\n")
    
    output.seek(0)
    
    filename = f"forecast_complete_{job_id}_{datetime.now().strftime('%Y%m%d')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
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
        fontSize=20,
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
    subheading_style = ParagraphStyle(
        'CustomSubheading',
        parent=styles['Heading3'],
        fontSize=12,
        textColor=colors.HexColor('#4b5563'),
        spaceBefore=10,
        spaceAfter=8
    )
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=10,
        textColor=colors.HexColor('#374151'),
        spaceAfter=8
    )
    
    elements = []
    
    historical_data = parse_json_field(forecast.get('historical_data'), [])
    forecast_data = parse_json_field(forecast.get('forecast_data'), [])
    metrics = parse_json_field(forecast.get('metrics'), {})
    decomposition = parse_json_field(forecast.get('decomposition_data'), {})
    feature_importance = parse_json_field(forecast.get('feature_importance'), [])
    top_products = parse_json_field(forecast.get('top_products'), [])
    top_regions = parse_json_field(forecast.get('top_regions'), [])
    
    elements.append(Paragraph("AI Sales Forecaster", title_style))
    elements.append(Paragraph("Complete Analysis Report", subheading_style))
    elements.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y at %H:%M')}", body_style))
    elements.append(Spacer(1, 20))
    
    elements.append(Paragraph("Forecast Summary", heading_style))
    
    mape = metrics.get('mape', 0)
    accuracy = f"{100 - mape:.1f}%" if isinstance(mape, (int, float)) else 'N/A'
    
    summary_data = [
        ['Model Type', forecast.get('model_type', 'N/A').upper()],
        ['Aggregation', forecast.get('aggregation', 'N/A').title()],
        ['Horizon', f"{forecast.get('horizon', 'N/A')} months"],
        ['Target Column', forecast.get('target_column', 'N/A').title()],
        ['MAE', f"{metrics.get('mae', 'N/A'):.2f}" if isinstance(metrics.get('mae'), (int, float)) else 'N/A'],
        ['RMSE', f"{metrics.get('rmse', 'N/A'):.2f}" if isinstance(metrics.get('rmse'), (int, float)) else 'N/A'],
        ['MAPE', f"{metrics.get('mape', 'N/A'):.2f}%" if isinstance(metrics.get('mape'), (int, float)) else 'N/A'],
        ['Accuracy', accuracy],
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
    
    elements.append(Paragraph("Page 1: Forecast Trend Chart", heading_style))
    try:
        forecast_chart = create_forecast_chart(historical_data, forecast_data)
        elements.append(Image(forecast_chart, width=6.5*inch, height=3.25*inch))
    except Exception as e:
        logger.error(f"Error creating forecast chart: {e}")
        elements.append(Paragraph("(Chart generation failed)", body_style))
    elements.append(Spacer(1, 15))
    
    elements.append(PageBreak())
    
    elements.append(Paragraph("Page 2: Detailed Analysis", heading_style))
    
    elements.append(Paragraph("Residuals Analysis", subheading_style))
    try:
        residuals_chart = create_residuals_chart(historical_data)
        elements.append(Image(residuals_chart, width=6.5*inch, height=2.5*inch))
    except Exception as e:
        logger.error(f"Error creating residuals chart: {e}")
    elements.append(Spacer(1, 15))
    
    elements.append(Paragraph("Historical vs Forecast Comparison", subheading_style))
    try:
        comparison_chart = create_comparison_chart(historical_data, forecast_data)
        elements.append(Image(comparison_chart, width=5*inch, height=2.5*inch))
    except Exception as e:
        logger.error(f"Error creating comparison chart: {e}")
    elements.append(Spacer(1, 15))
    
    if top_products:
        elements.append(PageBreak())
        elements.append(Paragraph("Top Products Performance", subheading_style))
        try:
            products_chart = create_top_products_chart(top_products)
            if products_chart:
                elements.append(Image(products_chart, width=5*inch, height=2.5*inch))
        except Exception as e:
            logger.error(f"Error creating products chart: {e}")
        elements.append(Spacer(1, 15))
    
    if top_regions:
        elements.append(Paragraph("Top Regions Distribution", subheading_style))
        try:
            regions_chart = create_top_regions_chart(top_regions)
            if regions_chart:
                elements.append(Image(regions_chart, width=4*inch, height=4*inch))
        except Exception as e:
            logger.error(f"Error creating regions chart: {e}")
        elements.append(Spacer(1, 15))
    
    elements.append(PageBreak())
    elements.append(Paragraph("Page 3: Decomposition & Feature Analysis", heading_style))
    
    if decomposition:
        try:
            trend_buf, seasonal_buf = create_decomposition_charts(decomposition)
            if trend_buf:
                elements.append(Paragraph("Trend Component", subheading_style))
                elements.append(Image(trend_buf, width=6.5*inch, height=2*inch))
                elements.append(Spacer(1, 10))
            if seasonal_buf:
                elements.append(Paragraph("Seasonal Component", subheading_style))
                elements.append(Image(seasonal_buf, width=6.5*inch, height=2*inch))
        except Exception as e:
            logger.error(f"Error creating decomposition charts: {e}")
    
    if feature_importance:
        elements.append(Spacer(1, 15))
        elements.append(Paragraph("Feature Importance", subheading_style))
        try:
            feature_chart = create_feature_importance_chart(feature_importance)
            if feature_chart:
                elements.append(Image(feature_chart, width=5*inch, height=3*inch))
        except Exception as e:
            logger.error(f"Error creating feature importance chart: {e}")
    
    insights = get_latest_insights(job_id)
    if insights:
        elements.append(PageBreak())
        elements.append(Paragraph("Page 4: Business Insights", heading_style))
        
        summary = insights.get('summary', '')
        if summary:
            elements.append(Paragraph(summary, body_style))
        elements.append(Spacer(1, 10))
        
        bullets = parse_json_field(insights.get('bullets'), [])
        if bullets:
            elements.append(Paragraph("Key Observations", subheading_style))
            for bullet in bullets:
                text = bullet.get('text', '') if isinstance(bullet, dict) else str(bullet)
                elements.append(Paragraph(f"• {text}", body_style))
        
        elements.append(Spacer(1, 15))
        
        recommendations = parse_json_field(insights.get('recommendations'), [])
        if recommendations:
            elements.append(Paragraph("Recommendations", subheading_style))
            for i, rec in enumerate(recommendations, 1):
                if isinstance(rec, dict):
                    title = rec.get('title', '')
                    desc = rec.get('description', '')
                    elements.append(Paragraph(f"{i}. <b>{title}</b>: {desc}", body_style))
                else:
                    elements.append(Paragraph(f"{i}. {rec}", body_style))
    
    elements.append(PageBreak())
    elements.append(Paragraph("Forecast Data Table", heading_style))
    
    if forecast_data:
        table_data = [['Date', 'Predicted', 'Lower Bound', 'Upper Bound']]
        for point in forecast_data[:15]:
            table_data.append([
                point.get('date', '')[:10],
                f"{point.get('predicted', 0):,.2f}",
                f"{point.get('lower_bound', 0):,.2f}",
                f"{point.get('upper_bound', 0):,.2f}"
            ])
        
        if len(forecast_data) > 15:
            table_data.append(['...', '...', '...', '...'])
        
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
    
    filename = f"forecast_complete_report_{job_id}_{datetime.now().strftime('%Y%m%d')}.pdf"
    
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
