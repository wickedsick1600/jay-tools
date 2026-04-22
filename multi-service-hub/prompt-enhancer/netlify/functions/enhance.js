// Serverless proxy to Google Gemini.
// The only place in this repo that touches GEMINI_API_KEY.
// Protects the shared 1,500 req/day free quota with a per-IP rate limit.

const SYSTEM_PROMPTS = {
  chatgpt: `You are a prompt engineer. Rewrite the user's rough idea into a detailed, structured prompt for ChatGPT / GPT-4.
Include: clear role, specific task, relevant context, desired output format, and constraints.
Keep it concise but thorough. Output ONLY the enhanced prompt, no preamble or explanation.`,
  claude: `You are a prompt engineer. Rewrite the user's rough idea into a detailed, structured prompt for Claude.
Use clear sections (<context>, <task>, <constraints>, <format>) if helpful. Be specific about role and output format.
Output ONLY the enhanced prompt, no preamble.`,
  midjourney: `You are a Midjourney prompt specialist. Rewrite the user's rough idea into a vivid, detailed Midjourney prompt.
Include: subject, setting, style, lighting, composition, color palette, camera/lens if relevant, and appropriate --ar and --v parameters.
Output ONLY the prompt line, no explanation.`,
  'stable-diffusion': `You are a Stable Diffusion prompt specialist. Rewrite the user's rough idea into a high-quality SD prompt.
Use comma-separated descriptors: subject, style, quality tags, lighting, composition, artists (if appropriate), negative prompt on a separate line prefixed "Negative: ".
Output ONLY the prompt, no explanation.`,
  generic: `You are a prompt engineer. Rewrite the user's rough idea into a detailed, well-structured prompt that works across most AI tools.
Include clear task, context, constraints, and desired output format. Output ONLY the enhanced prompt.`,
};

// Tiny in-memory rate limit. Resets when the serverless instance recycles (fine for abuse deterrence).
const ipHits = new Map();
const RATE_LIMIT = 10;      // requests
const RATE_WINDOW_MS = 60 * 60 * 1000; // per hour

function rateLimit(ip) {
  const now = Date.now();
  const bucket = ipHits.get(ip) || [];
  const fresh = bucket.filter(t => now - t < RATE_WINDOW_MS);
  if (fresh.length >= RATE_LIMIT) return false;
  fresh.push(now);
  ipHits.set(ip, fresh);
  return true;
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'POST only' }) };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server not configured.' }) };
  }

  const ip = event.headers['x-forwarded-for']?.split(',')[0].trim() || event.headers['client-ip'] || 'unknown';
  if (!rateLimit(ip)) {
    return { statusCode: 429, body: JSON.stringify({ error: 'Rate limit reached. Try again in an hour.' }) };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON.' }) }; }

  const { prompt, target } = body;
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Prompt required.' }) };
  }
  if (prompt.length > 2000) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Prompt too long (max 2000 chars).' }) };
  }

  const systemPrompt = SYSTEM_PROMPTS[target] || SYSTEM_PROMPTS.generic;

  const model = 'gemini-2.0-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Gemini error:', res.status, errText);
      return { statusCode: 502, body: JSON.stringify({ error: 'AI service error. Try again shortly.' }) };
    }

    const data = await res.json();
    const enhanced = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!enhanced) {
      return { statusCode: 502, body: JSON.stringify({ error: 'Empty response from AI. Try rephrasing.' }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enhanced }),
    };
  } catch (err) {
    console.error('Proxy failure:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Unexpected failure.' }) };
  }
};
