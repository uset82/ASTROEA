// Netlify Function for Chart Calculation
// Using simplified calculation - for accurate results, consider a dedicated astrology API

exports.handler = async (event, context) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
            },
            body: '',
        };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const body = JSON.parse(event.body);
        const { date_time, latitude, longitude, house_system } = body;

        if (!date_time || latitude === undefined || longitude === undefined) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ success: false, detail: 'Missing required fields: date_time, latitude, longitude' }),
            };
        }

        // Parse date and time
        const dt = new Date(date_time.replace(' ', 'T'));
        if (isNaN(dt.getTime())) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ success: false, detail: 'Invalid date_time format' }),
            };
        }

        // Calculate chart data
        const chart = calculateNatalChart(dt, latitude, longitude, house_system || 'placidus');

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
            },
            body: JSON.stringify({
                success: true,
                chart: chart,
            }),
        };
    } catch (error) {
        console.error('Chart calculation error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ success: false, detail: error.message }),
        };
    }
};

// Zodiac signs
const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
    'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

// Planet symbols
const SYMBOLS = {
    Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂',
    Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇',
    Chiron: '⚷', North_Node: '☊', Asc: 'Asc', MC: 'MC'
};

function getSign(longitude) {
    return SIGNS[Math.floor((longitude % 360) / 30)];
}

function julianDay(date) {
    const y = date.getUTCFullYear();
    const m = date.getUTCMonth() + 1;
    const d = date.getUTCDate() +
        (date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600) / 24;

    let jy = y;
    let jm = m;
    if (m <= 2) {
        jy -= 1;
        jm += 12;
    }

    const a = Math.floor(jy / 100);
    const b = 2 - a + Math.floor(a / 4);

    return Math.floor(365.25 * (jy + 4716)) + Math.floor(30.6001 * (jm + 1)) + d + b - 1524.5;
}

function calculateSunLongitude(jd) {
    const T = (jd - 2451545.0) / 36525;
    const L0 = (280.46646 + 36000.76983 * T + 0.0003032 * T * T) % 360;
    const M = (357.52911 + 35999.05029 * T - 0.0001537 * T * T) % 360;
    const e = 0.016708634 - 0.000042037 * T;
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M * Math.PI / 180) +
        (0.019993 - 0.000101 * T) * Math.sin(2 * M * Math.PI / 180) +
        0.000289 * Math.sin(3 * M * Math.PI / 180);
    return (L0 + C + 360) % 360;
}

function calculateMoonLongitude(jd) {
    const T = (jd - 2451545.0) / 36525;
    const L = (218.3165 + 481267.8813 * T) % 360;
    const D = (297.8502 + 445267.1115 * T) % 360;
    const M = (357.5291 + 35999.0503 * T) % 360;
    const Mm = (134.9634 + 477198.8675 * T) % 360;
    const F = (93.2721 + 483202.0175 * T) % 360;

    const longitude = L +
        6.289 * Math.sin(Mm * Math.PI / 180) +
        1.274 * Math.sin((2 * D - Mm) * Math.PI / 180) +
        0.658 * Math.sin(2 * D * Math.PI / 180) +
        0.214 * Math.sin(2 * Mm * Math.PI / 180) -
        0.186 * Math.sin(M * Math.PI / 180);

    return (longitude + 360) % 360;
}

// Simplified planetary longitude calculations (approximate)
function calculatePlanetLongitude(planet, jd) {
    const T = (jd - 2451545.0) / 36525;

    // Mean longitudes (simplified - real calculations are more complex)
    const meanLongitudes = {
        Mercury: (252.2509 + 149472.6747 * T) % 360,
        Venus: (181.9798 + 58517.8156 * T) % 360,
        Mars: (355.4330 + 19140.2993 * T) % 360,
        Jupiter: (34.3515 + 3034.9057 * T) % 360,
        Saturn: (50.0774 + 1222.1138 * T) % 360,
        Uranus: (314.0550 + 428.4669 * T) % 360,
        Neptune: (304.3487 + 218.4602 * T) % 360,
        Pluto: (238.9289 + 145.2078 * T) % 360,
    };

    return (meanLongitudes[planet] + 360) % 360;
}

function calculateAscendant(jd, latitude, longitude) {
    const T = (jd - 2451545.0) / 36525;
    const theta0 = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T;
    const lst = (theta0 + longitude + 360) % 360;

    const epsilon = 23.4393 - 0.0130 * T; // Obliquity
    const latRad = latitude * Math.PI / 180;
    const epsRad = epsilon * Math.PI / 180;
    const lstRad = lst * Math.PI / 180;

    const asc = Math.atan2(Math.cos(lstRad), -(Math.sin(lstRad) * Math.cos(epsRad) + Math.tan(latRad) * Math.sin(epsRad)));
    return ((asc * 180 / Math.PI) + 360) % 360;
}

function calculateMC(jd, longitude) {
    const T = (jd - 2451545.0) / 36525;
    const theta0 = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T;
    const mc = (theta0 + longitude + 360) % 360;
    return mc;
}

function calculateHouses(asc, mc) {
    // Simplified equal house system
    const houses = {};
    for (let i = 1; i <= 12; i++) {
        const cusp = (asc + (i - 1) * 30 + 360) % 360;
        houses[i] = {
            longitude: cusp,
            sign: getSign(cusp),
        };
    }
    return houses;
}

function getHouse(longitude, houses) {
    for (let i = 1; i <= 12; i++) {
        const cusp = houses[i].longitude;
        const nextCusp = houses[i % 12 + 1].longitude;
        if (nextCusp < cusp) {
            if (longitude >= cusp || longitude < nextCusp) return i;
        } else {
            if (longitude >= cusp && longitude < nextCusp) return i;
        }
    }
    return 1;
}

function calculateNatalChart(date, latitude, longitude, houseSystem) {
    const jd = julianDay(date);

    // Calculate planetary positions
    const sunLong = calculateSunLongitude(jd);
    const moonLong = calculateMoonLongitude(jd);
    const asc = calculateAscendant(jd, latitude, longitude);
    const mc = calculateMC(jd, longitude);

    // Calculate houses
    const houses = calculateHouses(asc, mc);

    // Build objects
    const objects = {
        Sun: {
            longitude: sunLong,
            sign: getSign(sunLong),
            symbol: SYMBOLS.Sun,
            house: getHouse(sunLong, houses)
        },
        Moon: {
            longitude: moonLong,
            sign: getSign(moonLong),
            symbol: SYMBOLS.Moon,
            house: getHouse(moonLong, houses)
        },
        Asc: {
            longitude: asc,
            sign: getSign(asc),
            symbol: SYMBOLS.Asc,
            house: 1
        },
        MC: {
            longitude: mc,
            sign: getSign(mc),
            symbol: SYMBOLS.MC,
            house: 10
        },
    };

    // Add other planets
    const planets = ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
    for (const planet of planets) {
        const long = calculatePlanetLongitude(planet, jd);
        objects[planet] = {
            longitude: long,
            sign: getSign(long),
            symbol: SYMBOLS[planet],
            house: getHouse(long, houses)
        };
    }

    // Calculate aspects
    const aspects = calculateAspects(objects);

    return {
        chart_type: 'natal',
        objects,
        houses,
        aspects,
        input: {
            date_time: date.toISOString(),
            latitude,
            longitude,
            house_system: houseSystem,
        },
    };
}

function calculateAspects(objects) {
    const aspects = {};
    const aspectTypes = [
        { name: 'Conjunction', angle: 0, orb: 10 },
        { name: 'Sextile', angle: 60, orb: 6 },
        { name: 'Square', angle: 90, orb: 8 },
        { name: 'Trine', angle: 120, orb: 8 },
        { name: 'Opposition', angle: 180, orb: 10 },
    ];

    const planetNames = Object.keys(objects).filter(n => !['Asc', 'MC'].includes(n));

    for (let i = 0; i < planetNames.length; i++) {
        for (let j = i + 1; j < planetNames.length; j++) {
            const p1 = planetNames[i];
            const p2 = planetNames[j];
            const long1 = objects[p1].longitude;
            const long2 = objects[p2].longitude;

            let diff = Math.abs(long1 - long2);
            if (diff > 180) diff = 360 - diff;

            for (const aspect of aspectTypes) {
                const orb = Math.abs(diff - aspect.angle);
                if (orb <= aspect.orb) {
                    aspects[`${p1}-${p2}`] = {
                        planet1: p1,
                        planet2: p2,
                        aspect_type: aspect.name,
                        angle: aspect.angle,
                        orb: orb,
                    };
                    break;
                }
            }
        }
    }

    return aspects;
}
