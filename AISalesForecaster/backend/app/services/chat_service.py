import os
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import google.generativeai as genai

logger = logging.getLogger(__name__)


class ChatService:
    """AI-powered chat service for sales forecasting insights"""
    
    def __init__(self, forecast_data: Dict = None):
        api_key = os.environ.get("GOOGLE_AI_API_KEY")
        if not api_key:
            logger.warning("GOOGLE_AI_API_KEY not set")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        self.forecast_data = forecast_data or {}
        self.conversation_history = []
    
    def _build_context(self) -> str:
        """Build context from forecast data"""
        context = "You are an AI Sales Forecasting Assistant. "
        
        if self.forecast_data:
            metrics = self.forecast_data.get('metrics', {})
            forecast = self.forecast_data.get('forecast', [])
            historical = self.forecast_data.get('historical', [])
            
            context += f"""Current Forecast Data:
- Model Type: {self.forecast_data.get('model_type', 'Prophet')}
- MAPE (Accuracy): {metrics.get('mape', 'N/A')}%
- Confidence Score: {metrics.get('confidence_score', 'N/A')}%
- Risk Level: {metrics.get('risk_level', 'N/A')}
- Total Forecast Points: {len(forecast)}
- Historical Data Points: {len(historical)}

When answering questions, reference this data and provide specific insights. Be concise and actionable."""
        
        return context
    
    def chat(self, user_message: str, conversation_history: List[Dict] = None) -> Dict[str, Any]:
        """
        Send a message and get AI response
        
        Args:
            user_message: User's message
            conversation_history: Previous messages for context
        
        Returns:
            Dictionary with response and metadata
        """
        try:
            # Build full prompt with context
            context = self._build_context()
            
            # Add conversation history if provided
            history_text = ""
            if conversation_history:
                for msg in conversation_history[-10:]:  # Last 10 messages
                    role = "User" if msg.get("role") == "user" else "Assistant"
                    history_text += f"{role}: {msg.get('content', '')}\n"
            
            # Combine everything into a single prompt
            full_prompt = f"{context}\n\nConversation History:\n{history_text}\nUser: {user_message}"
            
            # Call Gemini API
            response = self.model.generate_content(full_prompt)
            ai_response = response.text
            
            return {
                'success': True,
                'response': ai_response,
                'timestamp': datetime.now().isoformat(),
                'model': 'gemini-1.5-flash',
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
        
        queries = {
            'forecast': 'What is the forecast trend for the next period?',
            'growth': 'What is the growth rate trend?',
            'seasonal': 'Explain the seasonal patterns in the data',
            'anomaly': 'Are there any anomalies in the data?',
            'product': 'Which products are performing best?',
            'region': 'How are different regions performing?'
        }
        
        # Map question to query type
        query_type = 'forecast'
        for key, pattern in queries.items():
            if any(word in question.lower() for word in key.split()):
                query_type = key
                break
        
        response = self.chat(question)
        return response.get('response', '')
