"""
Chart Calculation Service using Immanuel library
Provides natal, transit, synastry, composite, solar return, and progression charts
"""
import json
from datetime import datetime
from typing import Optional, Dict, Any, List
from immanuel import charts
from immanuel.classes.serialize import ToJSON
from immanuel.const import chart as chart_const
from immanuel.setup import settings


class ChartService:
    """Service for calculating astrology charts using Immanuel"""
    
    # House system mapping using Immanuel constants
    HOUSE_SYSTEMS = {
        "placidus": chart_const.PLACIDUS,
        "koch": chart_const.KOCH,
        "whole_sign": chart_const.WHOLE_SIGN,
        "equal": chart_const.EQUAL,
        "regiomontanus": chart_const.REGIOMONTANUS,
        "campanus": chart_const.CAMPANUS,
        "porphyry": chart_const.PORPHYRIUS,
    }
    
    def __init__(self):
        """Initialize chart service with default settings"""
        # Configure default objects to include
        self._configure_default_objects()
    
    def _configure_default_objects(self):
        """Set up default celestial objects"""
        # Add additional asteroids if not already present
        try:
            if chart_const.CHIRON not in settings.objects:
                settings.objects.append(chart_const.CHIRON)
        except:
            pass
        try:
            if chart_const.CERES not in settings.objects:
                settings.objects.append(chart_const.CERES)
        except:
            pass
        try:
            if chart_const.PALLAS not in settings.objects:
                settings.objects.append(chart_const.PALLAS)
        except:
            pass
        try:
            if chart_const.JUNO not in settings.objects:
                settings.objects.append(chart_const.JUNO)
        except:
            pass
        try:
            if chart_const.VESTA not in settings.objects:
                settings.objects.append(chart_const.VESTA)
        except:
            pass
    
    def _create_subject(
        self,
        date_time: str,
        latitude: float,
        longitude: float,
        house_system: str = "placidus"
    ) -> charts.Subject:
        """Create a Subject for chart calculation"""
        # Set house system using Immanuel constant
        house_const = self.HOUSE_SYSTEMS.get(house_system.lower(), chart_const.PLACIDUS)
        settings.house_system = house_const
        
        return charts.Subject(
            date_time=date_time,
            latitude=latitude,
            longitude=longitude,
        )
    
    def _chart_to_dict(self, chart_obj) -> Dict[str, Any]:
        """Convert chart object to dictionary using JSON serialization"""
        return json.loads(json.dumps(chart_obj, cls=ToJSON))
    
    def calculate_natal(
        self,
        date_time: str,
        latitude: float,
        longitude: float,
        house_system: str = "placidus"
    ) -> Dict[str, Any]:
        """
        Calculate a natal chart
        
        Args:
            date_time: ISO format datetime string (e.g., "2000-01-01 10:00")
            latitude: Latitude in decimal degrees
            longitude: Longitude in decimal degrees
            house_system: House system to use (placidus, koch, whole_sign, etc.)
        
        Returns:
            Complete natal chart data as dictionary
        """
        subject = self._create_subject(date_time, latitude, longitude, house_system)
        natal = charts.Natal(subject)
        
        chart_data = self._chart_to_dict(natal)
        chart_data["chart_type"] = "natal"
        chart_data["input"] = {
            "date_time": date_time,
            "latitude": latitude,
            "longitude": longitude,
            "house_system": house_system
        }
        
        return chart_data
    
    def calculate_transit(
        self,
        natal_date_time: str,
        natal_latitude: float,
        natal_longitude: float,
        transit_date_time: str,
        house_system: str = "placidus"
    ) -> Dict[str, Any]:
        """
        Calculate transits to a natal chart
        
        Args:
            natal_date_time: Birth datetime
            natal_latitude: Birth latitude
            natal_longitude: Birth longitude
            transit_date_time: Transit datetime
            house_system: House system to use
        
        Returns:
            Transit chart data with aspects to natal
        """
        natal_subject = self._create_subject(
            natal_date_time, natal_latitude, natal_longitude, house_system
        )
        transit_subject = self._create_subject(
            transit_date_time, natal_latitude, natal_longitude, house_system
        )
        
        natal = charts.Natal(natal_subject)
        # Use Natal class for comparison to avoid Transits class bug
        transits = charts.Natal(transit_subject, natal)
        
        chart_data = self._chart_to_dict(transits)
        chart_data["chart_type"] = "transit"
        chart_data["natal_chart"] = self._chart_to_dict(natal)
        chart_data["input"] = {
            "natal_date_time": natal_date_time,
            "transit_date_time": transit_date_time,
            "latitude": natal_latitude,
            "longitude": natal_longitude,
            "house_system": house_system
        }
        
        return chart_data
    
    def calculate_synastry(
        self,
        person1_date_time: str,
        person1_latitude: float,
        person1_longitude: float,
        person2_date_time: str,
        person2_latitude: float,
        person2_longitude: float,
        house_system: str = "placidus"
    ) -> Dict[str, Any]:
        """
        Calculate synastry between two charts
        
        Returns:
            Both natal charts with inter-aspects
        """
        subject1 = self._create_subject(
            person1_date_time, person1_latitude, person1_longitude, house_system
        )
        subject2 = self._create_subject(
            person2_date_time, person2_latitude, person2_longitude, house_system
        )
        
        # Create natal charts
        natal1 = charts.Natal(subject1)
        natal2 = charts.Natal(subject2)
        
        # Calculate synastry (aspects from chart1 to chart2)
        synastry = charts.Natal(subject1, natal2)
        
        chart_data = {
            "chart_type": "synastry",
            "person1": self._chart_to_dict(natal1),
            "person2": self._chart_to_dict(natal2),
            "synastry_aspects": self._chart_to_dict(synastry).get("aspects", []),
            "input": {
                "person1": {
                    "date_time": person1_date_time,
                    "latitude": person1_latitude,
                    "longitude": person1_longitude
                },
                "person2": {
                    "date_time": person2_date_time,
                    "latitude": person2_latitude,
                    "longitude": person2_longitude
                },
                "house_system": house_system
            }
        }
        
        return chart_data
    
    def calculate_composite(
        self,
        person1_date_time: str,
        person1_latitude: float,
        person1_longitude: float,
        person2_date_time: str,
        person2_latitude: float,
        person2_longitude: float,
        house_system: str = "placidus"
    ) -> Dict[str, Any]:
        """
        Calculate composite chart (midpoint method)
        """
        subject1 = self._create_subject(
            person1_date_time, person1_latitude, person1_longitude, house_system
        )
        subject2 = self._create_subject(
            person2_date_time, person2_latitude, person2_longitude, house_system
        )
        
        composite = charts.Composite(subject1, subject2)
        
        chart_data = self._chart_to_dict(composite)
        chart_data["chart_type"] = "composite"
        chart_data["input"] = {
            "person1": {
                "date_time": person1_date_time,
                "latitude": person1_latitude,
                "longitude": person1_longitude
            },
            "person2": {
                "date_time": person2_date_time,
                "latitude": person2_latitude,
                "longitude": person2_longitude
            },
            "house_system": house_system
        }
        
        return chart_data
    
    def calculate_solar_return(
        self,
        natal_date_time: str,
        latitude: float,
        longitude: float,
        year: int,
        house_system: str = "placidus"
    ) -> Dict[str, Any]:
        """
        Calculate solar return chart for a specific year
        """
        subject = self._create_subject(
            natal_date_time, latitude, longitude, house_system
        )
        
        solar_return = charts.SolarReturn(subject, year)
        
        chart_data = self._chart_to_dict(solar_return)
        chart_data["chart_type"] = "solar_return"
        chart_data["input"] = {
            "natal_date_time": natal_date_time,
            "latitude": latitude,
            "longitude": longitude,
            "year": year,
            "house_system": house_system
        }
        
        return chart_data
    
    def calculate_progressed(
        self,
        natal_date_time: str,
        latitude: float,
        longitude: float,
        progressed_date_time: str,
        house_system: str = "placidus"
    ) -> Dict[str, Any]:
        """
        Calculate secondary progressions
        """
        natal_subject = self._create_subject(
            natal_date_time, latitude, longitude, house_system
        )
        
        progressed = charts.Progressed(natal_subject, progressed_date_time)
        
        chart_data = self._chart_to_dict(progressed)
        chart_data["chart_type"] = "progressed"
        chart_data["input"] = {
            "natal_date_time": natal_date_time,
            "progressed_date_time": progressed_date_time,
            "latitude": latitude,
            "longitude": longitude,
            "house_system": house_system
        }
        
        return chart_data


# Singleton instance
chart_service = ChartService()
