// Script to generate today's astrological chart
const { handler } = require('./netlify/functions/charts.js');

const event = {
    httpMethod: 'POST',
    body: JSON.stringify({
        date_time: '2026-01-27 20:14:00',
        latitude: 40.4168,  // Madrid, Spain
        longitude: -3.7038,
        house_system: 'placidus'
    })
};

handler(event).then(response => {
    const data = JSON.parse(response.body);
    if (data.success) {
        console.log('\n=== CARTA ASTRAL - MARTES 27 DE ENERO 2026 ===\n');
        console.log('Hora: 20:14 (Madrid, España)\n');

        console.log('--- POSICIONES PLANETARIAS ---');
        const objects = data.chart.objects;
        for (const [name, obj] of Object.entries(objects)) {
            if (!['Asc', 'MC'].includes(name)) {
                const retro = obj.movement?.formatted === 'Retrograde' ? ' ℞' : '';
                console.log(`${obj.symbol || name}: ${obj.sign.name} ${obj.sign_longitude.formatted} (Casa ${obj.house})${retro}`);
            }
        }

        console.log('\n--- PUNTOS IMPORTANTES ---');
        console.log(`Ascendente: ${objects.Asc.sign.name} ${objects.Asc.sign_longitude.formatted}`);
        console.log(`Medio Cielo: ${objects.MC.sign.name} ${objects.MC.sign_longitude.formatted}`);

        console.log('\n--- ASPECTOS PRINCIPALES ---');
        const aspects = data.chart.aspects;
        let count = 0;
        for (const [key, aspect] of Object.entries(aspects)) {
            if (count < 10) {
                console.log(`${aspect.planet1} ${aspect.symbol} ${aspect.planet2} (orbe: ${aspect.orb}°)`);
                count++;
            }
        }

        if (data.chart.patterns && data.chart.patterns.length > 0) {
            console.log('\n--- PATRONES ASTROLÓGICOS ---');
            data.chart.patterns.forEach(pattern => {
                console.log(`${pattern.type}: ${pattern.description}`);
            });
        }

        console.log('\n===========================================\n');
    } else {
        console.error('Error:', data.detail);
    }
}).catch(err => {
    console.error('Error generando carta:', err.message);
});
