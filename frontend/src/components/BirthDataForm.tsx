import { useState } from 'react'
import { useLanguage } from '../i18n'
import './BirthDataForm.css'

interface BirthData {
    name: string
    date: string
    time: string
    latitude: number
    longitude: number
    locationName: string
    houseSystem: string
}

interface BirthDataFormProps {
    onSubmit: (data: BirthData) => void
    isLoading: boolean
}

// Common cities with coordinates
const PRESET_LOCATIONS = [
    { name: 'New York, USA', lat: 40.7128, lng: -74.006 },
    { name: 'Los Angeles, USA', lat: 34.0522, lng: -118.2437 },
    { name: 'London, UK', lat: 51.5074, lng: -0.1278 },
    { name: 'Paris, France', lat: 48.8566, lng: 2.3522 },
    { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503 },
    { name: 'Sydney, Australia', lat: -33.8688, lng: 151.2093 },
    { name: 'Buenos Aires, Argentina', lat: -34.6037, lng: -58.3816 },
    { name: 'Mexico City, Mexico', lat: 19.4326, lng: -99.1332 },
    { name: 'Berlin, Germany', lat: 52.52, lng: 13.405 },
    { name: 'Madrid, Spain', lat: 40.4168, lng: -3.7038 },
    { name: 'Oslo, Norway', lat: 59.9139, lng: 10.7522 },
    { name: 'Rome, Italy', lat: 41.9028, lng: 12.4964 },
    { name: 'Lima, Peru', lat: -12.0464, lng: -77.0428 },
    { name: 'Cusco, Peru', lat: -13.5320, lng: -71.9675 },
    { name: 'Arequipa, Peru', lat: -16.4090, lng: -71.5375 },
    { name: 'Trujillo, Peru', lat: -8.1091, lng: -79.0286 },
]

const HOUSE_SYSTEMS = [
    { id: 'placidus', name: 'Placidus' },
    { id: 'koch', name: 'Koch' },
    { id: 'whole_sign', name: 'Whole Sign' },
    { id: 'equal', name: 'Equal' },
    { id: 'regiomontanus', name: 'Regiomontanus' },
    { id: 'campanus', name: 'Campanus' },
    { id: 'porphyry', name: 'Porphyry' },
]

function BirthDataForm({ onSubmit, isLoading }: BirthDataFormProps) {
    const { t } = useLanguage()

    // Default to a test date for easy testing
    const [name, setName] = useState('Carlos Alfredo Carpio Meza')
    const [date, setDate] = useState('1982-05-06')
    const [time, setTime] = useState('17:50')
    const [locationName, setLocationName] = useState('Lima, Peru')
    const [latitude, setLatitude] = useState<number | ''>(-12.0464)
    const [longitude, setLongitude] = useState<number | ''>(-77.0428)
    const [houseSystem, setHouseSystem] = useState('placidus')
    const [showManualCoords, setShowManualCoords] = useState(false)

    const handlePresetLocation = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const location = PRESET_LOCATIONS.find(l => l.name === e.target.value)
        if (location) {
            setLocationName(location.name)
            setLatitude(location.lat)
            setLongitude(location.lng)
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        if (!date || latitude === '' || longitude === '') {
            return
        }

        onSubmit({
            name,
            date,
            time,
            latitude: Number(latitude),
            longitude: Number(longitude),
            locationName: locationName || `${latitude}, ${longitude}`,
            houseSystem
        })
    }

    const isValid = date && time && latitude !== '' && longitude !== '' && name

    return (
        <form onSubmit={handleSubmit} className="birth-form">
            {/* Name */}
            <div className="form-group">
                <label className="form-label">{t('form.name')}</label>
                <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t('form.namePlaceholder')}
                    required
                />
            </div>

            {/* Date & Time Row */}
            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">{t('form.birthDate')}</label>
                    <input
                        type="date"
                        className="form-input"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label className="form-label">{t('form.birthTime')}</label>
                    <input
                        type="time"
                        className="form-input"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        required
                    />
                </div>
            </div>

            {/* Location */}
            <div className="form-group">
                <label className="form-label">{t('form.location')}</label>
                <select
                    className="form-input form-select"
                    onChange={handlePresetLocation}
                    defaultValue=""
                >
                    <option value="" disabled>{t('form.selectLocation')}</option>
                    {PRESET_LOCATIONS.map(loc => (
                        <option key={loc.name} value={loc.name}>{loc.name}</option>
                    ))}
                </select>
            </div>

            {/* Manual Coordinates Toggle */}
            <button
                type="button"
                className="toggle-coords"
                onClick={() => setShowManualCoords(!showManualCoords)}
            >
                {showManualCoords ? '▼' : '▶'} {t('form.manualCoords')}
            </button>

            {showManualCoords && (
                <div className="form-row coords-row">
                    <div className="form-group">
                        <label className="form-label">{t('form.latitude')}</label>
                        <input
                            type="number"
                            step="0.0001"
                            className="form-input"
                            placeholder="e.g., 40.7128"
                            value={latitude}
                            onChange={(e) => setLatitude(e.target.value ? parseFloat(e.target.value) : '')}
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">{t('form.longitude')}</label>
                        <input
                            type="number"
                            step="0.0001"
                            className="form-input"
                            placeholder="e.g., -74.006"
                            value={longitude}
                            onChange={(e) => setLongitude(e.target.value ? parseFloat(e.target.value) : '')}
                        />
                    </div>
                </div>
            )}

            {/* House System */}
            <div className="form-group">
                <label className="form-label">{t('form.houseSystem')}</label>
                <select
                    className="form-input form-select"
                    value={houseSystem}
                    onChange={(e) => setHouseSystem(e.target.value)}
                >
                    {HOUSE_SYSTEMS.map(sys => (
                        <option key={sys.id} value={sys.id}>{sys.name}</option>
                    ))}
                </select>
            </div>

            {/* Submit Button */}
            <button
                type="submit"
                className="btn btn-primary submit-btn"
                disabled={!isValid || isLoading}
            >
                {isLoading ? (
                    <>
                        <span className="btn-spinner"></span>
                        {t('form.generating')}
                    </>
                ) : (
                    <>
                        <span className="btn-icon">✧</span>
                        {t('form.generate')}
                    </>
                )}
            </button>
        </form>
    )
}

export default BirthDataForm
