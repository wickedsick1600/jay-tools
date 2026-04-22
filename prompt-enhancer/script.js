const promptInput = document.getElementById('prompt');
const targetSelect = document.getElementById('target');
const enhanceBtn = document.getElementById('enhance-btn');
const outputWrap = document.getElementById('output-wrap');
const output = document.getElementById('output');
const copyBtn = document.getElementById('copy-btn');
const msg = document.getElementById('msg');

function flash(text, isError) {
  msg.textContent = text;
  msg.className = isError ? 'error' : 'muted';
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
