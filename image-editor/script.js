const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const editor = document.getElementById('editor');
const canvasEl = document.getElementById('canvas');
const canvasWrap = document.getElementById('canvas-wrap');
const previewFitBtn = document.getElementById('preview-fit-btn');
const previewActualBtn = document.getElementById('preview-actual-btn');
const previewInfo = document.getElementById('preview-info');
const fillColor = document.getElementById('fill-color');
const textOptions = document.getElementById('text-options');
const fontFamily = document.getElementById('font-family');
const fontSize = document.getElementById('font-size');
const fontBold = document.getElementById('font-bold');
const fontItalic = document.getElementById('font-italic');
const deleteBtn = document.getElementById('delete-btn');
const clearBtn = document.getElementById('clear-btn');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');
const rotateLeftBtn = document.getElementById('rotate-left-btn');
const rotateRightBtn = document.getElementById('rotate-right-btn');
const flipXBtn = document.getElementById('flip-x-btn');
const flipYBtn = document.getElementById('flip-y-btn');
const brightnessEl = document.getElementById('brightness');
const contrastEl = document.getElementById('contrast');
const saturationEl = document.getElementById('saturation');
const resetFiltersBtn = document.getElementById('reset-filters-btn');
const outWidth = document.getElementById('out-width');
const outHeight = document.getElementById('out-height');
const lockRatio = document.getElementById('lock-ratio');
const quality = document.getElementById('quality');
const qualityLabel = document.getElementById('quality-label');
const format = document.getElementById('format');
const originalFormatOption = document.getElementById('original-format-option');
const formatHelp = document.getElementById('format-help');
const downloadBtn = document.getElementById('download-btn');
const resetBtn = document.getElementById('reset-btn');
const stats = document.getElementById('stats');
const msg = document.getElementById('msg');
const cropActionsEl = document.getElementById('crop-actions');
const applyCropBtn = document.getElementById('apply-crop-btn');
const cancelCropBtn = document.getElementById('cancel-crop-btn');

const MAX_CANVAS_W = 900;
const MAX_EXPORT_PIXELS = 16000000;

let canvas = null;
let originalFile = null;
let originalImage = null;
let originalMimeType = '';
let sourceWidth = 0;
let sourceHeight = 0;
let sourceImageChanged = false;
let displayScale = 1;
let previewMode = 'fit';
let activeTool = 'select';
let drawing = null;
let startPt = null;
let cropSelection = null;
let cropDrag = null;
let historyStack = [];
let historyIndex = -1;
let isRestoringHistory = false;

function flash(text, isError) {
  msg.textContent = text;
  msg.className = isError ? 'error' : 'muted';
  if (!isError) setTimeout(() => { if (msg.textContent === text) msg.textContent = ''; }, 2500);
}

function humanBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1024 / 1024).toFixed(2) + ' MB';
}

const ENCODABLE_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

function normalizeMimeType(type) {
  const normalized = String(type || '').toLowerCase();
  return normalized === 'image/jpg' ? 'image/jpeg' : normalized;
}

function inferMimeType(file) {
  const fromFile = normalizeMimeType(file?.type);
  if (fromFile) return fromFile;
  const extension = (file?.name || '').split('.').pop().toLowerCase();
  return {
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
  }[extension] || '';
}

function formatName(type) {
  return {
    'image/png': 'PNG',
    'image/jpeg': 'JPEG',
    'image/webp': 'WebP',
    'image/gif': 'GIF',
    'image/bmp': 'BMP',
    'image/svg+xml': 'SVG',
  }[normalizeMimeType(type)] || 'original format';
}

function getResolvedOutputType() {
  if (format.value !== 'original') return normalizeMimeType(format.value);
  return ENCODABLE_IMAGE_TYPES.has(originalMimeType) ? originalMimeType : 'image/png';
}

function updateFormatUi() {
  const sourceName = formatName(originalMimeType);
  originalFormatOption.textContent = originalMimeType
    ? `Same as original (${sourceName}, recommended)`
    : 'Same as original (recommended)';

  const outputType = getResolvedOutputType();
  const isLossy = outputType === 'image/jpeg' || outputType === 'image/webp';
  quality.disabled = !isLossy;
  qualityLabel.style.opacity = isLossy ? 1 : 0.4;

  if (format.value === 'original' && !ENCODABLE_IMAGE_TYPES.has(originalMimeType)) {
    formatHelp.textContent = `Untouched ${sourceName} files keep their original bytes. Edited images export as lossless PNG.`;
  } else if (format.value === 'original') {
    formatHelp.textContent = `Untouched ${sourceName} files keep their original bytes. Edited images are encoded once.`;
  } else if (outputType === 'image/png') {
    formatHelp.textContent = 'PNG is lossless. Edited images are encoded once in your browser.';
  } else {
    formatHelp.textContent = `${formatName(outputType)} is lossy. Edited images are encoded once using the quality setting.`;
  }
}

function fitScaleFor(width) {
  return width > MAX_CANVAS_W ? MAX_CANVAS_W / width : 1;
}

function updatePreviewInfo() {
  if (!canvas || !originalImage) {
    previewInfo.textContent = '';
    return;
  }
  const percent = Math.round(displayScale * 100);
  const previewW = Math.round(originalImage.width * displayScale);
  const previewH = Math.round(originalImage.height * displayScale);
  const targetW = Math.max(1, parseInt(outWidth.value, 10) || originalImage.width);
  const targetH = Math.max(1, parseInt(outHeight.value, 10) || originalImage.height);
  const label = previewMode === 'actual' ? '100% preview' : `Fit preview at ${percent}%`;
  previewInfo.textContent = `${label}: ${previewW}×${previewH}px on screen. Export: ${targetW}×${targetH}px.`;
}

function scaleSerializedObject(object, factor) {
  ['left', 'top', 'scaleX', 'scaleY'].forEach((key) => {
    if (typeof object[key] === 'number') object[key] *= factor;
  });
}

function setPreviewMode(mode) {
  previewMode = mode === 'actual' ? 'actual' : 'fit';
  previewFitBtn.setAttribute('aria-pressed', String(previewMode === 'fit'));
  previewActualBtn.setAttribute('aria-pressed', String(previewMode === 'actual'));
  canvasWrap.classList.toggle('actual-size', previewMode === 'actual');

  if (!canvas || !originalImage) {
    updatePreviewInfo();
    return;
  }

  const nextScale = previewMode === 'actual' ? 1 : fitScaleFor(originalImage.width);
  if (Math.abs(nextScale - displayScale) < 0.000001) {
    updatePreviewInfo();
    return;
  }

  const factor = nextScale / displayScale;
  canvas.discardActiveObject();
  canvas.getObjects().forEach((object) => {
    object.set({
      left: object.left * factor,
      top: object.top * factor,
      scaleX: object.scaleX * factor,
      scaleY: object.scaleY * factor,
    });
    object.setCoords();
  });
  if (canvas.backgroundImage) {
    canvas.backgroundImage.set({
      scaleX: canvas.backgroundImage.scaleX * factor,
      scaleY: canvas.backgroundImage.scaleY * factor,
    });
  }
  historyStack.forEach((state) => {
    (state.objects || []).forEach((object) => scaleSerializedObject(object, factor));
  });

  displayScale = nextScale;
  canvas.setDimensions({
    width: Math.round(originalImage.width * displayScale),
    height: Math.round(originalImage.height * displayScale),
  });
  canvas.calcOffset();
  canvas.requestRenderAll();
  updatePreviewInfo();
}

function updateHistoryButtons() {
  undoBtn.disabled = historyIndex <= 0;
  redoBtn.disabled = historyIndex >= historyStack.length - 1;
}

function getBgState() {
  const bg = canvas?.backgroundImage;
  return {
    angle: bg?.angle || 0,
    flipX: !!bg?.flipX,
    flipY: !!bg?.flipY,
    brightness: Number(brightnessEl.value),
    contrast: Number(contrastEl.value),
    saturation: Number(saturationEl.value),
  };
}

function normalizedAngle(angle) {
  return ((Number(angle) % 360) + 360) % 360;
}

function isDocumentPristine() {
  if (!canvas || !originalImage || sourceImageChanged) return false;
  const bg = getBgState();
  const hasVisibleEdits = canvas.getObjects().some((object) => !object.cropOverlay);
  return !hasVisibleEdits &&
    normalizedAngle(bg.angle) === 0 &&
    !bg.flipX &&
    !bg.flipY &&
    bg.brightness === 0 &&
    bg.contrast === 0 &&
    bg.saturation === 0;
}

function saveHistory() {
  if (!canvas || isRestoringHistory) return;
  const state = {
    objects: canvas.getObjects().filter((o) => !o.cropOverlay).map((o) => o.toObject()),
    bg: getBgState(),
  };
  historyStack = historyStack.slice(0, historyIndex + 1);
  historyStack.push(state);
  historyIndex = historyStack.length - 1;
  updateHistoryButtons();
}

function applyBackgroundAdjustments() {
  if (!canvas?.backgroundImage) return;
  const bg = canvas.backgroundImage;
  const filters = [];
  const brightness = Number(brightnessEl.value);
  const contrast = Number(contrastEl.value);
  const saturation = Number(saturationEl.value);
  if (brightness !== 0) filters.push(new fabric.Image.filters.Brightness({ brightness }));
  if (contrast !== 0) filters.push(new fabric.Image.filters.Contrast({ contrast }));
  if (saturation !== 0) filters.push(new fabric.Image.filters.Saturation({ saturation }));
  bg.filters = filters;
  bg.applyFilters();
  canvas.requestRenderAll();
}

function restoreHistoryState(state) {
  if (!canvas || !state) return;
  isRestoringHistory = true;
  canvas.getObjects().forEach((o) => canvas.remove(o));
  fabric.util.enlivenObjects(state.objects || [], (objects) => {
    objects.forEach((o) => canvas.add(o));
    if (canvas.backgroundImage) {
      canvas.backgroundImage.set({
        angle: state.bg?.angle || 0,
        flipX: !!state.bg?.flipX,
        flipY: !!state.bg?.flipY,
      });
    }
    brightnessEl.value = state.bg?.brightness ?? 0;
    contrastEl.value = state.bg?.contrast ?? 0;
    saturationEl.value = state.bg?.saturation ?? 0;
    applyBackgroundAdjustments();
    canvas.requestRenderAll();
    isRestoringHistory = false;
  });
}

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') fileInput.click(); });
dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('dragover');
  if (e.dataTransfer.files[0]) loadFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', (e) => { if (e.target.files[0]) loadFile(e.target.files[0]); });

document.addEventListener('paste', (e) => {
  if (editor.classList.contains('active') && canvas) {
    const active = canvas.getActiveObject();
    if (active?.isEditing) return;
  }
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

  const items = e.clipboardData?.items || [];
  let file = null;
  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    if (it.kind === 'file' && it.type.startsWith('image/')) {
      file = it.getAsFile();
      break;
    }
  }
  if (!file && e.clipboardData?.files?.length) {
    const f = e.clipboardData.files[0];
    if (f.type.startsWith('image/')) file = f;
  }
  if (file) {
    e.preventDefault();
    loadFile(file);
    flash('Image pasted from clipboard.');
  }
});

function removeCropOverlay() {
  if (!canvas) return;
  if (cropSelection) {
    canvas.remove(cropSelection);
    cropSelection = null;
  }
  if (cropDrag) {
    canvas.remove(cropDrag);
    cropDrag = null;
  }
  updateCropActionsVisibility();
  canvas.requestRenderAll();
}

function updateCropActionsVisibility() {
  if (!cropActionsEl || !applyCropBtn) return;
  const has = !!cropSelection;
  cropActionsEl.classList.toggle('show', has);
  applyCropBtn.disabled = !has;
}

function canvasToBlob(sourceCanvas, type, blobQuality) {
  return new Promise((resolve, reject) => {
    sourceCanvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('The browser could not create the image file.'));
        return;
      }
      const actualType = normalizeMimeType(blob.type);
      if (actualType !== normalizeMimeType(type)) {
        reject(new Error(`${formatName(type)} export is not supported by this browser.`));
        return;
      }
      resolve(blob);
    }, type, blobQuality);
  });
}

function fabricImageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(blob);
    fabric.Image.fromURL(objectUrl, (image, isError) => {
      URL.revokeObjectURL(objectUrl);
      if (isError || !image) {
        reject(new Error('The browser could not decode the rendered image.'));
        return;
      }
      resolve(image);
    });
  });
}

async function applyCrop() {
  if (!canvas || !originalImage || !cropSelection) return;

  const br = cropSelection.getBoundingRect(true);
  let left = Math.max(0, Math.floor(br.left));
  let top = Math.max(0, Math.floor(br.top));
  let width = Math.ceil(br.width);
  let height = Math.ceil(br.height);
  left = Math.min(left, canvas.width - 1);
  top = Math.min(top, canvas.height - 1);
  width = Math.min(width, canvas.width - left);
  height = Math.min(height, canvas.height - top);

  if (width < 4 || height < 4) {
    flash('Crop area too small.', true);
    return;
  }

  canvas.remove(cropSelection);
  cropSelection = null;
  updateCropActionsVisibility();
  canvas.discardActiveObject();
  canvas.requestRenderAll();

  const mult = originalImage.width / canvas.width;
  const destW = Math.round(width * mult);
  const destH = Math.round(height * mult);

  if (destW < 1 || destH < 1) {
    flash('Crop area too small.', true);
    return;
  }
  if (destW * destH > MAX_EXPORT_PIXELS) {
    flash('Cropped image too large (max 16 MP).', true);
    return;
  }

  try {
    const fullCanvas = renderExportCanvas(
      Math.round(originalImage.width),
      Math.round(originalImage.height),
    );
    const sx = Math.round(left * mult);
    const sy = Math.round(top * mult);
    let sw = Math.round(width * mult);
    let sh = Math.round(height * mult);
    sw = Math.min(sw, fullCanvas.width - sx);
    sh = Math.min(sh, fullCanvas.height - sy);
    if (sw < 1 || sh < 1) throw new Error('Invalid crop region.');

    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = sw;
    croppedCanvas.height = sh;
    const croppedContext = croppedCanvas.getContext('2d');
    croppedContext.imageSmoothingEnabled = true;
    croppedContext.imageSmoothingQuality = 'high';
    croppedContext.drawImage(fullCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
    fullCanvas.width = 1;
    fullCanvas.height = 1;

    const croppedBlob = await canvasToBlob(croppedCanvas, 'image/png', 1);
    croppedCanvas.width = 1;
    croppedCanvas.height = 1;
    const newImg = await fabricImageFromBlob(croppedBlob);
    originalImage = newImg;
    sourceImageChanged = true;
    const w = newImg.width;
    const h = newImg.height;
    displayScale = previewMode === 'actual' ? 1 : fitScaleFor(w);
    const displayW = Math.round(w * displayScale);
    const displayH = Math.round(h * displayScale);

    isRestoringHistory = true;
    canvas.clear();
    canvas.setDimensions({ width: displayW, height: displayH });

    newImg.set({
      selectable: false,
      evented: false,
      scaleX: displayScale,
      scaleY: displayScale,
      left: 0,
      top: 0,
    });
    canvas.setBackgroundImage(newImg, canvas.renderAll.bind(canvas));

    brightnessEl.value = 0;
    contrastEl.value = 0;
    saturationEl.value = 0;
    applyBackgroundAdjustments();

    outWidth.value = w;
    outHeight.value = h;
    stats.textContent = `Source: ${w}×${h} (cropped)`;

    historyStack = [];
    historyIndex = -1;
    isRestoringHistory = false;
    saveHistory();
    setTool('select');
    setPreviewMode(previewMode);
    updateFormatUi();
    flash('Crop applied.');
  } catch (err) {
    flash('Crop failed: ' + (err && err.message ? err.message : String(err)), true);
    isRestoringHistory = false;
  }
}

function loadFile(file) {
  const mimeType = inferMimeType(file);
  if (!mimeType.startsWith('image/')) { flash('That file is not an image.', true); return; }

  const objectUrl = URL.createObjectURL(file);
  try {
    fabric.Image.fromURL(objectUrl, (img, isError) => {
      URL.revokeObjectURL(objectUrl);
      if (isError || !img) {
        flash('The browser could not decode that image.', true);
        return;
      }
      originalFile = file;
      originalMimeType = mimeType;
      sourceWidth = img.width;
      sourceHeight = img.height;
      sourceImageChanged = false;
      previewMode = 'fit';
      cropSelection = null;
      cropDrag = null;
      updateCropActionsVisibility();
      originalImage = img;
      const w = img.width;
      const h = img.height;
      const pixels = w * h;
      if (pixels > 24000000) {
        flash('Very large image detected. Export is capped at 16 MP to avoid crashes.', true);
      }
      displayScale = fitScaleFor(w);
      const displayW = Math.round(w * displayScale);
      const displayH = Math.round(h * displayScale);

      if (canvas) canvas.dispose();
      canvas = new fabric.Canvas(canvasEl, {
        width: displayW,
        height: displayH,
        backgroundColor: '#ffffff',
        preserveObjectStacking: true,
      });

      img.set({
        selectable: false,
        evented: false,
        scaleX: displayScale,
        scaleY: displayScale,
        left: 0,
        top: 0,
      });
      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));

      outWidth.value = w;
      outHeight.value = h;
      format.value = 'original';

      dropZone.style.display = 'none';
      editor.classList.add('active');
      stats.textContent = `Source: ${w}×${h} · ${formatName(originalMimeType)} · ${humanBytes(file.size)}`;
      setTool('select');
      wireCanvas();
      historyStack = [];
      historyIndex = -1;
      brightnessEl.value = 0;
      contrastEl.value = 0;
      saturationEl.value = 0;
      saveHistory();
      setPreviewMode('fit');
      updateFormatUi();
    });
  } catch (err) {
    URL.revokeObjectURL(objectUrl);
    flash('The browser could not decode that image.', true);
  }
}

function setTool(tool) {
  activeTool = tool;
  document.querySelectorAll('.tool-btn[data-tool]').forEach(b => {
    b.classList.toggle('active', b.dataset.tool === tool);
  });
  textOptions.classList.toggle('show', tool === 'text');

  if (!canvas) return;

  canvas.isDrawingMode = (tool === 'draw');
  if (tool === 'draw') {
    canvas.freeDrawingBrush.color = fillColor.value;
    canvas.freeDrawingBrush.width = 3;
  }
  const selectLike = tool === 'select';
  canvas.selection = selectLike;
  canvas.forEachObject((o) => {
    o.selectable = selectLike;
  });
  canvas.defaultCursor = selectLike ? 'default' : 'crosshair';
}

document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
  btn.addEventListener('click', () => setTool(btn.dataset.tool));
});

fillColor.addEventListener('change', () => {
  if (canvas && canvas.isDrawingMode) canvas.freeDrawingBrush.color = fillColor.value;
  const active = canvas?.getActiveObject();
  if (active?.cropOverlay) return;
  if (active) {
    if (active.type === 'line') active.set('stroke', fillColor.value);
    else if (active.type === 'i-text' || active.type === 'text') active.set('fill', fillColor.value);
    else active.set('fill', fillColor.value);
    canvas.requestRenderAll();
  }
});

function wireCanvas() {
  canvas.on('object:modified', saveHistory);
  canvas.on('object:added', (e) => {
    if (e.target?.cropOverlay) return;
    saveHistory();
  });
  canvas.on('object:removed', (e) => {
    if (e.target?.cropOverlay) return;
    saveHistory();
  });
  canvas.on('path:created', saveHistory);
  canvas.on('text:editing:exited', saveHistory);

  canvas.on('mouse:down', (e) => {
    if (activeTool === 'select' || activeTool === 'draw') return;

    if (activeTool === 'crop') {
      if (e.target?.cropOverlay) {
        setTool('select');
        canvas.setActiveObject(e.target);
        canvas.requestRenderAll();
        return;
      }
      removeCropOverlay();
      const p = canvas.getPointer(e.e);
      startPt = p;
      cropDrag = new fabric.Rect({
        left: p.x,
        top: p.y,
        width: 1,
        height: 1,
        fill: 'rgba(0,0,0,0.12)',
        stroke: '#22c55e',
        strokeWidth: 2,
        strokeDashArray: [8, 5],
        selectable: false,
        evented: false,
        lockRotation: true,
      });
      cropDrag.cropOverlay = true;
      canvas.add(cropDrag);
      canvas.bringToFront(cropDrag);
      return;
    }

    const p = canvas.getPointer(e.e);
    startPt = p;

    if (activeTool === 'rect') {
      drawing = new fabric.Rect({
        left: p.x, top: p.y, width: 1, height: 1,
        fill: 'transparent', stroke: fillColor.value, strokeWidth: 3,
      });
    } else if (activeTool === 'circle') {
      drawing = new fabric.Ellipse({
        left: p.x, top: p.y, rx: 1, ry: 1,
        fill: 'transparent', stroke: fillColor.value, strokeWidth: 3,
      });
    } else if (activeTool === 'line') {
      drawing = new fabric.Line([p.x, p.y, p.x, p.y], {
        stroke: fillColor.value, strokeWidth: 3,
      });
    } else if (activeTool === 'text') {
      const weight = fontBold.checked ? 'bold' : 'normal';
      const style = fontItalic.checked ? 'italic' : 'normal';
      const t = new fabric.IText('Type here', {
        left: p.x, top: p.y,
        fontFamily: fontFamily.value,
        fontSize: parseInt(fontSize.value, 10) || 32,
        fontWeight: weight,
        fontStyle: style,
        fill: fillColor.value,
      });
      canvas.add(t);
      canvas.setActiveObject(t);
      t.enterEditing();
      t.selectAll();
      setTool('select');
      drawing = null;
      saveHistory();
      return;
    }

    if (drawing) canvas.add(drawing);
  });

  canvas.on('mouse:move', (e) => {
    if (cropDrag && startPt) {
      const p = canvas.getPointer(e.e);
      cropDrag.set({
        left: Math.min(p.x, startPt.x),
        top: Math.min(p.y, startPt.y),
        width: Math.abs(p.x - startPt.x),
        height: Math.abs(p.y - startPt.y),
      });
      canvas.requestRenderAll();
      return;
    }
    if (!drawing || !startPt) return;
    const p = canvas.getPointer(e.e);

    if (drawing.type === 'rect') {
      drawing.set({
        left: Math.min(p.x, startPt.x),
        top: Math.min(p.y, startPt.y),
        width: Math.abs(p.x - startPt.x),
        height: Math.abs(p.y - startPt.y),
      });
    } else if (drawing.type === 'ellipse') {
      drawing.set({
        left: Math.min(p.x, startPt.x),
        top: Math.min(p.y, startPt.y),
        rx: Math.abs(p.x - startPt.x) / 2,
        ry: Math.abs(p.y - startPt.y) / 2,
      });
    } else if (drawing.type === 'line') {
      drawing.set({ x2: p.x, y2: p.y });
    }
    canvas.requestRenderAll();
  });

  canvas.on('mouse:up', () => {
    if (cropDrag) {
      cropDrag.setCoords();
      const br = cropDrag.getBoundingRect(true);
      if (br.width < 4 || br.height < 4) {
        canvas.remove(cropDrag);
        cropDrag = null;
        startPt = null;
        updateCropActionsVisibility();
        return;
      }
      cropSelection = cropDrag;
      cropDrag = null;
      startPt = null;
      cropSelection.set({ lockRotation: true, evented: true });
      cropSelection.setCoords();
      canvas.bringToFront(cropSelection);
      canvas.requestRenderAll();
      updateCropActionsVisibility();
      return;
    }
    if (drawing) { drawing.setCoords(); drawing = null; }
    startPt = null;
  });
}

deleteBtn.addEventListener('click', () => {
  if (!canvas) return;
  const active = canvas.getActiveObjects();
  if (active.length) {
    active.forEach(o => canvas.remove(o));
    if (active.some((o) => o === cropSelection)) {
      cropSelection = null;
      updateCropActionsVisibility();
    }
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  }
});

applyCropBtn.addEventListener('click', () => applyCrop());

cancelCropBtn.addEventListener('click', () => {
  removeCropOverlay();
  flash('Crop cancelled.');
});

clearBtn.addEventListener('click', () => {
  if (!canvas) return;
  if (!confirm('Remove all shapes and drawings from the image? (The image itself stays.)')) return;
  removeCropOverlay();
  canvas.getObjects().forEach(o => canvas.remove(o));
  canvas.requestRenderAll();
  saveHistory();
});

undoBtn.addEventListener('click', () => {
  if (historyIndex <= 0) return;
  historyIndex -= 1;
  restoreHistoryState(historyStack[historyIndex]);
  updateHistoryButtons();
});

redoBtn.addEventListener('click', () => {
  if (historyIndex >= historyStack.length - 1) return;
  historyIndex += 1;
  restoreHistoryState(historyStack[historyIndex]);
  updateHistoryButtons();
});

rotateLeftBtn.addEventListener('click', () => {
  if (!canvas?.backgroundImage) return;
  const bg = canvas.backgroundImage;
  bg.rotate((bg.angle || 0) - 90);
  canvas.requestRenderAll();
  saveHistory();
});

rotateRightBtn.addEventListener('click', () => {
  if (!canvas?.backgroundImage) return;
  const bg = canvas.backgroundImage;
  bg.rotate((bg.angle || 0) + 90);
  canvas.requestRenderAll();
  saveHistory();
});

flipXBtn.addEventListener('click', () => {
  if (!canvas?.backgroundImage) return;
  const bg = canvas.backgroundImage;
  bg.set('flipX', !bg.flipX);
  canvas.requestRenderAll();
  saveHistory();
});

flipYBtn.addEventListener('click', () => {
  if (!canvas?.backgroundImage) return;
  const bg = canvas.backgroundImage;
  bg.set('flipY', !bg.flipY);
  canvas.requestRenderAll();
  saveHistory();
});

[brightnessEl, contrastEl, saturationEl].forEach((el) => {
  el.addEventListener('input', () => {
    applyBackgroundAdjustments();
  });
  el.addEventListener('change', () => {
    saveHistory();
  });
});

resetFiltersBtn.addEventListener('click', () => {
  brightnessEl.value = 0;
  contrastEl.value = 0;
  saturationEl.value = 0;
  applyBackgroundAdjustments();
  saveHistory();
});

document.addEventListener('keydown', (e) => {
  if (!canvas || !editor.classList.contains('active')) return;
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  const obj = canvas.getActiveObject();
  if (obj?.isEditing) return;

  if (e.key === 'Escape' && (cropSelection || cropDrag)) {
    e.preventDefault();
    removeCropOverlay();
    flash('Crop cancelled.');
    return;
  }

  const saveMod = e.ctrlKey || e.metaKey;
  if (saveMod && (e.key === 's' || e.key === 'S')) {
    e.preventDefault();
    if (!downloadBtn.disabled) downloadBtn.click();
    return;
  }
  if (e.key === 'Delete' || e.key === 'Backspace') {
    deleteBtn.click();
    e.preventDefault();
  }
});

const origRatio = () => (originalImage ? originalImage.width / originalImage.height : 1);
outWidth.addEventListener('input', () => {
  if (lockRatio.checked && outWidth.value) {
    outHeight.value = Math.round(Number(outWidth.value) / origRatio());
  }
  updatePreviewInfo();
});
outHeight.addEventListener('input', () => {
  if (lockRatio.checked && outHeight.value) {
    outWidth.value = Math.round(Number(outHeight.value) * origRatio());
  }
  updatePreviewInfo();
});

quality.addEventListener('input', () => { qualityLabel.textContent = quality.value; });
format.addEventListener('change', updateFormatUi);
previewFitBtn.addEventListener('click', () => setPreviewMode('fit'));
previewActualBtn.addEventListener('click', () => setPreviewMode('actual'));

resetBtn.addEventListener('click', () => {
  if (canvas) { canvas.dispose(); canvas = null; }
  originalFile = null;
  originalImage = null;
  originalMimeType = '';
  sourceWidth = 0;
  sourceHeight = 0;
  sourceImageChanged = false;
  displayScale = 1;
  previewMode = 'fit';
  cropSelection = null;
  cropDrag = null;
  historyStack = [];
  historyIndex = -1;
  updateCropActionsVisibility();
  fileInput.value = '';
  format.value = 'original';
  setPreviewMode('fit');
  updateFormatUi();
  editor.classList.remove('active');
  dropZone.style.display = '';
  stats.textContent = '';
  msg.textContent = '';
});

function getDownloadExtension(type, preserveOriginal) {
  if (preserveOriginal) {
    const match = (originalFile?.name || '').match(/\.([a-z0-9]+)$/i);
    if (match) return match[1].toLowerCase();
  }
  return {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/bmp': 'bmp',
    'image/svg+xml': 'svg',
  }[normalizeMimeType(type)] || 'png';
}

function downloadBlob(blob, extension) {
  const baseName = (originalFile?.name || 'image').replace(/\.[^.]+$/, '') || 'image';
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = `${baseName}-edited-juankit.${extension}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 30000);
}

function canPreserveOriginalBytes(targetW, targetH) {
  return format.value === 'original' &&
    targetW === sourceWidth &&
    targetH === sourceHeight &&
    isDocumentPristine();
}

function canCompositeSourceDirectly() {
  if (!canvas?.backgroundImage || !originalImage) return false;
  const bg = getBgState();
  return normalizedAngle(bg.angle) === 0 &&
    !bg.flipX &&
    !bg.flipY &&
    bg.brightness === 0 &&
    bg.contrast === 0 &&
    bg.saturation === 0 &&
    Math.abs(Number(canvas.backgroundImage.left) || 0) < 0.000001 &&
    Math.abs(Number(canvas.backgroundImage.top) || 0) < 0.000001;
}

function renderExportCanvas(targetW, targetH) {
  const overlays = canvas.getObjects().filter((object) => object.cropOverlay);
  const overlayVisibility = overlays.map((object) => object.visible);
  overlays.forEach((object) => object.set('visible', false));
  const background = canvas.backgroundImage;
  const backgroundVisibility = background?.visible;
  const canvasBackgroundColor = canvas.backgroundColor;

  try {
    const multiplier = targetW / canvas.width;

    // The editor uses a smaller backing canvas for its fitted preview. Rendering
    // that whole preview back up would resample screenshot text. When the source
    // itself has no filters or transforms, draw its decoded pixels directly at
    // the requested size and render only the annotation layer from Fabric.
    if (canCompositeSourceDirectly()) {
      background.set('visible', false);
      canvas.set('backgroundColor', null);
      const annotationCanvas = canvas.toCanvasElement(multiplier);
      const outputCanvas = document.createElement('canvas');
      outputCanvas.width = targetW;
      outputCanvas.height = targetH;
      const context = outputCanvas.getContext('2d');
      if (!context) throw new Error('The browser could not create an export canvas.');
      context.imageSmoothingEnabled = true;
      context.imageSmoothingQuality = 'high';
      context.drawImage(originalImage.getElement(), 0, 0, targetW, targetH);
      context.drawImage(annotationCanvas, 0, 0, targetW, targetH);
      annotationCanvas.width = 1;
      annotationCanvas.height = 1;
      return outputCanvas;
    }

    const renderedCanvas = canvas.toCanvasElement(multiplier);
    if (renderedCanvas.width === targetW && renderedCanvas.height === targetH) {
      return renderedCanvas;
    }

    const outputCanvas = document.createElement('canvas');
    outputCanvas.width = targetW;
    outputCanvas.height = targetH;
    const context = outputCanvas.getContext('2d');
    if (!context) throw new Error('The browser could not create an export canvas.');
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(renderedCanvas, 0, 0, targetW, targetH);
    renderedCanvas.width = 1;
    renderedCanvas.height = 1;
    return outputCanvas;
  } finally {
    canvas.set('backgroundColor', canvasBackgroundColor);
    if (background) background.set('visible', backgroundVisibility !== false);
    overlays.forEach((object, index) => object.set('visible', overlayVisibility[index]));
    canvas.requestRenderAll();
  }
}

downloadBtn.addEventListener('click', async () => {
  if (!canvas || !originalImage) return;
  downloadBtn.disabled = true;
  flash('Preparing…');

  try {
    const targetW = Math.max(1, parseInt(outWidth.value, 10) || originalImage.width);
    const targetH = Math.max(1, parseInt(outHeight.value, 10) || originalImage.height);
    const preserveOriginal = canPreserveOriginalBytes(targetW, targetH);

    if (preserveOriginal) {
      const extension = getDownloadExtension(originalMimeType, true);
      downloadBlob(originalFile, extension);
      stats.textContent = `Output: ${targetW}×${targetH} · ${humanBytes(originalFile.size)} · Original bytes preserved`;
      flash('Downloaded original-quality file.');
      return;
    }

    if (targetW * targetH > MAX_EXPORT_PIXELS) {
      throw new Error(`Export too large (${targetW}x${targetH}). Keep under 16 MP.`);
    }

    canvas.discardActiveObject();
    const type = getResolvedOutputType();
    const q = type === 'image/png' ? 1 : parseFloat(quality.value);
    const outputCanvas = renderExportCanvas(targetW, targetH);
    const finalBlob = await canvasToBlob(outputCanvas, type, q);
    outputCanvas.width = 1;
    outputCanvas.height = 1;
    downloadBlob(finalBlob, getDownloadExtension(type, false));

    stats.textContent = `Output: ${targetW}×${targetH} · ${formatName(type)} · ${humanBytes(finalBlob.size)} (source ${humanBytes(originalFile.size)})`;
    flash('Downloaded.');
  } catch (err) {
    flash('Failed: ' + err.message, true);
  } finally {
    downloadBtn.disabled = false;
  }
});
