(async function startPdfOrganizer() {
  await globalThis.pdfjsLibPromise;
  const pdfjsLib = globalThis.pdfjsLib;
  if (!pdfjsLib) throw new Error('PDF.js is unavailable.');

  const PDF_WORKER_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.2.67/legacy/build/pdf.worker.min.mjs';
  const PREVIEW_WIDTH = 160;
  const PREVIEW_HEIGHT = 198;
  const PREVIEW_MAX_PIXELS = 350000;

  pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;

  const dropZone = document.getElementById('drop-zone');
  const pdfInput = document.getElementById('pdf-input');
  const workspace = document.getElementById('workspace');
  const fileMeta = document.getElementById('file-meta');
  const pageGrid = document.getElementById('page-grid');
  const outputName = document.getElementById('output-name');
  const status = document.getElementById('status');
  const changeFileBtn = document.getElementById('change-file-btn');
  const selectAllBtn = document.getElementById('select-all-btn');
  const clearSelectionBtn = document.getElementById('clear-selection-btn');
  const rotateLeftBtn = document.getElementById('rotate-left-btn');
  const rotateRightBtn = document.getElementById('rotate-right-btn');
  const deleteBtn = document.getElementById('delete-btn');
  const resetBtn = document.getElementById('reset-btn');
  const saveBtn = document.getElementById('save-btn');
  const extractBtn = document.getElementById('extract-btn');
  const splitBtn = document.getElementById('split-btn');

  let originalBytes = null;
  let originalName = 'document.pdf';
  let pdfPreview = null;
  let pages = [];
  let selectedIds = new Set();
  let draggedId = null;
  let busy = false;
  let renderRunId = 0;

  function flash(text, isError) {
    status.textContent = text;
    status.className = isError ? 'error status-line' : 'muted status-line';
  }

  function humanBytes(value) {
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / 1024 / 1024).toFixed(2)} MB`;
  }

  function safeBaseName(name) {
    return (name || 'document')
      .replace(/\.pdf$/iu, '')
      .replace(/[\\/:*?"<>|]+/gu, '-')
      .trim() || 'document';
  }

  function cleanPdfName(name, fallback) {
    const safe = (name || fallback).replace(/[\\/:*?"<>|]+/gu, '-').trim();
    const base = safe.replace(/\.pdf$/iu, '').trim() || fallback.replace(/\.pdf$/iu, '');
    return `${base}.pdf`;
  }

  function isPdf(file) {
    return file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
  }

  function normalizedAngle(angle) {
    return ((angle % 360) + 360) % 360;
  }

  function downloadBytes(bytes, filename, type) {
    const blob = new Blob([bytes], { type });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  function pageLabel(item, index) {
    return `Position ${index + 1}, original page ${item.originalIndex + 1}`;
  }

  function makeButton(label, onClick, disabled) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'secondary';
    button.textContent = label;
    button.disabled = disabled || busy;
    button.addEventListener('click', onClick);
    return button;
  }

  function updateControls() {
    const selectedCount = selectedIds.size;
    const hasPages = pages.length > 0;
    selectAllBtn.disabled = busy || !hasPages || selectedCount === pages.length;
    clearSelectionBtn.disabled = busy || selectedCount === 0;
    rotateLeftBtn.disabled = busy || selectedCount === 0;
    rotateRightBtn.disabled = busy || selectedCount === 0;
    deleteBtn.disabled = busy || selectedCount === 0;
    resetBtn.disabled = busy || !originalBytes;
    saveBtn.disabled = busy || !hasPages;
    extractBtn.disabled = busy || selectedCount === 0;
    splitBtn.disabled = busy || !hasPages;
    changeFileBtn.disabled = busy;
    outputName.disabled = busy;
    pdfInput.disabled = busy;
    dropZone.setAttribute('aria-disabled', busy ? 'true' : 'false');
    pageGrid.querySelectorAll('button, input').forEach((control) => {
      control.disabled = busy;
    });
  }

  function renderCards() {
    renderRunId += 1;
    const currentRun = renderRunId;
    pageGrid.textContent = '';

    pages.forEach((item, index) => {
      const card = document.createElement('article');
      card.className = 'page-card';
      card.classList.toggle('selected', selectedIds.has(item.id));
      card.draggable = !busy;
      card.dataset.id = String(item.id);

      const preview = document.createElement('div');
      preview.className = 'page-preview';
      preview.dataset.preview = String(item.id);
      const placeholder = document.createElement('span');
      placeholder.className = 'page-placeholder';
      placeholder.textContent = 'Loading preview…';
      preview.appendChild(placeholder);

      const title = document.createElement('div');
      title.className = 'page-title';
      const checkLabel = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = selectedIds.has(item.id);
      checkbox.setAttribute('aria-label', `Select original page ${item.originalIndex + 1}`);
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) selectedIds.add(item.id);
        else selectedIds.delete(item.id);
        card.classList.toggle('selected', checkbox.checked);
        updateControls();
      });
      const labelText = document.createElement('span');
      labelText.textContent = `Page ${index + 1}`;
      checkLabel.append(checkbox, labelText);

      const rotation = document.createElement('span');
      rotation.className = 'rotation-label';
      rotation.textContent = item.rotation ? `${normalizedAngle(item.rotation)}°` : `Original ${item.originalIndex + 1}`;
      title.append(checkLabel, rotation);

      const actions = document.createElement('div');
      actions.className = 'page-actions';
      actions.append(
        makeButton('Move up', () => movePage(index, index - 1), index === 0),
        makeButton('Move down', () => movePage(index, index + 1), index === pages.length - 1),
        makeButton('Rotate left', () => rotatePage(item.id, -90), false),
        makeButton('Rotate right', () => rotatePage(item.id, 90), false)
      );

      card.addEventListener('dragstart', (event) => {
        draggedId = item.id;
        card.classList.add('dragging');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(item.id));
      });
      card.addEventListener('dragend', () => {
        draggedId = null;
        card.classList.remove('dragging');
      });
      card.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      });
      card.addEventListener('drop', (event) => {
        event.preventDefault();
        const fromId = Number(event.dataTransfer.getData('text/plain') || draggedId);
        reorderById(fromId, item.id);
      });
      card.setAttribute('aria-label', pageLabel(item, index));
      card.append(preview, title, actions);
      pageGrid.appendChild(card);
    });

    if (!pages.length) {
      const empty = document.createElement('p');
      empty.className = 'notice';
      empty.textContent = 'Every page was deleted. Use Reset pages to restore the document.';
      pageGrid.appendChild(empty);
    }

    updateControls();
    renderAllPreviews(currentRun);
  }

  async function renderPagePreview(item, runId) {
    if (!pdfPreview || runId !== renderRunId) return;
    const frame = pageGrid.querySelector(`[data-preview="${item.id}"]`);
    if (!frame) return;

    let page = null;
    try {
      page = await pdfPreview.getPage(item.originalIndex + 1);
      if (runId !== renderRunId) return;
      const base = page.getViewport({ scale: 1, rotation: page.rotate + item.rotation });
      let scale = Math.min(PREVIEW_WIDTH / base.width, PREVIEW_HEIGHT / base.height);
      const pixels = base.width * scale * base.height * scale;
      if (pixels > PREVIEW_MAX_PIXELS) scale = Math.sqrt(PREVIEW_MAX_PIXELS / (base.width * base.height));
      const viewport = page.getViewport({ scale, rotation: page.rotate + item.rotation });
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      const context = canvas.getContext('2d', { alpha: false });
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: context, viewport }).promise;
      if (runId !== renderRunId) return;
      frame.textContent = '';
      frame.appendChild(canvas);
    } catch (error) {
      if (runId !== renderRunId) return;
      frame.textContent = '';
      const failed = document.createElement('span');
      failed.className = 'page-placeholder';
      failed.textContent = 'Preview unavailable';
      frame.appendChild(failed);
    } finally {
      if (page) page.cleanup();
    }
  }

  async function renderAllPreviews(runId) {
    for (const item of pages) {
      if (runId !== renderRunId) return;
      await renderPagePreview(item, runId);
    }
  }

  function movePage(fromIndex, toIndex) {
    if (busy || toIndex < 0 || toIndex >= pages.length || fromIndex === toIndex) return;
    const [item] = pages.splice(fromIndex, 1);
    pages.splice(toIndex, 0, item);
    renderCards();
  }

  function reorderById(fromId, toId) {
    if (!fromId || !toId || fromId === toId) return;
    const fromIndex = pages.findIndex((item) => item.id === fromId);
    const toIndex = pages.findIndex((item) => item.id === toId);
    if (fromIndex !== -1 && toIndex !== -1) movePage(fromIndex, toIndex);
  }

  function rotatePage(id, amount) {
    const item = pages.find((page) => page.id === id);
    if (!item || busy) return;
    item.rotation = normalizedAngle(item.rotation + amount);
    renderCards();
  }

  function rotateSelected(amount) {
    if (busy || !selectedIds.size) return;
    pages.forEach((item) => {
      if (selectedIds.has(item.id)) item.rotation = normalizedAngle(item.rotation + amount);
    });
    renderCards();
  }

  function resetPages() {
    if (!pdfPreview || busy) return;
    pages = Array.from({ length: pdfPreview.numPages }, (_, index) => ({
      id: index + 1,
      originalIndex: index,
      rotation: 0,
    }));
    selectedIds = new Set();
    renderCards();
    flash('Original page order restored.');
  }

  function setBusy(value) {
    busy = value;
    updateControls();
  }

  async function createPdf(items) {
    const source = await PDFLib.PDFDocument.load(originalBytes.slice(), { updateMetadata: false });
    const output = await PDFLib.PDFDocument.create();
    const copied = await output.copyPages(source, items.map((item) => item.originalIndex));
    copied.forEach((page, index) => {
      const originalAngle = page.getRotation().angle || 0;
      page.setRotation(PDFLib.degrees(normalizedAngle(originalAngle + items[index].rotation)));
      output.addPage(page);
    });
    return output.save({ useObjectStreams: false });
  }

  async function downloadPdf(items, filename, message) {
    if (!items.length || busy) return;
    setBusy(true);
    flash(message);
    try {
      const bytes = await createPdf(items);
      downloadBytes(bytes, filename, 'application/pdf');
      flash('PDF created and downloaded.');
    } catch (error) {
      flash(`Could not create the PDF: ${error.message}`, true);
    } finally {
      setBusy(false);
    }
  }

  async function splitPages() {
    if (!pages.length || busy) return;
    setBusy(true);
    flash('Splitting pages and building ZIP…');
    try {
      const source = await PDFLib.PDFDocument.load(originalBytes.slice(), { updateMetadata: false });
      const zip = new JSZip();
      const digits = Math.max(3, String(pages.length).length);
      const base = safeBaseName(originalName);

      for (let index = 0; index < pages.length; index += 1) {
        const item = pages[index];
        flash(`Creating page ${index + 1} of ${pages.length}…`);
        const output = await PDFLib.PDFDocument.create();
        const [page] = await output.copyPages(source, [item.originalIndex]);
        const originalAngle = page.getRotation().angle || 0;
        page.setRotation(PDFLib.degrees(normalizedAngle(originalAngle + item.rotation)));
        output.addPage(page);
        const bytes = await output.save({ useObjectStreams: false });
        zip.file(`${base}-page-${String(index + 1).padStart(digits, '0')}-juankit.pdf`, bytes);
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `${base}-split-juankit.zip`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      flash('Split PDF ZIP created and downloaded.');
    } catch (error) {
      flash(`Could not split the PDF: ${error.message}`, true);
    } finally {
      setBusy(false);
    }
  }

  async function loadPdf(file) {
    if (busy) return;
    if (!isPdf(file)) {
      flash('Choose a valid PDF file.', true);
      return;
    }

    renderRunId += 1;
    if (pdfPreview) {
      try { await pdfPreview.destroy(); } catch (error) {}
    }
    pdfPreview = null;
    originalBytes = null;
    pages = [];
    selectedIds = new Set();
    pageGrid.textContent = '';
    workspace.hidden = true;
    setBusy(true);
    status.hidden = false;
    flash('Opening PDF…');

    try {
      originalName = file.name || 'document.pdf';
      originalBytes = new Uint8Array(await file.arrayBuffer());
      await PDFLib.PDFDocument.load(originalBytes.slice(), { updateMetadata: false });
      const loadingTask = pdfjsLib.getDocument({
        data: originalBytes.slice(),
        isEvalSupported: false,
      });
      pdfPreview = await loadingTask.promise;
      if (!pdfPreview.numPages) throw new Error('This PDF has no pages.');

      outputName.value = `${safeBaseName(originalName)}-organized-juankit.pdf`;
      fileMeta.textContent = `${originalName} · ${pdfPreview.numPages} page${pdfPreview.numPages === 1 ? '' : 's'} · ${humanBytes(file.size)}`;
      dropZone.style.display = 'none';
      workspace.hidden = false;
      pages = Array.from({ length: pdfPreview.numPages }, (_, index) => ({
        id: index + 1,
        originalIndex: index,
        rotation: 0,
      }));
      flash('PDF ready. Drag pages to reorder them.');
      renderCards();
    } catch (error) {
      originalBytes = null;
      dropZone.style.display = '';
      workspace.hidden = true;
      const protectedFile = error?.name === 'PasswordException' || /encrypted|password/iu.test(error.message || '');
      flash(protectedFile ? 'Password-protected PDFs are not supported.' : `Could not open this PDF: ${error.message}`, true);
    } finally {
      setBusy(false);
    }
  }

  function resetTool() {
    renderRunId += 1;
    if (pdfPreview) {
      try { pdfPreview.destroy(); } catch (error) {}
    }
    pdfPreview = null;
    originalBytes = null;
    pages = [];
    selectedIds = new Set();
    pdfInput.value = '';
    pageGrid.textContent = '';
    workspace.hidden = true;
    dropZone.style.display = '';
    flash('');
  }

  dropZone.addEventListener('click', () => pdfInput.click());
  dropZone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      pdfInput.click();
    }
  });
  dropZone.addEventListener('dragover', (event) => {
    event.preventDefault();
    dropZone.classList.add('dragover');
  });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (event) => {
    event.preventDefault();
    dropZone.classList.remove('dragover');
    if (event.dataTransfer.files[0]) loadPdf(event.dataTransfer.files[0]);
  });
  pdfInput.addEventListener('change', () => {
    if (pdfInput.files[0]) loadPdf(pdfInput.files[0]);
  });

  changeFileBtn.addEventListener('click', resetTool);
  selectAllBtn.addEventListener('click', () => {
    selectedIds = new Set(pages.map((item) => item.id));
    renderCards();
  });
  clearSelectionBtn.addEventListener('click', () => {
    selectedIds.clear();
    renderCards();
  });
  rotateLeftBtn.addEventListener('click', () => rotateSelected(-90));
  rotateRightBtn.addEventListener('click', () => rotateSelected(90));
  deleteBtn.addEventListener('click', () => {
    pages = pages.filter((item) => !selectedIds.has(item.id));
    selectedIds.clear();
    renderCards();
    flash('Selected pages removed. Use Reset pages to restore them.');
  });
  resetBtn.addEventListener('click', resetPages);
  saveBtn.addEventListener('click', () => {
    downloadPdf(pages, cleanPdfName(outputName.value, 'organized-juankit.pdf'), 'Creating organized PDF…');
  });
  extractBtn.addEventListener('click', () => {
    const selectedPages = pages.filter((item) => selectedIds.has(item.id));
    const name = `${safeBaseName(originalName)}-selected-juankit.pdf`;
    downloadPdf(selectedPages, name, 'Creating selected-page PDF…');
  });
  splitBtn.addEventListener('click', splitPages);

  updateControls();
})().catch((error) => {
  console.error('PDF Organizer failed to start:', error);
  const status = document.getElementById('status');
  if (status) {
    status.hidden = false;
    status.textContent = 'The PDF engine could not start. Check your connection and reload the page.';
    status.className = 'error status-line';
  }
});
