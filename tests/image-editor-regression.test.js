const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '..', 'image-editor', 'script.js'), 'utf8');

test('untouched same-size image downloads preserve the original File bytes', () => {
  assert.match(source, /canPreserveOriginalBytes\(targetW, targetH\)/);
  assert.match(source, /downloadBlob\(originalFile, extension\)/);
  assert.match(source, /Original bytes preserved/);
});

test('image export does not convert through data URLs or fetch', () => {
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /toDataURL\s*\(/);
  assert.doesNotMatch(source, /new\s+FileReader\b/);
  assert.match(source, /sourceCanvas\.toBlob\(/);
});

test('clean source pixels are composited directly below a transparent annotation layer', () => {
  assert.match(source, /canvas\.set\('backgroundColor', null\)/);
  assert.match(source, /context\.drawImage\(originalImage\.getElement\(\), 0, 0, targetW, targetH\)/);
  assert.match(source, /context\.drawImage\(annotationCanvas, 0, 0, targetW, targetH\)/);
});

test('fit and actual-size previews are independent from export dimensions', () => {
  assert.match(source, /function setPreviewMode\(mode\)/);
  assert.match(source, /previewMode === 'actual' \? 1 : fitScaleFor/);
  assert.match(source, /Export: \$\{targetW\}×\$\{targetH\}px/);
});
