import { useLanguage, Language, LANGUAGE_NAMES, LANGUAGE_FLAGS } from '../i18n'
import './LanguageSwitcher.css'

function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage()

    const languages: Language[] = ['en', 'es', 'no']

    return (
        <div className="language-switcher">
            {languages.map((lang) => (
                <button
                    key={lang}
                    className={`lang-btn ${language === lang ? 'active' : ''}`}
                    onClick={() => setLanguage(lang)}
                    title={LANGUAGE_NAMES[lang]}
                >
                    <span className="lang-flag">{LANGUAGE_FLAGS[lang]}</span>
                    <span className="lang-code">{lang.toUpperCase()}</span>
                </button>
            ))}
        </div>
    )
}

export default LanguageSwitcher
