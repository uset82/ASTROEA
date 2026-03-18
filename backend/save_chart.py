"""Script para generar carta astral y guardar en JSON"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from services.chart_service import chart_service
import json

# Datos para la carta de hoy - Martes 27 de enero 2026, 20:14
fecha = "2026-01-27 20:14:00"
latitud = 40.4168  # Madrid, España
longitud = -3.7038

print("Generando carta astral...")

try:
    # Generar carta natal usando el servicio
    chart_data = chart_service.calculate_natal(
        date_time=fecha,
        latitude=latitud,
        longitude=longitud,
        house_system="placidus"
    )
    
    # Guardar en JSON
    with open('carta_hoy.json', 'w', encoding='utf-8') as f:
        json.dump(chart_data, f, indent=2, ensure_ascii=False)
    
    print("Carta generada exitosamente!")
    print("Datos guardados en: carta_hoy.json")
    
    # Mostrar resumen
    print("\n" + "="*60)
    print("CARTA ASTRAL - MARTES 27 DE ENERO 2026")
    print("Hora: 20:14 (Madrid, Espana)")
    print("="*60 + "\n")
    
    objects = chart_data.get('objects', {})
    print(f"Planetas encontrados: {len(objects)}")
    print(f"Objetos: {list(objects.keys())}")
    
    aspects = chart_data.get('aspects', {})
    print(f"\nAspectos encontrados: {len(aspects)}")
    
    print("\n" + "="*60 + "\n")
    
except Exception as e:
    print(f"Error generando carta: {e}")
    import traceback
    traceback.print_exc()
