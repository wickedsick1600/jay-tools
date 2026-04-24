  const base = document.getElementById('base');
  const px = document.getElementById('px');
  const rem = document.getElementById('rem');

  let lock = false;
  function withLock(fn) { if (lock) return; lock = true; fn(); lock = false; }

  function pxFromRem() { withLock(() => { const v = parseFloat(rem.value); const b = parseFloat(base.value) || 16; px.value = isNaN(v) ? '' : +(v * b).toFixed(4); }); }
  function remFromPx() { withLock(() => { const v = parseFloat(px.value); const b = parseFloat(base.value) || 16; rem.value = isNaN(v) ? '' : +(v / b).toFixed(6); }); }
  px.addEventListener('input', remFromPx);
  rem.addEventListener('input', pxFromRem);
  base.addEventListener('input', () => { if (px.value) remFromPx(); });
  px.value = 16; remFromPx();

  const hex = document.getElementById('hex');
  const rgba = document.getElementById('rgba');
  const swatch = document.getElementById('swatch');

  function parseHex(s) {
    s = s.trim().replace(/^#/, '');
    if (s.length === 3) s = s.split('').map(c => c + c).join('');
    if (!/^[0-9a-f]{6}([0-9a-f]{2})?$/i.test(s)) return null;
    const r = parseInt(s.slice(0, 2), 16);
    const g = parseInt(s.slice(2, 4), 16);
    const b = parseInt(s.slice(4, 6), 16);
    const a = s.length === 8 ? +(parseInt(s.slice(6, 8), 16) / 255).toFixed(3) : 1;
    return { r, g, b, a };
  }

  function parseRgba(s) {
    const m = /rgba?\s*\(\s*(\d+)\s*[, ]\s*(\d+)\s*[, ]\s*(\d+)\s*(?:[,/]\s*([\d.]+%?))?\s*\)/i.exec(s);
    if (!m) return null;
    const r = +m[1], g = +m[2], b = +m[3];
    let a = 1;
    if (m[4] != null) a = m[4].endsWith('%') ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
    if ([r,g,b].some(x => x < 0 || x > 255)) return null;
    return { r, g, b, a };
  }

  function toHex({r,g,b,a}) {
    const h = n => n.toString(16).padStart(2, '0');
    let s = '#' + h(r) + h(g) + h(b);
    if (a < 1) s += h(Math.round(a * 255));
    return s;
  }

  function fromColor(c) {
    rgba.value = c.a < 1 ? `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})` : `rgb(${c.r}, ${c.g}, ${c.b})`;
    hex.value = toHex(c);
    swatch.style.background = rgba.value;
  }

  hex.addEventListener('input', () => withLock(() => { const c = parseHex(hex.value); if (!c) return; rgba.value = c.a < 1 ? `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})` : `rgb(${c.r}, ${c.g}, ${c.b})`; swatch.style.background = rgba.value; }));
  rgba.addEventListener('input', () => withLock(() => { const c = parseRgba(rgba.value); if (!c) return; hex.value = toHex(c); swatch.style.background = rgba.value; }));
  fromColor({ r: 37, g: 99, b: 235, a: 1 });

  const epoch = document.getElementById('epoch');
  const iso = document.getElementById('iso');

  epoch.addEventListener('input', () => withLock(() => {
    const v = parseFloat(epoch.value);
    if (isNaN(v)) { iso.value = ''; return; }
    const d = new Date(v * 1000);
    iso.value = isNaN(d.getTime()) ? '' : d.toISOString();
  }));
  iso.addEventListener('input', () => withLock(() => {
    const d = new Date(iso.value);
    epoch.value = isNaN(d.getTime()) ? '' : Math.floor(d.getTime() / 1000);
  }));
  document.getElementById('now-btn').addEventListener('click', () => {
    const now = Math.floor(Date.now() / 1000);
    epoch.value = now;
    epoch.dispatchEvent(new Event('input'));
  });
  document.getElementById('now-btn').click();
