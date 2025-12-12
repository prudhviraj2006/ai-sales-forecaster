import os
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import requests

logger = logging.getLogger(__name__)


class ChatService:
    """AI-powered chat service for sales forecasting insights"""
    
    def __init__(self, forecast_data: Optional[Dict[str, Any]] = None):
        self.api_key = os.environ.get("OPENROUTER_API_KEY")
        if not self.api_key:
            logger.warning("OPENROUTER_API_KEY not set")
        
        self.api_url = "https://openrouter.ai/api/v1/chat/completions"
        self.model = "mistralai/mistral-7b-instruct:free"
        self.forecast_data = forecast_data or {}
        self.conversation_history = []
    
    def _build_context(self) -> str:
        """Build context from forecast data"""
        context = "You are an AI Sales Forecasting Assistant. "
        
        if self.forecast_data:
            if isinstance(self.forecast_data, dict):
                context += f"Forecast Metrics: {json.dumps(self.forecast_data.get('metrics', {}), default=str)[:500]}. "
        
        context += """Help users understand their sales forecasts, identify trends, answer questions about their data, 
and provide actionable insights. Be concise and focus on business impact.
When answering questions, reference the provided data and give specific insights. Be concise and actionable."""
        
        return context
    
    def chat(self, user_message: str, conversation_history: Optional[List[Dict[str, str]]] = None) -> Dict[str, Any]:
        """
        Send a message and get AI response
        
        Args:
            user_message: User's message
            conversation_history: Previous messages for context
        
        Returns:
            Dictionary with response and metadata
        """
        try:
            if not self.api_key:
                return {
                    'success': False,
                    'error': "API key not configured",
                    'response': "Sorry, the chat service is not configured. Please contact support."
                }
            
            # Build context
            context = self._build_context()
            
            # Prepare messages
            messages = []
            
            # Add system message with context
            messages.append({
                "role": "system",
                "content": context
            })
            
            # Add conversation history if provided
            if conversation_history:
                for msg in conversation_history[-10:]:  # Last 10 messages
                    messages.append({
                        "role": msg.get("role", "user"),
                        "content": msg.get("content", "")
                    })
            
            # Add current user message
            messages.append({
                "role": "user",
                "content": user_message
            })
            
            # Call OpenRouter API
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "HTTP-Referer": "https://replit.dev",
                "X-Title": "AI Sales Forecaster",
                "Content-Type": "application/json"
            }
            
            payload = {
                "model": self.model,
                "messages": messages,
                "temperature": 0.7,
                "max_tokens": 1024
            }
            
            response = requests.post(self.api_url, headers=headers, json=payload, timeout=30)
            
            if response.status_code != 200:
                logger.error(f"OpenRouter API error: {response.status_code} - {response.text}")
                return {
                    'success': False,
                    'error': f"API error: {response.status_code}",
                    'response': "Sorry, I encountered an error. Please try again."
                }
            
            data = response.json()
            ai_response = data['choices'][0]['message']['content']
            
            return {
                'success': True,
                'response': ai_response,
                'timestamp': datetime.now().isoformat(),
                'model': self.model,
                'tokens_used': 0
            }
        
        except Exception as e:
            logger.error(f"Chat error: {str(e)}")
            return {
                'success': False,
                'error': f"Failed to get response: {str(e)}",
                'response': "Sorry, I encountered an error. Please try again."
            }
    
    def generate_insights_from_query(self, question: str, forecast_data: Dict) -> str:
        """Generate specific insights based on question"""
        self.forecast_data = forecast_data
        result = self.chat(question)
        return result.get('response', "Unable to generate insights.")
