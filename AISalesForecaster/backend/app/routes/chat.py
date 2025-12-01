import logging
import json
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional

from ..services.chat_service import ChatService
from ..models.database import get_latest_forecast

logger = logging.getLogger(__name__)
router = APIRouter()


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    job_id: str
    message: str
    conversation_history: Optional[List[ChatMessage]] = None


class ChatResponse(BaseModel):
    success: bool
    response: str
    timestamp: str
    error: Optional[str] = None


@router.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """Chat with AI about forecast insights"""
    try:
        # Get forecast data
        forecast = get_latest_forecast(request.job_id)
        if not forecast:
            raise HTTPException(status_code=404, detail="Forecast not found")
        
        # Parse forecast data
        forecast_data = {
            'model_type': forecast.get('model_type'),
            'metrics': json.loads(forecast['metrics']) if isinstance(forecast['metrics'], str) else forecast['metrics'],
            'forecast': json.loads(forecast['forecast_data']) if isinstance(forecast['forecast_data'], str) else forecast['forecast_data'],
            'historical': json.loads(forecast['historical_data']) if isinstance(forecast['historical_data'], str) else forecast['historical_data']
        }
        
        # Initialize chat service
        chat_service = ChatService(forecast_data)
        
        # Convert conversation history
        history = []
        if request.conversation_history:
            history = [{"role": msg.role, "content": msg.content} for msg in request.conversation_history]
        
        # Get response
        result = chat_service.chat(request.message, history)
        
        if result.get('success'):
            return ChatResponse(
                success=True,
                response=result['response'],
                timestamp=result['timestamp']
            )
        else:
            return ChatResponse(
                success=False,
                response=result['response'],
                timestamp=result.get('timestamp', ''),
                error=result.get('error')
            )
    
    except Exception as e:
        logger.error(f"Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")
