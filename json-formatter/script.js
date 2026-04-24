  const input = document.getElementById('input');
  const output = document.getElementById('output');
  const status = document.getElementById('status');
  const indentSel = document.getElementById('indent');

  function getIndent() {
    const v = indentSel.value;
    return v === 'tab' ? '\t' : parseInt(v, 10);
  }

  function locate(text, pos) {
    let line = 1, col = 1;
    for (let i = 0; i < pos && i < text.length; i++) {
      if (text[i] === '\n') { line++; col = 1; } else col++;
    }
    return { line, col };
  }

  function parse(text) {
    try {
      return { ok: true, data: JSON.parse(text) };
    } catch (e) {
      const m = /position (\d+)/i.exec(e.message);
      let where = '';
      if (m) {
        const loc = locate(text, parseInt(m[1], 10));
        where = ` (line ${loc.line}, column ${loc.col})`;
      }
      return { ok: false, err: e.message + where };
    }
  }

  function setStatus(cls, text) {
    status.textContent = '';
    const span = document.createElement('span');
    span.className = cls;
    span.textContent = text;
    status.appendChild(span);
  }
  function showOk(msg) { setStatus('status-ok', '✓ ' + msg); }
  function showErr(msg) { setStatus('status-err', '✗ ' + msg); }

  document.getElementById('format-btn').addEventListener('click', () => {
    const r = parse(input.value);
    if (!r.ok) { output.value = ''; showErr(r.err); return; }
    output.value = JSON.stringify(r.data, null, getIndent());
    showOk('Valid JSON — formatted.');
  });

  document.getElementById('minify-btn').addEventListener('click', () => {
    const r = parse(input.value);
    if (!r.ok) { output.value = ''; showErr(r.err); return; }
    output.value = JSON.stringify(r.data);
    showOk(`Valid JSON — minified (${output.value.length} chars).`);
  });

  document.getElementById('validate-btn').addEventListener('click', () => {
    const r = parse(input.value);
    if (r.ok) showOk('Valid JSON.');
    else { output.value = ''; showErr(r.err); }
  });

  document.getElementById('copy-btn').addEventListener('click', async () => {
    if (!output.value) return;
    try {
      await navigator.clipboard.writeText(output.value);
      showOk('Copied.');
    } catch {
      showErr('Copy failed — select and copy manually.');
    }
  });
