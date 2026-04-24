const promptInput = document.getElementById('prompt');
const targetSelect = document.getElementById('target');
const enhanceBtn = document.getElementById('enhance-btn');
const outputWrap = document.getElementById('output-wrap');
const output = document.getElementById('output');
const copyBtn = document.getElementById('copy-btn');
const msg = document.getElementById('msg');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const HISTORY_KEY = 'promptEnhancerHistoryV1';
const HISTORY_MAX = 5;

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

function renderHistory() {
  const history = readHistory();
  if (!history.length) {
    historyList.innerHTML = '<p class="muted">No history yet.</p>';
    return;
  }
  historyList.innerHTML = history.map((entry, idx) => `
    <div style="padding:10px 0;border-bottom:${idx === history.length - 1 ? 'none' : '1px solid var(--border)'};">
      <div style="font-size:12px;color:var(--muted);margin-bottom:6px;">${entry.target} · ${new Date(entry.time).toLocaleString()}</div>
      <div style="margin-bottom:8px;"><strong>Input:</strong> ${entry.prompt}</div>
      <div style="margin-bottom:8px;"><strong>Output:</strong> ${entry.enhanced}</div>
      <button class="secondary" type="button" data-history-index="${idx}">Use this</button>
    </div>
  `).join('');
}

function saveHistoryItem(prompt, target, enhanced) {
  const history = readHistory();
  history.unshift({
    prompt,
    target,
    enhanced,
    time: Date.now(),
  });
  writeHistory(history);
  renderHistory();
}

enhanceBtn.addEventListener('click', async () => {
  const prompt = promptInput.value.trim();
  if (!prompt) { flash('Type a prompt first.', true); return; }
  if (prompt.length > 2000) { flash('Keep the input under 2000 characters.', true); return; }

  enhanceBtn.disabled = true;
  flash('Enhancing…');

  try {
    const res = await fetch('/.netlify/functions/enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, target: targetSelect.value }),
    });

    const data = await res.json();

    if (!res.ok) {
      flash(data.error || 'Something went wrong. Try again in a moment.', true);
      return;
    }

    output.value = data.enhanced || '';
    outputWrap.style.display = 'block';
    saveHistoryItem(prompt, targetSelect.value, output.value);
    flash('Done.');
  } catch (err) {
    flash('Network error: ' + err.message, true);
  } finally {
    enhanceBtn.disabled = false;
  }
});

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(output.value);
    flash('Copied to clipboard.');
  } catch {
    output.select();
    document.execCommand('copy');
    flash('Copied.');
  }
});

historyList.addEventListener('click', (event) => {
  const btn = event.target.closest('button[data-history-index]');
  if (!btn) return;
  const idx = Number(btn.dataset.historyIndex);
  const item = readHistory()[idx];
  if (!item) return;
  promptInput.value = item.prompt;
  targetSelect.value = item.target;
  output.value = item.enhanced;
  outputWrap.style.display = 'block';
  flash('Loaded from history.');
});

clearHistoryBtn.addEventListener('click', () => {
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
  flash('History cleared.');
});

renderHistory();
