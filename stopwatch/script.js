  const totalEl = document.getElementById('total');
  const currentEl = document.getElementById('current');
  const startBtn = document.getElementById('start-btn');
  const resetBtn = document.getElementById('reset-btn');
  const splitBtn = document.getElementById('split-btn');
  const descInput = document.getElementById('desc-input');
  const body = document.getElementById('splits-body');
  const emptyEl = document.getElementById('empty');
  const msg = document.getElementById('msg');

  let running = false;
  let startedAt = 0;
  let accumulated = 0;
  let lastSplitAt = 0;
  let splits = [];
  let rafId = null;

  function fmt(ms) {
    const s = Math.floor(ms / 1000);
    const hh = String(Math.floor(s / 3600)).padStart(2, '0');
    const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }

  function elapsed() {
    return accumulated + (running ? Date.now() - startedAt : 0);
  }

  function tick() {
    const total = elapsed();
    totalEl.textContent = fmt(total);
    currentEl.textContent = `Current split: ${fmt(total - lastSplitAt)}`;
    rafId = requestAnimationFrame(tick);
  }

  function setRunning(on) {
    running = on;
    startBtn.textContent = on ? 'Stop' : (elapsed() > 0 ? 'Resume' : 'Start');
    startBtn.classList.toggle('success', !on);
    splitBtn.disabled = !on;
    if (on && !rafId) {
      tick();
    } else if (!on && rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
      const total = elapsed();
      totalEl.textContent = fmt(total);
      currentEl.textContent = `Current split: ${fmt(total - lastSplitAt)}`;
    }
  }

  startBtn.addEventListener('click', () => {
    if (running) {
      accumulated = elapsed();
      setRunning(false);
    } else {
      startedAt = Date.now();
      setRunning(true);
    }
  });

  resetBtn.addEventListener('click', () => {
    if (elapsed() > 0 && !confirm('Clear the stopwatch and all splits?')) return;
    accumulated = 0;
    startedAt = 0;
    lastSplitAt = 0;
    splits = [];
    setRunning(false);
    totalEl.textContent = '00:00:00';
    currentEl.textContent = 'Current split: 00:00:00';
    render();
  });

  splitBtn.addEventListener('click', () => {
    const at = elapsed();
    splits.push({
      id: Date.now() + Math.random(),
      at,
      length: at - lastSplitAt,
      desc: descInput.value.trim(),
    });
    lastSplitAt = at;
    descInput.value = '';
    render();
  });

  function render() {
    body.innerHTML = '';
    if (splits.length === 0) { emptyEl.style.display = ''; return; }
    emptyEl.style.display = 'none';
    splits.forEach((s, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="num">${i + 1}</td>
        <td>${fmt(s.length)}</td>
        <td>${fmt(s.at)}</td>
        <td class="desc"><input type="text" value="${escapeHtml(s.desc)}" data-id="${s.id}" maxlength="80"></td>
        <td>
          <button class="icon-btn" data-copy-time="${s.id}" title="Copy timecode">Copy time</button>
          <button class="icon-btn" data-copy-both="${s.id}" title="Copy time + note">Copy both</button>
        </td>
      `;
      body.appendChild(tr);
    });
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  body.addEventListener('input', (e) => {
    const id = parseFloat(e.target.dataset.id);
    if (!id) return;
    const s = splits.find(x => x.id === id);
    if (s) s.desc = e.target.value.trim();
  });

  body.addEventListener('click', (e) => {
    const copyTime = e.target.dataset.copyTime;
    const copyBoth = e.target.dataset.copyBoth;
    if (copyTime) {
      const s = splits.find(x => x.id === parseFloat(copyTime));
      if (s) copy(`${fmt(s.at)} - `);
    } else if (copyBoth) {
      const s = splits.find(x => x.id === parseFloat(copyBoth));
      if (s) copy(`${fmt(s.at)} - ${s.desc}`);
    }
  });

  document.getElementById('copy-total').addEventListener('click', () => copy(fmt(elapsed())));
  document.getElementById('copy-all').addEventListener('click', () => {
    if (splits.length === 0) { flash('No splits to copy yet.'); return; }
    const text = splits.map((s, i) => `${i + 1}. ${fmt(s.at)} - ${fmt(s.length)}${s.desc ? ' - ' + s.desc : ''}`).join('\n');
    copy(text);
  });

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); flash('Copied.'); }
    catch { flash('Copy failed — select and copy manually.', true); }
  }
  function flash(text, isError) {
    msg.textContent = text;
    msg.className = isError ? 'error' : 'muted';
    setTimeout(() => { if (msg.textContent === text) msg.textContent = ''; }, 2000);
  }

  descInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && running) { e.preventDefault(); splitBtn.click(); }
  });
