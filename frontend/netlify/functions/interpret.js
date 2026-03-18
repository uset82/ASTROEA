// Netlify Function for AI Chart Interpretation using Google Gemini API
const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async (event, context) => {
    // Handle CORS
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method Not Allowed' };
    }

    try {
        const { chart_data, focus, language, user_message, conversation_history } = JSON.parse(event.body);

        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return {
                statusCode: 500,
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'GEMINI_API_KEY not configured in Netlify environment variables' }),
            };
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const chartSummary = buildChartSummary(chart_data);
        const langInstruction = language === 'es'
            ? 'Respond entirely in Spanish.'
            : language === 'no'
                ? 'Respond entirely in Norwegian.'
                : 'Respond entirely in English.';

        const systemInstruction = `You are an expert professional astrologer with deep knowledge of Western tropical astrology (Placidus house system). You provide insightful, detailed, and empathetic natal chart interpretations. Use markdown formatting with headers (##, ###) and bold text for key points. ${langInstruction}`;

        let prompt;
        if (user_message && conversation_history?.length > 0) {
            // Follow-up conversation
            prompt = `Chart data:\n${chartSummary}\n\nConversation history:\n${conversation_history.map(m => `${m.role === 'user' ? 'User' : 'Astrologer'}: ${m.content}`).join('\n')}\n\nUser: ${user_message}`;
        } else {
            // Initial interpretation
            prompt = `Provide a detailed natal chart interpretation.\n\nChart data:\n${chartSummary}\n\n${focus ? `Focus area: ${focus}.` : ''}\n\nCover: Sun sign personality, Moon sign emotions, Ascendant/Rising sign, key planetary aspects, house placements, and any notable patterns. Structure with clear markdown headers for each section.`;
        }

        const result = await model.generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            systemInstruction: { parts: [{ text: systemInstruction }] },
        });

        const text = result.response.text();

        if (!text) {
            throw new Error('Empty response from Gemini API');
        }

        return {
            statusCode: 200,
            headers: { ...headers, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
            body: `data: ${text}\n\ndata: [DONE]\n\n`,
        };

    } catch (error) {
        console.error('Gemini interpretation error:', error);
        return {
            statusCode: 500,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message || 'Failed to generate interpretation' }),
        };
    }
};

function buildChartSummary(chartData) {
    if (!chartData?.objects) return 'No chart data';
    let summary = '## Planetary Positions:\n';
    for (const [name, data] of Object.entries(chartData.objects)) {
        const sign = data?.sign?.name || data?.sign;
        const house = data?.house;
        if (sign) summary += `- ${name}: ${sign}${house ? ` (House ${house})` : ''}\n`;
    }

    // Add aspects if available
    if (chartData.aspects && Object.keys(chartData.aspects).length > 0) {
        summary += '\n## Major Aspects:\n';
        for (const [key, asp] of Object.entries(chartData.aspects)) {
            if (asp.planet1 && asp.planet2 && asp.aspect_type) {
                summary += `- ${asp.planet1} ${asp.aspect_type} ${asp.planet2} (orb: ${asp.orb}°)\n`;
            }
        }
    }

    // Add detected patterns (T-Square, Grand Trine, Grand Cross, Yod)
    if (chartData.patterns && chartData.patterns.length > 0) {
        summary += '\n## Aspect Patterns (IMPORTANT - interpret these specifically):\n';
        for (const pattern of chartData.patterns) {
            summary += `- **${pattern.type}**: ${pattern.description}\n`;
            if (pattern.apex) {
                summary += `  (Apex planet: ${pattern.apex} - key focus of tension/energy)\n`;
            }
        }
    }

    return summary;
}
