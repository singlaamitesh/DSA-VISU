import type { Handler } from '@netlify/functions';

const SYSTEM_PROMPT = `You are an expert algorithm visualization generator. When given a description of an algorithm or data structure concept, generate a complete, self-contained HTML file that creates an interactive visualization.

Requirements:
- Single HTML file with all CSS and JS inline
- Dark theme matching: background #0f172a, text #e2e8f0, accents blue-500 (#3b82f6) and green-500 (#22c55e)
- Include play/pause/step animation controls
- Show the algorithm's code with current line highlighted
- Include step-by-step explanation text
- Use smooth CSS animations/transitions
- Must be mobile-responsive
- Include a title and complexity information
- Clean, modern design with rounded corners and subtle shadows

Return ONLY the HTML content, no markdown fences, no explanation.`;

const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { prompt } = JSON.parse(event.body || '{}');
    if (!prompt) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing prompt' }) };
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL || 'google/gemini-2.5-flash';

    if (!apiKey) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'OpenRouter not configured' }) };
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://algorhythm.netlify.app',
        'X-Title': 'Algorhythm Visualizer',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        max_tokens: 16000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenRouter error:', err);
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'AI generation failed' }) };
    }

    const data = await response.json();
    const html = data.choices?.[0]?.message?.content || '';

    return { statusCode: 200, headers, body: JSON.stringify({ html }) };
  } catch (error) {
    console.error('Function error:', error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Internal error' }) };
  }
};

export { handler };
