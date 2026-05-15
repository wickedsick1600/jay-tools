const crypto = require('crypto');

const VALID_RATINGS = new Set(['helpful', 'needs-work']);
const VALID_REASONS = new Set(['unclear', 'too-long', 'wrong-target', 'unsafe']);
const memoryCounts = new Map();

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function cleanText(value, max) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function requestId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return crypto.randomBytes(16).toString('hex');
}

async function upstashRequest(path, init) {
  const base = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!base || !token) return null;
  try {
    const res = await fetch(`${base}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init?.headers || {}),
      },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

async function incrementFeedback(key) {
  const encoded = encodeURIComponent(key);
  const result = await upstashRequest(`/incr/${encoded}`, { method: 'POST' });
  if (result) return;
  memoryCounts.set(key, (memoryCounts.get(key) || 0) + 1);
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'POST only' });
  if ((event.body || '').length > 5000) return json(413, { error: 'Feedback too large.' });

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Invalid JSON.' });
  }

  const rating = cleanText(body.rating, 40);
  if (!VALID_RATINGS.has(rating)) return json(400, { error: 'Invalid rating.' });

  const target = cleanText(body.target, 80) || 'unknown';
  const reasons = Array.isArray(body.reasons)
    ? body.reasons.map((reason) => cleanText(reason, 40)).filter((reason) => VALID_REASONS.has(reason)).slice(0, 4)
    : [];
  const includeContent = Boolean(body.includeContent);
  const feedbackId = requestId();
  const day = new Date().toISOString().slice(0, 10);

  await incrementFeedback(`feedback:${day}:${rating}`);
  await incrementFeedback(`feedback:${day}:${rating}:${target}`);
  await Promise.all(reasons.map((reason) => incrementFeedback(`feedback:${day}:reason:${reason}`)));

  if (includeContent) {
    const record = {
      id: feedbackId,
      time: new Date().toISOString(),
      rating,
      reasons,
      target,
      requestId: cleanText(body.requestId, 80),
      prompt: cleanText(body.prompt, 1200),
      enhanced: cleanText(body.enhanced, 1200),
    };
    const key = encodeURIComponent(`feedback:${day}:items`);
    const value = encodeURIComponent(JSON.stringify(record));
    await upstashRequest(`/lpush/${key}/${value}`, { method: 'POST' });
    await upstashRequest(`/ltrim/${key}/0/99`, { method: 'POST' });
  }

  return json(200, { ok: true, feedbackId });
};
