import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// Import translations
import en from './locales/en.json'
import es from './locales/es.json'
import no from './locales/no.json'

export type Language = 'en' | 'es' | 'no'

const translations: Record<Language, typeof en> = { en, es, no }

export const LANGUAGE_NAMES: Record<Language, string> = {
    en: 'English',
    es: 'Español',
    no: 'Norsk'
}

export const LANGUAGE_FLAGS: Record<Language, string> = {
    en: '🇬🇧',
    es: '🇪🇸',
    no: '🇳🇴'
}

interface LanguageContextType {
    language: Language
    setLanguage: (lang: Language) => void
    t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | null>(null)

// Helper to get nested translation by dot notation key
const getNestedValue = (obj: any, path: string): string => {
    const keys = path.split('.')
    let result = obj
    for (const key of keys) {
        if (result && typeof result === 'object' && key in result) {
            result = result[key]
        } else {
            return path // Return the key if translation not found
        }
    }
    return typeof result === 'string' ? result : path
}

interface LanguageProviderProps {
    children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
    // Initialize from localStorage or default to 'en'
    const [language, setLanguageState] = useState<Language>(() => {
        const saved = localStorage.getItem('astraea-language')
        if (saved && (saved === 'en' || saved === 'es' || saved === 'no')) {
            return saved as Language
        }
        return 'en'
    })

    // Persist language choice
    useEffect(() => {
        localStorage.setItem('astraea-language', language)
    }, [language])

    const setLanguage = (lang: Language) => {
        setLanguageState(lang)
    }

    // Translation function
    const t = (key: string): string => {
        return getNestedValue(translations[language], key)
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    )
}

export function useLanguage() {
    const context = useContext(LanguageContext)
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider')
    }
    return context
}

export default LanguageContext
