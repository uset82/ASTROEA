import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useLanguage } from '../i18n'
import './Interpretation.css'
import { ChartData } from '../App'

interface Message {
    role: 'user' | 'assistant'
    content: string
}

interface InterpretationProps {
    chartData: ChartData
}

// Preprocess markdown to ensure headers render correctly
const preprocessMarkdown = (text: string): string => {
    return text
        .replace(/([^\n])(\n?)(#{1,6}\s)/g, '$1\n\n$3')
        .replace(/([^\n])(\n?)(-\s)/g, '$1\n\n$3')
        .replace(/([^\n])(\n?)(\d+\.\s)/g, '$1\n\n$3')
        .replace(/\n{3,}/g, '\n\n')
}

function Interpretation({ chartData }: InterpretationProps) {
    const { t, language } = useLanguage()
    const [messages, setMessages] = useState<Message[]>([])
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [focus, setFocus] = useState('')
    const [error, setError] = useState<string | null>(null)
    const chatEndRef = useRef<HTMLDivElement>(null)

    // Focus areas with translated names
    const focusAreas = [
        { id: '', name: t('interpretation.fullOverview') },
        { id: 'personality', name: t('interpretation.personality') },
        { id: 'career', name: t('interpretation.career') },
        { id: 'relationships', name: t('interpretation.relationships') },
        { id: 'spirituality', name: t('interpretation.spirituality') },
        { id: 'challenges', name: t('interpretation.challenges') },
    ]

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const handleGetInterpretation = async (userMessage?: string) => {
        setIsLoading(true)
        setError(null)

        if (userMessage) {
            setMessages(prev => [...prev, { role: 'user', content: userMessage }])
        }

        try {
            // Use environment variable for API URL, fallback to relative path for local dev
            const apiBase = import.meta.env.VITE_API_URL || ''
            const response = await fetch(`${apiBase}/api/interpret`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chart_data: chartData,
                    focus: focus || null,
                    language,  // Use global language from context
                    stream: true,
                    user_message: userMessage,
                    conversation_history: messages
                })
            })

            if (!response.ok) {
                throw new Error(`${t('errors.failedInterpretation')}: ${response.statusText}`)
            }

            const reader = response.body?.getReader()
            const decoder = new TextDecoder()

            if (!reader) {
                throw new Error('No response body')
            }

            let fullText = ''
            setMessages(prev => [...prev, { role: 'assistant', content: '' }])

            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                const chunk = decoder.decode(value)
                const lines = chunk.split('\n')

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.slice(6)
                        if (data === '[DONE]') break
                        fullText += data
                        setMessages(prev => {
                            const updated = [...prev]
                            updated[updated.length - 1] = { role: 'assistant', content: fullText }
                            return updated
                        })
                    }
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : t('errors.failedInterpretation'))
            setMessages(prev => prev.filter((_, i) => i !== prev.length - 1 || prev[prev.length - 1].content !== ''))
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmitMessage = (e: React.FormEvent) => {
        e.preventDefault()
        if (!inputValue.trim() || isLoading) return
        const message = inputValue.trim()
        setInputValue('')
        handleGetInterpretation(message)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmitMessage(e as unknown as React.FormEvent)
        }
    }

    const handleStartInterpretation = () => {
        const focusName = focusAreas.find(a => a.id === focus)?.name || t('interpretation.fullOverview')
        const initialPrompt = `Please give me a detailed interpretation of my natal chart, focusing on: ${focusName}`
        handleGetInterpretation(initialPrompt)
    }

    return (
        <div className="interpretation-panel">
            {/* Controls - Only show when no messages yet */}
            {messages.length === 0 && (
                <div className="interpretation-controls">
                    <div className="control-group">
                        <label className="control-label">{t('interpretation.focusArea')}</label>
                        <select
                            className="form-input form-select"
                            value={focus}
                            onChange={(e) => setFocus(e.target.value)}
                            disabled={isLoading}
                        >
                            {focusAreas.map(area => (
                                <option key={area.id} value={area.id}>{area.name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        className="btn btn-primary interpret-btn"
                        onClick={handleStartInterpretation}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <span className="btn-spinner"></span>
                                {t('interpretation.interpreting')}
                            </>
                        ) : (
                            <>
                                <span className="btn-icon">✦</span>
                                {t('interpretation.getInterpretation')}
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Error Display */}
            {error && (
                <div className="interpretation-error">
                    <span className="error-icon">⚠</span>
                    {error}
                </div>
            )}

            {/* Chat Messages */}
            {messages.length > 0 && (
                <div className="chat-container">
                    <div className="chat-messages">
                        {messages.map((msg, i) => (
                            <div key={i} className={`chat-message ${msg.role}`}>
                                <div className="message-avatar">
                                    {msg.role === 'assistant' ? '✧' : '👤'}
                                </div>
                                <div className="message-content">
                                    {msg.role === 'assistant' ? (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {preprocessMarkdown(msg.content || '...')}
                                        </ReactMarkdown>
                                    ) : (
                                        <p>{msg.content}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    <form className="chat-input-form" onSubmit={handleSubmitMessage}>
                        <div className="chat-input-wrapper">
                            <textarea
                                className="chat-input"
                                placeholder={t('interpretation.chatPlaceholder')}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                disabled={isLoading}
                                rows={1}
                            />
                            <button
                                type="submit"
                                className="chat-send-btn"
                                disabled={isLoading || !inputValue.trim()}
                            >
                                {isLoading ? (
                                    <span className="btn-spinner small"></span>
                                ) : (
                                    <span>➤</span>
                                )}
                            </button>
                        </div>
                        <p className="chat-hint">{t('interpretation.chatHint')}</p>
                    </form>
                </div>
            )}

            {/* Loading State */}
            {isLoading && messages.length === 0 && (
                <div className="interpretation-loading">
                    <div className="cosmic-loader">
                        <div className="loader-ring"></div>
                        <div className="loader-ring"></div>
                        <div className="loader-ring"></div>
                        <span className="loader-star">✧</span>
                    </div>
                    <p>{t('interpretation.loading')}</p>
                </div>
            )}

            {/* Empty State */}
            {messages.length === 0 && !isLoading && !error && (
                <div className="interpretation-empty">
                    <div className="empty-icon">✧</div>
                    <h4>{t('interpretation.emptyTitle')}</h4>
                    <p>{t('interpretation.emptyDescription')}</p>
                </div>
            )}
        </div>
    )
}

export default Interpretation
