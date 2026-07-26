(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WordCounterCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const WORD_FALLBACK = /[\p{L}\p{N}\p{M}]+(?:['’\u2010\u2011-][\p{L}\p{N}\p{M}]+)*/gu;
  const HAS_LETTER_OR_NUMBER = /[\p{L}\p{N}]/u;

  function countSegments(text, granularity, predicate, locale) {
    if (typeof Intl === 'undefined' || typeof Intl.Segmenter !== 'function') return null;
    try {
      const segmenter = new Intl.Segmenter(locale || undefined, { granularity });
      let count = 0;
      for (const part of segmenter.segment(text)) {
        if (!predicate || predicate(part)) count += 1;
      }
      return count;
    } catch (_) {
      return null;
    }
  }

  function countWords(text, locale) {
    if (!text) return 0;
    if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
      try {
        const segments = new Intl.Segmenter(locale || undefined, { granularity: 'word' }).segment(text);
        let count = 0;
        let previous = null;
        let beforePrevious = null;
        for (const part of segments) {
          if (part.isWordLike === true) count += 1;
          if (
            previous
            && beforePrevious
            && /^['’\u2010\u2011-]$/u.test(previous.segment)
            && beforePrevious.isWordLike === true
            && part.isWordLike === true
          ) count -= 1;
          beforePrevious = previous;
          previous = part;
        }
        return count;
      } catch (_) {}
    }
    return (text.match(WORD_FALLBACK) || []).length;
  }

  function countCharacters(text, locale) {
    if (!text) return 0;
    const segmented = countSegments(text, 'grapheme', null, locale);
    return segmented === null ? Array.from(text).length : segmented;
  }

  function countSentences(text, locale) {
    if (!text || !HAS_LETTER_OR_NUMBER.test(text)) return 0;
    const segmented = countSegments(
      text,
      'sentence',
      (part) => HAS_LETTER_OR_NUMBER.test(part.segment),
      locale,
    );
    if (segmented !== null) return segmented;
    const matches = text.trim().match(/[^.!?。！？\s][^.!?。！？]*(?:[.!?。！？]+(?=\s|$)|$)/gu);
    return matches ? matches.length : 0;
  }

  function countParagraphs(text) {
    if (!text || !/\S/u.test(text)) return 0;
    return text
      .replace(/\r\n?/g, '\n')
      .trim()
      .split(/\n\s*\n+/u)
      .filter((part) => /\S/u.test(part)).length;
  }

  function countLines(text) {
    if (!text) return 0;
    return text.replace(/\r\n?/g, '\n').split('\n').length;
  }

  function estimateMinutes(words, wordsPerMinute) {
    if (!Number.isFinite(words) || words <= 0) return 0;
    return words / wordsPerMinute;
  }

  function formatDuration(minutes) {
    if (!minutes) return '0 min';
    if (minutes < 1) return '< 1 min';
    return `${Math.ceil(minutes)} min`;
  }

  function analyze(text, locale) {
    const value = String(text == null ? '' : text);
    const words = countWords(value, locale);
    const readingMinutes = estimateMinutes(words, 200);
    const speakingMinutes = estimateMinutes(words, 130);
    return {
      words,
      characters: countCharacters(value, locale),
      charactersNoSpaces: countCharacters(value.replace(/\s/gu, ''), locale),
      sentences: countSentences(value, locale),
      paragraphs: countParagraphs(value),
      lines: countLines(value),
      readingMinutes,
      speakingMinutes,
      readingTime: formatDuration(readingMinutes),
      speakingTime: formatDuration(speakingMinutes),
    };
  }

  return {
    analyze,
    countWords,
    countCharacters,
    countSentences,
    countParagraphs,
    countLines,
    estimateMinutes,
    formatDuration,
  };
});
