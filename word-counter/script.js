(function () {
  'use strict';

  const input = document.getElementById('text-input');
  const clearButton = document.getElementById('clear-btn');
  const copyButton = document.getElementById('copy-summary-btn');
  const status = document.getElementById('status');
  const statistics = document.getElementById('statistics');
  const fields = {
    words: document.getElementById('words-count'),
    characters: document.getElementById('characters-count'),
    charactersNoSpaces: document.getElementById('characters-no-spaces-count'),
    sentences: document.getElementById('sentences-count'),
    paragraphs: document.getElementById('paragraphs-count'),
    lines: document.getElementById('lines-count'),
    readingTime: document.getElementById('reading-time'),
    speakingTime: document.getElementById('speaking-time'),
  };
  let frame = 0;
  let timer = 0;
  let latest = WordCounterCore.analyze('');

  function render() {
    frame = 0;
    timer = 0;
    latest = WordCounterCore.analyze(input.value);
    Object.keys(fields).forEach((key) => {
      fields[key].textContent = latest[key].toLocaleString();
    });
    clearButton.disabled = input.value.length === 0;
    copyButton.disabled = input.value.length === 0;
    statistics.setAttribute('aria-busy', 'false');
  }

  function scheduleRender() {
    if (frame) cancelAnimationFrame(frame);
    if (timer) clearTimeout(timer);
    statistics.setAttribute('aria-busy', 'true');
    copyButton.disabled = true;
    if (input.value.length > 100000) timer = window.setTimeout(render, 180);
    else frame = requestAnimationFrame(render);
  }

  function summaryText() {
    return [
      `${latest.words} words`,
      `${latest.characters} characters (${latest.charactersNoSpaces} without spaces)`,
      `${latest.sentences} sentences`,
      `${latest.paragraphs} paragraphs`,
      `${latest.lines} lines`,
      `${latest.readingTime} reading time`,
      `${latest.speakingTime} speaking time`,
    ].join('\n');
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(summaryText());
      status.textContent = 'Summary copied.';
    } catch (_) {
      const helper = document.createElement('textarea');
      helper.value = summaryText();
      helper.setAttribute('readonly', '');
      helper.style.position = 'fixed';
      helper.style.opacity = '0';
      document.body.appendChild(helper);
      helper.select();
      const copied = document.execCommand('copy');
      helper.remove();
      status.textContent = copied ? 'Summary copied.' : 'Copy failed. Select the numbers and copy them manually.';
    }
  }

  input.addEventListener('input', scheduleRender);
  clearButton.addEventListener('click', () => {
    if (frame) cancelAnimationFrame(frame);
    if (timer) clearTimeout(timer);
    input.value = '';
    status.textContent = 'Text cleared.';
    render();
    input.focus();
  });
  copyButton.addEventListener('click', copySummary);
  render();
})();
