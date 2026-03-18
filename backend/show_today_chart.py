"""Script para generar carta astral del día actual usando el servicio"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from services.chart_service import chart_service
import json

# Datos para la carta de hoy - Martes 27 de enero 2026, 20:14
fecha = "2026-01-27 20:14:00"
latitud = 40.4168  # Madrid, España
longitud = -3.7038

print("\n" + "="*60)
print("CARTA ASTRAL - MARTES 27 DE ENERO 2026")
print("Hora: 20:14 (Madrid, España)")
print("="*60 + "\n")

try:
    # Generar carta natal usando el servicio
    chart_data = chart_service.calculate_natal(
        date_time=fecha,
        latitude=latitud,
        longitude=longitud,
        house_system="placidus"
    )
    
    # Símbolos planetarios
    symbols = {
        'Sun': '☉', 'Moon': '☽', 'Mercury': '☿', 'Venus': '♀',
        'Mars': '♂', 'Jupiter': '♃', 'Saturn': '♄', 
        'Uranus': '♅', 'Neptune': '♆', 'Pluto': '♇',
        'Chiron': '⚷', 'Ceres': '⚳', 'Pallas': '⚴',
        'Juno': '⚵', 'Vesta': '⚶'
    }
    
    print("--- POSICIONES PLANETARIAS ---\n")
    
    # Orden de planetas
    planets_order = ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 
                     'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
                     'Chiron']
    
    objects = chart_data.get('objects', {})
    
    for planet_name in planets_order:
        if planet_name in objects:
            obj = objects[planet_name]
            symbol = symbols.get(planet_name, planet_name[0])
            sign = obj.get('sign', {}).get('name', '?')
            degree = obj.get('sign_longitude', {}).get('formatted', '?')
            house = obj.get('house', {}).get('number', '?')
            retro = ' ℞' if obj.get('movement', {}).get('retrograde', False) else ''
            
            print(f"{symbol} {planet_name:10s}: {sign:12s} {degree:8s} (Casa {house}){retro}")
    
    print("\n--- PUNTOS IMPORTANTES ---\n")
    
    if 'Asc' in objects:
        asc = objects['Asc']
        sign = asc.get('sign', {}).get('name', '?')
        degree = asc.get('sign_longitude', {}).get('formatted', '?')
        print(f"Ascendente: {sign} {degree}")
    
    if 'MC' in objects:
        mc = objects['MC']
        sign = mc.get('sign', {}).get('name', '?')
        degree = mc.get('sign_longitude', {}).get('formatted', '?')
        print(f"Medio Cielo: {sign} {degree}")
    
    print("\n--- ASPECTOS PRINCIPALES ---\n")
    
    aspect_symbols = {
        'Conjunction': '☌',
        'Sextile': '⚹',
        'Square': '□',
        'Trine': '△',
        'Opposition': '☍',
        'Quincunx': '⚻',
    }
    
    aspects = chart_data.get('aspects', {})
    count = 0
    
    for aspect_key, aspect in aspects.items():
        if count >= 12:
            break
        
        try:
            active = aspect.get('active', {}).get('name', '')
            passive = aspect.get('passive', {}).get('name', '')
            aspect_type = aspect.get('aspect', {}).get('name', '')
            symbol = aspect_symbols.get(aspect_type, aspect_type)
            orb = aspect.get('orb', {}).get('formatted', '')
            
            if active and passive and aspect_type:
                print(f"{active:10s} {symbol} {passive:10s} (orbe: {orb})")
                count += 1
        except Exception as e:
            continue
    
    print("\n" + "="*60)
    print("\n💫 Esta es tu carta astral para hoy!")
    print("   Puedes ver más detalles en la aplicación web en:")
    print("   http://localhost:5174\n")
    print("="*60 + "\n")
    
except Exception as e:
    print(f"❌ Error generando carta: {e}")
    import traceback
    traceback.print_exc()
