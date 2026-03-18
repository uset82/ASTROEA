"""Script para generar carta astral del día actual"""
import sys
sys.path.append('.')

from datetime import datetime
from immanuel import charts
from immanuel.const import chart as c_const
from immanuel.setup import settings

# Configurar para usar Swiss Ephemeris
settings.ephemeris_path = './eph'

# Datos para la carta de hoy
fecha = datetime(2026, 1, 27, 20, 14, 0)  # 27 de enero 2026, 20:14
latitud = 40.4168  # Madrid, España
longitud = -3.7038

print("\n" + "="*50)
print("CARTA ASTRAL - MARTES 27 DE ENERO 2026")
print("Hora: 20:14 (Madrid, España)")
print("="*50 + "\n")

try:
    # Generar carta natal
    natal = charts.Subject(
        date_time=fecha,
        latitude=latitud,
        longitude=longitud,
    )
    
    chart = charts.Natal(natal)
    
    print("--- POSICIONES PLANETARIAS ---\n")
    
    # Planetas principales
    planets_order = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 
                     'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto']
    
    for planet_name in planets_order:
        if planet_name in chart.objects:
            obj = chart.objects[planet_name]
            sign = obj.sign['name']
            degree = obj.sign_longitude['formatted']
            house = obj.house['number'] if 'house' in obj and obj.house else '?'
            retro = ' ℞' if obj.movement.get('retrograde', False) else ''
            
            # Símbolos planetarios
            symbols = {
                'Sun': '☉', 'Moon': '☽', 'Mercury': '☿', 'Venus': '♀',
                'Mars': '♂', 'Jupiter': '♃', 'Saturn': '♄', 
                'Uranus': '♅', 'Neptune': '♆', 'Pluto': '♇'
            }
            symbol = symbols.get(planet_name, planet_name[0])
            
            print(f"{symbol} {planet_name:10s}: {sign:12s} {degree:8s} (Casa {house}){retro}")
    
    print("\n--- PUNTOS IMPORTANTES ---\n")
    
    if 'Asc' in chart.objects:
        asc = chart.objects['Asc']
        print(f"Ascendente: {asc.sign['name']} {asc.sign_longitude['formatted']}")
    
    if 'MC' in chart.objects:
        mc = chart.objects['MC']
        print(f"Medio Cielo: {mc.sign['name']} {mc.sign_longitude['formatted']}")
    
    print("\n--- ASPECTOS PRINCIPALES ---\n")
    
    # Mostrar primeros 10 aspectos
    aspect_symbols = {
        'Conjunction': '☌',
        'Sextile': '⚹',
        'Square': '□',
        'Trine': '△',
        'Opposition': '☍'
    }
    
    count = 0
    if hasattr(chart, 'aspects') and chart.aspects:
        for aspect_key, aspect in chart.aspects.items():
            if count >= 10:
                break
            
            try:
                # Intentar diferentes formatos de datos
                if isinstance(aspect.get('active'), dict):
                    active = aspect['active']['name']
                    passive = aspect['passive']['name']
                    aspect_type = aspect['aspect']['name']
                    orb = aspect['orb']['formatted']
                else:
                    active = str(aspect.get('active', ''))
                    passive = str(aspect.get('passive', ''))
                    aspect_type = str(aspect.get('aspect', ''))
                    orb = str(aspect.get('orb', ''))
                
                symbol = aspect_symbols.get(aspect_type, aspect_type)
                print(f"{active:10s} {symbol} {passive:10s} (orbe: {orb})")
                count += 1
            except Exception as e:
                continue
    
    print("\n" + "="*50 + "\n")
    
except Exception as e:
    print(f"Error generando carta: {e}")
    import traceback
    traceback.print_exc()
