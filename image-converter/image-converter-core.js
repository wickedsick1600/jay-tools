(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ImageConverterCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MIME_BY_EXTENSION = Object.freeze({
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    avif: 'image/avif',
    bmp: 'image/bmp',
    gif: 'image/gif',
  });
  const OUTPUT_EXTENSION = Object.freeze({
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  });

  function inputMime(file) {
    const declared = String(file && file.type || '').toLowerCase();
    if (Object.values(MIME_BY_EXTENSION).includes(declared)) return declared;
    const match = String(file && file.name || '').toLowerCase().match(/\.([a-z0-9]+)$/u);
    return match ? MIME_BY_EXTENSION[match[1]] || '' : '';
  }

  function isSupportedInput(file) {
    return inputMime(file) !== '';
  }

  function outputExtension(mime) {
    return OUTPUT_EXTENSION[mime] || '';
  }

  function safeBaseName(name) {
    const withoutExtension = String(name || 'image').replace(/\.[^.]*$/u, '');
    const safe = withoutExtension
      .replace(/[<>:"/\\|?*\u0000-\u001f]/gu, '-')
      .replace(/\s+/gu, ' ')
      .replace(/[. ]+$/gu, '')
      .trim()
      .slice(0, 120);
    return safe || 'image';
  }

  function outputName(name, mime) {
    const ext = outputExtension(mime);
    if (!ext) throw new Error('Unsupported output format.');
    const base = safeBaseName(name);
    const branded = /(?:^|-)juankit$/iu.test(base) ? base : `${base}-juankit`;
    return `${branded}.${ext}`;
  }

  function uniqueName(name, usedNames) {
    const used = usedNames || new Set();
    const comparisonKey = (value) => String(value).toLowerCase();
    if (!used.has(comparisonKey(name))) {
      used.add(comparisonKey(name));
      return name;
    }
    const dot = name.lastIndexOf('.');
    const base = dot > 0 ? name.slice(0, dot) : name;
    const ext = dot > 0 ? name.slice(dot) : '';
    let index = 2;
    let candidate = `${base}-${index}${ext}`;
    while (used.has(comparisonKey(candidate))) {
      index += 1;
      candidate = `${base}-${index}${ext}`;
    }
    used.add(comparisonKey(candidate));
    return candidate;
  }

  function positiveLimit(value) {
    const number = Number(value);
    return Number.isFinite(number) && number > 0 ? number : Infinity;
  }

  function calculateDimensions(sourceWidth, sourceHeight, maxWidth, maxHeight, neverEnlarge) {
    const width = Number(sourceWidth);
    const height = Number(sourceHeight);
    if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
      throw new Error('Invalid source dimensions.');
    }
    const widthLimit = positiveLimit(maxWidth);
    const heightLimit = positiveLimit(maxHeight);
    let scale = Math.min(widthLimit / width, heightLimit / height);
    if (neverEnlarge !== false) scale = Math.min(scale, 1);
    if (!Number.isFinite(scale)) scale = 1;
    return {
      width: Math.max(1, Math.round(width * scale)),
      height: Math.max(1, Math.round(height * scale)),
      scale,
    };
  }

  function sizeChange(originalBytes, outputBytes) {
    const original = Math.max(0, Number(originalBytes) || 0);
    const output = Math.max(0, Number(outputBytes) || 0);
    const difference = original - output;
    return {
      difference,
      percent: original ? (Math.abs(difference) / original) * 100 : 0,
      isSmaller: difference > 0,
      isLarger: difference < 0,
      isSame: difference === 0,
    };
  }

  return {
    MIME_BY_EXTENSION,
    OUTPUT_EXTENSION,
    inputMime,
    isSupportedInput,
    outputExtension,
    safeBaseName,
    outputName,
    uniqueName,
    calculateDimensions,
    sizeChange,
  };
});
