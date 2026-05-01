const PDF_WORKER_URL = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const MAX_PAGE_WIDTH = 900;
const MIN_PAGE_WIDTH = 280;
const MAX_HISTORY = 60;
const EXPORT_OVERLAY_SCALE = 2;
const MAX_EXPORT_OVERLAY_PIXELS = 8000000;
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
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(bytes.slice(0)) });
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
    const outPdf = await PDFLib.PDFDocument.load(originalPdfBytes.slice(0));

    for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
      const state = pageStates.get(pageNumber);
      if (!state || !hasObjects(state.json) || !state.width || !state.height) continue;

      flash(`Adding edits to page ${pageNumber} of ${pageCount}...`);
      const page = outPdf.getPage(pageNumber - 1);
      const size = page.getSize();
      const overlaySize = getExportOverlaySize(size.width, size.height);
      const overlayBytes = await renderOverlayPng(state, overlaySize.width, overlaySize.height);
      const overlayImage = await outPdf.embedPng(overlayBytes);
      page.drawImage(overlayImage, {
        x: 0,
        y: 0,
        width: size.width,
        height: size.height,
      });
    }

    const outputBytes = await outPdf.save();
    const blob = new Blob([outputBytes], { type: 'application/pdf' });
    downloadBlob(blob, `${safeFileBase(originalFileName)}-edited.pdf`);
    flash('Downloaded edited PDF.');
  } catch (err) {
    flash('Failed to export PDF: ' + err.message, true);
  } finally {
    downloadBtn.disabled = false;
    updatePageControls();
  }
}

function getExportOverlaySize(pageWidth, pageHeight) {
  const maxScale = Math.sqrt(MAX_EXPORT_OVERLAY_PIXELS / (pageWidth * pageHeight));
  const scale = Math.max(1, Math.min(EXPORT_OVERLAY_SCALE, maxScale));
  return {
    width: Math.max(1, Math.round(pageWidth * scale)),
    height: Math.max(1, Math.round(pageHeight * scale)),
  };
}

function renderOverlayPng(state, targetWidth, targetHeight) {
  return new Promise((resolve, reject) => {
    const overlayCanvas = document.createElement('canvas');
    const staticCanvas = new fabric.StaticCanvas(overlayCanvas, {
      width: targetWidth,
      height: targetHeight,
      backgroundColor: 'rgba(0,0,0,0)',
    });

    staticCanvas.loadFromJSON(state.json, async () => {
      try {
        scaleCanvasObjects(staticCanvas, state.width, state.height, targetWidth, targetHeight);
        staticCanvas.renderAll();
        const dataUrl = staticCanvas.toDataURL({ format: 'png', multiplier: 1 });
        const bytes = dataUrlToArrayBuffer(dataUrl);
        staticCanvas.dispose();
        resolve(bytes);
      } catch (err) {
        staticCanvas.dispose();
        reject(err);
      }
    });
  });
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
