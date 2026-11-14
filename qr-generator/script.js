(function () {
  'use strict';

  const textInput = document.getElementById('text');
  const sizeSelect = document.getElementById('size');
  const patternSelect = document.getElementById('pattern');
  const cornersSelect = document.getElementById('corners');
  const frameSelect = document.getElementById('frame');
  const foregroundInput = document.getElementById('foreground');
  const backgroundInput = document.getElementById('background');
  const foregroundValue = document.getElementById('foreground-value');
  const backgroundValue = document.getElementById('background-value');
  const marginInput = document.getElementById('margin');
  const marginValue = document.getElementById('margin-value');
  const logoInput = document.getElementById('logo-input');
  const logoStatus = document.getElementById('logo-status');
  const removeLogoButton = document.getElementById('remove-logo-btn');
  const warning = document.getElementById('scan-warning');
  const generateButton = document.getElementById('gen-btn');
  const resetStyleButton = document.getElementById('reset-style-btn');
  const preview = document.getElementById('qr-preview');
  const status = document.getElementById('msg');
  const downloadPngButton = document.getElementById('download-png-btn');
  const downloadSvgButton = document.getElementById('download-svg-btn');

  const DEFAULT_LOGO_STATUS = 'PNG, JPEG, or WebP up to 4 MB.';
  const MAX_LOGO_BYTES = 4 * 1024 * 1024;
  const ALLOWED_LOGO_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
  const CORNER_STYLES = {
    square: { square: 'square', dot: 'square' },
    rounded: { square: 'extra-rounded', dot: 'dot' },
    dot: { square: 'dot', dot: 'dot' },
  };

  let logoDataUrl = '';
  let currentOutput = null;
  let previewUrl = '';
  let generationId = 0;
  let renderTimer = 0;

  function flash(message, isError) {
    status.textContent = message;
    status.className = isError ? 'error status-line' : 'muted status-line';
  }

  function safeColor(value, fallback) {
    return /^#[0-9a-f]{6}$/iu.test(value) ? value.toUpperCase() : fallback;
  }

  function hexChannels(hex) {
    const value = safeColor(hex, '#000000').slice(1);
    return [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16) / 255);
  }

  function relativeLuminance(hex) {
    const channels = hexChannels(hex).map((channel) => (
      channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
    ));
    return (0.2126 * channels[0]) + (0.7152 * channels[1]) + (0.0722 * channels[2]);
  }

  function contrastRatio(first, second) {
    const light = Math.max(relativeLuminance(first), relativeLuminance(second));
    const dark = Math.min(relativeLuminance(first), relativeLuminance(second));
    return (light + 0.05) / (dark + 0.05);
  }

  function settings() {
    const size = Number(sizeSelect.value);
    const margin = Number(marginInput.value);
    const foreground = safeColor(foregroundInput.value, '#0A0F1A');
    const background = safeColor(backgroundInput.value, '#FFFFFF');
    return {
      text: textInput.value.trim(),
      size,
      margin,
      pattern: patternSelect.value,
      corners: CORNER_STYLES[cornersSelect.value] || CORNER_STYLES.square,
      frame: frameSelect.value,
      foreground,
      background,
    };
  }

  function updateControlLabels() {
    foregroundValue.textContent = safeColor(foregroundInput.value, '#0A0F1A');
    backgroundValue.textContent = safeColor(backgroundInput.value, '#FFFFFF');
    marginValue.textContent = `${marginInput.value} px`;
  }

  function showSafetyWarnings(options) {
    const messages = [];
    const ratio = contrastRatio(options.foreground, options.background);
    if (ratio < 4.5) messages.push(`Contrast is only ${ratio.toFixed(1)}:1; use more distinct colors for reliable scanning.`);
    if (relativeLuminance(options.foreground) >= relativeLuminance(options.background)) {
      messages.push('A lighter QR pattern on a darker background may fail in some scanners.');
    }
    if (options.margin < 16) messages.push('A larger margin is safer for printed QR codes.');
    if (logoDataUrl) messages.push('Test the code after adding a logo, especially before printing it.');
    warning.textContent = messages.join(' ');
    warning.hidden = messages.length === 0;
  }

  function frameLayout(size, frame) {
    if (frame === 'simple') {
      return { width: size + 40, height: size + 40, x: 20, y: 20, radius: 10, label: false };
    }
    if (frame === 'label') {
      const labelHeight = Math.max(64, Math.min(96, Math.round(size * 0.16)));
      return {
        width: size + 48,
        height: size + 48 + labelHeight,
        x: 24,
        y: 24,
        radius: Math.max(20, Math.round(size * 0.06)),
        label: true,
        labelHeight,
      };
    }
    return { width: size, height: size, x: 0, y: 0, radius: 0, label: false };
  }

  function framedSvg(rawSvg, options) {
    const parser = new DOMParser();
    const documentNode = parser.parseFromString(rawSvg, 'image/svg+xml');
    if (documentNode.querySelector('parsererror') || documentNode.documentElement.localName !== 'svg') {
      throw new Error('The QR engine returned an invalid SVG.');
    }

    const layout = frameLayout(options.size, options.frame);
    const innerSvg = documentNode.documentElement;
    innerSvg.setAttribute('x', String(layout.x));
    innerSvg.setAttribute('y', String(layout.y));
    innerSvg.setAttribute('width', String(options.size));
    innerSvg.setAttribute('height', String(options.size));
    if (!innerSvg.hasAttribute('viewBox')) innerSvg.setAttribute('viewBox', `0 0 ${options.size} ${options.size}`);
    const serializedQr = new XMLSerializer().serializeToString(innerSvg);

    let frameMarkup = '';
    if (options.frame !== 'none') {
      frameMarkup = `<rect x="2" y="2" width="${layout.width - 4}" height="${layout.height - 4}" rx="${layout.radius}" fill="${options.background}" stroke="${options.foreground}" stroke-width="4"/>`;
    }
    if (layout.label) {
      const fontSize = Math.max(20, Math.min(38, Math.round(options.size * 0.08)));
      const labelY = layout.y + options.size + Math.round(layout.labelHeight * 0.62);
      frameMarkup += `<text x="${layout.width / 2}" y="${labelY}" fill="${options.foreground}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="700" text-anchor="middle">Scan me</text>`;
    }

    return {
      width: layout.width,
      height: layout.height,
      text: `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${layout.width}" height="${layout.height}" viewBox="0 0 ${layout.width} ${layout.height}"><title>Styled QR code</title>${frameMarkup}${serializedQr}</svg>`,
    };
  }

  function revokePreviewUrl() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = '';
  }

  function setDownloadsEnabled(enabled) {
    downloadPngButton.disabled = !enabled;
    downloadSvgButton.disabled = !enabled;
  }

  async function generate() {
    const options = settings();
    updateControlLabels();
    showSafetyWarnings(options);
    if (!options.text) {
      currentOutput = null;
      revokePreviewUrl();
      preview.replaceChildren();
      flash('Enter a URL or text first.', true);
      setDownloadsEnabled(false);
      return;
    }
    if (typeof QRCodeStyling !== 'function') {
      flash('The QR styling engine did not load. Check your connection and reload the page.', true);
      setDownloadsEnabled(false);
      return;
    }

    const runId = generationId + 1;
    generationId = runId;
    generateButton.disabled = true;
    setDownloadsEnabled(false);
    flash('Building styled QR code…');

    try {
      const qrOptions = {
        type: 'svg',
        width: options.size,
        height: options.size,
        data: options.text,
        margin: options.margin,
        qrOptions: { errorCorrectionLevel: 'H' },
        dotsOptions: { type: options.pattern, color: options.foreground },
        cornersSquareOptions: { type: options.corners.square, color: options.foreground },
        cornersDotOptions: { type: options.corners.dot, color: options.foreground },
        backgroundOptions: { color: options.background },
      };
      if (logoDataUrl) {
        qrOptions.image = logoDataUrl;
        qrOptions.imageOptions = {
          hideBackgroundDots: true,
          imageSize: 0.28,
          margin: 6,
          saveAsBlob: true,
        };
      }

      const qrCode = new QRCodeStyling(qrOptions);
      const rawBlob = await qrCode.getRawData('svg');
      if (!rawBlob || typeof rawBlob.text !== 'function') throw new Error('SVG export is unavailable.');
      const output = framedSvg(await rawBlob.text(), options);
      if (runId !== generationId) return;

      output.blob = new Blob([output.text], { type: 'image/svg+xml;charset=utf-8' });
      currentOutput = output;
      revokePreviewUrl();
      previewUrl = URL.createObjectURL(output.blob);
      const image = document.createElement('img');
      image.src = previewUrl;
      image.alt = 'Preview of the styled QR code';
      preview.replaceChildren(image);
      setDownloadsEnabled(true);
      flash('QR code ready. Test it with your phone before printing.');
    } catch (error) {
      if (runId !== generationId) return;
      currentOutput = null;
      preview.replaceChildren();
      flash(`Could not create the QR code: ${error.message}`, true);
    } finally {
      if (runId === generationId) generateButton.disabled = false;
    }
  }

  function scheduleGenerate() {
    window.clearTimeout(renderTimer);
    generationId += 1;
    currentOutput = null;
    setDownloadsEnabled(false);
    renderTimer = window.setTimeout(generate, 140);
  }

  function fileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('The logo could not be read.'));
      reader.readAsDataURL(file);
    });
  }

  async function loadLogo(file) {
    if (!file) return;
    if (!ALLOWED_LOGO_TYPES.has(file.type)) {
      logoInput.value = '';
      flash('Use a PNG, JPEG, or WebP logo.', true);
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      logoInput.value = '';
      flash('The logo must be 4 MB or smaller.', true);
      return;
    }
    try {
      logoDataUrl = await fileAsDataUrl(file);
      logoStatus.textContent = `${file.name} · ${(file.size / 1024).toFixed(1)} KB`;
      removeLogoButton.disabled = false;
      await generate();
    } catch (error) {
      flash(error.message, true);
    }
  }

  function clearLogo(shouldGenerate) {
    logoDataUrl = '';
    logoInput.value = '';
    logoStatus.textContent = DEFAULT_LOGO_STATUS;
    removeLogoButton.disabled = true;
    if (shouldGenerate) generate();
  }

  function resetStyle() {
    sizeSelect.value = '320';
    patternSelect.value = 'rounded';
    cornersSelect.value = 'rounded';
    frameSelect.value = 'none';
    foregroundInput.value = '#0a0f1a';
    backgroundInput.value = '#ffffff';
    marginInput.value = '16';
    clearLogo(false);
    generate();
  }

  function downloadBlob(blob, filename) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }

  function loadImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('The SVG preview could not be converted to PNG.'));
      image.src = url;
    });
  }

  async function downloadPng() {
    if (!currentOutput) return;
    downloadPngButton.disabled = true;
    flash('Preparing PNG…');
    const sourceUrl = URL.createObjectURL(currentOutput.blob);
    try {
      const image = await loadImage(sourceUrl);
      const canvas = document.createElement('canvas');
      canvas.width = currentOutput.width;
      canvas.height = currentOutput.height;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Canvas export is unavailable.');
      context.fillStyle = safeColor(backgroundInput.value, '#FFFFFF');
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('PNG encoding failed.');
      downloadBlob(blob, 'styled-qr-code-juankit.png');
      flash('PNG downloaded.');
    } catch (error) {
      flash(error.message, true);
    } finally {
      URL.revokeObjectURL(sourceUrl);
      downloadPngButton.disabled = !currentOutput;
    }
  }

  function downloadSvg() {
    if (!currentOutput) return;
    downloadBlob(currentOutput.blob, 'styled-qr-code-juankit.svg');
    flash('SVG downloaded.');
  }

  generateButton.addEventListener('click', generate);
  resetStyleButton.addEventListener('click', resetStyle);
  downloadPngButton.addEventListener('click', downloadPng);
  downloadSvgButton.addEventListener('click', downloadSvg);
  removeLogoButton.addEventListener('click', () => clearLogo(true));
  logoInput.addEventListener('change', () => loadLogo(logoInput.files[0]));
  textInput.addEventListener('input', scheduleGenerate);
  [sizeSelect, patternSelect, cornersSelect, frameSelect].forEach((control) => {
    control.addEventListener('change', generate);
  });
  [foregroundInput, backgroundInput, marginInput].forEach((control) => {
    control.addEventListener('input', () => {
      updateControlLabels();
      scheduleGenerate();
    });
  });
  window.addEventListener('beforeunload', revokePreviewUrl);

  textInput.value = 'https://juankit.com/';
  updateControlLabels();
  generate();
})();
