const input = document.getElementById('input');
const output = document.getElementById('output');
const msg = document.getElementById('msg');
function flash(text, isError) { msg.textContent = text; msg.className = isError ? 'error' : 'muted'; }
function optimize(svg) {
  return svg
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/\s?(id|class|data-name|xmlns:xlink)="[^"]*"/g, (m, attr) => (attr === 'xmlns:xlink' ? m : ''))
    .trim();
}
document.getElementById('opt-btn').addEventListener('click', () => {
  const raw = input.value.trim();
  if (!raw.includes('<svg')) { flash('Paste valid SVG first.', true); return; }
  output.value = optimize(raw);
  flash(`Optimized. ${raw.length} -> ${output.value.length} chars.`);
});
document.getElementById('copy-btn').addEventListener('click', async () => {
  if (!output.value) return;
  await navigator.clipboard.writeText(output.value);
  flash('Copied.');
});
