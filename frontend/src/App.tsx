import { useState } from 'react'
import { LanguageProvider, useLanguage } from './i18n'
import BirthDataForm from './components/BirthDataForm'
import AstroChartLayout from './components/AstroChartLayout'
import Interpretation from './components/Interpretation'
import ChartTypeSelector from './components/ChartTypeSelector'
import LanguageSwitcher from './components/LanguageSwitcher'
import './App.css'

// Types for chart data
export interface ChartData {
    chart_type: string;
    objects: Record<string, any>;
    houses: Record<string, any>;
    aspects: Record<string, any>;
    input: {
        date_time: string;
        latitude: number;
        longitude: number;
        house_system: string;
    };
    [key: string]: any;
}

export interface BirthData {
    name: string;
    date: string;
    time: string;
    latitude: number;
    longitude: number;
    locationName: string;
    houseSystem: string;
}

function AppContent() {
    const { t, language } = useLanguage()
    const [chartType, setChartType] = useState('natal')
    const [chartData, setChartData] = useState<ChartData | null>(null)

    // Form step for multi-person charts
    const [step, setStep] = useState(1)

    // We keep track of primary and secondary birth data
    const [primaryData, setPrimaryData] = useState<BirthData | null>(null)
    const [secondaryData, setSecondaryData] = useState<BirthData | null>(null)

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'chart' | 'tables' | 'interpretation'>('chart')

    const getFormTitle = () => {
        if (['synastry', 'composite'].includes(chartType)) {
            return step === 1 ? t('form.titlePerson1') : t('form.titlePerson2')
        }
        if (chartType === 'transit') {
            return t('form.titleTransit')
        }
        return t('form.title')
    }

    const getChartTypeName = () => {
        const typeKey = chartType === 'solar-return' ? 'solarReturn' : chartType
        return t(`chartTypes.${typeKey}`)
    }

    const handleCalculate = async (data: BirthData) => {
        if (['synastry', 'composite'].includes(chartType)) {
            if (step === 1) {
                setPrimaryData(data)
                setStep(2)
                return
            } else {
                setSecondaryData(data)
                await calculateDualChart(primaryData!, data)
                return
            }
        }

        setPrimaryData(data)

        if (chartType === 'natal') {
            await fetchChart('natal', {
                date_time: `${data.date} ${data.time}`,
                latitude: data.latitude,
                longitude: data.longitude,
                house_system: data.houseSystem
            })
        } else if (chartType === 'transit') {
            const now = new Date()
            const transitTime = now.toISOString().slice(0, 16).replace('T', ' ')

            await fetchChart('transit', {
                natal_date_time: `${data.date} ${data.time}`,
                natal_latitude: data.latitude,
                natal_longitude: data.longitude,
                transit_date_time: transitTime,
                house_system: data.houseSystem
            })
        } else if (chartType === 'solar-return') {
            const currentYear = new Date().getFullYear()

            await fetchChart('solar-return', {
                natal_date_time: `${data.date} ${data.time}`,
                latitude: data.latitude,
                longitude: data.longitude,
                year: currentYear,
                house_system: data.houseSystem
            })
        }
    }

    const calculateDualChart = async (p1: BirthData, p2: BirthData) => {
        const payload = {
            person1_date_time: `${p1.date} ${p1.time}`,
            person1_latitude: p1.latitude,
            person1_longitude: p1.longitude,
            person2_date_time: `${p2.date} ${p2.time}`,
            person2_latitude: p2.latitude,
            person2_longitude: p2.longitude,
            house_system: p1.houseSystem
        }

        await fetchChart(chartType, payload)
    }

    const fetchChart = async (endpoint: string, payload: any) => {
        setIsLoading(true)
        setError(null)
        setChartData(null)

        try {
            const response = await fetch(`/api/charts/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                const errData = await response.json()
                throw new Error(errData.detail || `${t('errors.failedChart')}: ${response.statusText}`)
            }

            const result = await response.json()

            if (result.success) {
                setChartData(result.chart)
            } else {
                throw new Error(result.detail || t('errors.generic'))
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : t('errors.failedChart'))
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    const handleNewChart = () => {
        setChartData(null)
        setPrimaryData(null)
        setSecondaryData(null)
        setStep(1)
        setError(null)
    }

    const handleTypeChange = (type: string) => {
        setChartType(type)
        setStep(1)
        setError(null)
        setPrimaryData(null)
        setSecondaryData(null)
    }

    return (
        <div className="app">
            {/* Header */}
            <header className="header">
                <div className="container">
                    <div className="header-content">
                        <a href="/" className="logo">
                            <img src="/logo.png" alt="ASTRAEA" className="logo-img" />
                        </a>
                        <nav className="nav">
                            <a href="#" className="nav-link active">{t('header.nav')}</a>
                            <LanguageSwitcher />
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="main">
                <div className="container">

                    {!chartData && (
                        <section className="hero">
                            <div className="hero-content">
                                <h2 className="hero-title">{t('hero.title')}</h2>
                                <p className="hero-description">
                                    {t('hero.description')}
                                </p>
                            </div>

                            <ChartTypeSelector
                                activeType={chartType}
                                onTypeChange={handleTypeChange}
                            />

                            <div className="form-card card">
                                <div className="form-header">
                                    <h3>{getFormTitle()}</h3>
                                    {step === 2 && (
                                        <button
                                            className="back-btn"
                                            onClick={() => setStep(1)}
                                        >
                                            {t('form.backToPerson1')}
                                        </button>
                                    )}
                                </div>

                                <BirthDataForm
                                    key={`${chartType}-${step}-${language}`}
                                    onSubmit={handleCalculate}
                                    isLoading={isLoading}
                                />
                            </div>
                        </section>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="error-message">
                            <span className="error-icon">⚠</span>
                            {error}
                            <button onClick={() => setError(null)} className="error-close">×</button>
                        </div>
                    )}

                    {/* Loading State */}
                    {isLoading && (
                        <div className="loading-overlay">
                            <div className="loading-content">
                                <div className="spinner"></div>
                                <p>{t('chart.calculating')}</p>
                            </div>
                        </div>
                    )}

                    {/* Chart Display */}
                    {chartData && primaryData && (
                        <section className="chart-section">
                            {/* Chart Info Bar */}
                            <div className="chart-info-bar">
                                <div className="chart-info">
                                    <h2>{getChartTypeName()} Chart</h2>
                                    <p className="chart-meta">
                                        {['synastry', 'composite'].includes(chartType) ? (
                                            <>
                                                {primaryData.locationName} & {secondaryData?.locationName}
                                            </>
                                        ) : (
                                            <>
                                                {primaryData.locationName} • {primaryData.date}
                                            </>
                                        )}
                                    </p>
                                </div>
                                <button
                                    className="btn btn-secondary"
                                    onClick={handleNewChart}
                                >
                                    {t('chart.newChart')}
                                </button>
                            </div>

                            {/* Tabs */}
                            <div className="tabs">
                                <button
                                    className={`tab ${activeTab === 'chart' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('chart')}
                                >
                                    {t('tabs.fullReport')}
                                </button>
                                <button
                                    className={`tab ${activeTab === 'interpretation' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('interpretation')}
                                >
                                    {t('tabs.aiInterpretation')}
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="tab-content">
                                {activeTab === 'chart' && (
                                    <AstroChartLayout
                                        chartData={chartData}
                                        birthData={primaryData}
                                        secondaryBirthData={secondaryData || undefined}
                                        chartType={chartType}
                                    />
                                )}

                                {activeTab === 'interpretation' && (
                                    <div className="interpretation-container card">
                                        <Interpretation chartData={chartData} />
                                    </div>
                                )}
                            </div>
                        </section>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="footer">
                <div className="container">
                    <p>{t('footer.copyright')}</p>
                </div>
            </footer>
        </div>
    )
}

function App() {
    return (
        <LanguageProvider>
            <AppContent />
        </LanguageProvider>
    )
}

export default App
