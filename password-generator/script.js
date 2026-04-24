const lengthEl = document.getElementById('length');
const upper = document.getElementById('upper');
const lower = document.getElementById('lower');
const digits = document.getElementById('digits');
const symbols = document.getElementById('symbols');
const output = document.getElementById('output');
const msg = document.getElementById('msg');
const sets = { upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', lower: 'abcdefghijklmnopqrstuvwxyz', digits: '0123456789', symbols: '!@#$%^&*()-_=+[]{};:,.?/|~' };
function flash(text, isError) { msg.textContent = text; msg.className = isError ? 'error' : 'muted'; }
function randInt(max) {
  const buf = new Uint32Array(1);
  const limit = Math.floor(0x100000000 / max) * max;
  let v;
  do { crypto.getRandomValues(buf); v = buf[0]; } while (v >= limit);
  return v % max;
}
function generate() {
  const pool = (upper.checked ? sets.upper : '') + (lower.checked ? sets.lower : '') + (digits.checked ? sets.digits : '') + (symbols.checked ? sets.symbols : '');
  if (!pool) { flash('Select at least one character type.', true); return; }
  const len = Math.max(6, Math.min(128, parseInt(lengthEl.value, 10) || 20));
  let out = '';
  for (let i = 0; i < len; i++) out += pool[randInt(pool.length)];
  output.value = out;
  flash('New password generated.');
}
document.getElementById('gen-btn').addEventListener('click', generate);
document.getElementById('copy-btn').addEventListener('click', async () => {
  if (!output.value) return;
  try { await navigator.clipboard.writeText(output.value); flash('Copied.'); } catch { output.select(); document.execCommand('copy'); flash('Copied.'); }
});
generate();
