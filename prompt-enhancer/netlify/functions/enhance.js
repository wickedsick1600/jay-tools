// Serverless proxy to an OpenAI-compatible Chat Completions API (OpenAI, Groq, etc.).
// The only place in this repo that touches OPENAI_API_KEY.

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
  gemini: `You are a prompt engineer. Rewrite the user's rough idea into a detailed, structured prompt for Google Gemini.
Include clear task, context, desired output shape, and constraints. Output ONLY the enhanced prompt, no preamble.`,
  'linkedin-post': `You are a LinkedIn content coach. Rewrite the user's rough idea into a clear, professional LinkedIn post prompt: angle, structure, tone, CTA, and length guidance.
Output ONLY the prompt they can give to an AI writer, no preamble.`,
  'email-draft': `You are a business writing assistant. Rewrite the user's rough idea into a detailed prompt for drafting a professional email: recipient context, goal, tone, must-include points, and sign-off.
Output ONLY the prompt, no preamble.`,
  'youtube-script': `You are a video script coach. Rewrite the user's rough idea into a structured prompt for a YouTube script: audience, hook, sections, tone, length, and CTA.
Output ONLY the prompt, no preamble.`,
  generic: `You are a prompt engineer. Rewrite the user's rough idea into a detailed, well-structured prompt that works across most AI tools.
Include clear task, context, constraints, and desired output format. Output ONLY the enhanced prompt.`,
};

const ipHits = new Map();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 15000;
const GLOBAL_DAILY_LIMIT = Number(process.env.GLOBAL_DAILY_LIMIT || '300');

function rateLimit(ip) {
  const now = Date.now();
  const bucket = ipHits.get(ip) || [];
  const fresh = bucket.filter(t => now - t < RATE_WINDOW_MS);
  if (fresh.length >= RATE_LIMIT) return false;
  fresh.push(now);
  ipHits.set(ip, fresh);
  return true;
}

async function upstashRequest(path, init) {
  const base = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!base || !token) return null;
  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) return null;
  return res.json();
}

function readUpstashNumber(payload) {
  if (!payload || typeof payload !== 'object') return null;
  if (typeof payload.result === 'number') return payload.result;
  if (typeof payload.result === 'string') return Number(payload.result);
  if (Array.isArray(payload.result)) {
    const last = payload.result[payload.result.length - 1];
    const num = Number(last);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

async function distributedRateLimit(ip) {
  const minute = Math.floor(Date.now() / RATE_WINDOW_MS);
  const key = `rl:${ip}:${minute}`;
  const encoded = encodeURIComponent(key);
  const value = await upstashRequest(`/incr/${encoded}`, { method: 'POST' });
  const count = readUpstashNumber(value);
  if (!Number.isFinite(count)) return null;
  await upstashRequest(`/expire/${encoded}/${Math.ceil(RATE_WINDOW_MS / 1000)}`, { method: 'POST' });
  return count <= RATE_LIMIT;
}

async function checkDailyCap() {
  const day = new Date().toISOString().slice(0, 10);
  const key = `daily:${day}`;
  const encoded = encodeURIComponent(key);
  const value = await upstashRequest(`/incr/${encoded}`, { method: 'POST' });
  const count = readUpstashNumber(value);
  if (!Number.isFinite(count)) return true;
  await upstashRequest(`/expire/${encoded}/172800`, { method: 'POST' });
  return count <= GLOBAL_DAILY_LIMIT;
}

async function verifyTurnstile(token, ip) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true;
  if (!token || typeof token !== 'string') return false;

  const body = new URLSearchParams();
  body.set('secret', secret);
  body.set('response', token);
  if (ip && ip !== 'unknown') body.set('remoteip', ip);

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) return false;
  const data = await res.json();
  return Boolean(data?.success);
}

function safeClientError(status, providerMessage) {
  if (status === 401 || status === 403) return 'AI provider authentication failed. Check server API key.';
  if (status === 429) return 'AI provider rate limit reached. Try again later.';
  if (status >= 500) return 'AI provider is unavailable right now. Please retry shortly.';
  if (providerMessage && providerMessage.toLowerCase().includes('model')) return 'Configured model is unavailable. Check OPENAI_MODEL.';
  return 'AI service error. Try again shortly.';
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'POST only' }) };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server not configured.' }) };
  }

  const model = process.env.OPENAI_MODEL?.trim();
  if (!model) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Server not configured.' }) };
  }

  const ip = event.headers['x-forwarded-for']?.split(',')[0].trim() || event.headers['client-ip'] || 'unknown';
  const distributedAllowed = await distributedRateLimit(ip);
  const allowed = distributedAllowed === null ? rateLimit(ip) : distributedAllowed;
  if (!allowed) {
    return { statusCode: 429, body: JSON.stringify({ error: 'Rate limit reached. Try again in an hour.' }) };
  }
  if (!(await checkDailyCap())) {
    return { statusCode: 429, body: JSON.stringify({ error: 'Daily quota temporarily exhausted. Please try tomorrow.' }) };
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch { return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON.' }) }; }

  const { prompt, target, turnstileToken } = body;
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Prompt required.' }) };
  }
  if (prompt.length > 2000) {
    return { statusCode: 400, body: JSON.stringify({ error: 'Prompt too long (max 2000 chars).' }) };
  }
  if (!(await verifyTurnstile(turnstileToken, ip))) {
    return { statusCode: 403, body: JSON.stringify({ error: 'Human verification failed. Please retry.' }) };
  }

  const systemPrompt = SYSTEM_PROMPTS[target] || SYSTEM_PROMPTS.generic;

  // REST base for Chat Completions — not a browser URL; default is OpenAI's API host.
  const baseRaw = process.env.OPENAI_API_BASE || 'https://api.openai.com/v1';
  const base = baseRaw.replace(/\/$/, '');
  const url = `${base}/chat/completions`;

  const payload = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
    max_tokens: 1024,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error('LLM error:', res.status, errText);
      let providerMessage = '';
      try {
        const errJson = JSON.parse(errText);
        const msg = errJson?.error?.message;
        if (typeof msg === 'string' && msg.length > 0 && msg.length <= 280) {
          providerMessage = msg;
        }
      } catch { /* use generic */ }
      return { statusCode: 502, body: JSON.stringify({ error: safeClientError(res.status, providerMessage) }) };
    }

    const data = await res.json();
    const enhanced = data?.choices?.[0]?.message?.content?.trim();
    if (!enhanced) {
      return { statusCode: 502, body: JSON.stringify({ error: 'Empty response from AI. Try rephrasing.' }) };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enhanced }),
    };
  } catch (err) {
    if (err?.name === 'AbortError') {
      return { statusCode: 504, body: JSON.stringify({ error: 'Request timed out. Please try again.' }) };
    }
    console.error('Proxy failure:', err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Unexpected failure.' }) };
  } finally {
    clearTimeout(timeout);
  }
};
