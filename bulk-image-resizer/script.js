  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const fileList = document.getElementById('file-list');
  const preset = document.getElementById('preset');
  const wEl = document.getElementById('w');
  const hEl = document.getElementById('h');
  const fit = document.getElementById('fit');
  const format = document.getElementById('format');
  const quality = document.getElementById('quality');
  const qlabel = document.getElementById('qlabel');
  const bg = document.getElementById('bg');
  const goBtn = document.getElementById('go-btn');
  const clearBtn = document.getElementById('clear-btn');
  const progress = document.getElementById('progress');
  const bar = document.getElementById('bar');
  const msg = document.getElementById('msg');

  let files = [];

  function humanBytes(n) {
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    return (n / 1024 / 1024).toFixed(2) + ' MB';
  }

  function flash(text, isError) {
    msg.textContent = text;
    msg.className = isError ? 'error' : 'muted';
  }

  function renderList() {
    fileList.innerHTML = '';
    files.forEach((f, i) => {
      const li = document.createElement('li');
      const nameEl = document.createElement('span');
      nameEl.className = 'name';
      nameEl.textContent = f.file.name;
      const sizeEl = document.createElement('span');
      sizeEl.className = 'size';
      sizeEl.textContent = humanBytes(f.file.size);
      const statusEl = document.createElement('span');
      statusEl.className = 'status' + (f.status === 'done' ? ' done' : f.status === 'error' ? ' err' : '');
      statusEl.dataset.i = i;
      statusEl.textContent = f.status === 'done' ? 'done' : f.status === 'error' ? (f.error || 'failed') : '';
      li.append(nameEl, sizeEl, statusEl);
      fileList.appendChild(li);
    });
  }

  function addFiles(list) {
    for (const file of list) {
      if (!file.type.startsWith('image/')) continue;
      files.push({ file, status: 'queued' });
    }
    renderList();
  }

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', e => { e.preventDefault(); dropZone.classList.remove('dragover'); addFiles(e.dataTransfer.files); });
  fileInput.addEventListener('change', e => addFiles(e.target.files));

  clearBtn.addEventListener('click', () => { files = []; renderList(); flash(''); progress.style.display = 'none'; });

  preset.addEventListener('change', () => {
    if (preset.value === 'custom') return;
    const [w, h] = preset.value.split('x').map(Number);
    wEl.value = w; hEl.value = h;
  });

  quality.addEventListener('input', () => { qlabel.textContent = quality.value; });
  format.addEventListener('change', () => {
    const isPng = format.value === 'image/png';
    quality.disabled = isPng;
    qlabel.style.opacity = isPng ? 0.4 : 1;
  });

  function loadImage(file) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => { URL.revokeObjectURL(url); res(img); };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Not a valid image')); };
      img.src = url;
    });
  }

  function process(img, targetW, targetH, fitMode, bgColor) {
    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, targetW, targetH);

    const sw = img.naturalWidth, sh = img.naturalHeight;
    if (fitMode === 'stretch') {
      ctx.drawImage(img, 0, 0, targetW, targetH);
    } else if (fitMode === 'cover') {
      const scale = Math.max(targetW / sw, targetH / sh);
      const dw = sw * scale, dh = sh * scale;
      ctx.drawImage(img, (targetW - dw) / 2, (targetH - dh) / 2, dw, dh);
    } else {
      const scale = Math.min(targetW / sw, targetH / sh);
      const dw = sw * scale, dh = sh * scale;
      ctx.drawImage(img, (targetW - dw) / 2, (targetH - dh) / 2, dw, dh);
    }
    return canvas;
  }

  goBtn.addEventListener('click', async () => {
    if (files.length === 0) { flash('Add some images first.', true); return; }
    const targetW = Math.max(1, parseInt(wEl.value, 10) || 0);
    const targetH = Math.max(1, parseInt(hEl.value, 10) || 0);
    const type = format.value;
    const q = type === 'image/png' ? 1 : parseFloat(quality.value);
    const ext = type.split('/')[1].replace('jpeg', 'jpg');

    goBtn.disabled = true;
    progress.style.display = '';
    bar.style.width = '0%';
    flash('Processing…');

    const zip = new JSZip();
    let done = 0;

    for (const entry of files) {
      try {
        entry.status = 'processing';
        renderList();
        const img = await loadImage(entry.file);
        const canvas = process(img, targetW, targetH, fit.value, bg.value);
        const blob = await new Promise(res => canvas.toBlob(res, type, q));
        if (!blob) throw new Error('Encoding failed');
        const base = entry.file.name.replace(/\.[^.]+$/, '');
        zip.file(`${base}.${ext}`, blob);
        entry.status = 'done';
      } catch (err) {
        entry.status = 'error';
        entry.error = err.message;
      }
      done++;
      bar.style.width = `${(done / files.length) * 100}%`;
      renderList();
    }

    flash('Building .zip…');
    const zipBlob = await zip.generateAsync({ type: 'blob' }, m => {
      bar.style.width = `${m.percent}%`;
    });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resized-${targetW}x${targetH}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    flash(`Done. ${files.filter(f => f.status === 'done').length} / ${files.length} processed.`);
    goBtn.disabled = false;
  });
