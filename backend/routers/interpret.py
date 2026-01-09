"""
Interpretation Router - AI-powered chart interpretation
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from services.ai_service import ai_service
from services.chart_service import chart_service


router = APIRouter()


class InterpretationRequest(BaseModel):
    """Request model for chart interpretation"""
    chart_data: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Pre-calculated chart data. If not provided, birth_data must be given."
    )
    birth_data: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Birth data to calculate chart: {date_time, latitude, longitude, house_system}"
    )
    focus: Optional[str] = Field(
        default=None,
        description="Focus area: personality, career, relationships, spirituality, health, etc."
    )
    language: str = Field(
        default="en",
        description="Response language: en, es, no"
    )
    stream: bool = Field(
        default=False,
        description="Whether to stream the response"
    )


@router.post("/interpret")
async def interpret_chart(request: InterpretationRequest):
    """
    Generate AI interpretation for an astrological chart
    
    Provide either pre-calculated chart_data or birth_data to calculate the chart.
    """
    # Get or calculate chart data
    chart_data = request.chart_data
    
    if not chart_data and request.birth_data:
        try:
            chart_data = chart_service.calculate_natal(
                date_time=request.birth_data.get("date_time"),
                latitude=request.birth_data.get("latitude"),
                longitude=request.birth_data.get("longitude"),
                house_system=request.birth_data.get("house_system", "placidus")
            )
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Chart calculation error: {str(e)}")
    
    if not chart_data:
        raise HTTPException(
            status_code=400,
            detail="Either chart_data or birth_data must be provided"
        )
    
    # Stream or regular response
    if request.stream:
        async def generate():
            async for chunk in ai_service.interpret_chart_stream(
                chart_data=chart_data,
                focus=request.focus,
                language=request.language
            ):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        
        return StreamingResponse(
            generate(),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
    else:
        try:
            interpretation = await ai_service.interpret_chart(
                chart_data=chart_data,
                focus=request.focus,
                language=request.language
            )
            return {
                "success": True,
                "interpretation": interpretation,
                "chart_summary": {
                    "type": chart_data.get("chart_type", "natal"),
                    "input": chart_data.get("input", {})
                }
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


@router.get("/focus-areas")
async def get_focus_areas():
    """Get list of available focus areas for interpretation"""
    return {
        "focus_areas": [
            {"id": "personality", "name": "Personality & Core Self", "description": "Sun, Moon, Ascendant analysis"},
            {"id": "career", "name": "Career & Life Purpose", "description": "10th house, MC, Saturn focus"},
            {"id": "relationships", "name": "Relationships & Love", "description": "Venus, 7th house, synastry"},
            {"id": "communication", "name": "Communication & Learning", "description": "Mercury, 3rd house focus"},
            {"id": "home", "name": "Home & Family", "description": "Moon, 4th house, IC focus"},
            {"id": "creativity", "name": "Creativity & Self-Expression", "description": "5th house, Sun, Leo placements"},
            {"id": "spirituality", "name": "Spirituality & Higher Purpose", "description": "12th house, Neptune, Jupiter"},
            {"id": "challenges", "name": "Challenges & Growth", "description": "Saturn, Pluto, difficult aspects"},
        ]
    }
