(function () {
  const MAX_CANVAS_PIXELS = 24000000;
  const MAX_PAGE_POINTS = 14400;
  const PAGE_SIZES = {
    a4: [595.28, 841.89],
    letter: [612, 792],
  };

  const dropZone = document.getElementById('drop-zone');
  const imageInput = document.getElementById('image-input');
  const imageList = document.getElementById('image-list');
  const clearBtn = document.getElementById('clear-btn');
  const createBtn = document.getElementById('create-btn');
  const pageSize = document.getElementById('page-size');
  const orientation = document.getElementById('orientation');
  const margin = document.getElementById('margin');
  const fitMode = document.getElementById('fit-mode');
  const imageEncoding = document.getElementById('image-encoding');
  const quality = document.getElementById('quality');
  const qualityValue = document.getElementById('quality-value');
  const qualityWrap = document.getElementById('quality-wrap');
  const outputName = document.getElementById('output-name');
  const summary = document.getElementById('summary');
  const status = document.getElementById('status');

  let images = [];
  let nextId = 1;
  let draggedId = null;
  let busy = false;

  function flash(text, isError) {
    status.textContent = text;
    status.className = isError ? 'error' : 'muted';
  }

  function humanBytes(value) {
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / 1024 / 1024).toFixed(2)} MB`;
  }

  function isImage(file) {
    return file && (
      file.type.startsWith('image/') ||
      /\.(?:jpe?g|png|webp|avif|bmp|gif)$/iu.test(file.name)
    );
  }

  function cleanOutputName(name) {
    const safe = (name || 'images-juankit.pdf').replace(/[\\/:*?"<>|]+/gu, '-').trim();
    const base = safe.replace(/\.pdf$/iu, '').trim() || 'images-juankit';
    return `${base}.pdf`;
  }

  function downloadBytes(bytes, filename) {
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
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

  function renderList() {
    imageList.textContent = '';

    images.forEach((item, index) => {
      const row = document.createElement('li');
      row.className = 'image-item';
      row.draggable = !busy;
      row.dataset.id = String(item.id);

      const preview = document.createElement('img');
      preview.className = 'image-thumb';
      preview.src = item.previewUrl;
      preview.alt = '';

      const main = document.createElement('div');
      main.className = 'image-main';
      const name = document.createElement('div');
      name.className = 'image-name';
      name.textContent = `${index + 1}. ${item.file.name}`;
      const meta = document.createElement('div');
      meta.className = 'image-meta';
      meta.textContent = humanBytes(item.file.size);
      main.append(name, meta);

      const actions = document.createElement('div');
      actions.className = 'image-actions';
      actions.append(
        makeButton('Move up', () => moveImage(index, index - 1), index === 0),
        makeButton('Move down', () => moveImage(index, index + 1), index === images.length - 1),
        makeButton('Remove', () => removeImage(index), false)
      );

      row.addEventListener('dragstart', (event) => {
        draggedId = item.id;
        row.classList.add('dragging');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(item.id));
      });
      row.addEventListener('dragend', () => {
        draggedId = null;
        row.classList.remove('dragging');
      });
      row.addEventListener('dragover', (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      });
      row.addEventListener('drop', (event) => {
        event.preventDefault();
        const fromId = Number(event.dataTransfer.getData('text/plain') || draggedId);
        reorderById(fromId, item.id);
      });

      row.append(preview, main, actions);
      imageList.appendChild(row);
    });

    updateControls();
  }

  function updateControls() {
    const count = images.length;
    clearBtn.disabled = busy || count === 0;
    createBtn.disabled = busy || count === 0;
    imageInput.disabled = busy;
    pageSize.disabled = busy;
    orientation.disabled = busy || pageSize.value === 'match';
    margin.disabled = busy;
    fitMode.disabled = busy;
    imageEncoding.disabled = busy;
    quality.disabled = busy || imageEncoding.value !== 'jpeg';
    outputName.disabled = busy;
    dropZone.classList.toggle('is-disabled', busy);
    dropZone.setAttribute('aria-disabled', busy ? 'true' : 'false');
    qualityWrap.hidden = imageEncoding.value !== 'jpeg';
    qualityValue.textContent = `${Math.round(Number(quality.value) * 100)}%`;
    summary.textContent = count
      ? `${count} image${count === 1 ? '' : 's'} will become ${count} PDF page${count === 1 ? '' : 's'}.`
      : 'Add one or more images to create a PDF.';
    imageList.querySelectorAll('button').forEach((button) => {
      button.disabled = busy;
    });
  }

  function addFiles(files) {
    if (busy) {
      flash('Wait for the current PDF to finish.', true);
      return;
    }
    const accepted = files.filter(isImage);
    const skipped = files.length - accepted.length;
    accepted.forEach((file) => {
      images.push({
        id: nextId,
        file,
        previewUrl: URL.createObjectURL(file),
      });
      nextId += 1;
    });
    renderList();
    if (skipped) flash(`${skipped} unsupported file${skipped === 1 ? '' : 's'} skipped.`, true);
    else if (accepted.length) flash(`${accepted.length} image${accepted.length === 1 ? '' : 's'} added.`);
  }

  function moveImage(fromIndex, toIndex) {
    if (busy || toIndex < 0 || toIndex >= images.length || fromIndex === toIndex) return;
    const [item] = images.splice(fromIndex, 1);
    images.splice(toIndex, 0, item);
    renderList();
  }

  function reorderById(fromId, toId) {
    if (!fromId || !toId || fromId === toId) return;
    const fromIndex = images.findIndex((item) => item.id === fromId);
    const toIndex = images.findIndex((item) => item.id === toId);
    if (fromIndex !== -1 && toIndex !== -1) moveImage(fromIndex, toIndex);
  }

  function removeImage(index) {
    if (busy) return;
    const [removed] = images.splice(index, 1);
    if (removed) URL.revokeObjectURL(removed.previewUrl);
    renderList();
  }

  function clearImages() {
    images.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    images = [];
    imageInput.value = '';
    renderList();
    flash('');
  }

  async function loadDrawable(file) {
    if (typeof createImageBitmap === 'function') {
      try {
        const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
        return {
          width: bitmap.width,
          height: bitmap.height,
          draw(context, width, height) { context.drawImage(bitmap, 0, 0, width, height); },
          close() { bitmap.close(); },
        };
      } catch (error) {}
    }

    const url = URL.createObjectURL(file);
    try {
      const image = await new Promise((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error(`Could not decode ${file.name}.`));
        element.src = url;
      });
      return {
        width: image.naturalWidth,
        height: image.naturalHeight,
        draw(context, width, height) { context.drawImage(image, 0, 0, width, height); },
        close() {},
      };
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  function canvasToBlob(canvas, type, imageQuality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('This browser could not encode the image.'));
      }, type, imageQuality);
    });
  }

  async function encodeImage(file) {
    const drawable = await loadDrawable(file);
    if (!drawable.width || !drawable.height) {
      drawable.close();
      throw new Error(`${file.name} has invalid dimensions.`);
    }

    const originalWidth = drawable.width;
    const originalHeight = drawable.height;
    let width = originalWidth;
    let height = originalHeight;
    const pixels = width * height;
    if (pixels > MAX_CANVAS_PIXELS) {
      const scale = Math.sqrt(MAX_CANVAS_PIXELS / pixels);
      width = Math.max(1, Math.floor(width * scale));
      height = Math.max(1, Math.floor(height * scale));
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const useJpeg = imageEncoding.value === 'jpeg';
    const context = canvas.getContext('2d', { alpha: !useJpeg });
    if (useJpeg) {
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
    }
    drawable.draw(context, width, height);
    drawable.close();

    try {
      const type = useJpeg ? 'image/jpeg' : 'image/png';
      const blob = await canvasToBlob(canvas, type, Number(quality.value));
      return {
        bytes: new Uint8Array(await blob.arrayBuffer()),
        width,
        height,
        type,
        wasReduced: width !== originalWidth || height !== originalHeight,
      };
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }
  }

  function getPageDimensions(imageWidth, imageHeight) {
    if (pageSize.value === 'match') {
      let width = imageWidth * 0.75;
      let height = imageHeight * 0.75;
      const scale = Math.min(1, MAX_PAGE_POINTS / Math.max(width, height));
      return [Math.max(36, width * scale), Math.max(36, height * scale)];
    }

    let [width, height] = PAGE_SIZES[pageSize.value] || PAGE_SIZES.a4;
    const requested = orientation.value;
    const landscape = requested === 'landscape' || (requested === 'auto' && imageWidth > imageHeight);
    if (landscape && height > width) [width, height] = [height, width];
    if (!landscape && width > height) [width, height] = [height, width];
    return [width, height];
  }

  function imagePlacement(imageWidth, imageHeight, pageWidth, pageHeight) {
    const pageMargin = Math.max(0, Number(margin.value) || 0);
    const availableWidth = Math.max(1, pageWidth - pageMargin * 2);
    const availableHeight = Math.max(1, pageHeight - pageMargin * 2);
    const containScale = Math.min(availableWidth / imageWidth, availableHeight / imageHeight);
    const coverScale = Math.max(availableWidth / imageWidth, availableHeight / imageHeight);
    const scale = fitMode.value === 'cover' ? coverScale : containScale;
    const width = imageWidth * scale;
    const height = imageHeight * scale;
    return {
      x: (pageWidth - width) / 2,
      y: (pageHeight - height) / 2,
      width,
      height,
    };
  }

  async function createPdf() {
    if (!images.length || busy) return;
    busy = true;
    renderList();
    flash('Creating PDF…');
    let reducedCount = 0;

    try {
      const pdf = await PDFLib.PDFDocument.create();

      for (let index = 0; index < images.length; index += 1) {
        const item = images[index];
        flash(`Processing image ${index + 1} of ${images.length}: ${item.file.name}`);
        const encoded = await encodeImage(item.file);
        if (encoded.wasReduced) reducedCount += 1;
        const embedded = encoded.type === 'image/jpeg'
          ? await pdf.embedJpg(encoded.bytes)
          : await pdf.embedPng(encoded.bytes);
        const [pageWidth, pageHeight] = getPageDimensions(encoded.width, encoded.height);
        const page = pdf.addPage([pageWidth, pageHeight]);
        page.drawRectangle({ x: 0, y: 0, width: pageWidth, height: pageHeight, color: PDFLib.rgb(1, 1, 1) });
        page.drawImage(embedded, imagePlacement(encoded.width, encoded.height, pageWidth, pageHeight));
      }

      const bytes = await pdf.save({ useObjectStreams: false });
      downloadBytes(bytes, cleanOutputName(outputName.value));
      const reductionNote = reducedCount
        ? ` ${reducedCount} very large image${reducedCount === 1 ? ' was' : 's were'} reduced for browser safety.`
        : '';
      flash(`PDF created and downloaded.${reductionNote}`);
    } catch (error) {
      flash(`Could not create the PDF: ${error.message}`, true);
    } finally {
      busy = false;
      renderList();
    }
  }

  dropZone.addEventListener('click', () => imageInput.click());
  dropZone.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      imageInput.click();
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
    addFiles(Array.from(event.dataTransfer.files || []));
  });
  imageInput.addEventListener('change', () => {
    addFiles(Array.from(imageInput.files || []));
    imageInput.value = '';
  });
  document.addEventListener('paste', (event) => {
    if (busy) return;
    const files = Array.from(event.clipboardData?.files || []).filter(isImage);
    if (files.length) addFiles(files);
  });

  clearBtn.addEventListener('click', clearImages);
  createBtn.addEventListener('click', createPdf);
  [pageSize, orientation, margin, fitMode, imageEncoding, quality].forEach((control) => {
    control.addEventListener('input', updateControls);
    control.addEventListener('change', updateControls);
  });

  updateControls();
})();
