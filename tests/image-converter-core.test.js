const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../image-converter/image-converter-core.js');

test('recognizes supported common input types by MIME or extension', () => {
  assert.equal(core.inputMime({ name: 'photo.JPG', type: '' }), 'image/jpeg');
  assert.equal(core.inputMime({ name: 'photo.unknown', type: 'image/png' }), 'image/png');
  assert.equal(core.isSupportedInput({ name: 'vector.svg', type: 'image/svg+xml' }), false);
});

test('preserves aspect ratio and never enlarges by default', () => {
  assert.deepEqual(core.calculateDimensions(4000, 2000, 1920, 1080), { width: 1920, height: 960, scale: 0.48 });
  assert.deepEqual(core.calculateDimensions(800, 600, 1920, 1080), { width: 800, height: 600, scale: 1 });
});

test('creates safe branded names and de-duplicates them', () => {
  assert.equal(core.outputName('my:photo.JPG', 'image/webp'), 'my-photo-juankit.webp');
  assert.equal(core.outputName('ready-juankit.png', 'image/jpeg'), 'ready-juankit.jpg');
  const used = new Set();
  assert.equal(core.uniqueName('photo.webp', used), 'photo.webp');
  assert.equal(core.uniqueName('photo.webp', used), 'photo-2.webp');
  assert.equal(core.uniqueName('PHOTO.WEBP', used), 'PHOTO-3.WEBP');
});

test('reports actual size direction and percentage', () => {
  assert.deepEqual(core.sizeChange(1000, 750), { difference: 250, percent: 25, isSmaller: true, isLarger: false, isSame: false });
  assert.equal(core.sizeChange(1000, 1250).isLarger, true);
});
