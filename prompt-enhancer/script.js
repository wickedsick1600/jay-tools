const promptInput = document.getElementById('prompt');
const targetSelect = document.getElementById('target');
const enhanceBtn = document.getElementById('enhance-btn');
const newChatBtn = document.getElementById('new-chat-btn');
const msg = document.getElementById('msg');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const chatThread = document.getElementById('chat-thread');
const targetChips = Array.from(document.querySelectorAll('[data-target-chip]'));
const saveHistoryToggle = document.getElementById('save-history-toggle');
const turnstileWrap = document.getElementById('turnstile-wrap');
const turnstileContainer = document.getElementById('turnstile-container');

const HISTORY_KEY = 'promptEnhancerHistoryV1';
const HISTORY_ENABLED_KEY = 'promptEnhancerHistoryEnabledV1';
const HISTORY_MAX = 5;

let conversation = [];
let pendingPrompt = '';
let turnstileToken = '';
let turnstileWidgetId = null;

function flash(text, isError) {
  msg.textContent = text;
  msg.className = isError ? 'error' : 'muted';
}

function readHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeHistory(history) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, HISTORY_MAX)));
}

function historyEnabled() {
  return localStorage.getItem(HISTORY_ENABLED_KEY) === 'true';
}

function scrollThreadBottom() {
  chatThread.scrollTop = chatThread.scrollHeight;
}

function createTypingBubble() {
  const wrap = document.createElement('div');
  wrap.className = 'message message-assistant';
  wrap.id = 'typing-message';

  const meta = document.createElement('div');
  meta.className = 'message-meta';
  meta.textContent = 'Enhancer is typing...';

  const bubble = document.createElement('div');
  bubble.className = 'bubble typing-bubble';
  for (let i = 0; i < 3; i += 1) {
    const dot = document.createElement('span');
    dot.className = 'typing-dot';
    bubble.appendChild(dot);
  }

  wrap.append(meta, bubble);
  return wrap;
}

function removeTypingBubble() {
  const typing = document.getElementById('typing-message');
  if (typing) typing.remove();
}

function targetLabel(targetValue) {
  const option = targetSelect.querySelector(`option[value="${targetValue}"]`);
  return option ? option.textContent : targetValue;
}

function addMessage(role, text, opts = {}) {
  const wrap = document.createElement('div');
  wrap.className = `message message-${role}`;

  const meta = document.createElement('div');
  meta.className = 'message-meta';
  if (role === 'user') {
    meta.textContent = `You • ${targetLabel(opts.target || targetSelect.value)}`;
  } else if (role === 'assistant') {
    meta.textContent = 'Prompt Enhancer';
  } else {
    meta.textContent = 'System';
  }

  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;
  wrap.append(meta, bubble);

  if (role === 'assistant' && opts.withActions) {
    const actions = document.createElement('div');
    actions.className = 'message-actions';

    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'secondary';
    copy.textContent = 'Copy';
    copy.dataset.action = 'copy';
    copy.dataset.payload = text;

    const refine = document.createElement('button');
    refine.type = 'button';
    refine.className = 'secondary';
    refine.textContent = 'Refine';
    refine.dataset.action = 'refine';
    refine.dataset.payload = text;

    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'secondary';
    retry.textContent = 'Retry';
    retry.dataset.action = 'retry';

    const voteUp = document.createElement('button');
    voteUp.type = 'button';
    voteUp.className = 'secondary';
    voteUp.textContent = 'Helpful';
    voteUp.dataset.action = 'vote-up';

    const voteDown = document.createElement('button');
    voteDown.type = 'button';
    voteDown.className = 'secondary';
    voteDown.textContent = 'Needs work';
    voteDown.dataset.action = 'vote-down';

    actions.append(copy, refine, retry, voteUp, voteDown);
    wrap.appendChild(actions);
  }

  chatThread.appendChild(wrap);
  scrollThreadBottom();
}

function renderHistory() {
  const history = readHistory();
  historyList.textContent = '';
  if (!history.length) {
    const p = document.createElement('p');
    p.className = 'muted';
    p.textContent = 'No history yet.';
    historyList.appendChild(p);
    return;
  }

  history.forEach((entry, idx) => {
    const item = document.createElement('div');
    item.className = 'history-item';

    const meta = document.createElement('div');
    meta.className = 'history-item-meta';
    meta.textContent = `${targetLabel(entry.target)} • ${new Date(entry.time).toLocaleString()}`;

    const preview = document.createElement('p');
    preview.textContent = entry.prompt || '';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'secondary';
    button.dataset.historyIndex = String(idx);
    button.textContent = 'Load';

    item.append(meta, preview, button);
    historyList.appendChild(item);
  });
}

function saveHistoryItem(prompt, target, enhanced) {
  if (!historyEnabled()) return;
  const history = readHistory();
  history.unshift({ prompt, target, enhanced, time: Date.now() });
  writeHistory(history);
  renderHistory();
}

function syncTargetChips() {
  targetChips.forEach((chip) => {
    chip.classList.toggle('is-active', chip.dataset.targetChip === targetSelect.value);
  });
}

function startNewChat() {
  conversation = [];
  chatThread.textContent = '';
  addMessage('assistant', 'Hi. Share a rough idea and I will return a polished prompt tailored to your selected target.');
  flash('New chat started.');
}

function onHistoryToggleChange() {
  const enabled = saveHistoryToggle.checked;
  localStorage.setItem(HISTORY_ENABLED_KEY, enabled ? 'true' : 'false');
  if (!enabled) {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  }
  flash(enabled ? 'Local history enabled.' : 'Local history disabled and cleared.');
}

function loadHistoryPreference() {
  if (!saveHistoryToggle) return;
  const stored = localStorage.getItem(HISTORY_ENABLED_KEY);
  if (stored === null) {
    localStorage.setItem(HISTORY_ENABLED_KEY, 'false');
  }
  saveHistoryToggle.checked = historyEnabled();
}

function getTurnstileSiteKey() {
  const meta = document.querySelector('meta[name="turnstile-site-key"]');
  return (meta?.content || '').trim();
}

function loadTurnstileScript() {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-turnstile-script="1"]');
    if (existing) {
      if (window.turnstile) resolve();
      else existing.addEventListener('load', resolve, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.turnstileScript = '1';
    script.addEventListener('load', resolve, { once: true });
    script.addEventListener('error', reject, { once: true });
    document.head.appendChild(script);
  });
}

async function initTurnstile() {
  if (!turnstileWrap || !turnstileContainer) return;
  const siteKey = getTurnstileSiteKey();
  if (!siteKey) return;

  turnstileWrap.style.display = 'block';
  try {
    await loadTurnstileScript();
    if (!window.turnstile) {
      flash('Human verification unavailable right now.', true);
      return;
    }
    turnstileWidgetId = window.turnstile.render(turnstileContainer, {
      sitekey: siteKey,
      callback: (token) => { turnstileToken = token; },
      'expired-callback': () => { turnstileToken = ''; },
      'error-callback': () => { turnstileToken = ''; },
    });
  } catch {
    flash('Failed to load human verification.', true);
  }
}

async function enhancePrompt() {
  const prompt = promptInput.value.trim();
  if (!prompt) {
    flash('Type a prompt first.', true);
    return;
  }
  if (prompt.length > 2000) {
    flash('Keep the input under 2000 characters.', true);
    return;
  }

  pendingPrompt = prompt;
  conversation.push({ role: 'user', text: prompt, target: targetSelect.value });
  addMessage('user', prompt, { target: targetSelect.value });
  promptInput.value = '';

  enhanceBtn.disabled = true;
  flash('Enhancing...');
  chatThread.appendChild(createTypingBubble());
  scrollThreadBottom();

  try {
    const res = await fetch('/.netlify/functions/enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        target: targetSelect.value,
        turnstileToken: turnstileToken || undefined,
      }),
    });

    const raw = await res.text();
    let data = {};
    if (raw.trim()) {
      try {
        data = JSON.parse(raw);
      } catch {
        removeTypingBubble();
        addMessage('system', 'Server returned an unreadable response. Try again.');
        flash('Server returned an unreadable response.', true);
        return;
      }
    } else if (!res.ok) {
      removeTypingBubble();
      addMessage('system', `No JSON from enhance API (HTTP ${res.status}). Run with netlify dev or deploy functions.`);
      flash('No JSON from enhance API.', true);
      return;
    }

    if (!res.ok) {
      removeTypingBubble();
      addMessage('system', data.error || 'Something went wrong. Try again in a moment.');
      flash(data.error || 'Enhancement failed.', true);
      return;
    }

    removeTypingBubble();
    const enhanced = data.enhanced || '';
    conversation.push({ role: 'assistant', text: enhanced });
    addMessage('assistant', enhanced, { withActions: true });
    saveHistoryItem(prompt, targetSelect.value, enhanced);
    flash('Done.');
  } catch (err) {
    removeTypingBubble();
    addMessage('system', `Network error: ${err.message}`);
    flash(`Network error: ${err.message}`, true);
  } finally {
    enhanceBtn.disabled = false;
    if (window.turnstile && turnstileWidgetId !== null) {
      window.turnstile.reset(turnstileWidgetId);
      turnstileToken = '';
    }
  }
}

enhanceBtn.addEventListener('click', enhancePrompt);
newChatBtn.addEventListener('click', startNewChat);

promptInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    enhancePrompt();
  }
});

targetSelect.addEventListener('change', syncTargetChips);
if (saveHistoryToggle) saveHistoryToggle.addEventListener('change', onHistoryToggleChange);

targetChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    targetSelect.value = chip.dataset.targetChip;
    syncTargetChips();
    flash(`Target set to ${targetLabel(targetSelect.value)}.`);
  });
});

chatThread.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const action = button.dataset.action;
  if (action === 'copy') {
    const payload = button.dataset.payload || '';
    try {
      await navigator.clipboard.writeText(payload);
      flash('Copied to clipboard.');
    } catch {
      flash('Copy failed. Try selecting text manually.', true);
    }
    return;
  }

  if (action === 'refine') {
    const payload = button.dataset.payload || '';
    promptInput.value = `Improve this further for ${targetLabel(targetSelect.value)}:\n\n${payload}`;
    promptInput.focus();
    flash('Loaded response into composer for refinement.');
    return;
  }

  if (action === 'retry') {
    promptInput.value = pendingPrompt;
    promptInput.focus();
    flash('Last prompt restored. Press Enhance to retry.');
    return;
  }

  if (action === 'vote-up') {
    flash('Thanks. Feedback noted.');
    return;
  }

  if (action === 'vote-down') {
    flash('Thanks. Try Refine or switch target for a better result.');
  }
});

historyList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-history-index]');
  if (!button) return;
  const idx = Number(button.dataset.historyIndex);
  const item = readHistory()[idx];
  if (!item) return;

  if (!conversation.length) chatThread.textContent = '';
  addMessage('user', item.prompt, { target: item.target });
  addMessage('assistant', item.enhanced, { withActions: true });
  targetSelect.value = item.target;
  syncTargetChips();
  flash('Loaded from history.');
});

clearHistoryBtn.addEventListener('click', () => {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
  flash('History cleared.');
});

renderHistory();
syncTargetChips();
loadHistoryPreference();
initTurnstile();
startNewChat();
