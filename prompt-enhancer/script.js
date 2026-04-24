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
  historyList.textContent = '';
  if (!history.length) {
    const p = document.createElement('p');
    p.className = 'muted';
    p.textContent = 'No history yet.';
    historyList.appendChild(p);
    return;
  }
  history.forEach((entry, idx) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = `padding:10px 0;border-bottom:${idx === history.length - 1 ? 'none' : '1px solid var(--border)'};`;

    const meta = document.createElement('div');
    meta.style.cssText = 'font-size:12px;color:var(--muted);margin-bottom:6px;';
    meta.textContent = `${entry.target} · ${new Date(entry.time).toLocaleString()}`;

    const inputRow = document.createElement('div');
    inputRow.style.marginBottom = '8px';
    const inputLabel = document.createElement('strong');
    inputLabel.textContent = 'Input: ';
    inputRow.append(inputLabel, document.createTextNode(entry.prompt || ''));

    const outputRow = document.createElement('div');
    outputRow.style.marginBottom = '8px';
    const outputLabel = document.createElement('strong');
    outputLabel.textContent = 'Output: ';
    outputRow.append(outputLabel, document.createTextNode(entry.enhanced || ''));

    const btn = document.createElement('button');
    btn.className = 'secondary';
    btn.type = 'button';
    btn.dataset.historyIndex = idx;
    btn.textContent = 'Use this';

    wrap.append(meta, inputRow, outputRow, btn);
    historyList.appendChild(wrap);
  });
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
