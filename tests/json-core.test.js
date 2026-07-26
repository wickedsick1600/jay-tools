const test = require('node:test');
const assert = require('node:assert/strict');
const json = require('../json-formatter/json-core.js');

test('formats nested JSON without changing number or duplicate-key tokens', () => {
  const source = '{"id":9007199254740993,"id":1e+09,"items":[true,null,{"x":-0}]}';
  const formatted = json.format(source, 2);
  assert.match(formatted, /9007199254740993/);
  assert.match(formatted, /1e\+09/);
  assert.match(formatted, /"id": 9007199254740993/);
  assert.equal((formatted.match(/"id"/g) || []).length, 2);
  assert.match(formatted, /"x": -0/);
});

test('minifies whitespace while preserving string and number spelling', () => {
  const source = ' { "message" : "a b \\n c", "n" : 1.2300e-04 } ';
  assert.equal(json.minify(source), '{"message":"a b \\n c","n":1.2300e-04}');
});

test('accepts every JSON root value', () => {
  ['null', 'true', 'false', '0', '-12.5e2', '"hello"', '[]', '{}'].forEach((source) => {
    assert.doesNotThrow(() => json.parse(source));
  });
});

test('reports deterministic line and column information', () => {
  assert.throws(
    () => json.parse('{\n  "ok": true,\n  "broken": [1,]\n}'),
    /Trailing commas are not valid JSON \(line 3, column 16\)/
  );
});

test('rejects invalid JSON grammar and escapes', () => {
  const invalid = [
    '',
    '{unquoted:1}',
    '{"a":01}',
    '{"a":NaN}',
    '{"a":"\\x"}',
    '[1 2]',
    'true false',
  ];
  invalid.forEach((source) => assert.throws(() => json.parse(source), source));
});

test('preserves escaped braces and Unicode escapes', () => {
  const source = '{"value":"{not a fold} \\u263A","emoji":"😀"}';
  assert.equal(json.minify(source), source);
});
