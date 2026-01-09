"""
Charts Router - API endpoints for chart calculations
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
from services.chart_service import chart_service


router = APIRouter()


class NatalChartRequest(BaseModel):
    """Request model for natal chart calculation"""
    date_time: str = Field(..., description="Birth date/time in ISO format (YYYY-MM-DD HH:MM)")
    latitude: float = Field(..., ge=-90, le=90, description="Latitude in decimal degrees")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude in decimal degrees")
    house_system: str = Field(default="placidus", description="House system to use")


class TransitChartRequest(BaseModel):
    """Request model for transit chart calculation"""
    natal_date_time: str
    natal_latitude: float = Field(..., ge=-90, le=90)
    natal_longitude: float = Field(..., ge=-180, le=180)
    transit_date_time: str
    house_system: str = "placidus"


class SynastryChartRequest(BaseModel):
    """Request model for synastry chart calculation"""
    person1_date_time: str
    person1_latitude: float = Field(..., ge=-90, le=90)
    person1_longitude: float = Field(..., ge=-180, le=180)
    person2_date_time: str
    person2_latitude: float = Field(..., ge=-90, le=90)
    person2_longitude: float = Field(..., ge=-180, le=180)
    house_system: str = "placidus"


class CompositeChartRequest(BaseModel):
    """Request model for composite chart calculation"""
    person1_date_time: str
    person1_latitude: float = Field(..., ge=-90, le=90)
    person1_longitude: float = Field(..., ge=-180, le=180)
    person2_date_time: str
    person2_latitude: float = Field(..., ge=-90, le=90)
    person2_longitude: float = Field(..., ge=-180, le=180)
    house_system: str = "placidus"


class SolarReturnRequest(BaseModel):
    """Request model for solar return chart"""
    natal_date_time: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    year: int = Field(..., ge=1800, le=2400)
    house_system: str = "placidus"


class ProgressedChartRequest(BaseModel):
    """Request model for secondary progressions"""
    natal_date_time: str
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    progressed_date_time: str
    house_system: str = "placidus"


@router.post("/natal")
async def calculate_natal_chart(request: NatalChartRequest):
    """
    Calculate a natal (birth) chart
    
    Returns complete chart data including planets, houses, aspects, and dignities.
    """
    try:
        chart = chart_service.calculate_natal(
            date_time=request.date_time,
            latitude=request.latitude,
            longitude=request.longitude,
            house_system=request.house_system
        )
        return {"success": True, "chart": chart}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/transit")
async def calculate_transit_chart(request: TransitChartRequest):
    """
    Calculate transits to a natal chart
    
    Shows current planetary positions and their aspects to natal placements.
    """
    try:
        chart = chart_service.calculate_transit(
            natal_date_time=request.natal_date_time,
            natal_latitude=request.natal_latitude,
            natal_longitude=request.natal_longitude,
            transit_date_time=request.transit_date_time,
            house_system=request.house_system
        )
        return {"success": True, "chart": chart}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/synastry")
async def calculate_synastry_chart(request: SynastryChartRequest):
    """
    Calculate synastry between two people
    
    Shows both natal charts and inter-aspects.
    """
    try:
        chart = chart_service.calculate_synastry(
            person1_date_time=request.person1_date_time,
            person1_latitude=request.person1_latitude,
            person1_longitude=request.person1_longitude,
            person2_date_time=request.person2_date_time,
            person2_latitude=request.person2_latitude,
            person2_longitude=request.person2_longitude,
            house_system=request.house_system
        )
        return {"success": True, "chart": chart}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/composite")
async def calculate_composite_chart(request: CompositeChartRequest):
    """
    Calculate composite chart (midpoint method)
    
    Creates a single chart representing the relationship.
    """
    try:
        chart = chart_service.calculate_composite(
            person1_date_time=request.person1_date_time,
            person1_latitude=request.person1_latitude,
            person1_longitude=request.person1_longitude,
            person2_date_time=request.person2_date_time,
            person2_latitude=request.person2_latitude,
            person2_longitude=request.person2_longitude,
            house_system=request.house_system
        )
        return {"success": True, "chart": chart}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/solar-return")
async def calculate_solar_return(request: SolarReturnRequest):
    """
    Calculate solar return chart for a specific year
    
    Shows the chart for when the Sun returns to its natal position.
    """
    try:
        chart = chart_service.calculate_solar_return(
            natal_date_time=request.natal_date_time,
            latitude=request.latitude,
            longitude=request.longitude,
            year=request.year,
            house_system=request.house_system
        )
        return {"success": True, "chart": chart}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/progressed")
async def calculate_progressed_chart(request: ProgressedChartRequest):
    """
    Calculate secondary progressions
    
    Shows the symbolic progression of the natal chart.
    """
    try:
        chart = chart_service.calculate_progressed(
            natal_date_time=request.natal_date_time,
            latitude=request.latitude,
            longitude=request.longitude,
            progressed_date_time=request.progressed_date_time,
            house_system=request.house_system
        )
        return {"success": True, "chart": chart}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/house-systems")
async def get_house_systems():
    """Get list of supported house systems"""
    return {
        "house_systems": [
            {"id": "placidus", "name": "Placidus", "description": "Most popular modern system"},
            {"id": "koch", "name": "Koch", "description": "Time-based system"},
            {"id": "whole_sign", "name": "Whole Sign", "description": "Traditional Hellenistic system"},
            {"id": "equal", "name": "Equal", "description": "Equal 30° houses from ASC"},
            {"id": "regiomontanus", "name": "Regiomontanus", "description": "Medieval system"},
            {"id": "campanus", "name": "Campanus", "description": "Space-based division"},
            {"id": "porphyry", "name": "Porphyry", "description": "Simple trisection method"},
        ]
    }
