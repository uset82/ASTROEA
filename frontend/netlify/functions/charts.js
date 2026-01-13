// Netlify Function for Chart Calculation with Swiss Ephemeris WASM
// Uses swisseph-wasm for accurate planetary positions (same as astro.com)

const { initSwissEph, getSwissEph } = require('swisseph-wasm');

const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];
const SYMBOLS = { Sun: '☉', Moon: '☽', Mercury: '☿', Venus: '♀', Mars: '♂', Jupiter: '♃', Saturn: '♄', Uranus: '♅', Neptune: '♆', Pluto: '♇', Chiron: '⚷' };

// Swiss Ephemeris planet IDs
const SE_SUN = 0;
const SE_MOON = 1;
const SE_MERCURY = 2;
const SE_VENUS = 3;
const SE_MARS = 4;
const SE_JUPITER = 5;
const SE_SATURN = 6;
const SE_URANUS = 7;
const SE_NEPTUNE = 8;
const SE_PLUTO = 9;
const SE_CHIRON = 15;

// House system codes
const HOUSE_SYSTEMS = {
    placidus: 'P',
    koch: 'K',
    whole_sign: 'W',
    equal: 'E',
    regiomontanus: 'R',
    campanus: 'C',
    porphyry: 'O'
};

// Normalize angle to 0-360 range
function normalize(angle) {
    return ((angle % 360) + 360) % 360;
}

function getSign(longitude) {
    const norm = normalize(longitude);
    return SIGNS[Math.floor(norm / 30)];
}

// Convert Date to Julian Day
function dateToJulianDay(date) {
    const year = date.getUTCFullYear();
    const month = date.getUTCMonth() + 1;
    const day = date.getUTCDate();
    const hour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;

    let jy = year, jm = month;
    if (month <= 2) { jy--; jm += 12; }
    const a = Math.floor(jy / 100);
    const b = 2 - a + Math.floor(a / 4);
    const jd = Math.floor(365.25 * (jy + 4716)) + Math.floor(30.6001 * (jm + 1)) + day + hour / 24 + b - 1524.5;

    return jd;
}

// Format degrees to degrees and minutes
function formatDegrees(deg) {
    const d = Math.floor(deg);
    const m = Math.round((deg - d) * 60);
    return `${d}°${m.toString().padStart(2, '0')}'`;
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

        // Initialize Swiss Ephemeris WASM
        await initSwissEph();
        const sweph = getSwissEph();

        // Parse the date_time as LOCAL time at the given longitude
        const lon = longitude || 0;
        const lat = latitude || 0;
        const timezoneOffsetHours = lon / 15;

        // Parse and convert local time to UTC
        const dtLocal = new Date(date_time.replace(' ', 'T'));
        const dt = new Date(dtLocal.getTime() - timezoneOffsetHours * 60 * 60 * 1000);
        const jd = dateToJulianDay(dt);

        // Calculate planetary positions using Swiss Ephemeris
        const planetIds = {
            Sun: SE_SUN,
            Moon: SE_MOON,
            Mercury: SE_MERCURY,
            Venus: SE_VENUS,
            Mars: SE_MARS,
            Jupiter: SE_JUPITER,
            Saturn: SE_SATURN,
            Uranus: SE_URANUS,
            Neptune: SE_NEPTUNE,
            Pluto: SE_PLUTO,
            Chiron: SE_CHIRON
        };

        // SEFLG_SPEED = 256 to get speed (for retrograde detection)
        const SEFLG_SPEED = 256;

        // Calculate houses using Swiss Ephemeris
        const hsys = HOUSE_SYSTEMS[house_system] || 'P';
        const houseResult = sweph.swe_houses(jd, lat, lon, hsys);

        // houseResult.cusps[1-12] = house cusps
        // houseResult.ascmc[0] = ASC, houseResult.ascmc[1] = MC
        const asc = houseResult.ascmc[0];
        const mc = houseResult.ascmc[1];

        // Build houses object
        const houses = {};
        for (let i = 1; i <= 12; i++) {
            const cusp = houseResult.cusps[i];
            houses[i] = {
                number: i,
                longitude: { raw: cusp, formatted: formatDegrees(cusp) },
                sign: { name: getSign(cusp) },
                sign_longitude: { raw: cusp % 30, formatted: formatDegrees(cusp % 30) }
            };
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

        // Helper to create object with proper structure
        const createObject = (name, lng, symbol, speed = 0) => {
            const signLongitude = lng % 30;
            return {
                name,
                longitude: { raw: lng, formatted: formatDegrees(lng) },
                sign: { name: getSign(lng) },
                sign_longitude: { raw: signLongitude, formatted: formatDegrees(signLongitude) },
                symbol,
                house: getHouse(lng),
                movement: { formatted: speed < 0 ? 'Retrograde' : 'Direct' }
            };
        };

        // Calculate all planetary positions
        const objects = {
            Asc: createObject('Asc', asc, 'Asc'),
            MC: createObject('MC', mc, 'MC'),
        };

        for (const [name, id] of Object.entries(planetIds)) {
            try {
                const result = sweph.swe_calc_ut(jd, id, SEFLG_SPEED);
                if (result && result.longitude !== undefined) {
                    const lng = normalize(result.longitude);
                    const speed = result.speedLongitude || 0;
                    objects[name] = createObject(name, lng, SYMBOLS[name] || name[0], speed);
                }
            } catch (e) {
                console.log(`Error calculating ${name}:`, e.message);
            }
        }

        // Calculate aspects
        const aspects = calcAspects(objects);

        // Detect aspect patterns
        const patterns = detectPatterns(aspects, objects);

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
                    patterns,
                    input: { date_time, latitude: lat, longitude: lon, house_system: house_system || 'placidus' }
                }
            })
        };
    } catch (e) {
        console.error('Chart error:', e);
        return { statusCode: 500, headers, body: JSON.stringify({ success: false, detail: e.message }) };
    }
};

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
                        active: p1,
                        passive: p2,
                        type: asp.name,
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

function detectPatterns(aspects, objects) {
    const patterns = [];
    const aspectList = Object.values(aspects);

    const findAspect = (p1, p2, type) => {
        return aspectList.find(a =>
            ((a.planet1 === p1 && a.planet2 === p2) || (a.planet1 === p2 && a.planet2 === p1))
            && a.aspect_type === type
        );
    };

    const planets = [...new Set(aspectList.flatMap(a => [a.planet1, a.planet2]))];

    // Detect T-SQUARE
    const oppositions = aspectList.filter(a => a.aspect_type === 'Opposition');
    for (const opp of oppositions) {
        for (const planet of planets) {
            if (planet === opp.planet1 || planet === opp.planet2) continue;
            const sq1 = findAspect(opp.planet1, planet, 'Square');
            const sq2 = findAspect(opp.planet2, planet, 'Square');
            if (sq1 && sq2) {
                patterns.push({
                    type: 'T-Square',
                    planets: [opp.planet1, opp.planet2, planet],
                    apex: planet,
                    description: `T-Square with ${planet} at apex, opposing ${opp.planet1}-${opp.planet2} opposition`
                });
            }
        }
    }

    // Detect GRAND TRINE
    const trines = aspectList.filter(a => a.aspect_type === 'Trine');
    for (let i = 0; i < trines.length; i++) {
        for (let j = i + 1; j < trines.length; j++) {
            const t1 = trines[i], t2 = trines[j];
            const planets1 = [t1.planet1, t1.planet2];
            const planets2 = [t2.planet1, t2.planet2];
            const common = planets1.find(p => planets2.includes(p));
            if (!common) continue;

            const other1 = planets1.find(p => p !== common);
            const other2 = planets2.find(p => p !== common);
            const t3 = findAspect(other1, other2, 'Trine');
            if (t3) {
                const gtPlanets = [common, other1, other2].sort();
                if (!patterns.find(p => p.type === 'Grand Trine' &&
                    JSON.stringify(p.planets.sort()) === JSON.stringify(gtPlanets))) {
                    patterns.push({
                        type: 'Grand Trine',
                        planets: gtPlanets,
                        description: `Grand Trine between ${gtPlanets.join(', ')}`
                    });
                }
            }
        }
    }

    // Detect GRAND CROSS
    for (let i = 0; i < oppositions.length; i++) {
        for (let j = i + 1; j < oppositions.length; j++) {
            const opp1 = oppositions[i], opp2 = oppositions[j];
            const p1 = [opp1.planet1, opp1.planet2];
            const p2 = [opp2.planet1, opp2.planet2];
            if (p1.some(p => p2.includes(p))) continue;

            const sq1 = findAspect(p1[0], p2[0], 'Square');
            const sq2 = findAspect(p1[0], p2[1], 'Square');
            const sq3 = findAspect(p1[1], p2[0], 'Square');
            const sq4 = findAspect(p1[1], p2[1], 'Square');

            if (sq1 && sq2 && sq3 && sq4) {
                patterns.push({
                    type: 'Grand Cross',
                    planets: [...p1, ...p2].sort(),
                    description: `Grand Cross between ${[...p1, ...p2].join(', ')}`
                });
            }
        }
    }

    // Detect YOD
    const sextiles = aspectList.filter(a => a.aspect_type === 'Sextile');
    const quincunxes = [];
    const planetNames = Object.keys(objects).filter(n => !['Asc', 'MC'].includes(n));
    for (let i = 0; i < planetNames.length; i++) {
        for (let j = i + 1; j < planetNames.length; j++) {
            const p1 = planetNames[i], p2 = planetNames[j];
            const l1 = objects[p1].longitude.raw, l2 = objects[p2].longitude.raw;
            let diff = Math.abs(l1 - l2);
            if (diff > 180) diff = 360 - diff;
            if (Math.abs(diff - 150) <= 3) {
                quincunxes.push({ planet1: p1, planet2: p2, aspect_type: 'Quincunx' });
            }
        }
    }

    for (const sext of sextiles) {
        for (const planet of planets) {
            if (planet === sext.planet1 || planet === sext.planet2) continue;
            const q1 = quincunxes.find(q =>
                (q.planet1 === sext.planet1 && q.planet2 === planet) ||
                (q.planet1 === planet && q.planet2 === sext.planet1)
            );
            const q2 = quincunxes.find(q =>
                (q.planet1 === sext.planet2 && q.planet2 === planet) ||
                (q.planet1 === planet && q.planet2 === sext.planet2)
            );
            if (q1 && q2) {
                patterns.push({
                    type: 'Yod',
                    planets: [sext.planet1, sext.planet2, planet],
                    apex: planet,
                    description: `Yod (Finger of God) with ${planet} at apex, sextile base ${sext.planet1}-${sext.planet2}`
                });
            }
        }
    }

    return patterns;
}
