const test = require('node:test');
const assert = require('node:assert/strict');
const counter = require('../word-counter/word-counter-core.js');

test('counts basic English text and blank-line paragraphs', () => {
  const result = counter.analyze('Hello world.\n\nThis is a test!');
  assert.equal(result.words, 6);
  assert.equal(result.sentences, 2);
  assert.equal(result.paragraphs, 2);
  assert.equal(result.lines, 3);
});

test('keeps joined words together', () => {
  assert.equal(counter.countWords("Don't re-enter the co-op."), 4);
});

test('counts grapheme clusters rather than UTF-16 code units', () => {
  assert.equal(counter.countCharacters('A👍🏽'), 2);
});

test('supports text without Latin whitespace', () => {
  const result = counter.analyze('你好世界。こんにちは世界。');
  assert.ok(result.words >= 2);
  assert.equal(result.sentences, 2);
});

test('returns zeroes for empty input and stable time labels', () => {
  const result = counter.analyze('');
  assert.equal(result.words, 0);
  assert.equal(result.characters, 0);
  assert.equal(result.lines, 0);
  assert.equal(result.readingTime, '0 min');
  assert.equal(counter.formatDuration(0.5), '< 1 min');
  assert.equal(counter.formatDuration(1.01), '2 min');
});

test('counts a large stream without changing joined-word policy', () => {
  const text = Array(10000).fill('high-quality').join(' ');
  assert.equal(counter.countWords(text), 10000);
});
