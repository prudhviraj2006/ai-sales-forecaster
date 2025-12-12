from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import logging

from ..services.chat_service import ChatService

logger = logging.getLogger(__name__)
router = APIRouter()


class ChatRequest(BaseModel):
    job_id: str
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = None


class ChatResponse(BaseModel):
    success: bool
    response: str
    timestamp: Optional[str] = None
    model: Optional[str] = None
    error: Optional[str] = None


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat with AI about forecast insights
    
    Args:
        job_id: ID of the forecast job
        message: User's message
        conversation_history: Previous messages for context
    
    Returns:
        AI response with metadata
    """
    try:
        # Initialize chat service
        service = ChatService()
        
        # Get response
        result = service.chat(
            user_message=request.message,
            conversation_history=request.conversation_history or []
        )
        
        return ChatResponse(
            success=result.get('success', False),
            response=result.get('response', ''),
            timestamp=result.get('timestamp'),
            model=result.get('model'),
            error=result.get('error')
        )
    
    except Exception as e:
        logger.error(f"Chat endpoint error: {str(e)}")
        return ChatResponse(
            success=False,
            response="Sorry, I encountered an error. Please try again.",
            error=str(e)
        )
