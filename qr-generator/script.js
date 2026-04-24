const textEl = document.getElementById('text');
const sizeEl = document.getElementById('size');
const qrEl = document.getElementById('qr');
const msg = document.getElementById('msg');
let qr = null;
function flash(text, isError) { msg.textContent = text; msg.className = isError ? 'error' : 'muted'; }
function generate() {
  const text = textEl.value.trim();
  if (!text) { flash('Enter text first.', true); return; }
  const size = Math.max(128, Math.min(1024, parseInt(sizeEl.value, 10) || 320));
  qrEl.innerHTML = '';
  qr = new QRCode(qrEl, { text, width: size, height: size, correctLevel: QRCode.CorrectLevel.M });
  flash('QR generated.');
}
document.getElementById('gen-btn').addEventListener('click', generate);
document.getElementById('download-btn').addEventListener('click', () => {
  const img = qrEl.querySelector('img');
  const canvas = qrEl.querySelector('canvas');
  const src = img ? img.src : (canvas ? canvas.toDataURL('image/png') : '');
  if (!src) { flash('Generate a QR first.', true); return; }
  const a = document.createElement('a');
  a.href = src;
  a.download = 'qr-code.png';
  document.body.appendChild(a);
  a.click();
  a.remove();
  flash('Downloaded.');
});
textEl.value = 'https://jaytools.netlify.app/';
generate();
