import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const editorSource = await readFile(new URL('../script.js', import.meta.url), 'utf8');
const editorHtml = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const imagesSource = await readFile(new URL('../../pdf-to-images/script.js', import.meta.url), 'utf8');
const imagesHtml = await readFile(new URL('../../pdf-to-images/index.html', import.meta.url), 'utf8');
const organizerSource = await readFile(new URL('../../pdf-organizer/script.js', import.meta.url), 'utf8');
const organizerHtml = await readFile(new URL('../../pdf-organizer/index.html', import.meta.url), 'utf8');
const bootstrapSource = await readFile(new URL('../../pdfjs-bootstrap.js', import.meta.url), 'utf8');
const imagesToPdfSource = await readFile(new URL('../../images-to-pdf/script.js', import.meta.url), 'utf8');
const imagesToPdfHtml = await readFile(new URL('../../images-to-pdf/index.html', import.meta.url), 'utf8');

test('PDF preview tools load the patched integrity-pinned PDF.js module and matching worker', () => {
  for (const html of [editorHtml, imagesHtml, organizerHtml]) {
    assert.match(html, /<script src="\.\.\/pdfjs-bootstrap\.js"><\/script>/);
    assert.match(html, /<script type="module" src="https:\/\/cdn\.jsdelivr\.net\/npm\/pdfjs-dist@4\.2\.67\/legacy\/build\/pdf\.min\.mjs" integrity="sha384-[^"]+"/);
  }
  for (const source of [editorSource, imagesSource, organizerSource]) {
    assert.match(source, /pdfjs-dist@4\.2\.67\/legacy\/build\/pdf\.worker\.min\.mjs/);
    assert.match(source, /await globalThis\.pdfjsLibPromise/);
  }
  assert.match(bootstrapSource, /globalThis\.pdfjsLibPromise = new Promise/);
  assert.match(bootstrapSource, /globalThis\.pdfjsLib/);
});

test('PDF.js evaluation is disabled in every local PDF loader', () => {
  assert.match(editorSource, /pdfjsLib\.getDocument\(\{[\s\S]*?isEvalSupported:\s*false[\s\S]*?\}\)/);
  assert.match(imagesSource, /pdfjsLib\.getDocument\(\{[\s\S]*?isEvalSupported:\s*false[\s\S]*?\}\)/);
  assert.match(organizerSource, /pdfjsLib\.getDocument\(\{[\s\S]*?isEvalSupported:\s*false[\s\S]*?\}\)/);
});

test('PDF Organizer keeps page operations local and exports organized, selected, and split files', () => {
  assert.match(organizerSource, /output\.copyPages\(source, items\.map/);
  assert.match(organizerSource, /page\.setRotation\(PDFLib\.degrees/);
  assert.match(organizerSource, /const zip = new JSZip\(\)/);
  assert.match(organizerHtml, /Save organized PDF/);
  assert.match(organizerHtml, /Download selected pages/);
  assert.match(organizerHtml, /Split every page/);
  assert.doesNotMatch(organizerSource, /fetch\(|XMLHttpRequest/);
});

test('Images to PDF decodes locally and supports ordered JPEG or PNG embedding', () => {
  assert.match(imagesToPdfSource, /createImageBitmap\(file/);
  assert.match(imagesToPdfSource, /pdf\.embedJpg\(encoded\.bytes\)/);
  assert.match(imagesToPdfSource, /pdf\.embedPng\(encoded\.bytes\)/);
  assert.match(imagesToPdfSource, /output\.save|pdf\.save/);
  assert.match(imagesToPdfHtml, /JPG\/JPEG, PNG, WebP, AVIF, BMP, or GIF/);
  assert.doesNotMatch(imagesToPdfSource, /fetch\(|XMLHttpRequest/);
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
