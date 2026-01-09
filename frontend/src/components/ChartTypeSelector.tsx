import { useLanguage } from '../i18n'
import './ChartTypeSelector.css'

interface ChartTypeSelectorProps {
    activeType: string
    onTypeChange: (type: string) => void
}

function ChartTypeSelector({ activeType, onTypeChange }: ChartTypeSelectorProps) {
    const { t } = useLanguage()

    const chartTypes = [
        { id: 'natal', name: t('chartTypes.natal'), icon: '✦' },
        { id: 'transit', name: t('chartTypes.transit'), icon: '☿' },
        { id: 'synastry', name: t('chartTypes.synastry'), icon: '♥' },
        { id: 'composite', name: t('chartTypes.composite'), icon: '♃' },
        { id: 'solar-return', name: t('chartTypes.solarReturn'), icon: '☉' },
    ]

    return (
        <div className="chart-type-selector">
            {chartTypes.map((type) => (
                <button
                    key={type.id}
                    className={`type-btn ${activeType === type.id ? 'active' : ''}`}
                    onClick={() => onTypeChange(type.id)}
                >
                    <span className="type-icon">{type.icon}</span>
                    <span className="type-name">{type.name}</span>
                </button>
            ))}
        </div>
    )
}

export default ChartTypeSelector
