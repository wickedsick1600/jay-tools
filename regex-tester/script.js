  const pat = document.getElementById('pattern');
  const flags = document.getElementById('flags');
  const text = document.getElementById('text');
  const overlay = document.getElementById('overlay');
  const stats = document.getElementById('stats');
  const matchesEl = document.getElementById('matches');
  const errEl = document.getElementById('err');

  pat.value = '(\\w+)@([\\w.]+)';

  function escapeHtml(s) {
    return s.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  }

  function run() {
    const p = pat.value;
    let f = flags.value;
    if (!f.includes('g')) f += 'g';

    errEl.style.display = 'none';
    matchesEl.innerHTML = '';

    if (!p) {
      overlay.textContent = text.value;
      stats.textContent = '0 matches';
      return;
    }

    let re;
    try { re = new RegExp(p, f); }
    catch (e) {
      errEl.textContent = 'Invalid regex: ' + e.message;
      errEl.style.display = '';
      overlay.textContent = text.value;
      stats.textContent = '';
      return;
    }

    const src = text.value;
    let html = '';
    let last = 0;
    const list = [];
    let m;
    let guard = 0;
    while ((m = re.exec(src)) !== null && guard < 10000) {
      if (m.index === re.lastIndex) re.lastIndex++;
      html += escapeHtml(src.slice(last, m.index)) + '<mark>' + escapeHtml(m[0] || ' ') + '</mark>';
      last = m.index + m[0].length;
      list.push(m);
      guard++;
    }
    html += escapeHtml(src.slice(last));
    overlay.innerHTML = html;
    stats.textContent = `${list.length} match${list.length === 1 ? '' : 'es'}`;

    list.forEach((m, i) => {
      const div = document.createElement('div');
      let inner = `<span class="m-idx">${i + 1}.</span> <span class="m-val">${escapeHtml(m[0])}</span>`;
      for (let g = 1; g < m.length; g++) {
        inner += `<span class="m-grp">[$${g}: ${escapeHtml(m[g] === undefined ? '' : m[g])}]</span>`;
      }
      div.innerHTML = inner;
      matchesEl.appendChild(div);
    });
  }

  function syncScroll() { overlay.scrollTop = text.scrollTop; }

  pat.addEventListener('input', run);
  flags.addEventListener('input', run);
  text.addEventListener('input', run);
  text.addEventListener('scroll', syncScroll);

  run();
