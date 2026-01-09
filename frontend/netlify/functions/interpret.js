// Netlify Function for AI Chart Interpretation using Gemini
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
                body: JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
            };
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        const chartSummary = buildChartSummary(chart_data);
        const langInstruction = language === 'es' ? 'Respond in Spanish.' : language === 'no' ? 'Respond in Norwegian.' : 'Respond in English.';

        let prompt = user_message && conversation_history?.length > 0
            ? `You are an expert astrologer. Chart:\n${chartSummary}\n\nHistory:\n${conversation_history.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nUser: ${user_message}\n\n${langInstruction}`
            : `You are an expert astrologer. Provide a detailed natal chart interpretation.\n\nChart:\n${chartSummary}\n\n${focus ? `Focus on: ${focus}.` : ''}\n\nCover: Sun sign, Moon sign, Ascendant, key aspects, house placements.\n\n${langInstruction}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();

        return {
            statusCode: 200,
            headers: { ...headers, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
            body: `data: ${text}\n\ndata: [DONE]\n\n`,
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message }),
        };
    }
};

function buildChartSummary(chartData) {
    if (!chartData?.objects) return 'No chart data';
    let summary = '## Planets:\n';
    for (const [name, data] of Object.entries(chartData.objects)) {
        if (data?.sign) summary += `- ${name}: ${data.sign}${data.house ? ` (House ${data.house})` : ''}\n`;
    }
    return summary;
}
