// Netlify Function for Chart Calculation
const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const SYMBOLS = { Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇', Chiron: '⚷' };

// Normalize angle to 0-360 range
function normalize(angle) {
    return ((angle % 360) + 360) % 360;
}

function getSign(longitude) {
    const norm = normalize(longitude);
    return SIGNS[Math.floor(norm / 30)];
}

exports.handler = async (event) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
    };

    if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
    if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };

    try {
        const { date_time, latitude, longitude, house_system } = JSON.parse(event.body);
        if (!date_time) return { statusCode: 400, headers, body: JSON.stringify({ success: false, detail: 'Missing date_time' }) };

        const dt = new Date(date_time.replace(' ', 'T'));
        const jd = julianDay(dt);
        const lat = latitude || 0;
        const lon = longitude || 0;

        // Calculate positions
        const sunLong = normalize(calcSun(jd));
        const moonLong = normalize(calcMoon(jd));
        const asc = normalize(calcAsc(jd, lat, lon));
        const mc = normalize((asc + 270) % 360); // MC is roughly 90° before ASC

        // Build houses (equal house system) with proper structure
        const houses = {};
        for (let i = 1; i <= 12; i++) {
            const cusp = normalize(asc + (i - 1) * 30);
            houses[i] = { number: i, longitude: { raw: cusp }, sign: { name: getSign(cusp) } };
        }

        // Get house for a longitude
        const getHouse = (lng) => {
            const norm = normalize(lng);
            for (let i = 1; i <= 12; i++) {
                const cusp = houses[i].longitude.raw;
                const nextCusp = houses[i % 12 + 1].longitude.raw;
                if (nextCusp < cusp) {
                    if (norm >= cusp || norm < nextCusp) return i;
                } else {
                    if (norm >= cusp && norm < nextCusp) return i;
                }
            }
            return 1;
        };

        // Helper to create object with proper structure for ChartWheel.tsx
        const createObject = (name, lng, symbol) => {
            const signName = getSign(lng);
            const signLongitude = lng % 30; // Degrees within the sign
            return {
                name,
                longitude: { raw: lng, formatted: `${Math.floor(lng)}°${Math.round((lng % 1) * 60)}'` },
                sign: { name: signName },
                sign_longitude: { raw: signLongitude, formatted: `${Math.floor(signLongitude)}°${Math.round((signLongitude % 1) * 60)}'` },
                symbol,
                house: getHouse(lng)
            };
        };

        // Build objects with proper structure
        const objects = {
            Sun: createObject('Sun', sunLong, '☉'),
            Moon: createObject('Moon', moonLong, '☽'),
            Asc: createObject('Asc', asc, 'Asc'),
            MC: createObject('MC', mc, 'MC'),
        };

        // Add other planets
        const planets = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
        for (const planet of planets) {
            const lng = normalize(calcPlanet(planet, jd));
            objects[planet] = createObject(planet, lng, SYMBOLS[planet]);
        }

        // Calculate aspects
        const aspects = calcAspects(objects);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                success: true,
                chart: {
                    chart_type: 'natal',
                    objects,
                    houses,
                    aspects,
                    input: { date_time, latitude: lat, longitude: lon, house_system: house_system || 'equal' }
                }
            })
        };
    } catch (e) {
        console.error('Chart error:', e);
        return { statusCode: 500, headers, body: JSON.stringify({ success: false, detail: e.message }) };
    }
};

function julianDay(d) {
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    const day = d.getUTCDate() + d.getUTCHours() / 24 + d.getUTCMinutes() / 1440 + d.getUTCSeconds() / 86400;
    let jy = y, jm = m;
    if (m <= 2) { jy--; jm += 12; }
    const a = Math.floor(jy / 100);
    const b = 2 - a + Math.floor(a / 4);
    return Math.floor(365.25 * (jy + 4716)) + Math.floor(30.6001 * (jm + 1)) + day + b - 1524.5;
}

function calcSun(jd) {
    const T = (jd - 2451545.0) / 36525;
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    const Mrad = M * Math.PI / 180;
    const C = (1.914602 - 0.004817 * T) * Math.sin(Mrad) + 0.019993 * Math.sin(2 * Mrad);
    return L0 + C;
}

function calcMoon(jd) {
    const T = (jd - 2451545.0) / 36525;
    const L = 218.3165 + 481267.8813 * T;
    const D = 297.8502 + 445267.1115 * T;
    const M = 357.5291 + 35999.0503 * T;
    const Mm = 134.9634 + 477198.8675 * T;
    return L + 6.289 * Math.sin(Mm * Math.PI / 180) + 1.274 * Math.sin((2 * D - Mm) * Math.PI / 180) + 0.658 * Math.sin(2 * D * Math.PI / 180);
}

function calcAsc(jd, lat, lon) {
    const T = (jd - 2451545.0) / 36525;
    const theta0 = 280.46061837 + 360.98564736629 * (jd - 2451545.0);
    const lst = normalize(theta0 + lon);
    const eps = 23.4393 - 0.0130 * T;
    const lstRad = lst * Math.PI / 180;
    const epsRad = eps * Math.PI / 180;
    const latRad = lat * Math.PI / 180;
    const ascRad = Math.atan2(Math.cos(lstRad), -(Math.sin(lstRad) * Math.cos(epsRad) + Math.tan(latRad) * Math.sin(epsRad)));
    return ascRad * 180 / Math.PI;
}

function calcPlanet(planet, jd) {
    const T = (jd - 2451545.0) / 36525;
    const orbits = {
        Mercury: { L0: 252.2509, rate: 149472.6747 },
        Venus: { L0: 181.9798, rate: 58517.8156 },
        Mars: { L0: 355.4330, rate: 19140.2993 },
        Jupiter: { L0: 34.3515, rate: 3034.9057 },
        Saturn: { L0: 50.0774, rate: 1222.1138 },
        Uranus: { L0: 314.0550, rate: 428.4669 },
        Neptune: { L0: 304.3487, rate: 218.4602 },
        Pluto: { L0: 238.9289, rate: 145.2078 }
    };
    const orbit = orbits[planet];
    if (!orbit) return 0;
    return orbit.L0 + orbit.rate * T;
}

function calcAspects(objects) {
    const aspects = {};
    const aspectDefs = [
        { name: 'Conjunction', angle: 0, orb: 10, symbol: '☌' },
        { name: 'Sextile', angle: 60, orb: 6, symbol: '⚹' },
        { name: 'Square', angle: 90, orb: 8, symbol: '□' },
        { name: 'Trine', angle: 120, orb: 8, symbol: '△' },
        { name: 'Opposition', angle: 180, orb: 10, symbol: '☍' }
    ];

    const planets = Object.keys(objects).filter(n => !['Asc', 'MC'].includes(n));

    for (let i = 0; i < planets.length; i++) {
        for (let j = i + 1; j < planets.length; j++) {
            const p1 = planets[i], p2 = planets[j];
            const l1 = objects[p1].longitude.raw, l2 = objects[p2].longitude.raw;
            let diff = Math.abs(l1 - l2);
            if (diff > 180) diff = 360 - diff;

            for (const asp of aspectDefs) {
                const orb = Math.abs(diff - asp.angle);
                if (orb <= asp.orb) {
                    aspects[`${p1}-${p2}`] = {
                        planet1: p1,
                        planet2: p2,
                        aspect_type: asp.name,
                        symbol: asp.symbol,
                        angle: asp.angle,
                        orb: Math.round(orb * 10) / 10
                    };
                    break;
                }
            }
        }
    }
    return aspects;
}
