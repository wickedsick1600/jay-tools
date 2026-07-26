const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const migrationSource = fs.readFileSync(path.join(root, 'storage-migration.js'), 'utf8');
const synchronizerSource = fs.readFileSync(path.join(root, 'scripts', 'sync-storage-migration.mjs'), 'utf8');

test('retired browser keys are removed without touching unrelated storage', () => {
  const prefix = ['prompt', 'Enhancer'].join('');
  const values = new Map([
    [prefix + 'HistoryV2', 'history'],
    [prefix + 'HistoryEnabledV1', 'true'],
    [prefix + 'CollectionV1', 'collection'],
    ['juankit_bookmark_hint_v1', 'dismissed'],
  ]);
  const removed = [];
  const localStorage = {
    removeItem(key) {
      removed.push(key);
      values.delete(key);
    },
  };

  vm.runInNewContext(migrationSource, { localStorage });

  assert.deepEqual(removed, [
    prefix + 'HistoryV2',
    prefix + 'HistoryEnabledV1',
    prefix + 'CollectionV1',
  ]);
  assert.equal(values.get('juankit_bookmark_hint_v1'), 'dismissed');
});

test('storage synchronizer fails closed when an HTML page has no charset anchor', () => {
  const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'juankit-storage-sync-'));
  try {
    fs.mkdirSync(path.join(fixture, 'scripts'));
    fs.writeFileSync(path.join(fixture, 'scripts', 'sync-storage-migration.mjs'), synchronizerSource);
    fs.writeFileSync(path.join(fixture, 'storage-migration.js'), migrationSource);
    fs.writeFileSync(path.join(fixture, 'index.html'), '<!doctype html><html><head></head><body></body></html>');

    const result = spawnSync(process.execPath, [path.join(fixture, 'scripts', 'sync-storage-migration.mjs')], {
      encoding: 'utf8',
    });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /quoted <meta charset> tag is missing/);
  } finally {
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});
