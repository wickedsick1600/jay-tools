(function () {
  'use strict';

  const core = ImageConverterCore;
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const fileList = document.getElementById('file-list');
  const outputFormat = document.getElementById('output-format');
  const quality = document.getElementById('quality');
  const qualityValue = document.getElementById('quality-value');
  const qualityWrap = document.getElementById('quality-wrap');
  const resizeToggle = document.getElementById('resize-toggle');
  const resizeFields = document.getElementById('resize-fields');
  const maxWidth = document.getElementById('max-width');
  const maxHeight = document.getElementById('max-height');
  const jpegOptions = document.getElementById('jpeg-options');
  const background = document.getElementById('background');
  const convertButton = document.getElementById('convert-btn');
  const cancelButton = document.getElementById('cancel-btn');
  const clearButton = document.getElementById('clear-btn');
  const zipButton = document.getElementById('zip-btn');
  const progress = document.getElementById('progress');
  const progressBar = document.getElementById('progress-bar');
  const status = document.getElementById('status');
  const results = document.getElementById('results');
  const resultList = document.getElementById('result-list');
  let entries = [];
  let nextId = 1;
  let activeRun = 0;
  let busy = false;

  function humanBytes(bytes) {
    const number = Number(bytes) || 0;
    if (number < 1024) return `${number} B`;
    if (number < 1024 * 1024) return `${(number / 1024).toFixed(1)} KB`;
    return `${(number / 1024 / 1024).toFixed(2)} MB`;
  }

  function formatName(mime) {
    return ({
      'image/jpeg': 'JPEG',
      'image/png': 'PNG',
      'image/webp': 'WebP',
      'image/avif': 'AVIF',
      'image/bmp': 'BMP',
      'image/gif': 'GIF',
    })[mime] || 'image';
  }

  function flash(message, isError) {
    status.textContent = message;
    status.className = isError ? 'error' : 'muted';
  }

  function revokeOutput(entry) {
    if (entry.outputUrl) URL.revokeObjectURL(entry.outputUrl);
    entry.outputUrl = '';
    entry.outputBlob = null;
  }

  function clearOutputs() {
    entries.forEach(revokeOutput);
    resultList.replaceChildren();
    results.hidden = true;
    zipButton.hidden = true;
  }

  function renderFiles() {
    fileList.replaceChildren();
    entries.forEach((entry) => {
      const item = document.createElement('li');
      const details = document.createElement('span');
      details.className = 'file-details';
      const name = document.createElement('strong');
      name.textContent = entry.file.name;
      const meta = document.createElement('span');
      meta.textContent = `${formatName(core.inputMime(entry.file))} · ${humanBytes(entry.file.size)}`;
      details.append(name, meta);
      const state = document.createElement('span');
      state.className = `file-state${entry.status === 'error' ? ' error' : ''}`;
      state.textContent = entry.status === 'processing' ? 'Converting…' : entry.status === 'done' ? 'Done' : entry.error || 'Ready';
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'secondary remove-file';
      remove.textContent = 'Remove';
      remove.setAttribute('aria-label', `Remove ${entry.file.name}`);
      remove.disabled = busy;
      remove.addEventListener('click', () => {
        revokeOutput(entry);
        entries = entries.filter((candidate) => candidate.id !== entry.id);
        renderFiles();
        clearOutputs();
        updateButtons();
      });
      item.append(details, state, remove);
      fileList.appendChild(item);
    });
  }

  function updateButtons() {
    clearButton.disabled = busy || entries.length === 0;
    convertButton.disabled = busy || entries.length === 0;
    fileInput.disabled = busy;
    outputFormat.disabled = busy;
    resizeToggle.disabled = busy;
    background.disabled = busy;
    dropZone.classList.toggle('is-disabled', busy);
    dropZone.setAttribute('aria-disabled', busy ? 'true' : 'false');
    syncSettings();
  }

  function addFiles(fileLikeList) {
    if (busy) {
      flash('Wait for the current conversion to finish or cancel it first.', true);
      return;
    }
    let rejected = 0;
    for (const file of Array.from(fileLikeList || [])) {
      if (!core.isSupportedInput(file)) {
        rejected += 1;
        continue;
      }
      entries.push({ id: nextId, file, status: 'ready', error: '', outputBlob: null, outputUrl: '' });
      nextId += 1;
    }
    clearOutputs();
    renderFiles();
    updateButtons();
    if (rejected) flash(`${rejected} unsupported file${rejected === 1 ? ' was' : 's were'} skipped. Use JPEG, PNG, WebP, AVIF, BMP, or GIF.`, true);
    else if (entries.length) flash(`${entries.length} image${entries.length === 1 ? '' : 's'} ready.`);
    fileInput.value = '';
  }

  function syncSettings() {
    const isPng = outputFormat.value === 'image/png';
    const isJpeg = outputFormat.value === 'image/jpeg';
    quality.disabled = busy || isPng;
    qualityWrap.classList.toggle('setting-disabled', isPng || busy);
    jpegOptions.hidden = !isJpeg;
    resizeFields.hidden = !resizeToggle.checked;
    maxWidth.disabled = busy || !resizeToggle.checked;
    maxHeight.disabled = busy || !resizeToggle.checked;
    qualityValue.textContent = `${Math.round(Number(quality.value) * 100)}%`;
  }

  function loadWithImageElement(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => resolve({ source: image, width: image.naturalWidth, height: image.naturalHeight, cleanup: () => URL.revokeObjectURL(url) });
      image.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('This browser could not decode the image.'));
      };
      image.src = url;
    });
  }

  async function decodeImage(file) {
    if (typeof createImageBitmap === 'function') {
      try {
        const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
        return { source: bitmap, width: bitmap.width, height: bitmap.height, cleanup: () => bitmap.close() };
      } catch (_) {
        return loadWithImageElement(file);
      }
    }
    return loadWithImageElement(file);
  }

  function canvasBlob(canvas, mime, outputQuality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) reject(new Error(`${formatName(mime)} encoding is not supported by this browser.`));
        else if (blob.type && blob.type !== mime) reject(new Error(`${formatName(mime)} encoding is not supported by this browser.`));
        else resolve(blob);
      }, mime, outputQuality);
    });
  }

  async function convertEntry(entry, options, usedNames) {
    const decoded = await decodeImage(entry.file);
    try {
      const dimensions = options.resize
        ? core.calculateDimensions(decoded.width, decoded.height, options.maxWidth, options.maxHeight, true)
        : core.calculateDimensions(decoded.width, decoded.height, null, null, true);
      if (dimensions.width * dimensions.height > 67108864) {
        throw new Error('The output is over 67 megapixels. Set smaller maximum dimensions and try again.');
      }
      const canvas = document.createElement('canvas');
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      const context = canvas.getContext('2d', { alpha: options.mime !== 'image/jpeg' });
      if (!context) throw new Error('Canvas rendering is unavailable.');
      if (options.mime === 'image/jpeg') {
        context.fillStyle = options.background;
        context.fillRect(0, 0, canvas.width, canvas.height);
      }
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);
      const blob = await canvasBlob(canvas, options.mime, options.quality);
      const name = core.uniqueName(core.outputName(entry.file.name, options.mime), usedNames);
      return { blob, name, width: canvas.width, height: canvas.height };
    } finally {
      decoded.cleanup();
    }
  }

  function renderResults() {
    resultList.replaceChildren();
    const completed = entries.filter((entry) => entry.outputBlob);
    completed.forEach((entry) => {
      const card = document.createElement('article');
      card.className = 'result-card';
      const image = document.createElement('img');
      image.src = entry.outputUrl;
      image.alt = '';
      image.loading = 'lazy';
      const body = document.createElement('div');
      body.className = 'result-body';
      const heading = document.createElement('h3');
      heading.textContent = entry.outputName;
      const dimensions = document.createElement('p');
      dimensions.className = 'muted';
      dimensions.textContent = `${entry.outputWidth.toLocaleString()} × ${entry.outputHeight.toLocaleString()} px`;
      const comparison = core.sizeChange(entry.file.size, entry.outputBlob.size);
      const size = document.createElement('p');
      size.className = comparison.isLarger ? 'size-comparison warning' : 'size-comparison';
      if (comparison.isSame) {
        size.textContent = `${humanBytes(entry.file.size)} → ${humanBytes(entry.outputBlob.size)} · same size`;
      } else {
        const direction = comparison.isSmaller ? 'smaller' : 'larger';
        size.textContent = `${humanBytes(entry.file.size)} → ${humanBytes(entry.outputBlob.size)} · ${comparison.percent.toFixed(1)}% ${direction}`;
      }
      const download = document.createElement('a');
      download.className = 'btn success';
      download.href = entry.outputUrl;
      download.download = entry.outputName;
      download.textContent = 'Download';
      body.append(heading, dimensions, size, download);
      card.append(image, body);
      resultList.appendChild(card);
    });
    results.hidden = completed.length === 0;
    zipButton.hidden = completed.length < 2;
  }

  async function runConversion() {
    if (!entries.length) return;
    const width = Number.parseInt(maxWidth.value, 10);
    const height = Number.parseInt(maxHeight.value, 10);
    if (resizeToggle.checked && ((!Number.isFinite(width) || width < 1) || (!Number.isFinite(height) || height < 1))) {
      flash('Enter valid maximum width and height values.', true);
      return;
    }
    const runId = activeRun + 1;
    activeRun = runId;
    clearOutputs();
    entries.forEach((entry) => { entry.status = 'ready'; entry.error = ''; });
    const options = {
      mime: outputFormat.value,
      quality: outputFormat.value === 'image/png' ? undefined : Number(quality.value),
      resize: resizeToggle.checked,
      maxWidth: width,
      maxHeight: height,
      background: background.value,
    };
    const usedNames = new Set();
    busy = true;
    updateButtons();
    cancelButton.hidden = false;
    cancelButton.disabled = false;
    progress.hidden = false;
    progressBar.style.width = '0%';
    progress.setAttribute('aria-valuenow', '0');
    flash('Converting images…');

    let completed = 0;
    for (let index = 0; index < entries.length; index += 1) {
      if (activeRun !== runId) break;
      const entry = entries[index];
      entry.status = 'processing';
      renderFiles();
      try {
        const output = await convertEntry(entry, options, usedNames);
        if (activeRun !== runId) break;
        entry.outputBlob = output.blob;
        entry.outputUrl = URL.createObjectURL(output.blob);
        entry.outputName = output.name;
        entry.outputWidth = output.width;
        entry.outputHeight = output.height;
        entry.status = 'done';
        completed += 1;
      } catch (error) {
        entry.status = 'error';
        entry.error = error && error.message ? error.message : 'Conversion failed.';
      }
      const percent = Math.round(((index + 1) / entries.length) * 100);
      progressBar.style.width = `${percent}%`;
      progress.setAttribute('aria-valuenow', String(percent));
      renderFiles();
    }

    const cancelled = activeRun !== runId;
    entries.forEach((entry) => { if (entry.status === 'processing') entry.status = 'ready'; });
    busy = false;
    cancelButton.hidden = true;
    cancelButton.disabled = false;
    updateButtons();
    renderFiles();
    renderResults();
    if (cancelled) flash(`Cancelled. ${completed} image${completed === 1 ? '' : 's'} finished.`);
    else if (completed === 0) flash('No images could be converted. See each file for details.', true);
    else flash(`Done. ${completed} of ${entries.length} image${entries.length === 1 ? '' : 's'} converted locally.`);
  }

  async function downloadZip() {
    const completed = entries.filter((entry) => entry.outputBlob);
    if (completed.length < 2) return;
    if (typeof JSZip !== 'function') {
      flash('ZIP support did not load. Use the individual Download buttons.', true);
      return;
    }
    zipButton.disabled = true;
    flash('Building ZIP on your device…');
    try {
      const zip = new JSZip();
      completed.forEach((entry) => zip.file(entry.outputName, entry.outputBlob));
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'converted-images-juankit.zip';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      flash(`ZIP ready with ${completed.length} images.`);
    } catch (_) {
      flash('Could not build the ZIP. Use the individual Download buttons.', true);
    } finally {
      zipButton.disabled = false;
    }
  }

  dropZone.addEventListener('click', () => fileInput.click());
  dropZone.addEventListener('keydown', (event) => {
    if (busy) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      fileInput.click();
    }
  });
  dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    if (!busy) dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('dragover');
    if (busy) {
      flash('Wait for the current conversion to finish or cancel it first.', true);
      return;
    }
    addFiles(event.dataTransfer.files);
  });
  document.addEventListener('paste', (event) => {
    const pasted = Array.from(event.clipboardData && event.clipboardData.files || []).filter((file) => file.type.startsWith('image/'));
    if (pasted.length) {
      event.preventDefault();
      if (busy) {
        flash('Wait for the current conversion to finish or cancel it first.', true);
        return;
      }
      addFiles(pasted);
    }
  });
  fileInput.addEventListener('change', () => addFiles(fileInput.files));
  outputFormat.addEventListener('change', syncSettings);
  quality.addEventListener('input', syncSettings);
  resizeToggle.addEventListener('change', syncSettings);
  convertButton.addEventListener('click', runConversion);
  cancelButton.addEventListener('click', () => { activeRun += 1; cancelButton.disabled = true; });
  clearButton.addEventListener('click', () => {
    entries.forEach(revokeOutput);
    entries = [];
    renderFiles();
    clearOutputs();
    progress.hidden = true;
    flash('List cleared.');
    updateButtons();
  });
  zipButton.addEventListener('click', downloadZip);
  window.addEventListener('pagehide', () => entries.forEach(revokeOutput));

  syncSettings();
  renderFiles();
  updateButtons();
})();
