import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const editorSource = await readFile(new URL('../script.js', import.meta.url), 'utf8');
const editorHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const imagesSource = await readFile(new URL('../../pdf-to-images/script.js', import.meta.url), 'utf8');
const imagesHtml = await readFile(new URL('../../pdf-to-images/index.html', import.meta.url), 'utf8');

test('both PDF tools load the patched integrity-pinned PDF.js module and matching worker', () => {
  for (const html of [editorHtml, imagesHtml]) {
    assert.match(html, /<script type="module" src="https:\/\/cdn\.jsdelivr\.net\/npm\/pdfjs-dist@4\.2\.67\/legacy\/build\/pdf\.min\.mjs" integrity="sha384-[^"]+"/);
  }
  for (const source of [editorSource, imagesSource]) {
    assert.match(source, /pdfjs-dist@4\.2\.67\/legacy\/build\/pdf\.worker\.min\.mjs/);
    assert.match(source, /await globalThis\.pdfjsLibPromise/);
  }
});

test('PDF.js evaluation is disabled in every local PDF loader', () => {
  assert.match(editorSource, /pdfjsLib\.getDocument\(\{[\s\S]*?isEvalSupported:\s*false[\s\S]*?\}\)/);
  assert.match(imagesSource, /pdfjsLib\.getDocument\(\{[\s\S]*?isEvalSupported:\s*false[\s\S]*?\}\)/);
});

test('no-edit export downloads the original bytes without a PDF rewrite', () => {
  assert.match(editorSource, /if \(!editedPageNumbers\.length\)[\s\S]*?new Uint8Array\(originalPdfBytes\.slice\(0\)\)[\s\S]*?downloadBlob/);
  assert.match(editorSource, /Downloaded the original PDF unchanged/);
});

test('edited export is vector/native first and maps through the PDF.js viewport', () => {
  for (const type of ['i-text', 'rect', 'ellipse', 'line', 'path', 'image']) {
    assert.match(editorSource, new RegExp(`case '${type.replace('-', '\\-')}'`));
  }
  assert.match(editorSource, /viewport\.convertToPdfPoint/);
  assert.match(editorSource, /embedJpg\(data\.bytes\)|embedPng\(data\.bytes\)/);
  assert.doesNotMatch(editorSource, /EXPORT_OVERLAY_SCALE|renderOverlayPng|getExportOverlaySize/);
});

test('unsupported objects use only a bounded localized high-resolution fallback', () => {
  assert.match(editorSource, /const FALLBACK_EXPORT_DPI = 300/);
  assert.match(editorSource, /const MAX_FALLBACK_EXPORT_PIXELS = 12000000/);
  assert.match(editorSource, /object\.getBoundingRect\(true, true\)/);
  assert.match(editorSource, /exportObjectAsLocalizedRaster\(object, page, state, viewport, exportContext\)/);
  assert.match(editorHtml, /localized high-resolution fallback \(up to 300 DPI\)/);
});

test('edited export preserves source metadata and avoids object-stream-only output', () => {
  assert.match(editorSource, /updateMetadata:\s*false/);
  assert.match(editorSource, /save\(\{ useObjectStreams: false \}\)/);
});
