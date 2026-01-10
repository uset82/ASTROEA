// Netlify Function for AI Chart Interpretation using OpenRouter
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

        // Use OpenRouter API
        const apiKey = process.env.OPENROUTER_API_KEY || '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';

        const chartSummary = buildChartSummary(chart_data);
        const langInstruction = language === 'es' ? 'Respond in Spanish.' : language === 'no' ? 'Respond in Norwegian.' : 'Respond in English.';

        let prompt = user_message && conversation_history?.length > 0
            ? `You are an expert astrologer. Chart:\n${chartSummary}\n\nHistory:\n${conversation_history.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nUser: ${user_message}\n\n${langInstruction}`
            : `You are an expert astrologer. Provide a detailed natal chart interpretation.\n\nChart:\n${chartSummary}\n\n${focus ? `Focus on: ${focus}.` : ''}\n\nCover: Sun sign, Moon sign, Ascendant, key aspects, house placements.\n\n${langInstruction}`;

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'HTTP-Referer': 'https://lively-sunburst-274cb9.netlify.app/',
                'X-Title': 'ASTRAEA Astrology App'
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-exp:free',
                messages: [{ role: 'user', content: prompt }],
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('OpenRouter error:', errorData);
            throw new Error(errorData.error?.message || 'OpenRouter API request failed');
        }

        const result = await response.json();
        const text = result.choices?.[0]?.message?.content || 'No interpretation generated';

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

    return summary;
}
