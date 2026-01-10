// Netlify Function for AI Chart Interpretation using OpenRouter
const https = require('https');

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

        // Use OpenRouter API - read from env variable
        const apiKey = process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
            return {
                statusCode: 500,
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: 'OPENROUTER_API_KEY not configured in Netlify environment variables' }),
            };
        }

        const chartSummary = buildChartSummary(chart_data);
        const langInstruction = language === 'es' ? 'Respond in Spanish.' : language === 'no' ? 'Respond in Norwegian.' : 'Respond in English.';

        let prompt = user_message && conversation_history?.length > 0
            ? `You are an expert astrologer. Chart:\n${chartSummary}\n\nHistory:\n${conversation_history.map(m => `${m.role}: ${m.content}`).join('\n')}\n\nUser: ${user_message}\n\n${langInstruction}`
            : `You are an expert astrologer. Provide a detailed natal chart interpretation.\n\nChart:\n${chartSummary}\n\n${focus ? `Focus on: ${focus}.` : ''}\n\nCover: Sun sign, Moon sign, Ascendant, key aspects, house placements.\n\n${langInstruction}`;

        // Make request to OpenRouter API - try multiple free models
        const models = [
            'google/gemini-2.0-flash-exp:free',
            'meta-llama/llama-3.2-3b-instruct:free',
            'mistralai/mistral-7b-instruct:free'
        ];

        let lastError = null;

        for (const model of models) {
            try {
                const requestBody = JSON.stringify({
                    model: model,
                    messages: [{ role: 'user', content: prompt }],
                });

                const result = await makeHttpsRequest({
                    hostname: 'openrouter.ai',
                    path: '/api/v1/chat/completions',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`,
                        'HTTP-Referer': 'https://lively-sunburst-274cb9.netlify.app/',
                        'X-Title': 'ASTRAEA Astrology App',
                        'Content-Length': Buffer.byteLength(requestBody)
                    }
                }, requestBody);

                const parsed = JSON.parse(result);

                if (parsed.error) {
                    console.log(`Model ${model} failed:`, parsed.error.message);
                    lastError = parsed.error.message;
                    continue; // Try next model
                }

                const text = parsed.choices?.[0]?.message?.content;
                if (text) {
                    return {
                        statusCode: 200,
                        headers: { ...headers, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
                        body: `data: ${text}\n\ndata: [DONE]\n\n`,
                    };
                }
            } catch (e) {
                console.log(`Model ${model} error:`, e.message);
                lastError = e.message;
            }
        }

        throw new Error(lastError || 'All models failed');

    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: error.message }),
        };
    }
};

// Helper function to make HTTPS request using built-in module
function makeHttpsRequest(options, body) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => { resolve(data); });
        });

        req.on('error', (err) => { reject(err); });
        req.write(body);
        req.end();
    });
}

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
