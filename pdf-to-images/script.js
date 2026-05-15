const PDF_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const MAX_EXPORT_PIXELS = 16000000;
const LARGE_PAGE_COUNT = 80;
const PREVIEW_TARGET_WIDTH = 150;
const PREVIEW_MAX_PIXELS = 300000;

pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;

const dropZone = document.getElementById('drop-zone');
const pdfInput = document.getElementById('pdf-input');
const converter = document.getElementById('converter');
const msg = document.getElementById('msg');
const fileTitle = document.getElementById('file-title');
const fileMeta = document.getElementById('file-meta');
const docWarning = document.getElementById('doc-warning');
const exportBtn = document.getElementById('export-btn');
const exportBtnBottom = document.getElementById('export-btn-bottom');
const changeFileBtn = document.getElementById('change-file-btn');
const previewStatus = document.getElementById('preview-status');
const previewGrid = document.getElementById('preview-grid');
const selectAllBtn = document.getElementById('select-all-btn');
const clearSelectionBtn = document.getElementById('clear-selection-btn');
const pageRange = document.getElementById('page-range');
const format = document.getElementById('format');
const quality = document.getElementById('quality');
const qualityLabel = document.getElementById('quality-label');
const scaleMode = document.getElementById('scale-mode');
const downloadMode = document.getElementById('download-mode');
const customWidthWrap = document.getElementById('custom-width-wrap');
const customMaxWidth = document.getElementById('custom-max-width');
const outputSummary = document.getElementById('output-summary');
const progressPanel = document.getElementById('progress-panel');
const progressStatus = document.getElementById('progress-status');
const progressFill = document.getElementById('progress-fill');

let pdfDoc = null;
let originalFileName = 'document.pdf';
let pageCount = 0;
let fileSize = 0;
let isExporting = false;
let selectedPages = new Set();
let previewRunId = 0;
let isSyncingRange = false;

function flash(text, isError) {
  msg.textContent = text;
  msg.className = isError ? 'error' : 'muted';
}

function humanBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1024 / 1024).toFixed(2) + ' MB';
}

function isPdfFile(file) {
  return file && (
    file.type === 'application/pdf' ||
    file.type.includes('pdf') ||
    file.name.toLowerCase().endsWith('.pdf')
  );
}

function friendlyPdfError(err) {
  if (err?.name === 'PasswordException') {
    return 'That PDF is password-protected. Remove the password and try again.';
  }
  if (err?.name === 'InvalidPDFException') {
    return 'That file does not look like a valid PDF.';
  }
  if (err?.name === 'MissingPDFException') {
    return 'That PDF could not be found or read.';
  }
  return 'Failed to open that PDF. Try a different file.';
}

function safeFileBase(name) {
  return (name || 'document')
    .replace(/\.pdf$/i, '')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .trim() || 'document';
}

function padPageNumber(pageNumber) {
  const digits = Math.max(3, String(pageCount).length);
  return String(pageNumber).padStart(digits, '0');
}

function fileNameForPage(pageNumber, ext) {
  return `${safeFileBase(originalFileName)}-page-${padPageNumber(pageNumber)}.${ext}`;
}

function zipFileName() {
  return `${safeFileBase(originalFileName)}-images.zip`;
}

function downloadBlob(blob, filename) {
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

function updateProgress(percent, text) {
  progressPanel.hidden = false;
  progressStatus.textContent = text;
  progressFill.style.width = `${Math.max(0, Math.min(100, percent))}%`;
}

function clearProgress() {
  progressPanel.hidden = true;
  progressStatus.textContent = 'Waiting...';
  progressFill.style.width = '0%';
}

function parsePageRange(value, totalPages) {
  const text = (value || '').trim().toLowerCase();
  if (text === 'all') {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  if (!text) throw new Error('Choose at least one page.');

  const pages = [];
  const seen = new Set();
  const parts = text.split(',');

  for (const rawPart of parts) {
    const part = rawPart.trim();
    if (!part) throw new Error('Remove empty page range entries.');

    const match = part.match(/^(\d+)(?:-(\d+))?$/);
    if (!match) throw new Error('Use page numbers like 1,3,5-8.');

    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : start;

    if (start < 1 || end < 1) throw new Error('Page numbers must be 1 or higher.');
    if (start > end) throw new Error(`Page range ${part} is backwards.`);
    if (end > totalPages) throw new Error(`Page ${end} is outside this ${totalPages}-page PDF.`);

    for (let page = start; page <= end; page += 1) {
      if (!seen.has(page)) {
        pages.push(page);
        seen.add(page);
      }
    }
  }

  if (!pages.length) throw new Error('Choose at least one page.');
  return pages;
}

function allPageNumbers() {
  return Array.from({ length: pageCount }, (_, index) => index + 1);
}

function compactPageRange(pages) {
  if (!pages.length) return '';
  const sorted = [...pages].sort((a, b) => a - b);
  if (
    sorted.length === pageCount &&
    sorted[0] === 1 &&
    sorted[sorted.length - 1] === pageCount
  ) {
    return 'all';
  }

  const parts = [];
  let start = sorted[0];
  let previous = sorted[0];

  for (let index = 1; index <= sorted.length; index += 1) {
    const page = sorted[index];
    if (page === previous + 1) {
      previous = page;
      continue;
    }

    parts.push(start === previous ? String(start) : `${start}-${previous}`);
    start = page;
    previous = page;
  }

  return parts.join(',');
}

function setSelectedPages(pages, shouldUpdateRange) {
  selectedPages = new Set(pages);

  if (shouldUpdateRange) {
    isSyncingRange = true;
    pageRange.value = compactPageRange(pages);
    isSyncingRange = false;
  }

  renderSelectionState();
  updateOutputSummary();
}

function getSelectedPages() {
  return [...selectedPages].sort((a, b) => a - b);
}

function selectionSummaryText() {
  if (!pdfDoc) return 'Page previews will appear here after loading.';

  const selectedCount = selectedPages.size;
  const pageText = pageCount === 1 ? 'page' : 'pages';
  const selectedText = selectedCount === 1 ? '1 selected' : `${selectedCount} selected`;
  return `${selectedText} of ${pageCount} ${pageText}. Click a page preview to include or skip it.`;
}

function renderSelectionState() {
  if (!previewGrid || !previewStatus) return;

  previewGrid.querySelectorAll('.preview-page').forEach((button) => {
    const pageNumber = Number(button.dataset.page);
    const isSelected = selectedPages.has(pageNumber);
    button.classList.toggle('selected', isSelected);
    button.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
    button.disabled = isExporting;

    const state = button.querySelector('[data-selection-state]');
    if (state) state.textContent = isSelected ? 'Selected' : 'Skipped';
  });

  previewStatus.textContent = selectionSummaryText();
  selectAllBtn.disabled = !pdfDoc || selectedPages.size === pageCount || isExporting;
  clearSelectionBtn.disabled = !pdfDoc || selectedPages.size === 0 || isExporting;
}

function syncSelectionFromRange() {
  if (!pdfDoc || isSyncingRange) {
    updateOutputSummary();
    return;
  }

  try {
    selectedPages = new Set(parsePageRange(pageRange.value, pageCount));
    renderSelectionState();
  } catch (err) {
    // Keep the last valid thumbnail selection while the user edits the text range.
  }

  updateOutputSummary();
}

function togglePageSelection(pageNumber) {
  if (!pdfDoc || isExporting) return;

  const pages = new Set(selectedPages);
  if (pages.has(pageNumber)) {
    pages.delete(pageNumber);
  } else {
    pages.add(pageNumber);
  }

  setSelectedPages([...pages], true);
}

function buildPreviewGrid() {
  previewGrid.textContent = '';

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'preview-page';
    button.dataset.page = String(pageNumber);
    button.setAttribute('aria-label', `Toggle page ${pageNumber}`);

    const frame = document.createElement('span');
    frame.className = 'preview-frame';

    const placeholder = document.createElement('span');
    placeholder.className = 'preview-placeholder';
    placeholder.textContent = 'Loading preview';
    frame.appendChild(placeholder);

    const label = document.createElement('span');
    label.className = 'preview-label';

    const pageLabel = document.createElement('span');
    pageLabel.textContent = `Page ${pageNumber}`;

    const selectionState = document.createElement('span');
    selectionState.dataset.selectionState = 'true';

    label.append(pageLabel, selectionState);
    button.append(frame, label);
    button.addEventListener('click', () => togglePageSelection(pageNumber));
    previewGrid.appendChild(button);
  }

  renderSelectionState();
}

function getPreviewScale(baseViewport) {
  const widthScale = PREVIEW_TARGET_WIDTH / baseViewport.width;
  const requestedPixels = baseViewport.width * widthScale * baseViewport.height * widthScale;
  if (requestedPixels <= PREVIEW_MAX_PIXELS) return widthScale;

  return Math.sqrt(PREVIEW_MAX_PIXELS / (baseViewport.width * baseViewport.height));
}

async function renderPreviewPage(pageNumber, runId) {
  const button = previewGrid.querySelector(`[data-page="${pageNumber}"]`);
  if (!button || !pdfDoc || runId !== previewRunId) return;

  const frame = button.querySelector('.preview-frame');
  if (!frame) return;

  let page = null;

  try {
    page = await pdfDoc.getPage(pageNumber);
    if (runId !== previewRunId) return;

    const baseViewport = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: getPreviewScale(baseViewport) });
    const canvas = document.createElement('canvas');
    const width = Math.max(1, Math.floor(viewport.width));
    const height = Math.max(1, Math.floor(viewport.height));

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d', { alpha: false });
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);

    await page.render({ canvasContext: context, viewport }).promise;
    if (runId !== previewRunId) return;

    frame.textContent = '';
    frame.appendChild(canvas);
  } catch (err) {
    if (runId !== previewRunId) return;
    frame.textContent = '';

    const failed = document.createElement('span');
    failed.className = 'preview-placeholder';
    failed.textContent = 'Preview failed';
    frame.appendChild(failed);
  } finally {
    if (page) page.cleanup();
  }
}

async function renderPreviewGrid() {
  previewRunId += 1;
  const runId = previewRunId;

  buildPreviewGrid();

  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    if (runId !== previewRunId || !pdfDoc) return;

    previewStatus.textContent = `Rendering preview ${pageNumber} of ${pageCount}...`;
    await renderPreviewPage(pageNumber, runId);
  }

  if (runId === previewRunId) {
    renderSelectionState();
  }
}

function getFormatSettings() {
  const mime = format.value;
  const ext = mime === 'image/jpeg' ? 'jpg' : mime.split('/')[1];
  const imageQuality = mime === 'image/png' ? 1 : Number(quality.value);
  return { mime, ext, imageQuality };
}

function wantsZipDownload(pageTotal) {
  return pageTotal > 1 && downloadMode.value === 'zip';
}

function canEncodeType(mime) {
  if (mime === 'image/png') return true;
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL(mime).startsWith(`data:${mime}`);
}

function getRequestedScale(baseViewport) {
  if (scaleMode.value === 'custom') {
    const width = Number(customMaxWidth.value);
    if (!Number.isFinite(width) || width < 1) {
      throw new Error('Enter a custom max width.');
    }
    return Math.max(0.1, width / baseViewport.width);
  }

  return Number(scaleMode.value) || 1;
}

function getSafeScale(baseViewport) {
  const requestedScale = getRequestedScale(baseViewport);
  const requestedPixels = baseViewport.width * requestedScale * baseViewport.height * requestedScale;

  if (requestedPixels <= MAX_EXPORT_PIXELS) {
    return { scale: requestedScale, wasCapped: false };
  }

  const cappedScale = Math.sqrt(MAX_EXPORT_PIXELS / (baseViewport.width * baseViewport.height));
  return {
    scale: Math.max(0.1, cappedScale),
    wasCapped: true,
  };
}

function canvasToBlob(canvas, mime, imageQuality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Image encoding failed.'));
        return;
      }
      resolve(blob);
    }, mime, imageQuality);
  });
}

async function renderPageToBlob(pageNumber, mime, imageQuality) {
  const page = await pdfDoc.getPage(pageNumber);
  const canvas = document.createElement('canvas');

  try {
    const baseViewport = page.getViewport({ scale: 1 });
    const { scale, wasCapped } = getSafeScale(baseViewport);
    const viewport = page.getViewport({ scale });
    const width = Math.max(1, Math.floor(viewport.width));
    const height = Math.max(1, Math.floor(viewport.height));

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d', { alpha: false });
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);

    await page.render({ canvasContext: context, viewport }).promise;
    const blob = await canvasToBlob(canvas, mime, imageQuality);

    return { blob, width, height, wasCapped };
  } finally {
    page.cleanup();
    canvas.width = 0;
    canvas.height = 0;
  }
}

function updateQualityControls() {
  const isPng = format.value === 'image/png';
  quality.disabled = isPng;
  qualityLabel.textContent = quality.value;
  qualityLabel.style.opacity = isPng ? 0.45 : 1;
}

function updateOutputSummary() {
  updateQualityControls();
  customWidthWrap.hidden = scaleMode.value !== 'custom';

  const buttons = [exportBtn, exportBtnBottom];
  if (!pdfDoc) {
    outputSummary.textContent = 'Load a PDF to start.';
    buttons.forEach((button) => { button.disabled = true; });
    return;
  }

  try {
    const pages = parsePageRange(pageRange.value, pageCount);
    const { ext } = getFormatSettings();
    const unit = pages.length === 1 ? 'image' : 'images';
    const container = wantsZipDownload(pages.length)
      ? 'a ZIP'
      : `${pages.length === 1 ? 'one' : 'separate'} ${ext.toUpperCase()} ${unit}`;
    outputSummary.textContent = `${pages.length} ${unit} will download as ${container}.`;
    buttons.forEach((button) => { button.disabled = isExporting; });
  } catch (err) {
    outputSummary.textContent = err.message;
    buttons.forEach((button) => { button.disabled = true; });
  }
}

function setLargeDocumentWarning() {
  if (pageCount > LARGE_PAGE_COUNT) {
    docWarning.hidden = false;
    docWarning.textContent = `This PDF has ${pageCount} pages. For faster export, choose a smaller page range first.`;
    return;
  }

  docWarning.hidden = true;
  docWarning.textContent = '';
}

function setBusy(busy) {
  isExporting = busy;
  exportBtn.disabled = busy;
  exportBtnBottom.disabled = busy;
  changeFileBtn.disabled = busy;
  renderSelectionState();
  updateOutputSummary();
}

function resetTool(showDropZone) {
  previewRunId += 1;
  if (pdfDoc) {
    try { pdfDoc.destroy(); } catch (err) {}
  }

  pdfDoc = null;
  originalFileName = 'document.pdf';
  pageCount = 0;
  fileSize = 0;
  isExporting = false;
  selectedPages = new Set();
  pdfInput.value = '';
  pageRange.value = 'all';
  previewGrid.textContent = '';
  previewStatus.textContent = 'Page previews will appear here after loading.';
  converter.classList.remove('active');
  docWarning.hidden = true;
  docWarning.textContent = '';
  clearProgress();
  updateOutputSummary();
  renderSelectionState();
  if (showDropZone) dropZone.style.display = '';
}

async function loadPdfFile(file) {
  if (!isPdfFile(file)) {
    flash('Please choose a PDF file.', true);
    return;
  }

  resetTool(false);
  originalFileName = file.name || 'document.pdf';
  fileSize = file.size || 0;
  fileTitle.textContent = originalFileName;
  fileMeta.textContent = `${humanBytes(fileSize)} - Loading...`;
  converter.classList.add('active');
  dropZone.style.display = 'none';
  flash('Opening PDF...');

  try {
    const bytes = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(bytes.slice(0)) });
    pdfDoc = await loadingTask.promise;
    pageCount = pdfDoc.numPages;

    if (!pageCount) throw new Error('PDF has no pages.');

    fileMeta.textContent = `${pageCount} page${pageCount === 1 ? '' : 's'} - ${humanBytes(fileSize)}`;
    setSelectedPages(allPageNumbers(), true);
    setLargeDocumentWarning();
    clearProgress();
    flash('PDF ready.');
    updateOutputSummary();
    renderPreviewGrid();
  } catch (err) {
    resetTool(true);
    flash(friendlyPdfError(err), true);
  }
}

async function exportImages() {
  if (!pdfDoc || isExporting) return;

  let pages;
  let settings;

  try {
    pages = getSelectedPages();
    if (!pages.length) throw new Error('Choose at least one page.');
    settings = getFormatSettings();
    if (!canEncodeType(settings.mime)) {
      throw new Error('This browser cannot create that image format. Choose PNG or JPG.');
    }
  } catch (err) {
    flash(err.message, true);
    updateOutputSummary();
    return;
  }

  setBusy(true);
  clearProgress();
  flash('Converting pages...');

  let cappedCount = 0;

  try {
    if (!wantsZipDownload(pages.length)) {
      for (let index = 0; index < pages.length; index += 1) {
        const pageNumber = pages[index];
        const percent = pages.length === 1 ? 20 : (index / pages.length) * 95;
        updateProgress(percent, `Rendering page ${pageNumber} of ${pageCount}...`);

        const result = await renderPageToBlob(pageNumber, settings.mime, settings.imageQuality);
        if (result.wasCapped) cappedCount += 1;
        updateProgress(((index + 1) / pages.length) * 100, `Downloading page ${pageNumber}...`);
        downloadBlob(result.blob, fileNameForPage(pageNumber, settings.ext));
      }
    } else {
      const zip = new JSZip();

      for (let index = 0; index < pages.length; index += 1) {
        const pageNumber = pages[index];
        const percent = (index / pages.length) * 85;
        updateProgress(percent, `Rendering page ${pageNumber} of ${pageCount}...`);

        const result = await renderPageToBlob(pageNumber, settings.mime, settings.imageQuality);
        if (result.wasCapped) cappedCount += 1;
        zip.file(fileNameForPage(pageNumber, settings.ext), result.blob);
      }

      updateProgress(90, 'Building ZIP...');
      const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
        const percent = 90 + (metadata.percent * 0.1);
        updateProgress(percent, 'Building ZIP...');
      });
      updateProgress(100, 'Downloading ZIP...');
      downloadBlob(zipBlob, zipFileName());
    }

    const capText = cappedCount
      ? ` ${cappedCount} page${cappedCount === 1 ? '' : 's'} were reduced to stay under 16 MP.`
      : '';
    flash(`Done.${capText}`);
  } catch (err) {
    flash('Failed to convert PDF: ' + err.message, true);
  } finally {
    setBusy(false);
    setTimeout(() => {
      if (!isExporting) clearProgress();
    }, 1600);
  }
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
  if (event.dataTransfer.files[0]) loadPdfFile(event.dataTransfer.files[0]);
});

pdfInput.addEventListener('change', (event) => {
  if (event.target.files[0]) loadPdfFile(event.target.files[0]);
});

changeFileBtn.addEventListener('click', () => {
  resetTool(true);
  flash('');
});

exportBtn.addEventListener('click', exportImages);
exportBtnBottom.addEventListener('click', exportImages);
selectAllBtn.addEventListener('click', () => setSelectedPages(allPageNumbers(), true));
clearSelectionBtn.addEventListener('click', () => setSelectedPages([], true));

pageRange.addEventListener('input', syncSelectionFromRange);
pageRange.addEventListener('change', syncSelectionFromRange);

[format, quality, scaleMode, downloadMode, customMaxWidth].forEach((element) => {
  element.addEventListener('input', updateOutputSummary);
  element.addEventListener('change', updateOutputSummary);
});

updateOutputSummary();
renderSelectionState();
