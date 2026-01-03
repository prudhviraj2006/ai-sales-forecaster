import os
import logging
from typing import List, Dict, Any
from datetime import datetime
import json
import requests

logger = logging.getLogger(__name__)


class ChatService:
    """AI-powered chat service for sales forecasting insights using OpenRouter API"""

    def __init__(self, forecast_data: Dict = None):
        api_key = os.environ.get("OPENROUTER_API_KEY")

        if not api_key:
            logger.warning("OPENROUTER_API_KEY not set, using fallback responses")
            self.client = None
        else:
            try:
                self.client = {
                    "api_key": api_key,
                    "base_url": "https://openrouter.ai/api/v1/chat/completions",
                    "model": "anthropic/claude-3-haiku"  # Free model option
                }
                logger.info("OpenRouter client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize OpenRouter client: {e}")
                self.client = None

        self.forecast_data = forecast_data or {}
        self.conversation_history = []

    def _build_context(self) -> str:
        """Build context from forecast data"""
        context = "You are an AI Sales Forecasting Assistant.\n"

        if self.forecast_data:
            metrics = self.forecast_data.get("metrics", {})
            forecast = self.forecast_data.get("forecast", [])
            historical = self.forecast_data.get("historical", [])

            context += f"""
Current Forecast Data:
- Model Type: {self.forecast_data.get("model_type", "Prophet")}
- MAPE (Accuracy): {metrics.get("mape", "N/A")}%
- Confidence Score: {metrics.get("confidence_score", "N/A")}%
- Risk Level: {metrics.get("risk_level", "N/A")}
- Total Forecast Points: {len(forecast)}
- Historical Data Points: {len(historical)}

When answering questions, reference this data and provide concise, actionable insights.
"""
        return context.strip()

    def chat(
        self,
        user_message: str,
        conversation_history: List[Dict] = None
    ) -> Dict[str, Any]:
        """Send a message and get AI response"""

        try:
            # If no AI client available, use rule-based responses
            if not self.client:
                return self._fallback_response(user_message)

            context = self._build_context()

            # Build messages array for OpenRouter API
            messages = [
                {"role": "system", "content": context}
            ]

            # Add conversation history
            if conversation_history:
                for msg in conversation_history[-10:]:
                    role = msg.get("role", "user")
                    if role == "user":
                        messages.append({"role": "user", "content": msg.get("content", "")})
                    else:
                        messages.append({"role": "assistant", "content": msg.get("content", "")})

            # Add current user message
            messages.append({"role": "user", "content": user_message})

            # Make API request to OpenRouter
            headers = {
                "Authorization": f"Bearer {self.client['api_key']}",
                "Content-Type": "application/json"
            }

            payload = {
                "model": self.client["model"],
                "messages": messages,
                "max_tokens": 1000,
                "temperature": 0.7
            }

            response = requests.post(
                self.client["base_url"],
                headers=headers,
                json=payload,
                timeout=30
            )

            if response.status_code == 200:
                result = response.json()
                ai_response = result["choices"][0]["message"]["content"]
                
                return {
                    "success": True,
                    "response": ai_response,
                    "timestamp": datetime.now().isoformat(),
                    "model": self.client["model"]
                }
            else:
                logger.error(f"OpenRouter API error: {response.status_code} - {response.text}")
                return self._fallback_response(user_message, f"API Error: {response.status_code}")

        except Exception as e:
            logger.error(f"Chat error: {str(e)}", exc_info=True)
            return self._fallback_response(user_message, str(e))

    def _fallback_response(self, user_message: str, error: str = None) -> Dict[str, Any]:
        """Provide rule-based responses when AI is not available"""
        
        message_lower = user_message.lower()
        
        # Forecast-related responses
        if "forecast" in message_lower and ("next" in message_lower or "future" in message_lower):
            if "6 month" in message_lower or "six month" in message_lower:
                return {
                    "success": True,
                    "response": "Based on the current forecast model, the next 6 months show a continuing trend with the patterns identified in your historical data. The forecast indicates moderate growth with seasonal variations. For specific numbers, please refer to the forecast chart in the dashboard.",
                    "timestamp": datetime.now().isoformat(),
                    "model": "fallback"
                }
            elif "3 month" in message_lower or "three month" in message_lower:
                return {
                    "success": True,
                    "response": "The 3-month forecast projects short-term stability based on recent trends. The model shows confidence in the current trajectory with typical seasonal fluctuations expected.",
                    "timestamp": datetime.now().isoformat(),
                    "model": "fallback"
                }
            elif "12 month" in message_lower or "year" in message_lower:
                return {
                    "success": True,
                    "response": "The 12-month forecast provides a comprehensive view of the upcoming year, showing annual patterns and long-term trends. The model accounts for seasonal cycles and projected market conditions.",
                    "timestamp": datetime.now().isoformat(),
                    "model": "fallback"
                }
            else:
                return {
                    "success": True,
                    "response": "The forecast shows promising trends based on your historical data. You can view detailed projections for different time horizons (3, 6, or 12 months) in the forecast dashboard. The model provides confidence intervals to help with planning.",
                    "timestamp": datetime.now().isoformat(),
                    "model": "fallback"
                }
        
        # Insights-related responses
        elif "insight" in message_lower or "trend" in message_lower or "pattern" in message_lower:
            return {
                "success": True,
                "response": "Based on the forecast analysis, key insights include: seasonal patterns affecting sales, trend directions, and confidence levels in predictions. The dashboard provides detailed breakdowns of these factors to help inform your business decisions.",
                "timestamp": datetime.now().isoformat(),
                "model": "fallback"
            }
        
        # Accuracy-related responses
        elif "accurac" in message_lower or "mape" in message_lower or "confidence" in message_lower:
            return {
                "success": True,
                "response": "The forecast model's accuracy is measured by MAPE (Mean Absolute Percentage Error). Current confidence levels and accuracy metrics are displayed in the insights section. These metrics help assess the reliability of the predictions.",
                "timestamp": datetime.now().isoformat(),
                "model": "fallback"
            }
        
        # Recommendation responses
        elif "recommend" in message_lower or "suggest" in message_lower or "should" in message_lower:
            return {
                "success": True,
                "response": "Based on the forecast analysis, I recommend: 1) Monitor seasonal trends for inventory planning, 2) Use confidence intervals for risk assessment, 3) Compare multiple forecast models for validation, 4) Regularly update forecasts with new data for improved accuracy.",
                "timestamp": datetime.now().isoformat(),
                "model": "fallback"
            }
        
        # Default response
        else:
            return {
                "success": True,
                "response": f"I can help you understand your sales forecast data. You can ask me about: forecast predictions for different time periods, accuracy metrics, trends and patterns, or business recommendations. What specific aspect of the forecast would you like to explore?",
                "timestamp": datetime.now().isoformat(),
                "model": "fallback"
            }

    def generate_insights_from_query(
        self,
        question: str,
        forecast_data: Dict
    ) -> str:
        """Generate specific insights based on question"""

        self.forecast_data = forecast_data
        response = self.chat(question)
        return response.get("response", "")
