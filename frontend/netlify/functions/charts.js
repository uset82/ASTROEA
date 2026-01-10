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
        const mc = normalize(calcMC(jd, lon));  // Proper MC calculation

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

        // Detect aspect patterns (T-Square, Grand Trine, Grand Cross, Yod)
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
                    patterns,  // NEW: Include detected patterns
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
    // Greenwich Mean Sidereal Time
    const theta0 = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T;
    // Local Sidereal Time
    const lst = normalize(theta0 + lon);
    // Obliquity of the ecliptic
    const eps = 23.4392911 - 0.0130042 * T;

    const lstRad = lst * Math.PI / 180;
    const epsRad = eps * Math.PI / 180;
    const latRad = lat * Math.PI / 180;

    // Correct Ascendant formula: Asc = atan2(-cos(LST), sin(ε)·tan(φ) + cos(ε)·sin(LST))
    const y = -Math.cos(lstRad);
    const x = Math.sin(epsRad) * Math.tan(latRad) + Math.cos(epsRad) * Math.sin(lstRad);
    let ascRad = Math.atan2(y, x);

    // Convert to degrees and normalize to 0-360
    let asc = ascRad * 180 / Math.PI;
    return normalize(asc);
}

// Calculate Midheaven (MC) - the point where the ecliptic crosses the meridian
function calcMC(jd, lon) {
    const T = (jd - 2451545.0) / 36525;
    // Greenwich Mean Sidereal Time
    const theta0 = 280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * T * T;
    // Local Sidereal Time (RAMC - Right Ascension of MC)
    const lst = normalize(theta0 + lon);
    // Obliquity of the ecliptic
    const eps = 23.4392911 - 0.0130042 * T;

    const lstRad = lst * Math.PI / 180;
    const epsRad = eps * Math.PI / 180;

    // MC is where the ecliptic crosses the local meridian
    // MC = atan(tan(RAMC) / cos(ε))
    let mcRad = Math.atan2(Math.sin(lstRad), Math.cos(lstRad) * Math.cos(epsRad));
    let mc = mcRad * 180 / Math.PI;

    return normalize(mc);
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
                        // Both formats for compatibility
                        planet1: p1,
                        planet2: p2,
                        active: p1,      // ChartWheel.tsx expects this
                        passive: p2,     // ChartWheel.tsx expects this
                        type: asp.name,  // Alternative to aspect_type
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

// Detect major aspect patterns
function detectPatterns(aspects, objects) {
    const patterns = [];
    const aspectList = Object.values(aspects);

    // Helper to find aspects between specific planets
    const findAspect = (p1, p2, type) => {
        return aspectList.find(a =>
            ((a.planet1 === p1 && a.planet2 === p2) || (a.planet1 === p2 && a.planet2 === p1))
            && a.aspect_type === type
        );
    };

    // Get all planets involved in aspects
    const planets = [...new Set(aspectList.flatMap(a => [a.planet1, a.planet2]))];

    // Detect T-SQUARE: Opposition + 2 Squares forming a T
    // Planet A opposes Planet B, both square Planet C (apex)
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

    // Detect GRAND TRINE: 3 planets all in trine to each other
    const trines = aspectList.filter(a => a.aspect_type === 'Trine');
    for (let i = 0; i < trines.length; i++) {
        for (let j = i + 1; j < trines.length; j++) {
            const t1 = trines[i], t2 = trines[j];
            // Find common planet
            const planets1 = [t1.planet1, t1.planet2];
            const planets2 = [t2.planet1, t2.planet2];
            const common = planets1.find(p => planets2.includes(p));
            if (!common) continue;

            const other1 = planets1.find(p => p !== common);
            const other2 = planets2.find(p => p !== common);
            const t3 = findAspect(other1, other2, 'Trine');
            if (t3) {
                const gtPlanets = [common, other1, other2].sort();
                // Avoid duplicates
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

    // Detect GRAND CROSS: 4 planets, 2 oppositions, 4 squares forming a cross
    for (let i = 0; i < oppositions.length; i++) {
        for (let j = i + 1; j < oppositions.length; j++) {
            const opp1 = oppositions[i], opp2 = oppositions[j];
            const p1 = [opp1.planet1, opp1.planet2];
            const p2 = [opp2.planet1, opp2.planet2];
            // Check no overlap
            if (p1.some(p => p2.includes(p))) continue;

            // Check all 4 squares exist
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

    // Detect YOD (Finger of God): 2 planets sextile each other, both quincunx a third
    const sextiles = aspectList.filter(a => a.aspect_type === 'Sextile');
    // Note: We need to add Quincunx detection first - adding it here
    const quincunxes = [];
    const planetNames = Object.keys(objects).filter(n => !['Asc', 'MC'].includes(n));
    for (let i = 0; i < planetNames.length; i++) {
        for (let j = i + 1; j < planetNames.length; j++) {
            const p1 = planetNames[i], p2 = planetNames[j];
            const l1 = objects[p1].longitude.raw, l2 = objects[p2].longitude.raw;
            let diff = Math.abs(l1 - l2);
            if (diff > 180) diff = 360 - diff;
            // Quincunx = 150° with 3° orb
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
