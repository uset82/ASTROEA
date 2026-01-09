// Netlify Function for Chart Calculation
const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const SYMBOLS = { Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇' };

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

        const sunLong = calcSun(jd);
        const moonLong = calcMoon(jd);
        const asc = calcAsc(jd, latitude || 0, longitude || 0);

        const houses = {};
        for (let i = 1; i <= 12; i++) houses[i] = { longitude: (asc + (i - 1) * 30) % 360, sign: SIGNS[Math.floor(((asc + (i - 1) * 30) % 360) / 30)] };

        const getHouse = (lon) => { for (let i = 1; i <= 12; i++) { const c = houses[i].longitude; const n = houses[i % 12 + 1].longitude; if (n < c ? (lon >= c || lon < n) : (lon >= c && lon < n)) return i; } return 1; };
        const getSign = (lon) => SIGNS[Math.floor((lon % 360) / 30)];

        const objects = {
            Sun: { longitude: sunLong, sign: getSign(sunLong), symbol: '☉', house: getHouse(sunLong) },
            Moon: { longitude: moonLong, sign: getSign(moonLong), symbol: '☽', house: getHouse(moonLong) },
            Asc: { longitude: asc, sign: getSign(asc), symbol: 'Asc', house: 1 },
        };

        ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'].forEach(p => {
            const lon = calcPlanet(p, jd);
            objects[p] = { longitude: lon, sign: getSign(lon), symbol: SYMBOLS[p], house: getHouse(lon) };
        });

        return { statusCode: 200, headers, body: JSON.stringify({ success: true, chart: { chart_type: 'natal', objects, houses, aspects: {}, input: { date_time, latitude, longitude, house_system } } }) };
    } catch (e) {
        return { statusCode: 500, headers, body: JSON.stringify({ success: false, detail: e.message }) };
    }
};

function julianDay(d) { const y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, day = d.getUTCDate() + d.getUTCHours() / 24 + d.getUTCMinutes() / 1440; let jy = y, jm = m; if (m <= 2) { jy--; jm += 12; } const a = Math.floor(jy / 100); return Math.floor(365.25 * (jy + 4716)) + Math.floor(30.6001 * (jm + 1)) + day + 2 - a + Math.floor(a / 4) - 1524.5; }
function calcSun(jd) { const T = (jd - 2451545) / 36525; return ((280.46646 + 36000.76983 * T) + (1.9146 - 0.0048 * T) * Math.sin((357.529 + 35999.05 * T) * Math.PI / 180) + 360) % 360; }
function calcMoon(jd) { const T = (jd - 2451545) / 36525; return ((218.32 + 481267.88 * T) + 6.29 * Math.sin((134.96 + 477198.87 * T) * Math.PI / 180) + 360) % 360; }
function calcAsc(jd, lat, lon) { const T = (jd - 2451545) / 36525; const lst = (280.46 + 360.9856 * jd + lon + 360) % 360; return (Math.atan2(Math.cos(lst * Math.PI / 180), -(Math.sin(lst * Math.PI / 180) * Math.cos(23.44 * Math.PI / 180) + Math.tan(lat * Math.PI / 180) * Math.sin(23.44 * Math.PI / 180))) * 180 / Math.PI + 360) % 360; }
function calcPlanet(p, jd) { const T = (jd - 2451545) / 36525; const L = { Mercury: 252.25 + 149472.67 * T, Venus: 181.98 + 58517.82 * T, Mars: 355.43 + 19140.3 * T, Jupiter: 34.35 + 3034.91 * T, Saturn: 50.08 + 1222.11 * T, Uranus: 314.06 + 428.47 * T, Neptune: 304.35 + 218.46 * T, Pluto: 238.93 + 145.21 * T }; return (L[p] + 360) % 360; }
