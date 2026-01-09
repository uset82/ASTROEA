import { useMemo } from 'react'
import './ChartWheel.css'
import { ChartData } from '../App'

interface ChartWheelProps {
    chartData: ChartData
}

type ElementType = 'fire' | 'earth' | 'air' | 'water'

const ZODIAC_SIGNS: Array<{ name: string; symbol: string; element: ElementType; degrees: number }> = [
    { name: 'Aries', symbol: '\u2648', element: 'fire', degrees: 0 },
    { name: 'Taurus', symbol: '\u2649', element: 'earth', degrees: 30 },
    { name: 'Gemini', symbol: '\u264A', element: 'air', degrees: 60 },
    { name: 'Cancer', symbol: '\u264B', element: 'water', degrees: 90 },
    { name: 'Leo', symbol: '\u264C', element: 'fire', degrees: 120 },
    { name: 'Virgo', symbol: '\u264D', element: 'earth', degrees: 150 },
    { name: 'Libra', symbol: '\u264E', element: 'air', degrees: 180 },
    { name: 'Scorpio', symbol: '\u264F', element: 'water', degrees: 210 },
    { name: 'Sagittarius', symbol: '\u2650', element: 'fire', degrees: 240 },
    { name: 'Capricorn', symbol: '\u2651', element: 'earth', degrees: 270 },
    { name: 'Aquarius', symbol: '\u2652', element: 'air', degrees: 300 },
    { name: 'Pisces', symbol: '\u2653', element: 'water', degrees: 330 },
]

const ELEMENT_COLORS: Record<ElementType, string> = {
    fire: '#d35400',
    earth: '#2d5016',
    air: '#b8860b',
    water: '#1565c0'
}

const ZODIAC_TINTS: Record<ElementType, string> = {
    fire: '#fce4d6',
    earth: '#d4e8c7',
    air: '#fff3c4',
    water: '#c5ddf8'
}

const PLANET_SYMBOLS: Record<string, string> = {
    Sun: '\u2609',
    Moon: '\u263D',
    Mercury: '\u263F',
    Venus: '\u2640',
    Mars: '\u2642',
    Jupiter: '\u2643',
    Saturn: '\u2644',
    Uranus: '\u2645',
    Neptune: '\u2646',
    Pluto: '\u2647',
    Chiron: '\u26B7',
    'North Node': '\u260A',
    'South Node': '\u260B',
    'True Node': '\u260A',
    'Mean Node': '\u260A',
    Node: '\u260A',
    Ceres: '\u26B3',
    Pallas: '\u26B4',
    Juno: '\u26B5',
    Vesta: '\u26B6',
    'Pars Fortuna': '\u2297',
    'Part of Fortune': '\u2297',
    Asc: 'AC',
    Ascendant: 'AC',
    MC: 'MC',
    IC: 'IC',
    Desc: 'DC',
    Descendant: 'DC',
}

const normalizeObjectKey = (value: string) => value.toLowerCase().replace(/[^a-z]/g, '')
const PLANET_SYMBOLS_NORMALIZED = Object.fromEntries(
    Object.entries(PLANET_SYMBOLS).map(([key, value]) => [normalizeObjectKey(key), value])
)

const AXIS_OBJECTS = new Set(['Asc', 'Ascendant', 'MC', 'IC', 'Desc', 'Descendant'])
const ASPECT_OBJECT_ALLOWLIST = new Set([
    'sun',
    'moon',
    'mercury',
    'venus',
    'mars',
    'jupiter',
    'saturn',
    'uranus',
    'neptune',
    'pluto',
])

const ASPECT_CONFIG: Record<string, { color: string; dash?: string; width: number }> = {
    Conjunction: { color: '#111827', width: 1.4 },
    Opposition: { color: '#dc2626', width: 1.6 },
    Trine: { color: '#2563eb', width: 1.6 },
    Square: { color: '#dc2626', width: 1.6 },
    Sextile: { color: '#2563eb', width: 1.2, dash: '4,3' },
    Quincunx: { color: '#16a34a', width: 1.2, dash: '2,3' },
    Inconjunct: { color: '#16a34a', width: 1.2, dash: '2,3' },
}

const SYMBOL_FONT = '"Segoe UI Symbol", "Noto Sans Symbols 2", "Noto Sans Symbols", "DejaVu Sans", "Arial Unicode MS", sans-serif'
const LABEL_FONT = '"Times New Roman", serif'

const SHOW_ASPECT_NODES = true

const normalizeAngle = (deg: number) => ((deg % 360) + 360) % 360
const angularDistance = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180)

const formatDegreeMinutes = (raw?: number) => {
    if (raw === undefined || Number.isNaN(raw)) return ''
    let deg = Math.floor(raw)
    let minutes = Math.round((raw - deg) * 60)
    if (minutes === 60) {
        deg += 1
        minutes = 0
    }
    return `${deg}\u00B0${minutes.toString().padStart(2, '0')}'`
}

const getObjectSymbol = (obj: any) => {
    const name = typeof obj?.name === 'string' ? obj.name : ''
    const normalizedName = normalizeObjectKey(name)
    const mapped = PLANET_SYMBOLS[name] || PLANET_SYMBOLS_NORMALIZED[normalizedName]
    if (mapped) return mapped

    if (typeof obj?.symbol === 'string') {
        const rawSymbol = obj.symbol.trim()
        if (rawSymbol && !/^[A-Za-z]{1,3}$/.test(rawSymbol)) {
            return rawSymbol
        }
    }

    return ''
}

const resolveLongitude = (value: any, objectLongitudes: Record<string, number>) => {
    if (typeof value === 'number') {
        const mapped = objectLongitudes[String(value)]
        return mapped !== undefined ? mapped : value
    }
    if (typeof value === 'string') return objectLongitudes[value]
    if (value?.longitude?.raw !== undefined) return value.longitude.raw
    if (typeof value?.longitude === 'number') return value.longitude
    if (typeof value?.name === 'string') return objectLongitudes[value.name]
    return undefined
}

const resolveObjectName = (value: any, objectNames: Record<string, string>) => {
    if (typeof value === 'string') return objectNames[value] || value
    if (typeof value === 'number') return objectNames[String(value)]
    if (typeof value?.name === 'string') return value.name
    if (typeof value?.id === 'string' || typeof value?.id === 'number') return objectNames[String(value.id)]
    return undefined
}

const getAspectTypeName = (aspect: any) => {
    if (!aspect) return ''
    if (typeof aspect.type === 'string') return aspect.type
    if (typeof aspect.type?.name === 'string') return aspect.type.name
    if (typeof aspect.aspect === 'string') return aspect.aspect
    return ''
}

const ASPECT_TYPE_ALIASES: Record<string, string> = {
    conjunction: 'Conjunction',
    opposition: 'Opposition',
    trine: 'Trine',
    square: 'Square',
    sextile: 'Sextile',
    quincunx: 'Quincunx',
    inconjunct: 'Inconjunct',
}

const normalizeAspectType = (typeName: string) => {
    const key = typeName.trim().toLowerCase()
    return ASPECT_TYPE_ALIASES[key] || typeName.trim()
}

const getAspectKeyPart = (value: any, fallbackLong?: number) => {
    if (typeof value === 'string') return value
    if (typeof value === 'number') return value.toFixed(4)
    if (typeof value?.name === 'string') return value.name
    if (typeof value?.id === 'string' || typeof value?.id === 'number') return String(value.id)
    if (fallbackLong !== undefined) return fallbackLong.toFixed(4)
    return 'unknown'
}

const collectAspects = (node: any, acc: any[]) => {
    if (!node) return
    if (Array.isArray(node)) {
        node.forEach((item) => collectAspects(item, acc))
        return
    }
    if (typeof node !== 'object') return

    const typeName = getAspectTypeName(node)
    const hasEndpoints = node.active !== undefined || node.passive !== undefined || node.active_id !== undefined || node.passive_id !== undefined
    if (typeName && hasEndpoints) {
        acc.push(node)
        return
    }

    Object.values(node).forEach((value) => collectAspects(value, acc))
}

const intersectSegments = (a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }, d: { x: number; y: number }) => {
    const den = (a.x - b.x) * (c.y - d.y) - (a.y - b.y) * (c.x - d.x)
    if (Math.abs(den) < 1e-6) return null

    const t = ((a.x - c.x) * (c.y - d.y) - (a.y - c.y) * (c.x - d.x)) / den
    const u = ((a.x - c.x) * (a.y - b.y) - (a.y - c.y) * (a.x - b.x)) / den

    if (t <= 0 || t >= 1 || u <= 0 || u >= 1) return null

    return {
        x: a.x + t * (b.x - a.x),
        y: a.y + t * (b.y - a.y)
    }
}

function ChartWheel({ chartData }: ChartWheelProps) {
    const size = 700
    const center = size / 2

    const outerRingRadius = 340
    const outerRadius = 310
    const zodiacInnerRadius = 260
    const houseInnerRadius = 185
    const aspectRadius = houseInnerRadius
    const hubRadius = 65

    // ASTRO.COM STYLE: Signs live in the colored zodiac band, planets live inside it
    const planetTracks = [
        246,  // outermost planet track (just inside zodiac band)
        226,  // track 2
        206,  // track 3
        186,  // innermost planet track (above house labels)
    ]
    const zodiacLabelRadius = outerRadius - 28
    const houseLabelRadius = houseInnerRadius - 18
    const axisLabelRadius = outerRadius + 22
    const degreeLabelRadius = (outerRadius + outerRingRadius) / 2  // Degrees IN the outer teal ring (~325)
    const planetTickLength = 8  // Tick mark length
    const planetGlyphSize = 26
    const planetCollisionPadding = 4
    const minPlanetDistance = planetGlyphSize + planetCollisionPadding
    const averagePlanetRadius = planetTracks.reduce((sum, radius) => sum + radius, 0) / planetTracks.length
    const clusterGap = Math.max(8, Math.min(16, (minPlanetDistance / averagePlanetRadius) * (180 / Math.PI)))

    const chartRoot = useMemo(
        () => ((chartData as any).objects ? chartData : (chartData as any).person1 ?? chartData),
        [chartData]
    )

    const houses = useMemo(() => {
        if (!chartRoot?.houses) return []
        return Object.values(chartRoot.houses)
            .filter((h: any) => h.longitude && typeof h.number === 'number')
            .sort((a: any, b: any) => a.number - b.number)
            .map((h: any) => ({
                number: h.number,
                longitude: h.longitude.raw
            }))
    }, [chartRoot])

    const ascDegree = useMemo(() => {
        const house1 = houses.find((h) => h.number === 1)
        if (house1?.longitude !== undefined) {
            return house1.longitude
        }
        if (chartRoot?.objects) {
            const ascObject = Object.values(chartRoot.objects).find((obj: any) => obj?.name === 'Asc' || obj?.name === 'Ascendant') as any
            if (ascObject?.longitude?.raw !== undefined) {
                return ascObject.longitude.raw
            }
        }
        return 0
    }, [chartRoot, houses])

    const toChartAngle = (long: number) => normalizeAngle(180 + (long - ascDegree))

    const toCartesian = (angle: number, r: number) => {
        const rad = angle * Math.PI / 180
        return {
            x: center + r * Math.cos(rad),
            y: center - r * Math.sin(rad)
        }
    }

    const arcPath = (startAngle: number, endAngle: number, outerR: number, innerR: number) => {
        const sweep = endAngle - startAngle
        const largeArc = sweep > 180 ? 1 : 0
        const p1 = toCartesian(startAngle, outerR)
        const p2 = toCartesian(endAngle, outerR)
        const p3 = toCartesian(endAngle, innerR)
        const p4 = toCartesian(startAngle, innerR)

        return [
            `M ${p1.x} ${p1.y}`,
            `A ${outerR} ${outerR} 0 ${largeArc} 1 ${p2.x} ${p2.y}`,
            `L ${p3.x} ${p3.y}`,
            `A ${innerR} ${innerR} 0 ${largeArc} 0 ${p4.x} ${p4.y}`,
            'Z'
        ].join(' ')
    }

    const zodiacSegments = useMemo(() => {
        return ZODIAC_SIGNS.map((sign) => {
            const startAngle = toChartAngle(sign.degrees)
            let endAngle = toChartAngle(sign.degrees + 30)
            if (endAngle <= startAngle) endAngle += 360
            const midAngle = (startAngle + endAngle) / 2

            return { ...sign, startAngle, endAngle, midAngle }
        })
    }, [ascDegree])

    const tickMarks = useMemo(() => {
        const ticks: Array<{ angle: number; length: number; width: number }> = []
        for (let deg = 0; deg < 360; deg += 5) {
            const angle = toChartAngle(deg)
            const isMajor = deg % 30 === 0
            const isMedium = deg % 10 === 0
            ticks.push({
                angle,
                length: isMajor ? 12 : isMedium ? 8 : 4,
                width: isMajor ? 1.2 : 0.7
            })
        }
        return ticks
    }, [ascDegree])

    const houseSegments = useMemo(() => {
        if (houses.length === 0) return []
        const angles = houses.map((house) => ({
            number: house.number,
            angle: normalizeAngle(toChartAngle(house.longitude)),
        }))

        return angles.map((house, i) => {
            const next = angles[(i + 1) % angles.length]
            let start = house.angle
            let end = next.angle
            if (end <= start) end += 360
            const mid = start + (end - start) / 2
            return {
                number: house.number,
                midAngle: mid
            }
        })
    }, [houses, ascDegree])

    const axisLabels = useMemo(() => {
        const axis = new Map<number, string>([
            [1, 'AC'],
            [4, 'IC'],
            [7, 'DC'],
            [10, 'MC']
        ])

        return houses
            .filter((house) => axis.has(house.number))
            .map((house) => ({
                label: axis.get(house.number) as string,
                longitude: house.longitude
            }))
    }, [houses])

    const planets = useMemo(() => {
        if (!chartRoot?.objects) return []
        return Object.values(chartRoot.objects)
            .filter((obj: any) => obj.longitude && obj.name && !AXIS_OBJECTS.has(obj.name))
            .map((obj: any) => {
                const symbol = getObjectSymbol(obj)
                return {
                    name: obj.name,
                    longitude: obj.longitude.raw,
                    sign: obj.sign?.name || '',
                    degreeLabel: typeof obj.sign_longitude?.raw === 'number'
                        ? formatDegreeMinutes(obj.sign_longitude.raw)
                        : (typeof obj.sign_longitude?.formatted === 'string' ? obj.sign_longitude.formatted : ''),
                    symbol
                }
            })
            .filter((planet: any) => Boolean(planet.symbol))
    }, [chartRoot])

    const planetPositions = useMemo(() => {
        if (planets.length === 0) return []

        const withAngles = planets
            .map((planet) => ({
                ...planet,
                baseAngle: normalizeAngle(toChartAngle(planet.longitude))
            }))
            .sort((a, b) => a.baseAngle - b.baseAngle)

        const clusters: Array<typeof withAngles> = []
        let current: typeof withAngles = [withAngles[0]]

        for (let i = 1; i < withAngles.length; i += 1) {
            const prev = withAngles[i - 1]
            const next = withAngles[i]
            if (angularDistance(prev.baseAngle, next.baseAngle) <= clusterGap) {
                current.push(next)
            } else {
                clusters.push(current)
                current = [next]
            }
        }
        clusters.push(current)

        if (clusters.length > 1) {
            const first = clusters[0][0]
            const lastCluster = clusters[clusters.length - 1]
            const last = lastCluster[lastCluster.length - 1]
            if (angularDistance(first.baseAngle, last.baseAngle) <= clusterGap) {
                clusters[0] = lastCluster.concat(clusters[0])
                clusters.pop()
            }
        }

        const trackOrder: number[] = []
        let left = 0
        let right = planetTracks.length - 1
        while (left <= right) {
            if (left === right) {
                trackOrder.push(left)
            } else {
                trackOrder.push(left, right)
            }
            left += 1
            right -= 1
        }

        const minAngularGap = Math.max(2, Math.min(6, (minPlanetDistance / averagePlanetRadius) * (180 / Math.PI)))

        return clusters.flatMap((cluster) => {
            const shouldOffset = cluster.length > trackOrder.length
            const centerIndex = (cluster.length - 1) / 2
            return cluster.map((planet, index) => {
                const offset = shouldOffset ? (index - centerIndex) * minAngularGap : 0
                const trackIndex = trackOrder[index % trackOrder.length]
                return {
                    ...planet,
                    angle: normalizeAngle(planet.baseAngle + offset),
                    radius: planetTracks[trackIndex],
                    trackIndex
                }
            })
        })
    }, [planets, ascDegree, planetTracks, clusterGap, minPlanetDistance, averagePlanetRadius])

    const objectLongitudes = useMemo(() => {
        const map: Record<string, number> = {}
        if (chartRoot?.objects) {
            Object.entries(chartRoot.objects).forEach(([id, obj]: [string, any]) => {
                if (obj.longitude?.raw !== undefined) {
                    map[id] = obj.longitude.raw
                }
                if (typeof obj?.name === 'string' && obj.longitude?.raw !== undefined) {
                    map[obj.name] = obj.longitude.raw
                }
            })
        }
        return map
    }, [chartRoot])

    const objectNames = useMemo(() => {
        const map: Record<string, string> = {}
        if (chartRoot?.objects) {
            Object.entries(chartRoot.objects).forEach(([id, obj]: [string, any]) => {
                if (typeof obj?.name === 'string') {
                    map[id] = obj.name
                    map[obj.name] = obj.name
                }
            })
        }
        return map
    }, [chartRoot])

    const aspects = useMemo(() => {
        const source = chartRoot?.aspects ?? chartData.aspects
        if (!source) return []

        const rawAspects: any[] = []
        collectAspects(source, rawAspects)

        const deduped = new Map<string, { activeLong: number; passiveLong: number; type: string; config: { color: string; dash?: string; width: number }; orb: number }>()

        rawAspects.forEach((aspect) => {
            const typeName = normalizeAspectType(getAspectTypeName(aspect))
            const config = ASPECT_CONFIG[typeName]
            if (!config) return

            const activeSource = aspect.active ?? aspect.active_id ?? aspect.activeId
            const passiveSource = aspect.passive ?? aspect.passive_id ?? aspect.passiveId
            const activeName = resolveObjectName(activeSource, objectNames)
            const passiveName = resolveObjectName(passiveSource, objectNames)
            if (!activeName || !passiveName) return

            const activeKeyName = normalizeObjectKey(activeName)
            const passiveKeyName = normalizeObjectKey(passiveName)
            if (!ASPECT_OBJECT_ALLOWLIST.has(activeKeyName) || !ASPECT_OBJECT_ALLOWLIST.has(passiveKeyName)) return

            const activeLong = resolveLongitude(activeSource, objectLongitudes)
            const passiveLong = resolveLongitude(passiveSource, objectLongitudes)

            if (activeLong === undefined || passiveLong === undefined) return
            if (Math.abs(activeLong - passiveLong) < 1e-6) return

            const activeKey = getAspectKeyPart(activeSource, activeLong)
            const passiveKey = getAspectKeyPart(passiveSource, passiveLong)
            const key = [typeName, ...[activeKey, passiveKey].sort()].join('|')

            const orb = typeof aspect.orb?.raw === 'number'
                ? aspect.orb.raw
                : (typeof aspect.orb === 'number' ? aspect.orb : Number.POSITIVE_INFINITY)

            const existing = deduped.get(key)
            if (!existing || orb < existing.orb) {
                deduped.set(key, { activeLong, passiveLong, type: typeName, config, orb })
            }
        })

        return Array.from(deduped.values()).slice(0, 120)
    }, [chartRoot, chartData.aspects, objectLongitudes, objectNames])

    const aspectLines = useMemo(() => {
        return aspects.map((aspect) => {
            const p1 = toCartesian(toChartAngle(aspect.activeLong), aspectRadius)
            const p2 = toCartesian(toChartAngle(aspect.passiveLong), aspectRadius)
            return { ...aspect, p1, p2 }
        })
    }, [aspects, ascDegree, aspectRadius])

    const aspectNodes = useMemo(() => {
        if (!SHOW_ASPECT_NODES || aspectLines.length < 2) return []

        const nodes: Array<{ x: number; y: number }> = []
        const seen = new Set<string>()

        for (let i = 0; i < aspectLines.length; i += 1) {
            for (let j = i + 1; j < aspectLines.length; j += 1) {
                const a = aspectLines[i]
                const b = aspectLines[j]
                const intersection = intersectSegments(a.p1, a.p2, b.p1, b.p2)
                if (!intersection) continue

                const distFromCenter = Math.hypot(intersection.x - center, intersection.y - center)
                if (distFromCenter > aspectRadius - 2) continue

                const minEndDist = Math.min(
                    Math.hypot(intersection.x - a.p1.x, intersection.y - a.p1.y),
                    Math.hypot(intersection.x - a.p2.x, intersection.y - a.p2.y),
                    Math.hypot(intersection.x - b.p1.x, intersection.y - b.p1.y),
                    Math.hypot(intersection.x - b.p2.x, intersection.y - b.p2.y)
                )

                if (minEndDist < 6) continue

                const key = `${Math.round(intersection.x)}:${Math.round(intersection.y)}`
                if (seen.has(key)) continue
                seen.add(key)
                nodes.push(intersection)
            }
        }

        return nodes
    }, [aspectLines, aspectRadius, center])

    return (
        <svg viewBox={`0 0 ${size} ${size}`} className="chart-wheel">
            <defs>
                <radialGradient id="outerRingGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="85%" stopColor="#b8e8e8" />
                    <stop offset="100%" stopColor="#8fd4d4" />
                </radialGradient>
                <filter id="chartShadow" x="-5%" y="-5%" width="110%" height="110%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
                </filter>
            </defs>

            <circle cx={center} cy={center} r={outerRingRadius} fill="url(#outerRingGradient)" />
            <circle cx={center} cy={center} r={outerRadius} fill="#ffffff" stroke="#2c3e50" strokeWidth="1.5" filter="url(#chartShadow)" />
            <circle cx={center} cy={center} r={zodiacInnerRadius} fill="#fefefe" stroke="#34495e" strokeWidth="1" />
            <circle cx={center} cy={center} r={aspectRadius} fill="none" stroke="#7f8c8d" strokeWidth="0.8" />
            <circle cx={center} cy={center} r={hubRadius} fill="#ffffff" stroke="#34495e" strokeWidth="1" />

            {zodiacSegments.map((sign) => (
                <path
                    key={`zodiac-${sign.name}`}
                    d={arcPath(sign.startAngle, sign.endAngle, outerRadius, zodiacInnerRadius)}
                    fill={ZODIAC_TINTS[sign.element]}
                    stroke="#4a5568"
                    strokeWidth="0.5"
                />
            ))}

            {tickMarks.map((tick, i) => {
                const p1 = toCartesian(tick.angle, outerRadius)
                const p2 = toCartesian(tick.angle, outerRadius - tick.length)
                return (
                    <line
                        key={`tick-${i}`}
                        x1={p1.x}
                        y1={p1.y}
                        x2={p2.x}
                        y2={p2.y}
                        stroke="#34495e"
                        strokeWidth={tick.width}
                    />
                )
            })}

            {zodiacSegments.map((sign) => {
                const pos = toCartesian(sign.midAngle, zodiacLabelRadius)
                return (
                    <text
                        key={`zodiac-label-${sign.name}`}
                        x={pos.x}
                        y={pos.y}
                        fill={ELEMENT_COLORS[sign.element]}
                        fontSize="24"
                        fontWeight="bold"
                        fontFamily={SYMBOL_FONT}
                        textAnchor="middle"
                        dominantBaseline="middle"
                    >
                        {sign.symbol}
                    </text>
                )
            })}

            {zodiacSegments.map((sign) => {
                const p1 = toCartesian(sign.startAngle, zodiacInnerRadius)
                const p2 = toCartesian(sign.startAngle, outerRadius)
                return (
                    <line
                        key={`zodiac-boundary-${sign.name}`}
                        x1={p1.x}
                        y1={p1.y}
                        x2={p2.x}
                        y2={p2.y}
                        stroke="#4a5568"
                        strokeWidth="0.8"
                    />
                )
            })}

            {houses.map((house) => {
                const angle = toChartAngle(house.longitude)
                const isAngle = [1, 4, 7, 10].includes(house.number)
                // Angular houses (AC/IC/DC/MC) extend to hub, others stop at aspect ring
                const innerRadius = isAngle ? hubRadius : houseInnerRadius
                const pOuter = toCartesian(angle, zodiacInnerRadius)
                const pInner = toCartesian(angle, innerRadius)

                return (
                    <line
                        key={`house-${house.number}`}
                        x1={pOuter.x}
                        y1={pOuter.y}
                        x2={pInner.x}
                        y2={pInner.y}
                        stroke={isAngle ? '#111827' : '#718096'}
                        strokeWidth={isAngle ? 2 : 0.6}
                    />
                )
            })}

            {houseSegments.map((house) => {
                const pos = toCartesian(house.midAngle, houseLabelRadius)
                return (
                    <text
                        key={`house-label-${house.number}`}
                        x={pos.x}
                        y={pos.y}
                        fill="#2d3748"
                        fontSize="13"
                        fontFamily={LABEL_FONT}
                        textAnchor="middle"
                        dominantBaseline="middle"
                    >
                        {house.number}
                    </text>
                )
            })}

            {aspectLines.map((aspect, i) => (
                <line
                    key={`asp-${i}`}
                    x1={aspect.p1.x}
                    y1={aspect.p1.y}
                    x2={aspect.p2.x}
                    y2={aspect.p2.y}
                    stroke={aspect.config.color}
                    strokeWidth={aspect.config.width}
                    strokeDasharray={aspect.config.dash}
                    opacity={0.85}
                />
            ))}

            {SHOW_ASPECT_NODES && aspectNodes.map((node, i) => (
                <circle
                    key={`node-${i}`}
                    cx={node.x}
                    cy={node.y}
                    r={1.8}
                    fill="#111827"
                    opacity={0.8}
                />
            ))}

            {planetPositions.map((planet) => {
                const pos = toCartesian(planet.angle, planet.radius)
                // Use baseAngle for tick to point to TRUE zodiac position
                const trueAngle = (planet as any).baseAngle ?? planet.angle
                // ASTRO.COM STYLE: Tick marks point INWARD from outer ring toward planet
                const tickOuter = toCartesian(trueAngle, outerRingRadius)
                const tickInner = toCartesian(trueAngle, outerRingRadius - planetTickLength)
                // Connector endpoint at planet position (display angle)
                const connectorEnd = toCartesian(planet.angle, planet.radius)
                // Degree label positioned IN the outer teal ring - rotated radially
                const degreePos = toCartesian(planet.angle, degreeLabelRadius)
                // Calculate rotation angle for radial text (pointing outward from center)
                const textRotation = -planet.angle + 90  // Rotate to be perpendicular to radius

                return (
                    <g key={`planet-${planet.name}`} className="planet-group">
                        {/* Tick mark pointing INWARD from outer ring */}
                        <line
                            x1={tickOuter.x}
                            y1={tickOuter.y}
                            x2={tickInner.x}
                            y2={tickInner.y}
                            stroke="#2d3748"
                            strokeWidth="1"
                        />
                        {/* Connector line from tick to planet glyph */}
                        <line
                            x1={tickInner.x}
                            y1={tickInner.y}
                            x2={connectorEnd.x}
                            y2={connectorEnd.y}
                            stroke="#94a3b8"
                            strokeWidth="0.5"
                            strokeDasharray="2,2"
                        />
                        {/* Planet glyph inside the zodiac ring */}
                        <text
                            x={pos.x}
                            y={pos.y}
                            fill="#1e3a5f"
                            fontSize={planetGlyphSize}
                            fontWeight="700"
                            fontFamily={SYMBOL_FONT}
                            textAnchor="middle"
                            dominantBaseline="middle"
                        >
                            {planet.symbol}
                        </text>
                        {/* Degree label IN the outer teal ring - rotated radially */}
                        {planet.degreeLabel && (
                            <text
                                x={degreePos.x}
                                y={degreePos.y}
                                fill="#1f2937"
                                fontSize="10"
                                fontFamily={LABEL_FONT}
                                textAnchor="middle"
                                dominantBaseline="middle"
                                transform={`rotate(${textRotation}, ${degreePos.x}, ${degreePos.y})`}
                            >
                                {planet.degreeLabel}
                            </text>
                        )}
                    </g>
                )
            })}

            {axisLabels.map((axis) => {
                const angle = toChartAngle(axis.longitude)
                const pos = toCartesian(angle, axisLabelRadius)
                return (
                    <text
                        key={`axis-${axis.label}`}
                        x={pos.x}
                        y={pos.y}
                        fill="#c0392b"
                        fontSize="13"
                        fontWeight="700"
                        fontFamily={LABEL_FONT}
                        textAnchor="middle"
                        dominantBaseline="middle"
                    >
                        {axis.label}
                    </text>
                )
            })}
        </svg>
    )
}

export default ChartWheel

