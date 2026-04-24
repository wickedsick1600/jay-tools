const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const editor = document.getElementById('editor');
const canvasEl = document.getElementById('canvas');
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
const downloadBtn = document.getElementById('download-btn');
const resetBtn = document.getElementById('reset-btn');
const stats = document.getElementById('stats');
const msg = document.getElementById('msg');

const MAX_CANVAS_W = 900;
const MAX_EXPORT_PIXELS = 16000000;

let canvas = null;
let originalFile = null;
let originalImage = null;
let displayScale = 1;
let activeTool = 'select';
let drawing = null;
let startPt = null;
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

function saveHistory() {
  if (!canvas || isRestoringHistory) return;
  const state = {
    objects: canvas.getObjects().map((o) => o.toObject()),
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

function loadFile(file) {
  if (!file.type.startsWith('image/')) { flash('That file is not an image.', true); return; }
  originalFile = file;

  const reader = new FileReader();
  reader.onload = () => {
    fabric.Image.fromURL(reader.result, (img) => {
      originalImage = img;
      const w = img.width;
      const h = img.height;
      const pixels = w * h;
      if (pixels > 24000000) {
        flash('Very large image detected. Export is capped at 16 MP to avoid crashes.', true);
      }
      displayScale = w > MAX_CANVAS_W ? MAX_CANVAS_W / w : 1;
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

      dropZone.style.display = 'none';
      editor.classList.add('active');
      stats.textContent = `Original: ${w}×${h} · ${humanBytes(file.size)}`;
      setTool('select');
      wireCanvas();
      historyStack = [];
      historyIndex = -1;
      brightnessEl.value = 0;
      contrastEl.value = 0;
      saturationEl.value = 0;
      saveHistory();
    });
  };
  reader.readAsDataURL(file);
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
  canvas.selection = (tool === 'select');
  canvas.forEachObject(o => { o.selectable = (tool === 'select'); });
  canvas.defaultCursor = tool === 'select' ? 'default' : 'crosshair';
}

document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
  btn.addEventListener('click', () => setTool(btn.dataset.tool));
});

fillColor.addEventListener('change', () => {
  if (canvas && canvas.isDrawingMode) canvas.freeDrawingBrush.color = fillColor.value;
  const active = canvas?.getActiveObject();
  if (active) {
    if (active.type === 'line') active.set('stroke', fillColor.value);
    else if (active.type === 'i-text' || active.type === 'text') active.set('fill', fillColor.value);
    else active.set('fill', fillColor.value);
    canvas.requestRenderAll();
  }
});

function wireCanvas() {
  canvas.on('object:modified', saveHistory);
  canvas.on('object:added', saveHistory);
  canvas.on('object:removed', saveHistory);
  canvas.on('path:created', saveHistory);
  canvas.on('text:editing:exited', saveHistory);

  canvas.on('mouse:down', (e) => {
    if (activeTool === 'select' || activeTool === 'draw') return;
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
    if (drawing) { drawing.setCoords(); drawing = null; }
    startPt = null;
  });
}

deleteBtn.addEventListener('click', () => {
  if (!canvas) return;
  const active = canvas.getActiveObjects();
  if (active.length) {
    active.forEach(o => canvas.remove(o));
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  }
});

clearBtn.addEventListener('click', () => {
  if (!canvas) return;
  if (!confirm('Remove all shapes and drawings from the image? (The image itself stays.)')) return;
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
});
outHeight.addEventListener('input', () => {
  if (lockRatio.checked && outHeight.value) {
    outWidth.value = Math.round(Number(outHeight.value) * origRatio());
  }
});

quality.addEventListener('input', () => { qualityLabel.textContent = quality.value; });
format.addEventListener('change', () => {
  const isPng = format.value === 'image/png';
  quality.disabled = isPng;
  qualityLabel.style.opacity = isPng ? 0.4 : 1;
});

resetBtn.addEventListener('click', () => {
  if (canvas) { canvas.dispose(); canvas = null; }
  originalFile = null;
  originalImage = null;
  fileInput.value = '';
  editor.classList.remove('active');
  dropZone.style.display = '';
  stats.textContent = '';
  msg.textContent = '';
});

downloadBtn.addEventListener('click', async () => {
  if (!canvas || !originalImage) return;
  downloadBtn.disabled = true;
  flash('Preparing…');

  try {
    const targetW = Math.max(1, parseInt(outWidth.value, 10) || originalImage.width);
    const targetH = Math.max(1, parseInt(outHeight.value, 10) || originalImage.height);
    if (targetW * targetH > MAX_EXPORT_PIXELS) {
      throw new Error(`Export too large (${targetW}x${targetH}). Keep under 16 MP.`);
    }
    const multiplier = targetW / canvas.width;

    canvas.discardActiveObject();
    canvas.requestRenderAll();

    const type = format.value;
    const q = type === 'image/png' ? 1 : parseFloat(quality.value);

    // Fabric's toDataURL with multiplier upscales all layers to the full resolution before export.
    const fabricFormat = type === 'image/jpeg' ? 'jpeg' : (type === 'image/webp' ? 'webp' : 'png');
    const dataUrl = canvas.toDataURL({
      format: fabricFormat,
      quality: q,
      multiplier: multiplier,
    });

    // If target aspect doesn't match canvas aspect, render into a sized canvas for the final size.
    let finalBlob;
    const needsResize = Math.abs((targetW / targetH) - (canvas.width / canvas.height)) > 0.01 ||
                        Math.round(canvas.width * multiplier) !== targetW ||
                        Math.round(canvas.height * multiplier) !== targetH;

    if (!needsResize) {
      finalBlob = await (await fetch(dataUrl)).blob();
    } else {
      const out = document.createElement('canvas');
      out.width = targetW;
      out.height = targetH;
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = dataUrl; });
      const ctx = out.getContext('2d');
      ctx.drawImage(img, 0, 0, targetW, targetH);
      finalBlob = await new Promise(res => out.toBlob(res, type, q));
    }

    const ext = type.split('/')[1].replace('jpeg', 'jpg');
    const baseName = (originalFile.name || 'image').replace(/\.[^.]+$/, '');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(finalBlob);
    a.download = `${baseName}-edited.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);

    stats.textContent = `Output: ${targetW}×${targetH} · ${humanBytes(finalBlob.size)} (was ${humanBytes(originalFile.size)})`;
    flash('Downloaded.');
  } catch (err) {
    flash('Failed: ' + err.message, true);
  } finally {
    downloadBtn.disabled = false;
  }
});
