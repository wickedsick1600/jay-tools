const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'qr-generator', 'index.html'), 'utf8');
const source = fs.readFileSync(path.join(root, 'qr-generator', 'script.js'), 'utf8');

test('styled QR generator uses an integrity-pinned renderer and exposes approved controls', () => {
  assert.match(html, /qr-code-styling@1\.9\.2\/lib\/qr-code-styling\.js/);
  assert.match(html, /integrity="sha384-P7sw4KeI1SDhOs6wYFsBysIIHFqMTgG4y9vunEfL8ZuV0WhnHsh9MRu9Rso17MtY"/);
  assert.doesNotMatch(html, /qrcodejs/);
  for (const id of [
    'pattern',
    'corners',
    'foreground',
    'background',
    'margin',
    'frame',
    'logo-input',
    'download-png-btn',
    'download-svg-btn',
  ]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});

test('styled QR generation stays local and keeps scan-safety protections', () => {
  assert.match(source, /errorCorrectionLevel: 'H'/);
  assert.match(source, /dotsOptions:/);
  assert.match(source, /cornersSquareOptions:/);
  assert.match(source, /cornersDotOptions:/);
  assert.match(source, /contrastRatio\(/);
  assert.match(source, /MAX_LOGO_BYTES/);
  assert.match(source, /image\/svg\+xml/);
  assert.match(source, /canvas\.toBlob\(resolve, 'image\/png'\)/);
  assert.doesNotMatch(source, /fetch\(|XMLHttpRequest|FormData/);
});
