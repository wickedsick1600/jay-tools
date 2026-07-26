(async function startPdfEditor() {
const deadline = Date.now() + 30000;
while (!globalThis.pdfjsLibPromise) {
  if (Date.now() >= deadline) throw new Error('PDF.js did not load in time.');
  await new Promise((resolve) => setTimeout(resolve, 25));
}
await globalThis.pdfjsLibPromise;
const pdfjsLib = globalThis.pdfjsLib;
if (!pdfjsLib) throw new Error('PDF.js is unavailable.');

const PDF_WORKER_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.2.67/legacy/build/pdf.worker.min.mjs';
const MAX_PAGE_WIDTH = 900;
const MIN_PAGE_WIDTH = 280;
const MAX_HISTORY = 60;
const FALLBACK_EXPORT_DPI = 300;
const MAX_FALLBACK_EXPORT_PIXELS = 12000000;
const ELLIPSE_EXPORT_SEGMENTS = 96;
const MIN_PREVIEW_ZOOM = 0.75;
const MAX_PREVIEW_ZOOM = 2.5;
const PREVIEW_ZOOM_STEP = 0.25;
const MIN_PREVIEW_PIXEL_RATIO = 2;
const MAX_PREVIEW_PIXELS = 12000000;

pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;

const dropZone = document.getElementById('drop-zone');
const pdfInput = document.getElementById('pdf-input');
const editor = document.getElementById('editor');
const msg = document.getElementById('msg');
const fileTitle = document.getElementById('file-title');
const fileMeta = document.getElementById('file-meta');
const downloadBtn = document.getElementById('download-btn');
const changeFileBtn = document.getElementById('change-file-btn');
const pageList = document.getElementById('page-list');
const pageStatus = document.getElementById('page-status');
const prevPageBtn = document.getElementById('prev-page-btn');
const nextPageBtn = document.getElementById('next-page-btn');
const zoomOutBtn = document.getElementById('zoom-out-btn');
const zoomInBtn = document.getElementById('zoom-in-btn');
const zoomLabel = document.getElementById('zoom-label');
const pdfCanvas = document.getElementById('pdf-canvas');
const editCanvas = document.getElementById('edit-canvas');
const pageStage = document.getElementById('page-stage');
const canvasScroller = document.querySelector('.canvas-scroller');
const toolColor = document.getElementById('tool-color');
const strokeWidth = document.getElementById('stroke-width');
const textSize = document.getElementById('text-size');
const deleteBtn = document.getElementById('delete-btn');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');
const clearPageBtn = document.getElementById('clear-page-btn');
const signatureInput = document.getElementById('signature-input');
const signaturePanel = document.getElementById('signature-panel');
const signaturePreview = document.getElementById('signature-preview');
const signatureHeading = document.getElementById('signature-heading');
const signatureStatus = document.getElementById('signature-status');
const uploadSignatureBtn = document.getElementById('upload-signature-btn');
const placeSavedSignatureBtn = document.getElementById('place-saved-signature-btn');
const signatureSettingsBtn = document.getElementById('signature-settings-btn');
const replaceSignatureBtn = document.getElementById('replace-signature-btn');
const clearSignatureBtn = document.getElementById('clear-signature-btn');
const removeWhite = document.getElementById('remove-white');
const whiteThreshold = document.getElementById('white-threshold');
const thresholdLabel = document.getElementById('threshold-label');
const doneSignatureBtn = document.getElementById('done-signature-btn');

let pdfDoc = null;
let originalPdfBytes = null;
let originalFileName = 'document.pdf';
let currentPage = 1;
let pageCount = 0;
let fabricCanvas = null;
let activeTool = 'select';
let drawingObject = null;
let startPoint = null;
let pageStates = new Map();
let isRestoring = false;
let isRendering = false;
let renderTask = null;
let signatureImage = null;
let resizeTimer = null;
let previewZoom = 1;

function flash(text, isError) {
  msg.textContent = text;
  msg.className = isError ? 'error' : 'muted';
  if (!isError && text) {
    setTimeout(() => {
      if (msg.textContent === text) msg.textContent = '';
    }, 2600);
  }
}

function humanBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1024 / 1024).toFixed(2) + ' MB';
}

function emptyJson() {
  return { version: fabric.version, objects: [] };
}

function hasObjects(json) {
  return Array.isArray(json?.objects) && json.objects.length > 0;
}

function getPageState(pageNumber) {
  if (!pageStates.has(pageNumber)) {
    const json = emptyJson();
    pageStates.set(pageNumber, {
      json,
      history: [json],
      historyIndex: 0,
      width: 0,
      height: 0,
    });
  }
  return pageStates.get(pageNumber);
}

function safeFileBase(name) {
  return (name || 'document')
    .replace(/\.pdf$/i, '')
    .replace(/[\\/:*?"<>|]+/g, '-')
    .trim() || 'document';
}

function friendlyPdfError(err) {
  if (err?.name === 'PasswordException') {
    return 'That PDF is password-protected. Remove the password and try again.';
  }
  if (err?.name === 'InvalidPDFException') {
    return 'That file does not look like a valid PDF.';
  }
  return 'Failed to open that PDF. Try a different file.';
}

function setBusy(isBusy) {
  isRendering = isBusy;
  prevPageBtn.disabled = isBusy || currentPage <= 1;
  nextPageBtn.disabled = isBusy || currentPage >= pageCount;
  downloadBtn.disabled = isBusy || !pdfDoc;
  updateZoomControls();
}

function getPageRenderWidth() {
  const workspace = document.querySelector('.page-workspace');
  const available = workspace
    ? workspace.clientWidth - 26
    : window.innerWidth - 32;
  const fitWidth = Math.max(MIN_PAGE_WIDTH, Math.min(MAX_PAGE_WIDTH, Math.floor(available)));
  return Math.round(fitWidth * previewZoom);
}

function getPreviewPixelRatio(width, height) {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const desiredRatio = Math.max(MIN_PREVIEW_PIXEL_RATIO, dpr);
  const maxRatio = Math.sqrt(MAX_PREVIEW_PIXELS / Math.max(1, width * height));
  return Math.max(1, Math.min(desiredRatio, maxRatio));
}

function updateZoomControls() {
  zoomLabel.textContent = `${Math.round(previewZoom * 100)}%`;
  zoomOutBtn.disabled = !pdfDoc || isRendering || previewZoom <= MIN_PREVIEW_ZOOM;
  zoomInBtn.disabled = !pdfDoc || isRendering || previewZoom >= MAX_PREVIEW_ZOOM;
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

async function loadPdfFile(file) {
  if (!file || (!file.type.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf'))) {
    flash('Please choose a PDF file.', true);
    return;
  }

  resetEditor(false);
  originalFileName = file.name || 'document.pdf';
  fileTitle.textContent = originalFileName;
  fileMeta.textContent = `${humanBytes(file.size)} - Loading...`;
  flash('Opening PDF...');

  try {
    const bytes = await file.arrayBuffer();
    originalPdfBytes = bytes.slice(0);
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(bytes.slice(0)),
      isEvalSupported: false,
    });
    pdfDoc = await loadingTask.promise;
    pageCount = pdfDoc.numPages;

    if (!pageCount) throw new Error('PDF has no pages.');

    currentPage = 1;
    pageStates = new Map();
    dropZone.style.display = 'none';
    editor.classList.add('active');
    fileMeta.textContent = `${pageCount} page${pageCount === 1 ? '' : 's'} - ${humanBytes(file.size)}`;

    renderPageList();
    await renderPage(1);
    flash('PDF ready.');
  } catch (err) {
    resetEditor(true);
    flash(friendlyPdfError(err), true);
  }
}

function resetEditor(showDropZone) {
  if (renderTask) {
    try { renderTask.cancel(); } catch (err) {}
    renderTask = null;
  }
  if (fabricCanvas) {
    fabricCanvas.dispose();
    fabricCanvas = null;
  }
  pdfDoc = null;
  originalPdfBytes = null;
  currentPage = 1;
  pageCount = 0;
  pageStates = new Map();
  signatureImage = null;
  previewZoom = 1;
  signaturePanel.hidden = true;
  pdfInput.value = '';
  signatureInput.value = '';
  pageList.textContent = '';
  pageStatus.textContent = 'Page 1 of 1';
  pdfCanvas.width = 0;
  pdfCanvas.height = 0;
  pageStage.style.width = '0px';
  pageStage.style.height = '0px';
  editor.classList.remove('active');
  if (showDropZone) dropZone.style.display = '';
  updateSignatureControls();
  updateZoomControls();
  updateHistoryButtons();
}

function renderPageList() {
  pageList.textContent = '';

  for (let i = 1; i <= pageCount; i += 1) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'page-btn';
    button.dataset.page = String(i);

    const label = document.createElement('span');
    label.textContent = `Page ${i}`;
    const dot = document.createElement('span');
    dot.className = 'edited-dot';
    dot.setAttribute('aria-hidden', 'true');

    button.append(label, dot);
    button.addEventListener('click', () => goToPage(i));
    pageList.appendChild(button);
  }

  updatePageList();
}

function updatePageList() {
  pageList.querySelectorAll('.page-btn').forEach((button) => {
    const pageNumber = Number(button.dataset.page);
    const state = pageStates.get(pageNumber);
    button.classList.toggle('active', pageNumber === currentPage);
    button.classList.toggle('edited', hasObjects(state?.json));
  });
}

function updatePageControls() {
  pageStatus.textContent = `Page ${currentPage} of ${pageCount}`;
  prevPageBtn.disabled = isRendering || currentPage <= 1;
  nextPageBtn.disabled = isRendering || currentPage >= pageCount;
  updateZoomControls();
}

async function setPreviewZoom(nextZoom) {
  if (!pdfDoc || isRendering) return;
  const clamped = Math.max(MIN_PREVIEW_ZOOM, Math.min(MAX_PREVIEW_ZOOM, nextZoom));
  if (clamped === previewZoom) return;

  saveCurrentPageState();
  previewZoom = clamped;
  updateZoomControls();
  await renderPage(currentPage);
}

zoomOutBtn.addEventListener('click', () => setPreviewZoom(previewZoom - PREVIEW_ZOOM_STEP));
zoomInBtn.addEventListener('click', () => setPreviewZoom(previewZoom + PREVIEW_ZOOM_STEP));

async function goToPage(pageNumber) {
  if (!pdfDoc || isRendering || pageNumber === currentPage || pageNumber < 1 || pageNumber > pageCount) return;
  saveCurrentPageState();
  currentPage = pageNumber;
  await renderPage(pageNumber);
}

prevPageBtn.addEventListener('click', () => goToPage(currentPage - 1));
nextPageBtn.addEventListener('click', () => goToPage(currentPage + 1));
changeFileBtn.addEventListener('click', () => {
  resetEditor(true);
  flash('');
});

async function renderPage(pageNumber) {
  if (!pdfDoc) return;
  setBusy(true);
  flash(`Rendering page ${pageNumber}...`);

  try {
    const page = await pdfDoc.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = getPageRenderWidth() / baseViewport.width;
    const viewport = page.getViewport({ scale });
    const width = Math.round(viewport.width);
    const height = Math.round(viewport.height);
    const pixelRatio = getPreviewPixelRatio(width, height);
    const renderViewport = page.getViewport({ scale: scale * pixelRatio });

    pageStage.style.width = `${width}px`;
    pageStage.style.height = `${height}px`;
    pdfCanvas.width = Math.round(renderViewport.width);
    pdfCanvas.height = Math.round(renderViewport.height);
    pdfCanvas.style.width = `${width}px`;
    pdfCanvas.style.height = `${height}px`;

    const context = pdfCanvas.getContext('2d', { alpha: false });
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, pdfCanvas.width, pdfCanvas.height);

    if (renderTask) {
      try { renderTask.cancel(); } catch (err) {}
    }
    renderTask = page.render({ canvasContext: context, viewport: renderViewport });
    await renderTask.promise;
    renderTask = null;

    ensureFabricCanvas(width, height);
    const state = getPageState(pageNumber);
    await loadStateIntoCanvas(state, width, height);
    state.width = width;
    state.height = height;
    state.json = fabricCanvas.toJSON();
    state.history[state.historyIndex] = state.json;

    setTool(activeTool);
    updatePageControls();
    updatePageList();
    flash('');
  } catch (err) {
    if (err?.name !== 'RenderingCancelledException') {
      flash('Failed to render this page.', true);
    }
  } finally {
    setBusy(false);
    updateHistoryButtons();
  }
}

function ensureFabricCanvas(width, height) {
  if (!fabricCanvas) {
    fabricCanvas = new fabric.Canvas(editCanvas, {
      width,
      height,
      backgroundColor: 'rgba(0,0,0,0)',
      preserveObjectStacking: true,
      selection: true,
      allowTouchScrolling: true,
    });
    wireFabricCanvas();
  } else {
    fabricCanvas.setDimensions({ width, height });
  }

  syncFabricLayer(width, height);
}

function syncFabricLayer(width, height) {
  const elements = [
    fabricCanvas.wrapperEl,
    fabricCanvas.lowerCanvasEl,
    fabricCanvas.upperCanvasEl,
  ];

  elements.forEach((element) => {
    if (!element) return;
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.style.maxWidth = 'none';
  });

  fabricCanvas.wrapperEl.style.position = 'absolute';
  fabricCanvas.wrapperEl.style.left = '0';
  fabricCanvas.wrapperEl.style.top = '0';
  fabricCanvas.wrapperEl.style.zIndex = '3';
  fabricCanvas.wrapperEl.style.pointerEvents = 'auto';

  fabricCanvas.lowerCanvasEl.style.pointerEvents = 'none';
  fabricCanvas.upperCanvasEl.style.pointerEvents = 'auto';
  fabricCanvas.upperCanvasEl.style.touchAction = 'none';
  fabricCanvas.upperCanvasEl.style.webkitUserSelect = 'none';
  fabricCanvas.upperCanvasEl.style.userSelect = 'none';

  fabricCanvas.calcOffset();
  applyCanvasInteractionMode();
}

function loadStateIntoCanvas(state, targetWidth, targetHeight) {
  return new Promise((resolve) => {
    isRestoring = true;
    const sourceWidth = state.width;
    const sourceHeight = state.height;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = 'rgba(0,0,0,0)';

    if (!hasObjects(state.json)) {
      fabricCanvas.requestRenderAll();
      isRestoring = false;
      resolve();
      return;
    }

    fabricCanvas.loadFromJSON(state.json, () => {
      scaleObjectsToCanvas(sourceWidth, sourceHeight, targetWidth, targetHeight);
      fabricCanvas.requestRenderAll();
      isRestoring = false;
      resolve();
    });
  });
}

function scaleObjectsToCanvas(sourceWidth, sourceHeight, targetWidth, targetHeight) {
  scaleCanvasObjects(fabricCanvas, sourceWidth, sourceHeight, targetWidth, targetHeight);
}

function scaleCanvasObjects(canvas, sourceWidth, sourceHeight, targetWidth, targetHeight) {
  if (!sourceWidth || !sourceHeight) return;
  if (sourceWidth === targetWidth && sourceHeight === targetHeight) return;

  const scaleX = targetWidth / sourceWidth;
  const scaleY = targetHeight / sourceHeight;
  canvas.getObjects().forEach((object) => {
    object.set({
      left: (object.left || 0) * scaleX,
      top: (object.top || 0) * scaleY,
      scaleX: (object.scaleX || 1) * scaleX,
      scaleY: (object.scaleY || 1) * scaleY,
    });
    object.setCoords();
  });
}

function saveCurrentPageState() {
  if (!fabricCanvas || !pdfDoc || isRestoring) return;
  const state = getPageState(currentPage);
  state.json = fabricCanvas.toJSON();
  state.width = fabricCanvas.getWidth();
  state.height = fabricCanvas.getHeight();
  updatePageList();
}

function recordHistory() {
  if (!fabricCanvas || isRestoring || isRendering) return;

  const state = getPageState(currentPage);
  const json = fabricCanvas.toJSON();
  const last = state.history[state.historyIndex];

  state.json = json;
  state.width = fabricCanvas.getWidth();
  state.height = fabricCanvas.getHeight();

  if (JSON.stringify(last) !== JSON.stringify(json)) {
    state.history = state.history.slice(0, state.historyIndex + 1);
    state.history.push(json);
    if (state.history.length > MAX_HISTORY) state.history.shift();
    state.historyIndex = state.history.length - 1;
  }

  updateHistoryButtons();
  updatePageList();
}

function updateHistoryButtons() {
  const state = pageStates.get(currentPage);
  undoBtn.disabled = !state || state.historyIndex <= 0;
  redoBtn.disabled = !state || state.historyIndex >= state.history.length - 1;
}

async function restoreHistory(offset) {
  const state = getPageState(currentPage);
  const nextIndex = state.historyIndex + offset;
  if (nextIndex < 0 || nextIndex >= state.history.length) return;

  state.historyIndex = nextIndex;
  state.json = state.history[nextIndex];
  await loadStateIntoCanvas(state, state.width, state.height);
  setTool(activeTool);
  updateHistoryButtons();
  updatePageList();
}

undoBtn.addEventListener('click', () => restoreHistory(-1));
redoBtn.addEventListener('click', () => restoreHistory(1));

function setTool(tool) {
  activeTool = tool;
  document.querySelectorAll('.tool-btn[data-tool]').forEach((button) => {
    button.classList.toggle('active', button.dataset.tool === tool);
  });

  if (!fabricCanvas) return;

  const isSelect = tool === 'select';
  const isDraw = tool === 'draw';
  const isPan = tool === 'pan';

  fabricCanvas.isDrawingMode = isDraw;
  fabricCanvas.selection = isSelect;
  fabricCanvas.allowTouchScrolling = isPan;
  fabricCanvas.skipTargetFind = !isSelect;
  fabricCanvas.defaultCursor = isPan ? 'grab' : (isSelect ? 'default' : 'crosshair');
  fabricCanvas.forEachObject((object) => {
    object.selectable = isSelect;
    object.evented = isSelect;
  });

  if (isDraw) {
    fabricCanvas.freeDrawingBrush.color = toolColor.value;
    fabricCanvas.freeDrawingBrush.width = getStrokeWidth();
  }

  if (!isSelect) fabricCanvas.discardActiveObject();
  applyCanvasInteractionMode();
  fabricCanvas.requestRenderAll();
  fabricCanvas.calcOffset();
}

function applyCanvasInteractionMode() {
  if (!fabricCanvas) return;
  const isPan = activeTool === 'pan';
  const touchAction = isPan ? 'pan-x pan-y' : 'none';
  const pointerEvents = isPan ? 'none' : 'auto';

  pageStage.style.touchAction = touchAction;
  fabricCanvas.wrapperEl.style.pointerEvents = pointerEvents;
  fabricCanvas.upperCanvasEl.style.pointerEvents = pointerEvents;
  fabricCanvas.upperCanvasEl.style.touchAction = touchAction;
}

document.querySelectorAll('.tool-btn[data-tool]').forEach((button) => {
  button.addEventListener('click', () => setTool(button.dataset.tool));
});

function getStrokeWidth() {
  return Math.max(1, Math.min(30, parseInt(strokeWidth.value, 10) || 3));
}

function getTextSize() {
  return Math.max(8, Math.min(120, parseInt(textSize.value, 10) || 24));
}

function wireFabricCanvas() {
  fabricCanvas.on('object:modified', recordHistory);
  fabricCanvas.on('path:created', (event) => {
    if (event.path) {
      event.path.set({
        selectable: activeTool === 'select',
        evented: activeTool === 'select',
      });
    }
    recordHistory();
  });
  fabricCanvas.on('text:editing:exited', recordHistory);

  fabricCanvas.on('mouse:down', (event) => {
    if (activeTool === 'select' || activeTool === 'draw') return;
    const point = fabricCanvas.getPointer(event.e);
    startPoint = point;

    if (activeTool === 'text') {
      const text = new fabric.IText('Type here', {
        left: point.x,
        top: point.y,
        fill: toolColor.value,
        fontFamily: 'Arial',
        fontSize: getTextSize(),
      });
      fabricCanvas.add(text);
      fabricCanvas.setActiveObject(text);
      setTool('select');
      text.enterEditing();
      text.selectAll();
      recordHistory();
      return;
    }

    const stroke = toolColor.value;
    const width = getStrokeWidth();

    if (activeTool === 'rect') {
      drawingObject = new fabric.Rect({
        left: point.x,
        top: point.y,
        width: 1,
        height: 1,
        fill: 'rgba(0,0,0,0)',
        stroke,
        strokeWidth: width,
        selectable: false,
        evented: false,
      });
    } else if (activeTool === 'ellipse') {
      drawingObject = new fabric.Ellipse({
        left: point.x,
        top: point.y,
        rx: 1,
        ry: 1,
        fill: 'rgba(0,0,0,0)',
        stroke,
        strokeWidth: width,
        selectable: false,
        evented: false,
      });
    } else if (activeTool === 'line') {
      drawingObject = new fabric.Line([point.x, point.y, point.x, point.y], {
        stroke,
        strokeWidth: width,
        selectable: false,
        evented: false,
      });
    }

    if (drawingObject) fabricCanvas.add(drawingObject);
  });

  fabricCanvas.on('mouse:move', (event) => {
    if (!drawingObject || !startPoint) return;
    const point = fabricCanvas.getPointer(event.e);

    if (drawingObject.type === 'rect') {
      drawingObject.set({
        left: Math.min(point.x, startPoint.x),
        top: Math.min(point.y, startPoint.y),
        width: Math.abs(point.x - startPoint.x),
        height: Math.abs(point.y - startPoint.y),
      });
    } else if (drawingObject.type === 'ellipse') {
      drawingObject.set({
        left: Math.min(point.x, startPoint.x),
        top: Math.min(point.y, startPoint.y),
        rx: Math.abs(point.x - startPoint.x) / 2,
        ry: Math.abs(point.y - startPoint.y) / 2,
      });
    } else if (drawingObject.type === 'line') {
      drawingObject.set({ x2: point.x, y2: point.y });
    }

    drawingObject.setCoords();
    fabricCanvas.requestRenderAll();
  });

  fabricCanvas.on('mouse:up', () => {
    if (drawingObject) {
      drawingObject.setCoords();
      drawingObject.set({
        selectable: true,
        evented: true,
      });
      fabricCanvas.setActiveObject(drawingObject);
      setTool('select');
      recordHistory();
    }
    drawingObject = null;
    startPoint = null;
  });
}

toolColor.addEventListener('input', () => {
  if (fabricCanvas?.isDrawingMode) fabricCanvas.freeDrawingBrush.color = toolColor.value;
});
toolColor.addEventListener('change', applySelectedStyle);
strokeWidth.addEventListener('change', applySelectedStyle);
textSize.addEventListener('change', applySelectedStyle);

function applySelectedStyle() {
  if (!fabricCanvas) return;
  const object = fabricCanvas.getActiveObject();
  if (!object) return;

  if (object.type === 'i-text' || object.type === 'text') {
    object.set({
      fill: toolColor.value,
      fontSize: getTextSize(),
    });
  } else if (object.type === 'line' || object.type === 'path') {
    object.set({
      stroke: toolColor.value,
      strokeWidth: getStrokeWidth(),
    });
  } else if (object.type === 'rect' || object.type === 'ellipse') {
    object.set({
      stroke: toolColor.value,
      strokeWidth: getStrokeWidth(),
    });
  }

  object.setCoords();
  fabricCanvas.requestRenderAll();
  recordHistory();
}

deleteBtn.addEventListener('click', deleteSelected);
clearPageBtn.addEventListener('click', () => {
  if (!fabricCanvas || !fabricCanvas.getObjects().length) return;
  if (!confirm('Remove all text, shapes, drawings, and signatures from this page?')) return;
  fabricCanvas.getObjects().forEach((object) => fabricCanvas.remove(object));
  fabricCanvas.discardActiveObject();
  fabricCanvas.requestRenderAll();
  recordHistory();
});

function deleteSelected() {
  if (!fabricCanvas) return;
  const active = fabricCanvas.getActiveObjects();
  if (!active.length) return;
  active.forEach((object) => fabricCanvas.remove(object));
  fabricCanvas.discardActiveObject();
  fabricCanvas.requestRenderAll();
  recordHistory();
}

document.addEventListener('keydown', (event) => {
  if (!fabricCanvas || !editor.classList.contains('active')) return;
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  const active = fabricCanvas.getActiveObject();
  if (active?.isEditing) return;

  const key = event.key.toLowerCase();
  if (event.ctrlKey || event.metaKey) {
    if (key === 'z' && !event.shiftKey) {
      event.preventDefault();
      restoreHistory(-1);
    } else if (key === 'y' || (key === 'z' && event.shiftKey)) {
      event.preventDefault();
      restoreHistory(1);
    }
  } else if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault();
    deleteSelected();
  }
});

uploadSignatureBtn.addEventListener('click', handleSignatureSettingsButton);
placeSavedSignatureBtn.addEventListener('click', placeSignatureOnPage);
signatureSettingsBtn.addEventListener('click', () => {
  signaturePanel.hidden = false;
});
replaceSignatureBtn.addEventListener('click', openSignaturePicker);
clearSignatureBtn.addEventListener('click', clearSavedSignature);
signatureInput.addEventListener('change', (event) => {
  if (event.target.files[0]) loadSignatureImage(event.target.files[0]);
});
removeWhite.addEventListener('change', updateSignaturePreview);
whiteThreshold.addEventListener('input', updateSignaturePreview);
doneSignatureBtn.addEventListener('click', () => {
  signaturePanel.hidden = true;
});

function openSignaturePicker() {
  signatureInput.value = '';
  signatureInput.click();
}

function handleSignatureSettingsButton() {
  if (signatureImage) {
    signaturePanel.hidden = false;
  } else {
    openSignaturePicker();
  }
}

function clearSavedSignature() {
  signatureImage = null;
  signaturePanel.hidden = true;
  signatureInput.value = '';
  const context = signaturePreview.getContext('2d');
  context.clearRect(0, 0, signaturePreview.width, signaturePreview.height);
  updateSignatureControls();
  flash('Saved signature cleared.');
}

function updateSignatureControls() {
  const hasSignature = !!signatureImage;
  signatureHeading.textContent = hasSignature ? 'Signature ready' : 'Signature';
  uploadSignatureBtn.hidden = hasSignature;
  placeSavedSignatureBtn.hidden = !hasSignature;
  signatureSettingsBtn.hidden = !hasSignature;
  replaceSignatureBtn.hidden = !hasSignature;
  clearSignatureBtn.hidden = !hasSignature;
  signatureStatus.textContent = hasSignature
    ? 'Use Place signature to stamp it anywhere in this PDF.'
    : 'Upload once, then place it anywhere in this PDF.';
}

function loadSignatureImage(file) {
  if (!file.type.startsWith('image/')) {
    flash('Please choose an image file for the signature.', true);
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      signatureImage = img;
      signaturePanel.hidden = false;
      updateSignaturePreview();
      updateSignatureControls();
      flash('Signature image ready.');
    };
    img.onerror = () => flash('Could not read that signature image.', true);
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function getProcessedSignatureCanvas() {
  if (!signatureImage) return null;
  const canvas = document.createElement('canvas');
  canvas.width = signatureImage.naturalWidth || signatureImage.width;
  canvas.height = signatureImage.naturalHeight || signatureImage.height;
  const context = canvas.getContext('2d');
  context.drawImage(signatureImage, 0, 0, canvas.width, canvas.height);

  if (removeWhite.checked) {
    const threshold = Number(whiteThreshold.value);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] >= threshold && data[i + 1] >= threshold && data[i + 2] >= threshold) {
        data[i + 3] = 0;
      }
    }
    context.putImageData(imageData, 0, 0);
  }

  return canvas;
}

function updateSignaturePreview() {
  thresholdLabel.textContent = whiteThreshold.value;
  const processed = getProcessedSignatureCanvas();
  const context = signaturePreview.getContext('2d');
  context.clearRect(0, 0, signaturePreview.width, signaturePreview.height);
  if (!processed) return;

  const scale = Math.min(
    signaturePreview.width / processed.width,
    signaturePreview.height / processed.height,
    1
  );
  const width = processed.width * scale;
  const height = processed.height * scale;
  const x = (signaturePreview.width - width) / 2;
  const y = (signaturePreview.height - height) / 2;
  context.drawImage(processed, x, y, width, height);
}

function placeSignatureOnPage() {
  if (!fabricCanvas || !signatureImage) return;
  const processed = getProcessedSignatureCanvas();
  if (!processed) return;

  const dataUrl = processed.toDataURL('image/png');
  fabric.Image.fromURL(dataUrl, (image) => {
    const maxWidth = fabricCanvas.getWidth() * 0.35;
    const maxHeight = fabricCanvas.getHeight() * 0.18;
    const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
    const signatureCount = fabricCanvas.getObjects().filter((object) => object.type === 'image').length;
    const offset = (signatureCount % 5) * 18;
    image.set({
      left: 36 + offset,
      top: 36 + offset,
      scaleX: scale,
      scaleY: scale,
      selectable: true,
      evented: true,
    });
    fabricCanvas.add(image);
    fabricCanvas.setActiveObject(image);
    setTool('select');
    updateSignatureControls();
    recordHistory();
    flash('Signature placed. You can place it again without reuploading.');
  });
}

window.addEventListener('resize', () => {
  if (!pdfDoc || isRendering) return;
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    saveCurrentPageState();
    renderPage(currentPage);
  }, 250);
});

function refreshCanvasOffset() {
  if (fabricCanvas) fabricCanvas.calcOffset();
}

window.addEventListener('scroll', refreshCanvasOffset, true);
canvasScroller.addEventListener('scroll', refreshCanvasOffset);

downloadBtn.addEventListener('click', exportEditedPdf);

async function exportEditedPdf() {
  if (!originalPdfBytes || !pdfDoc) return;

  saveCurrentPageState();
  downloadBtn.disabled = true;
  flash('Preparing edited PDF...');

  try {
    const editedPageNumbers = [];
    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const state = pageStates.get(pageNumber);
      if (state && hasObjects(state.json) && state.width && state.height) {
        editedPageNumbers.push(pageNumber);
      }
    }

    if (!editedPageNumbers.length) {
      const originalBytes = new Uint8Array(originalPdfBytes.slice(0));
      downloadBlob(new Blob([originalBytes], { type: 'application/pdf' }), originalFileName);
      flash('Downloaded the original PDF unchanged.');
      return;
    }

    const outPdf = await PDFLib.PDFDocument.load(originalPdfBytes.slice(0), {
      updateMetadata: false,
    });
    const exportContext = {
      outPdf,
      font: null,
      fontCharacterSet: null,
      images: new Map(),
      fallbackCount: 0,
    };

    for (const pageNumber of editedPageNumbers) {
      const state = pageStates.get(pageNumber);
      flash(`Adding edits to page ${pageNumber} of ${pageCount}...`);
      const page = outPdf.getPage(pageNumber - 1);
      const sourcePage = await pdfDoc.getPage(pageNumber);
      const viewport = sourcePage.getViewport({ scale: 1 });
      const exportCanvas = await loadFabricCanvasForExport(state);

      try {
        for (const object of exportCanvas.getObjects()) {
          const exported = await exportFabricObject(object, page, state, viewport, exportContext);
          if (!exported) {
            await exportObjectAsLocalizedRaster(object, page, state, viewport, exportContext);
            exportContext.fallbackCount += 1;
          }
        }
      } finally {
        exportCanvas.dispose();
        if (typeof sourcePage.cleanup === 'function') sourcePage.cleanup();
      }
    }

    const outputBytes = await outPdf.save({ useObjectStreams: false });
    const blob = new Blob([outputBytes], { type: 'application/pdf' });
    downloadBlob(blob, `${safeFileBase(originalFileName)}-edited-juankit.pdf`);
    if (exportContext.fallbackCount) {
      flash(`Downloaded edited PDF. ${exportContext.fallbackCount} complex edit(s) used a localized high-resolution fallback (up to 300 DPI).`);
    } else {
      flash('Downloaded edited PDF with vector-quality edits.');
    }
  } catch (err) {
    flash('Failed to export PDF: ' + err.message, true);
  } finally {
    downloadBtn.disabled = false;
    updatePageControls();
  }
}

function loadFabricCanvasForExport(state) {
  return new Promise((resolve, reject) => {
    const element = document.createElement('canvas');
    const canvas = new fabric.StaticCanvas(element, {
      width: state.width,
      height: state.height,
      backgroundColor: 'rgba(0,0,0,0)',
      enableRetinaScaling: false,
      renderOnAddRemove: false,
    });

    try {
      canvas.loadFromJSON(state.json, () => {
        canvas.renderAll();
        resolve(canvas);
      });
    } catch (err) {
      canvas.dispose();
      reject(err);
    }
  });
}

async function exportFabricObject(object, page, state, viewport, context) {
  if (object.visible === false || object.opacity === 0) return true;
  if (hasRasterOnlyEffect(object)) return false;

  try {
    switch (object.type) {
      case 'i-text':
      case 'text':
      case 'textbox':
        return await exportTextObject(object, page, state, viewport, context);
      case 'rect':
        return exportRectObject(object, page, state, viewport);
      case 'ellipse':
        return exportEllipseObject(object, page, state, viewport);
      case 'line':
        return exportLineObject(object, page, state, viewport);
      case 'path':
        return exportPathObject(object, page, state, viewport);
      case 'image':
        return await exportImageObject(object, page, state, viewport, context);
      default:
        return false;
    }
  } catch (err) {
    console.warn(`Using localized raster fallback for ${object.type || 'unknown'} edit.`, err);
    return false;
  }
}

function hasRasterOnlyEffect(object) {
  if (object.shadow || object.clipPath) return true;
  const composite = object.globalCompositeOperation;
  return Boolean(composite && composite !== 'source-over');
}

function exportRectObject(object, page, state, viewport) {
  if ((object.rx || 0) !== 0 || (object.ry || 0) !== 0 || hasVisibleFill(object)) return false;
  const stroke = getStrokeStyle(object, state, viewport);
  if (!stroke) return !hasVisibleStroke(object);
  if (hasUnsupportedStroke(object)) return false;

  const halfWidth = (object.width || 0) / 2;
  const halfHeight = (object.height || 0) / 2;
  const points = [
    transformObjectPoint(object, -halfWidth, -halfHeight),
    transformObjectPoint(object, halfWidth, -halfHeight),
    transformObjectPoint(object, halfWidth, halfHeight),
    transformObjectPoint(object, -halfWidth, halfHeight),
  ].map((point) => canvasPointToPdf(point, state, viewport));
  points.push(points[0]);
  drawPdfPolyline(page, points, stroke, false);
  return true;
}

function exportEllipseObject(object, page, state, viewport) {
  if (hasVisibleFill(object)) return false;
  const stroke = getStrokeStyle(object, state, viewport);
  if (!stroke) return !hasVisibleStroke(object);
  if (hasUnsupportedStroke(object)) return false;

  const rx = Number(object.rx) || (object.width || 0) / 2;
  const ry = Number(object.ry) || (object.height || 0) / 2;
  const points = [];
  for (let index = 0; index <= ELLIPSE_EXPORT_SEGMENTS; index += 1) {
    const angle = (index / ELLIPSE_EXPORT_SEGMENTS) * Math.PI * 2;
    const canvasPoint = transformObjectPoint(object, Math.cos(angle) * rx, Math.sin(angle) * ry);
    points.push(canvasPointToPdf(canvasPoint, state, viewport));
  }
  drawPdfPolyline(page, points, stroke, true);
  return true;
}

function exportLineObject(object, page, state, viewport) {
  const stroke = getStrokeStyle(object, state, viewport);
  if (!stroke) return !hasVisibleStroke(object);
  if (hasUnsupportedStroke(object)) return false;
  const line = typeof object.calcLinePoints === 'function'
    ? object.calcLinePoints()
    : { x1: object.x1, y1: object.y1, x2: object.x2, y2: object.y2 };
  const points = [
    transformObjectPoint(object, line.x1, line.y1),
    transformObjectPoint(object, line.x2, line.y2),
  ].map((point) => canvasPointToPdf(point, state, viewport));
  drawPdfPolyline(page, points, stroke, object.strokeLineCap === 'round');
  return true;
}

function exportPathObject(object, page, state, viewport) {
  if (hasVisibleFill(object) || hasUnsupportedStroke(object)) return false;
  const stroke = getStrokeStyle(object, state, viewport);
  if (!stroke) return !hasVisibleStroke(object);
  const polylines = flattenFabricPath(object.path);
  if (!polylines) return false;
  const offset = object.pathOffset || { x: 0, y: 0 };

  for (const polyline of polylines) {
    const points = polyline.map((point) => {
      const canvasPoint = transformObjectPoint(object, point.x - offset.x, point.y - offset.y);
      return canvasPointToPdf(canvasPoint, state, viewport);
    });
    drawPdfPolyline(page, points, stroke, object.strokeLineCap !== 'butt');
  }
  return true;
}

async function exportTextObject(object, page, state, viewport, context) {
  if (!isPlainTextObject(object)) return false;
  const fill = parsePdfColor(object.fill);
  if (!fill || fill.alpha <= 0) return true;

  if (!context.font) {
    context.font = await context.outPdf.embedFont(PDFLib.StandardFonts.Helvetica);
    context.fontCharacterSet = new Set(context.font.getCharacterSet());
  }

  const origin = localPointToPdf(object, 0, 0, state, viewport);
  const xUnit = localPointToPdf(object, 1, 0, state, viewport);
  const yDownUnit = localPointToPdf(object, 0, 1, state, viewport);
  const xVector = subtractPoints(xUnit, origin);
  const yUpVector = subtractPoints(origin, yDownUnit);
  const xScale = pointLength(xVector);
  const yScale = pointLength(yUpVector);
  if (!xScale || !yScale) return true;

  const orthogonality = Math.abs(dotPoints(xVector, yUpVector)) / (xScale * yScale);
  const scaleDifference = Math.abs(xScale - yScale) / Math.max(xScale, yScale);
  const determinant = crossPoints(xVector, yUpVector);
  if (orthogonality > 0.01 || scaleDifference > 0.03 || determinant <= 0) return false;

  const lines = Array.isArray(object._textLines)
    ? object._textLines.map((line) => Array.isArray(line) ? line.join('') : String(line))
    : String(object.text || '').split(/\r?\n/);
  if (lines.some((line) => Array.from(line).some((character) => !context.fontCharacterSet.has(character.codePointAt(0))))) {
    return false;
  }
  const lineHeight = Number(object.lineHeight) || 1.16;
  let lineTop = typeof object._getTopOffset === 'function'
    ? object._getTopOffset()
    : -(object.height || object.fontSize || 0) / 2;
  const leftOffset = typeof object._getLeftOffset === 'function'
    ? object._getLeftOffset()
    : -(object.width || 0) / 2;
  const rotation = PDFLib.degrees(Math.atan2(xVector.y, xVector.x) * 180 / Math.PI);
  const fontSize = Math.max(0.1, (Number(object.fontSize) || 16) * ((xScale + yScale) / 2));
  const opacity = clampOpacity((Number(object.opacity) || 1) * fill.alpha);

  for (let index = 0; index < lines.length; index += 1) {
    const text = lines[index];
    const heightOfLine = typeof object.getHeightOfLine === 'function'
      ? object.getHeightOfLine(index)
      : (Number(object.fontSize) || 16) * lineHeight;
    const maxHeight = heightOfLine / lineHeight;
    const lineLeft = leftOffset + (typeof object._getLineLeftOffset === 'function'
      ? object._getLineLeftOffset(index)
      : 0);
    const baseline = localPointToPdf(object, lineLeft, lineTop + maxHeight, state, viewport);

    if (text) {
      context.font.encodeText(text);
      page.drawText(text, {
        x: baseline.x,
        y: baseline.y,
        size: fontSize,
        font: context.font,
        color: fill.color,
        opacity,
        rotate: rotation,
      });
    }
    lineTop += heightOfLine;
  }
  return true;
}

function isPlainTextObject(object) {
  const family = String(object.fontFamily || 'Arial').toLowerCase();
  const weight = String(object.fontWeight || 'normal').toLowerCase();
  const style = String(object.fontStyle || 'normal').toLowerCase();
  const hasStyles = object.styles && Object.keys(object.styles).length > 0;
  const allowedFamily = family === 'arial' || family === 'helvetica' || family === 'sans-serif';
  const allowedWeight = weight === 'normal' || weight === '400';
  return allowedFamily
    && allowedWeight
    && style === 'normal'
    && !hasStyles
    && !object.path
    && !object.stroke
    && !object.underline
    && !object.overline
    && !object.linethrough
    && !object.textBackgroundColor
    && !object.backgroundColor
    && !(Number(object.charSpacing) || 0)
    && !String(object.text || '').includes('\t');
}

async function exportImageObject(object, page, state, viewport, context) {
  if (object.flipX || object.flipY || object.clipPath || object.filters?.length) return false;
  if ((Number(object.cropX) || 0) !== 0 || (Number(object.cropY) || 0) !== 0) return false;
  const source = typeof object.getSrc === 'function' ? object.getSrc() : object.src;
  const data = decodeImageDataUrl(source);
  if (!data) return false;

  let image = context.images.get(source);
  if (!image) {
    image = data.type === 'image/jpeg'
      ? await context.outPdf.embedJpg(data.bytes)
      : await context.outPdf.embedPng(data.bytes);
    context.images.set(source, image);
  }

  return drawEmbeddedImageForObject(image, object, page, state, viewport);
}

function drawEmbeddedImageForObject(image, object, page, state, viewport) {
  const halfWidth = (object.width || 0) / 2;
  const halfHeight = (object.height || 0) / 2;
  const corners = {
    tl: localPointToPdf(object, -halfWidth, -halfHeight, state, viewport),
    tr: localPointToPdf(object, halfWidth, -halfHeight, state, viewport),
    br: localPointToPdf(object, halfWidth, halfHeight, state, viewport),
    bl: localPointToPdf(object, -halfWidth, halfHeight, state, viewport),
  };
  return drawEmbeddedImageAtPdfCorners(image, corners, page, Number(object.opacity) || 1);
}

function drawEmbeddedImageAtCanvasRect(image, rect, page, state, viewport, opacity) {
  const corners = {
    tl: canvasPointToPdf({ x: rect.left, y: rect.top }, state, viewport),
    tr: canvasPointToPdf({ x: rect.right, y: rect.top }, state, viewport),
    br: canvasPointToPdf({ x: rect.right, y: rect.bottom }, state, viewport),
    bl: canvasPointToPdf({ x: rect.left, y: rect.bottom }, state, viewport),
  };
  return drawEmbeddedImageAtPdfCorners(image, corners, page, opacity);
}

function drawEmbeddedImageAtPdfCorners(image, corners, page, opacity) {
  const xVector = subtractPoints(corners.br, corners.bl);
  const yVector = subtractPoints(corners.tl, corners.bl);
  const width = pointLength(xVector);
  const height = pointLength(yVector);
  if (!width || !height) return true;
  const orthogonality = Math.abs(dotPoints(xVector, yVector)) / (width * height);
  if (orthogonality > 0.01 || crossPoints(xVector, yVector) <= 0) return false;

  page.drawImage(image, {
    x: corners.bl.x,
    y: corners.bl.y,
    width,
    height,
    rotate: PDFLib.degrees(Math.atan2(xVector.y, xVector.x) * 180 / Math.PI),
    opacity: clampOpacity(opacity),
  });
  return true;
}

async function exportObjectAsLocalizedRaster(object, page, state, viewport, context) {
  object.setCoords();
  const rawBounds = object.getBoundingRect(true, true);
  const padding = Math.max(2, (Number(object.strokeWidth) || 0) * 2);
  const rect = {
    left: Math.max(0, rawBounds.left - padding),
    top: Math.max(0, rawBounds.top - padding),
    right: Math.min(state.width, rawBounds.left + rawBounds.width + padding),
    bottom: Math.min(state.height, rawBounds.top + rawBounds.height + padding),
  };
  const width = rect.right - rect.left;
  const height = rect.bottom - rect.top;
  if (width <= 0 || height <= 0) return;

  const pdfUnitsPerCanvasPixel = ((viewport.width / state.width) + (viewport.height / state.height)) / 2;
  let multiplier = Math.max(1, pdfUnitsPerCanvasPixel * FALLBACK_EXPORT_DPI / 72);
  const desiredPixels = width * height * multiplier * multiplier;
  if (desiredPixels > MAX_FALLBACK_EXPORT_PIXELS) {
    multiplier *= Math.sqrt(MAX_FALLBACK_EXPORT_PIXELS / desiredPixels);
  }

  const outputWidth = Math.max(1, Math.ceil(width * multiplier));
  const outputHeight = Math.max(1, Math.ceil(height * multiplier));
  const element = document.createElement('canvas');
  const canvas = new fabric.StaticCanvas(element, {
    width: outputWidth,
    height: outputHeight,
    backgroundColor: 'rgba(0,0,0,0)',
    enableRetinaScaling: false,
    renderOnAddRemove: false,
  });

  try {
    const clone = await cloneFabricObject(object);
    clone.set({
      left: (Number(object.left) - rect.left) * multiplier,
      top: (Number(object.top) - rect.top) * multiplier,
      scaleX: (Number(object.scaleX) || 1) * multiplier,
      scaleY: (Number(object.scaleY) || 1) * multiplier,
      selectable: false,
      evented: false,
    });
    clone.setCoords();
    canvas.add(clone);
    canvas.renderAll();
    const pngBytes = new Uint8Array(dataUrlToArrayBuffer(canvas.toDataURL({ format: 'png', multiplier: 1 })));
    const image = await context.outPdf.embedPng(pngBytes);
    if (!drawEmbeddedImageAtCanvasRect(image, rect, page, state, viewport, 1)) {
      throw new Error('Could not map localized raster edit to the PDF page.');
    }
  } finally {
    canvas.dispose();
    element.width = 1;
    element.height = 1;
  }
}

function cloneFabricObject(object) {
  return new Promise((resolve, reject) => {
    try {
      let resolved = false;
      const result = object.clone((clone) => {
        resolved = true;
        resolve(clone);
      });
      if (result && typeof result.then === 'function') {
        result.then((clone) => {
          if (!resolved) resolve(clone);
        }, reject);
      }
    } catch (err) {
      reject(err);
    }
  });
}

function canvasPointToPdf(point, state, viewport) {
  const viewportX = point.x * viewport.width / state.width;
  const viewportY = point.y * viewport.height / state.height;
  const converted = viewport.convertToPdfPoint(viewportX, viewportY);
  return { x: converted[0], y: converted[1] };
}

function transformObjectPoint(object, x, y) {
  return fabric.util.transformPoint(new fabric.Point(x, y), object.calcTransformMatrix());
}

function localPointToPdf(object, x, y, state, viewport) {
  return canvasPointToPdf(transformObjectPoint(object, x, y), state, viewport);
}

function subtractPoints(first, second) {
  return { x: first.x - second.x, y: first.y - second.y };
}

function pointLength(point) {
  return Math.hypot(point.x, point.y);
}

function dotPoints(first, second) {
  return first.x * second.x + first.y * second.y;
}

function crossPoints(first, second) {
  return first.x * second.y - first.y * second.x;
}

function hasUnsupportedStroke(object) {
  return Boolean(object.strokeDashArray?.length || object.strokeDashOffset);
}

function hasVisibleStroke(object) {
  const stroke = parsePdfColor(object.stroke);
  return Boolean(stroke && stroke.alpha > 0 && (Number(object.strokeWidth) || 0) > 0);
}

function hasVisibleFill(object) {
  const fill = parsePdfColor(object.fill);
  return Boolean(fill && fill.alpha > 0);
}

function getStrokeStyle(object, state, viewport) {
  const parsed = parsePdfColor(object.stroke);
  if (!parsed || parsed.alpha <= 0 || (Number(object.strokeWidth) || 0) <= 0) return null;

  let scale = 1;
  if (!object.strokeUniform) {
    const origin = transformObjectPoint(object, 0, 0);
    const xUnit = transformObjectPoint(object, 1, 0);
    const yUnit = transformObjectPoint(object, 0, 1);
    scale = Math.sqrt(pointLength(subtractPoints(xUnit, origin)) * pointLength(subtractPoints(yUnit, origin)));
  }
  const pdfUnitsPerCanvasPixel = ((viewport.width / state.width) + (viewport.height / state.height)) / 2;
  return {
    color: parsed.color,
    opacity: clampOpacity(parsed.alpha * (Number(object.opacity) || 1)),
    thickness: Math.max(0.1, (Number(object.strokeWidth) || 1) * scale * pdfUnitsPerCanvasPixel),
  };
}

function drawPdfPolyline(page, points, stroke, roundCaps) {
  if (stroke.opacity >= 0.999999 && points.length > 1) {
    const lineCap = roundCaps ? PDFLib.LineCapStyle.Round : PDFLib.LineCapStyle.Butt;
    const lineJoin = roundCaps ? PDFLib.LineJoinStyle.Round : PDFLib.LineJoinStyle.Miter;
    const operators = [
      PDFLib.pushGraphicsState(),
      PDFLib.setStrokingColor(stroke.color),
      PDFLib.setLineWidth(stroke.thickness),
      PDFLib.setLineCap(lineCap),
      PDFLib.setLineJoin(lineJoin),
      PDFLib.setDashPattern([], 0),
      PDFLib.moveTo(points[0].x, points[0].y),
    ];
    for (let index = 1; index < points.length; index += 1) {
      if (pointLength(subtractPoints(points[index], points[index - 1])) >= 0.0001) {
        operators.push(PDFLib.lineTo(points[index].x, points[index].y));
      }
    }
    operators.push(PDFLib.stroke(), PDFLib.popGraphicsState());
    page.pushOperators(...operators);
    return;
  }

  for (let index = 1; index < points.length; index += 1) {
    const start = points[index - 1];
    const end = points[index];
    if (pointLength(subtractPoints(end, start)) < 0.0001) continue;
    const options = {
      start,
      end,
      thickness: stroke.thickness,
      color: stroke.color,
      opacity: stroke.opacity,
    };
    if (roundCaps && PDFLib.LineCapStyle?.Round !== undefined) {
      options.lineCap = PDFLib.LineCapStyle.Round;
    }
    page.drawLine(options);
  }
}

function parsePdfColor(value) {
  if (!value || value === 'transparent') return { color: PDFLib.rgb(0, 0, 0), alpha: 0 };
  const text = String(value).trim().toLowerCase();
  const named = {
    black: '#000000',
    white: '#ffffff',
    red: '#ff0000',
    green: '#008000',
    blue: '#0000ff',
  };
  const normalized = named[text] || text;
  let match = normalized.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (match) {
    let hex = match[1];
    if (hex.length === 3) hex = hex.split('').map((char) => char + char).join('');
    const hasAlpha = hex.length === 8;
    const red = parseInt(hex.slice(0, 2), 16);
    const green = parseInt(hex.slice(2, 4), 16);
    const blue = parseInt(hex.slice(4, 6), 16);
    const alpha = hasAlpha ? parseInt(hex.slice(6, 8), 16) / 255 : 1;
    return { color: PDFLib.rgb(red / 255, green / 255, blue / 255), alpha };
  }

  match = normalized.match(/^rgba?\(\s*([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/);
  if (!match) return null;
  const alpha = match[4]
    ? (match[4].endsWith('%') ? parseFloat(match[4]) / 100 : parseFloat(match[4]))
    : 1;
  return {
    color: PDFLib.rgb(Math.min(255, Number(match[1])) / 255, Math.min(255, Number(match[2])) / 255, Math.min(255, Number(match[3])) / 255),
    alpha: clampOpacity(alpha),
  };
}

function clampOpacity(value) {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 1));
}

function decodeImageDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string') return null;
  const match = dataUrl.match(/^data:(image\/(?:png|jpeg));base64,(.+)$/i);
  if (!match) return null;
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return { type: match[1].toLowerCase(), bytes };
}

function flattenFabricPath(path) {
  if (!Array.isArray(path)) return null;
  const polylines = [];
  let points = [];
  let current = { x: 0, y: 0 };
  let start = null;
  let previousCommand = '';
  let lastCubicControl = null;
  let lastQuadraticControl = null;

  const addPoint = (point) => {
    const last = points[points.length - 1];
    if (!last || last.x !== point.x || last.y !== point.y) points.push(point);
    current = point;
  };
  const finish = () => {
    if (points.length > 1) polylines.push(points);
    points = [];
  };

  for (const segment of path) {
    const command = String(segment[0] || '');
    if (command !== command.toUpperCase()) return null;
    if (command === 'M') {
      finish();
      addPoint({ x: Number(segment[1]), y: Number(segment[2]) });
      start = { ...current };
    } else if (command === 'L') {
      addPoint({ x: Number(segment[1]), y: Number(segment[2]) });
    } else if (command === 'H') {
      addPoint({ x: Number(segment[1]), y: current.y });
    } else if (command === 'V') {
      addPoint({ x: current.x, y: Number(segment[1]) });
    } else if (command === 'C' || command === 'S') {
      const control1 = command === 'C'
        ? { x: Number(segment[1]), y: Number(segment[2]) }
        : reflectControl((previousCommand === 'C' || previousCommand === 'S') ? lastCubicControl : current, current);
      const control2 = command === 'C'
        ? { x: Number(segment[3]), y: Number(segment[4]) }
        : { x: Number(segment[1]), y: Number(segment[2]) };
      const end = command === 'C'
        ? { x: Number(segment[5]), y: Number(segment[6]) }
        : { x: Number(segment[3]), y: Number(segment[4]) };
      const origin = { ...current };
      const steps = curveStepCount([origin, control1, control2, end]);
      for (let step = 1; step <= steps; step += 1) {
        addPoint(cubicBezierPoint(origin, control1, control2, end, step / steps));
      }
      lastCubicControl = control2;
      lastQuadraticControl = null;
    } else if (command === 'Q' || command === 'T') {
      const control = command === 'Q'
        ? { x: Number(segment[1]), y: Number(segment[2]) }
        : reflectControl((previousCommand === 'Q' || previousCommand === 'T') ? lastQuadraticControl : current, current);
      const end = command === 'Q'
        ? { x: Number(segment[3]), y: Number(segment[4]) }
        : { x: Number(segment[1]), y: Number(segment[2]) };
      const origin = { ...current };
      const steps = curveStepCount([origin, control, end]);
      for (let step = 1; step <= steps; step += 1) {
        addPoint(quadraticBezierPoint(origin, control, end, step / steps));
      }
      lastQuadraticControl = control;
      lastCubicControl = null;
    } else if (command === 'Z') {
      if (start) addPoint({ ...start });
      finish();
      start = null;
    } else {
      return null;
    }

    if (command !== 'C' && command !== 'S') lastCubicControl = null;
    if (command !== 'Q' && command !== 'T') lastQuadraticControl = null;
    previousCommand = command;
  }
  finish();
  return polylines;
}

function reflectControl(control, around) {
  return { x: around.x * 2 - control.x, y: around.y * 2 - control.y };
}

function curveStepCount(points) {
  let length = 0;
  for (let index = 1; index < points.length; index += 1) {
    length += pointLength(subtractPoints(points[index], points[index - 1]));
  }
  return Math.max(12, Math.min(96, Math.ceil(length / 4)));
}

function cubicBezierPoint(start, control1, control2, end, time) {
  const inverse = 1 - time;
  return {
    x: inverse ** 3 * start.x + 3 * inverse ** 2 * time * control1.x + 3 * inverse * time ** 2 * control2.x + time ** 3 * end.x,
    y: inverse ** 3 * start.y + 3 * inverse ** 2 * time * control1.y + 3 * inverse * time ** 2 * control2.y + time ** 3 * end.y,
  };
}

function quadraticBezierPoint(start, control, end, time) {
  const inverse = 1 - time;
  return {
    x: inverse ** 2 * start.x + 2 * inverse * time * control.x + time ** 2 * end.x,
    y: inverse ** 2 * start.y + 2 * inverse * time * control.y + time ** 2 * end.y,
  };
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

function dataUrlToArrayBuffer(dataUrl) {
  const base64 = dataUrl.split(',')[1] || '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

updateSignatureControls();
updateZoomControls();
updateHistoryButtons();
})().catch((error) => {
  console.error('PDF Editor failed to start:', error);
  const message = document.getElementById('msg');
  if (message) {
    message.textContent = 'The PDF engine could not start. Check your connection and reload the page.';
    message.classList.add('error');
  }
});
