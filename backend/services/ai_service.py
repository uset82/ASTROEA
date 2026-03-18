"""
AI Interpretation Service using OpenRouter API
Provides grounded astrology interpretations based on chart data
"""
import os
import asyncio
import httpx
from typing import Dict, Any, AsyncGenerator, Optional, List


class AIService:
    """Service for AI-powered chart interpretation"""
    
    OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
    MODELS: List[str] = [
        "openrouter/free",                    # Auto-routes to available free models
        "google/gemma-3-12b-it:free",         # Fallback if router is down
    ]
    MAX_RETRIES = 2
    RETRY_BASE_DELAY = 2.0  # seconds
    
    # System prompt for grounded astrology interpretation
    SYSTEM_PROMPT = """You are ASTRAEA, a professional astrology interpreter. Your role is to provide insightful, grounded interpretations of astrological charts.

IMPORTANT RULES:
1. ONLY interpret data that is explicitly provided in the chart - never invent placements
2. Always cite specific placements (e.g., "Your Sun at 10°37' Capricorn in the 11th House...")
3. Use reflective, exploratory language - avoid deterministic predictions
4. Focus on psychological insights, growth opportunities, and life themes
5. NEVER make medical diagnoses or guarantee specific outcomes
6. Balance positive potential with constructive challenges
7. Explain astrological concepts when they appear

Your interpretations should feel like a conversation with a knowledgeable, compassionate astrologer who respects the individual's agency and free will.

When interpreting aspects, consider:
- The nature of the aspect (conjunction, trine, square, etc.)
- The planets involved and their archetypal meanings
- The houses these planets rule and occupy
- The overall chart context

Languages: Respond in the same language the user uses (English, Spanish, or Norwegian)."""

    def __init__(self):
        """Initialize AI service"""
        self.api_key = os.getenv("OPENROUTER_API_KEY")
        self.openai_key = os.getenv("OPENAI_API_KEY")
    
    def _get_headers(self) -> Dict[str, str]:
        """Get API headers for OpenRouter"""
        return {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://astraea.local",
            "X-Title": "ASTRAEA Astrology Platform"
        }
    
    def _format_chart_summary(self, chart_data: Dict[str, Any]) -> str:
        """Format chart data into a readable summary for the AI"""
        lines = []
        
        chart_type = chart_data.get("chart_type", "natal")
        lines.append(f"## {chart_type.upper()} CHART DATA\n")
        
        # Input data
        if "input" in chart_data:
            inp = chart_data["input"]
            if "date_time" in inp:
                lines.append(f"Birth Date/Time: {inp['date_time']}")
            if "latitude" in inp and "longitude" in inp:
                lines.append(f"Location: {inp['latitude']}, {inp['longitude']}")
        
        # Objects (planets, points)
        if "objects" in chart_data:
            lines.append("\n### PLANETARY POSITIONS")
            for key, obj in chart_data["objects"].items():
                if isinstance(obj, dict) and "name" in obj:
                    name = obj["name"]
                    sign = obj.get("sign", {}).get("name", "Unknown")
                    house = obj.get("house", {}).get("number", "?")
                    sign_long = obj.get("sign_longitude", {}).get("formatted", "?")
                    movement = obj.get("movement", {}).get("formatted", "Direct")
                    
                    line = f"- {name}: {sign_long} {sign}, House {house}"
                    if movement == "Retrograde":
                        line += " (Retrograde)"
                    lines.append(line)
        
        # Houses
        if "houses" in chart_data:
            lines.append("\n### HOUSE CUSPS")
            for key, house in chart_data["houses"].items():
                if isinstance(house, dict) and "number" in house:
                    num = house["number"]
                    sign = house.get("sign", {}).get("name", "Unknown")
                    deg = house.get("sign_longitude", {}).get("formatted", "?")
                    lines.append(f"- House {num}: {deg} {sign}")
        
        # Aspects
        if "aspects" in chart_data:
            lines.append("\n### ASPECTS")
            for key, aspect in chart_data["aspects"].items():
                if isinstance(aspect, dict) and "active" in aspect:
                    active = aspect.get("active", {}).get("name", "?")
                    passive = aspect.get("passive", {}).get("name", "?")
                    aspect_type = aspect.get("type", {}).get("name", "?")
                    orb = aspect.get("orb", {}).get("formatted", "?")
                    lines.append(f"- {active} {aspect_type} {passive} (orb: {orb})")
        
        return "\n".join(lines)
    
    async def _request_with_retry(
        self,
        client: httpx.AsyncClient,
        model: str,
        messages: list,
        stream: bool = False
    ):
        """Make a request with retry on 429 rate limit errors"""
        for attempt in range(self.MAX_RETRIES + 1):
            response = await client.post(
                f"{self.OPENROUTER_BASE_URL}/chat/completions",
                headers=self._get_headers(),
                json={
                    "model": model,
                    "messages": messages,
                    "temperature": 0.7,
                    "max_tokens": 2000,
                    **(({"stream": True}) if stream else {})
                }
            )
            if response.status_code == 429 and attempt < self.MAX_RETRIES:
                delay = self.RETRY_BASE_DELAY * (2 ** attempt)
                await asyncio.sleep(delay)
                continue
            return response
        return response  # return last response even if still 429

    async def interpret_chart(
        self,
        chart_data: Dict[str, Any],
        focus: Optional[str] = None,
        language: str = "en"
    ) -> str:
        """
        Generate AI interpretation for a chart.
        Tries multiple models with retry on 429 rate limits.
        """
        if not self.api_key:
            return "Error: OpenRouter API key not configured. Please set OPENROUTER_API_KEY."
        
        chart_summary = self._format_chart_summary(chart_data)
        
        user_prompt = f"""Please interpret the following astrological chart:

{chart_summary}

"""
        if focus:
            user_prompt += f"\nFocus particularly on: {focus}"
        
        if language == "es":
            user_prompt += "\n\nPlease respond in Spanish."
        elif language == "no":
            user_prompt += "\n\nPlease respond in Norwegian."
        
        messages = [
            {"role": "system", "content": self.SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ]
        
        last_error = ""
        async with httpx.AsyncClient(timeout=90.0) as client:
            for model in self.MODELS:
                try:
                    response = await self._request_with_retry(client, model, messages)
                    if response.status_code == 200:
                        data = response.json()
                        content = data.get("choices", [{}])[0].get("message", {}).get("content")
                        if content:
                            return content
                    last_error = f"Model {model}: status {response.status_code}"
                except Exception as e:
                    last_error = f"Model {model}: {str(e)}"
            
            return f"Error: All AI models are currently rate-limited. Please try again in a minute. Last error: {last_error}"
    
    async def interpret_chart_stream(
        self,
        chart_data: Dict[str, Any],
        focus: Optional[str] = None,
        language: str = "en"
    ) -> AsyncGenerator[str, None]:
        """
        Generate streaming AI interpretation for a chart.
        Tries multiple models with retry on 429 rate limits.
        """
        if not self.api_key:
            yield "Error: OpenRouter API key not configured. Please set OPENROUTER_API_KEY."
            return
        
        chart_summary = self._format_chart_summary(chart_data)
        
        user_prompt = f"""Please interpret the following astrological chart:

{chart_summary}

"""
        if focus:
            user_prompt += f"\nFocus particularly on: {focus}"
        
        if language == "es":
            user_prompt += "\n\nPlease respond in Spanish."
        elif language == "no":
            user_prompt += "\n\nPlease respond in Norwegian."
        
        messages = [
            {"role": "system", "content": self.SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ]
        
        last_error = ""
        async with httpx.AsyncClient(timeout=120.0) as client:
            for model in self.MODELS:
                for attempt in range(self.MAX_RETRIES + 1):
                    try:
                        async with client.stream(
                            "POST",
                            f"{self.OPENROUTER_BASE_URL}/chat/completions",
                            headers=self._get_headers(),
                            json={
                                "model": model,
                                "messages": messages,
                                "temperature": 0.7,
                                "max_tokens": 2000,
                                "stream": True
                            }
                        ) as response:
                            if response.status_code == 429:
                                if attempt < self.MAX_RETRIES:
                                    delay = self.RETRY_BASE_DELAY * (2 ** attempt)
                                    await asyncio.sleep(delay)
                                    continue
                                last_error = f"Model {model}: rate limited (429)"
                                break  # try next model
                            
                            if response.status_code != 200:
                                last_error = f"Model {model}: status {response.status_code}"
                                break  # try next model
                            
                            # Success - stream the response
                            async for line in response.aiter_lines():
                                if line.startswith("data: "):
                                    data_str = line[6:]
                                    if data_str == "[DONE]":
                                        return
                                    try:
                                        import json
                                        data = json.loads(data_str)
                                        if "choices" in data and len(data["choices"]) > 0:
                                            delta = data["choices"][0].get("delta", {})
                                            content = delta.get("content", "")
                                            if content:
                                                yield content
                                    except:
                                        pass
                            return  # successfully streamed
                    except Exception as e:
                        last_error = f"Model {model}: {str(e)}"
                        break  # try next model
            
            yield f"Error: All AI models are currently rate-limited. Please try again in a minute. ({last_error})"


# Singleton instance
ai_service = AIService()
