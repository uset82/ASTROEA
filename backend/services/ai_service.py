"""
AI Interpretation Service using OpenRouter API
Provides grounded astrology interpretations based on chart data
"""
import os
import httpx
from typing import Dict, Any, AsyncGenerator, Optional


class AIService:
    """Service for AI-powered chart interpretation"""
    
    OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
    DEFAULT_MODEL = "tngtech/deepseek-r1t-chimera:free"
    
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
    
    async def interpret_chart(
        self,
        chart_data: Dict[str, Any],
        focus: Optional[str] = None,
        language: str = "en"
    ) -> str:
        """
        Generate AI interpretation for a chart
        
        Args:
            chart_data: Complete chart data from chart_service
            focus: Optional focus area (e.g., "career", "relationships", "personality")
            language: Response language preference
        
        Returns:
            AI-generated interpretation text
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
        
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.OPENROUTER_BASE_URL}/chat/completions",
                headers=self._get_headers(),
                json={
                    "model": self.DEFAULT_MODEL,
                    "messages": [
                        {"role": "system", "content": self.SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 2000
                }
            )
            
            if response.status_code != 200:
                return f"Error: API request failed with status {response.status_code}: {response.text}"
            
            data = response.json()
            return data["choices"][0]["message"]["content"]
    
    async def interpret_chart_stream(
        self,
        chart_data: Dict[str, Any],
        focus: Optional[str] = None,
        language: str = "en"
    ) -> AsyncGenerator[str, None]:
        """
        Generate streaming AI interpretation for a chart
        
        Yields:
            Chunks of interpretation text as they arrive
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
        
        async with httpx.AsyncClient(timeout=120.0) as client:
            async with client.stream(
                "POST",
                f"{self.OPENROUTER_BASE_URL}/chat/completions",
                headers=self._get_headers(),
                json={
                    "model": self.DEFAULT_MODEL,
                    "messages": [
                        {"role": "system", "content": self.SYSTEM_PROMPT},
                        {"role": "user", "content": user_prompt}
                    ],
                    "temperature": 0.7,
                    "max_tokens": 2000,
                    "stream": True
                }
            ) as response:
                if response.status_code != 200:
                    yield f"Error: API request failed with status {response.status_code}"
                    return
                
                async for line in response.aiter_lines():
                    if line.startswith("data: "):
                        data_str = line[6:]
                        if data_str == "[DONE]":
                            break
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


# Singleton instance
ai_service = AIService()
