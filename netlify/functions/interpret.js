// Netlify Function for AI Chart Interpretation using Gemini
const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.handler = async (event, context) => {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
            },
            body: '',
        };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { chart_data, focus, language, user_message, conversation_history } = JSON.parse(event.body);

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return {
                statusCode: 500,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
            };
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // Build the prompt
        const chartSummary = buildChartSummary(chart_data);
        const langInstruction = getLanguageInstruction(language);
        const focusInstruction = focus ? `Focus especially on: ${focus}.` : '';

        let prompt;
        if (conversation_history && conversation_history.length > 0) {
            // Continue conversation
            const history = conversation_history.map(m => `${m.role}: ${m.content}`).join('\n');
            prompt = `You are an expert astrologer. Here is the chart data:\n${chartSummary}\n\nConversation so far:\n${history}\n\nUser: ${user_message}\n\n${langInstruction}`;
        } else {
            // Initial interpretation
            prompt = `You are an expert astrologer providing a detailed natal chart interpretation.

Here is the chart data:
${chartSummary}

${focusInstruction}

Please provide a comprehensive, insightful interpretation covering:
1. The Sun sign and its influence on core identity
2. The Moon sign and emotional nature
3. The Ascendant and how they present to the world
4. Key planetary aspects and their significance
5. House placements and life areas affected

${langInstruction}

Be warm, encouraging, and insightful. Use astrological terminology but explain concepts clearly.`;
        }

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Access-Control-Allow-Origin': '*',
            },
            body: `data: ${text}\n\ndata: [DONE]\n\n`,
        };
    } catch (error) {
        console.error('Interpretation error:', error);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message }),
        };
    }
};

function buildChartSummary(chartData) {
    if (!chartData || !chartData.objects) {
        return 'No chart data available';
    }

    const objects = chartData.objects;
    const houses = chartData.houses || {};

    let summary = '## Planetary Positions:\n';

    for (const [name, data] of Object.entries(objects)) {
        if (data && typeof data === 'object') {
            const sign = data.sign || 'Unknown';
            const deg = data.longitude ? `${Math.floor(data.longitude % 30)}°` : '';
            const house = data.house || '';
            summary += `- ${name}: ${sign} ${deg}${house ? ` (House ${house})` : ''}\n`;
        }
    }

    summary += '\n## House Cusps:\n';
    for (const [house, data] of Object.entries(houses)) {
        if (data && typeof data === 'object') {
            summary += `- House ${house}: ${data.sign || 'Unknown'} ${data.longitude ? Math.floor(data.longitude % 30) : ''}°\n`;
        }
    }

    if (chartData.aspects) {
        summary += '\n## Major Aspects:\n';
        for (const [aspect, data] of Object.entries(chartData.aspects)) {
            if (data && typeof data === 'object') {
                summary += `- ${aspect}: ${data.aspect_type || 'aspect'} (orb: ${data.orb ? data.orb.toFixed(1) : '?'}°)\n`;
            }
        }
    }

    return summary;
}

function getLanguageInstruction(language) {
    const instructions = {
        'es': 'Respond entirely in Spanish.',
        'no': 'Respond entirely in Norwegian.',
        'en': 'Respond in English.',
    };
    return instructions[language] || 'Respond in English.';
}
