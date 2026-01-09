import { useMemo } from 'react'
import './ChartTables.css'
import { ChartData } from '../App'

interface ChartTablesProps {
    chartData: ChartData
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

const ELEMENT_MAP: Record<string, string> = {
    Aries: 'fire', Leo: 'fire', Sagittarius: 'fire',
    Taurus: 'earth', Virgo: 'earth', Capricorn: 'earth',
    Gemini: 'air', Libra: 'air', Aquarius: 'air',
    Cancer: 'water', Scorpio: 'water', Pisces: 'water',
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

const getAspectName = (aspect: any) => {
    if (!aspect) return ''
    if (typeof aspect.type === 'string') return aspect.type
    if (typeof aspect.type?.name === 'string') return aspect.type.name
    if (typeof aspect.aspect === 'string') return aspect.aspect
    return ''
}

function ChartTables({ chartData }: ChartTablesProps) {
    const planets = useMemo(() => {
        if (!chartData.objects) return []
        return Object.values(chartData.objects)
            .filter((obj: any) => obj.name && obj.sign)
            .map((obj: any) => ({
                name: obj.name,
                symbol: getObjectSymbol(obj),
                sign: obj.sign?.name || '',
                signSymbol: SIGN_SYMBOLS[obj.sign?.name] || '',
                signLongitude: obj.sign_longitude?.formatted || '',
                house: obj.house?.number || '',
                retrograde: obj.movement?.retrograde || false,
                element: ELEMENT_MAP[obj.sign?.name] || ''
            }))
    }, [chartData])

    const houses = useMemo(() => {
        if (!chartData.houses) return []
        return Object.values(chartData.houses)
            .filter((h: any) => h.number)
            .sort((a: any, b: any) => a.number - b.number)
            .map((h: any) => ({
                number: h.number,
                sign: h.sign?.name || '',
                signSymbol: SIGN_SYMBOLS[h.sign?.name] || '',
                signLongitude: h.sign_longitude?.formatted || '',
                element: ELEMENT_MAP[h.sign?.name] || ''
            }))
    }, [chartData])

    const aspects = useMemo(() => {
        if (!chartData.aspects) return []
        return Object.values(chartData.aspects)
            .filter((a: any) => a.active && a.passive && (a.type || a.aspect))
            .map((a: any) => ({
                active: a.active.name,
                activeSymbol: getObjectSymbol(a.active),
                aspect: getAspectName(a),
                passive: a.passive.name,
                passiveSymbol: getObjectSymbol(a.passive),
                orb: a.orb?.formatted || ''
            }))
    }, [chartData])

    return (
        <div className="chart-tables">
            <div className="table-card card">
                <h3 className="table-title">Planetary Positions</h3>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Planet</th>
                                <th>Sign</th>
                                <th>Degree</th>
                                <th>House</th>
                            </tr>
                        </thead>
                        <tbody>
                            {planets.map((planet) => (
                                <tr key={planet.name}>
                                    <td>
                                        <span className="planet-cell">
                                            <span className="planet-symbol">{planet.symbol}</span>
                                            {planet.name}
                                            {planet.retrograde && <span className="retrograde-badge">R</span>}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`zodiac-badge zodiac-${planet.element}`}>
                                            {planet.signSymbol && <span className="sign-symbol">{planet.signSymbol}</span>}
                                            {planet.sign}
                                        </span>
                                    </td>
                                    <td className="degree-cell">{planet.signLongitude}</td>
                                    <td className="house-cell">{planet.house}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="table-card card">
                <h3 className="table-title">House Cusps</h3>
                <div className="table-wrapper">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>House</th>
                                <th>Sign</th>
                                <th>Degree</th>
                            </tr>
                        </thead>
                        <tbody>
                            {houses.map((house) => (
                                <tr key={house.number} className={[1, 4, 7, 10].includes(house.number) ? 'angle-row' : ''}>
                                    <td className="house-num">{house.number}</td>
                                    <td>
                                        <span className={`zodiac-badge zodiac-${house.element}`}>
                                            {house.signSymbol && <span className="sign-symbol">{house.signSymbol}</span>}
                                            {house.sign}
                                        </span>
                                    </td>
                                    <td className="degree-cell">{house.signLongitude}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="table-card card aspects-card">
                <h3 className="table-title">Major Aspects</h3>
                <div className="table-wrapper">
                    <table className="data-table aspects-table">
                        <thead>
                            <tr>
                                <th>Planet 1</th>
                                <th>Aspect</th>
                                <th>Planet 2</th>
                                <th>Orb</th>
                            </tr>
                        </thead>
                        <tbody>
                            {aspects.slice(0, 20).map((aspect, i) => (
                                <tr key={i}>
                                    <td>
                                        <span className="planet-cell">
                                            <span className="planet-symbol">{aspect.activeSymbol}</span>
                                            {aspect.active}
                                        </span>
                                    </td>
                                    <td className={`aspect-type aspect-${aspect.aspect.toLowerCase()}`}>
                                        {aspect.aspect}
                                    </td>
                                    <td>
                                        <span className="planet-cell">
                                            <span className="planet-symbol">{aspect.passiveSymbol}</span>
                                            {aspect.passive}
                                        </span>
                                    </td>
                                    <td className="orb-cell">{aspect.orb}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default ChartTables

