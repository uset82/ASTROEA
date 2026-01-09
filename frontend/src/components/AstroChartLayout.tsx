import { useMemo, type CSSProperties } from 'react'
import { useLanguage } from '../i18n'
import ChartWheel from './ChartWheel'
import './AstroChartLayout.css'
import { ChartData, BirthData } from '../App'

interface AstroChartLayoutProps {
    chartData: ChartData
    birthData: BirthData
    secondaryBirthData?: BirthData
    chartType: string
}

// Planet symbols
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
}

const normalizeObjectKey = (value: string) => value.toLowerCase().replace(/[^a-z]/g, '')
const PLANET_SYMBOLS_NORMALIZED = Object.fromEntries(
    Object.entries(PLANET_SYMBOLS).map(([key, value]) => [normalizeObjectKey(key), value])
)

const SIGN_SYMBOLS: Record<string, string> = {
    Aries: '\u2648',
    Taurus: '\u2649',
    Gemini: '\u264A',
    Cancer: '\u264B',
    Leo: '\u264C',
    Virgo: '\u264D',
    Libra: '\u264E',
    Scorpio: '\u264F',
    Sagittarius: '\u2650',
    Capricorn: '\u2651',
    Aquarius: '\u2652',
    Pisces: '\u2653',
}

type ElementType = 'fire' | 'earth' | 'air' | 'water'

const SIGN_ELEMENTS: Record<string, ElementType> = {
    Aries: 'fire',
    Taurus: 'earth',
    Gemini: 'air',
    Cancer: 'water',
    Leo: 'fire',
    Virgo: 'earth',
    Libra: 'air',
    Scorpio: 'water',
    Sagittarius: 'fire',
    Capricorn: 'earth',
    Aquarius: 'air',
    Pisces: 'water',
}

const ELEMENT_COLORS: Record<ElementType, string> = {
    fire: '#d35400',
    earth: '#2d5016',
    air: '#b8860b',
    water: '#1565c0',
}

const ZODIAC_TINTS: Record<ElementType, string> = {
    fire: '#fce4d6',
    earth: '#d4e8c7',
    air: '#fff3c4',
    water: '#c5ddf8',
}

const ZODIAC_ORDER = [
    'Aries',
    'Taurus',
    'Gemini',
    'Cancer',
    'Leo',
    'Virgo',
    'Libra',
    'Scorpio',
    'Sagittarius',
    'Capricorn',
    'Aquarius',
    'Pisces',
]

const ASPECT_SYMBOLS: Record<string, string> = {
    Conjunction: '\u260C',
    Opposition: '\u260D',
    Trine: '\u25B3',
    Square: '\u25A1',
    Sextile: '\u26B9',
    Quincunx: '\u26BB',
}

// Main planet order for display (astro.com style)
const PLANET_ORDER = [
    'Sun', 'Moon', 'Mercury', 'Venus', 'Mars',
    'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto',
    'Chiron', 'True Node', 'North Node'
]

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

const getAspectName = (aspect: any) => {
    if (!aspect) return ''
    if (typeof aspect.type === 'string') return aspect.type
    if (typeof aspect.type?.name === 'string') return aspect.type.name
    if (typeof aspect.aspect === 'string') return aspect.aspect
    return ''
}

function AstroChartLayout({ chartData, birthData, chartType }: AstroChartLayoutProps) {
    const { t, language } = useLanguage()

    const planets = useMemo(() => {
        if (!chartData?.objects) return []

        const planetList = Object.values(chartData.objects)
            .filter((obj: any) => obj.name && obj.sign && PLANET_ORDER.includes(obj.name))
            .map((obj: any) => ({
                name: obj.name,
                symbol: getObjectSymbol(obj),
                sign: obj.sign?.name || '',
                signSymbol: SIGN_SYMBOLS[obj.sign?.name] || '',
                longitude: obj.sign_longitude?.formatted || '',
                retrograde: obj.movement?.retrograde || false,
            }))

        return planetList.sort((a, b) => {
            const indexA = PLANET_ORDER.indexOf(a.name)
            const indexB = PLANET_ORDER.indexOf(b.name)
            return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
        })
    }, [chartData])

    const houses = useMemo(() => {
        if (!chartData?.houses) return []
        return Object.values(chartData.houses)
            .filter((h: any) => h.number)
            .sort((a: any, b: any) => a.number - b.number)
            .map((h: any) => ({
                number: h.number,
                sign: h.sign?.name || '',
                signSymbol: SIGN_SYMBOLS[h.sign?.name] || '',
                degree: h.sign_longitude?.formatted || '',
            }))
    }, [chartData])

    const ascendant = houses.find(h => h.number === 1)
    const midheaven = houses.find(h => h.number === 10)

    const aspects = useMemo(() => {
        if (!chartData?.aspects) return []
        return Object.values(chartData.aspects)
            .filter((a: any) => a.active && a.passive && (a.type || a.aspect))
            .slice(0, 15)
            .map((a: any) => {
                const name = getAspectName(a)
                return {
                    active: a.active.name,
                    activeSymbol: getObjectSymbol(a.active),
                    type: name,
                    typeSymbol: ASPECT_SYMBOLS[name] || '',
                    passive: a.passive.name,
                    passiveSymbol: getObjectSymbol(a.passive),
                    orb: a.orb?.formatted || '',
                }
            })
    }, [chartData])

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr)
            const localeMap: Record<string, string> = {
                en: 'en-US',
                es: 'es-ES',
                no: 'nb-NO'
            }
            const options: Intl.DateTimeFormatOptions = {
                weekday: 'short',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            }
            return date.toLocaleDateString(localeMap[language] || 'en-US', options)
        } catch {
            return dateStr
        }
    }

    const getChartTypeName = () => {
        const typeKey = chartType === 'solar-return' ? 'solarReturn' : chartType
        return t(`chartTypes.${typeKey}`)
    }

    return (
        <div className="astro-chart-layout">
            {/* Left Sidebar */}
            <div className="chart-sidebar">
                {/* Header Info */}
                <div className="chart-header-info">
                    <div className="subject-name">{birthData.name || 'Chart Subject'}</div>
                    <div className="birth-details">
                        <div className="detail-row">
                            <span className="label">{t('form.birthDate')}:</span>
                            <span className="value">{formatDate(birthData.date)}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">{t('form.birthTime')}:</span>
                            <span className="value">{birthData.time}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">{t('form.location')}:</span>
                            <span className="value">{birthData.locationName}</span>
                        </div>
                        <div className="detail-row coordinates">
                            <span className="value">
                                {Math.abs(birthData.latitude).toFixed(2)}{'\u00B0'}{birthData.latitude >= 0 ? 'N' : 'S'},
                                {Math.abs(birthData.longitude).toFixed(2)}{'\u00B0'}{birthData.longitude >= 0 ? 'E' : 'W'}
                            </span>
                        </div>
                    </div>
                    <div className="chart-type-badge">{getChartTypeName()}</div>
                </div>

                {/* Ascendant & Midheaven */}
                <div className="angles-box">
                    <div className="angle-row">
                        <span className="angle-label">AC</span>
                        <span className="angle-sign">{ascendant?.signSymbol} {ascendant?.sign}</span>
                        <span className="angle-degree">{ascendant?.degree}</span>
                    </div>
                    <div className="angle-row">
                        <span className="angle-label">MC</span>
                        <span className="angle-sign">{midheaven?.signSymbol} {midheaven?.sign}</span>
                        <span className="angle-degree">{midheaven?.degree}</span>
                    </div>
                </div>

                {/* Planets Table */}
                <div className="planets-table">
                    <div className="table-header">{t('tables.planetPositions')}</div>
                    <table>
                        <tbody>
                            {planets.map((planet) => (
                                <tr key={planet.name}>
                                    <td className="planet-symbol">{planet.symbol}</td>
                                    <td className="planet-name">{planet.name}</td>
                                    <td className="planet-sign">
                                        <span className="sign-symbol">{planet.signSymbol}</span>
                                    </td>
                                    <td className="planet-degree">{planet.longitude}</td>
                                    <td className="planet-retro">
                                        {planet.retrograde && <span className="retro-badge">r</span>}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Houses Table */}
                <div className="houses-table">
                    <div className="table-header">{t('tables.houseCusps')}</div>
                    <div className="houses-grid">
                        {houses.map((house) => (
                            <div key={house.number} className={`house-item ${[1, 4, 7, 10].includes(house.number) ? 'angular' : ''}`}>
                                <span className="house-num">{house.number}</span>
                                <span className="house-sign">{house.signSymbol}</span>
                                <span className="house-degree">{house.degree}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Aspects List */}
                <div className="aspects-table">
                    <div className="table-header">{t('tables.majorAspects')}</div>
                    <div className="aspects-list">
                        {aspects.slice(0, 10).map((aspect, i) => (
                            <div key={i} className={`aspect-row aspect-${aspect.type.toLowerCase()}`}>
                                <span className="aspect-planet">{aspect.activeSymbol}</span>
                                <span className="aspect-type">{aspect.typeSymbol || aspect.type}</span>
                                <span className="aspect-planet">{aspect.passiveSymbol}</span>
                                <span className="aspect-orb">{aspect.orb}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Chart Area */}
            <div className="chart-main">
                <ChartWheel chartData={chartData} />
                <div className="zodiac-legend" aria-label="Zodiac legend">
                    {ZODIAC_ORDER.map((sign) => {
                        const element = SIGN_ELEMENTS[sign]
                        const zodiacStyle = {
                            '--zodiac-tint': ZODIAC_TINTS[element],
                            '--zodiac-color': ELEMENT_COLORS[element],
                        } as CSSProperties

                        return (
                            <div key={sign} className="zodiac-item" style={zodiacStyle}>
                                <span className="zodiac-symbol">{SIGN_SYMBOLS[sign]}</span>
                                <span className="zodiac-name">{sign}</span>
                            </div>
                        )
                    })}
                </div>
                <div className="chart-footer">
                    <span className="method-info">Method: Placidus</span>
                    <span className="date-generated">Generated: {new Date().toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    )
}

export default AstroChartLayout



