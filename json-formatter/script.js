const input = document.getElementById('input');
const output = document.getElementById('output');
const status = document.getElementById('status');
const indentSelect = document.getElementById('indent');
const expandAllButton = document.getElementById('expand-all-btn');
const collapseAllButton = document.getElementById('collapse-all-btn');

let outputText = '';
let foldRanges = [];
let collapsedFolds = new Set();
let lineElements = [];

function getIndent() {
  return indentSelect.value === 'tab' ? '\t' : Number(indentSelect.value);
}

function setStatus(className, text) {
  status.textContent = '';
  const span = document.createElement('span');
  span.className = className;
  span.textContent = text;
  status.appendChild(span);
}

function showOk(message) {
  setStatus('status-ok', `✓ ${message}`);
}

function showError(error) {
  setStatus('status-err', `✕ ${error.message}`);
  if (Number.isInteger(error.offset)) {
    input.focus();
    input.setSelectionRange(error.offset, Math.min(error.offset + 1, input.value.length));
  }
}

function tokenClass(token) {
  if (token.role === 'key') return 'token-key';
  return `token-${token.type}`;
}

function buildModel(text) {
  const tokens = JuankitJson.parse(text);
  const lines = text.split('\n');
  const tokensByLine = lines.map(() => []);
  const stack = [];
  const folds = [];

  tokens.forEach((token) => {
    const lineIndex = token.line - 1;
    if (tokensByLine[lineIndex]) tokensByLine[lineIndex].push(token);

    if (token.raw === '{' || token.raw === '[') {
      stack.push(token);
    } else if (token.raw === '}' || token.raw === ']') {
      const opening = stack.pop();
      if (opening && opening.line < token.line) {
        folds.push({
          id: opening.start,
          startLine: opening.line - 1,
          endLine: token.line - 1,
          opening: opening.raw,
        });
      }
    }
  });

  return { folds, lines, tokensByLine };
}

function clearOutput() {
  outputText = '';
  foldRanges = [];
  collapsedFolds = new Set();
  lineElements = [];
  output.textContent = '';
  const empty = document.createElement('p');
  empty.className = 'json-empty';
  empty.textContent = 'Format or minify JSON to see the result.';
  output.appendChild(empty);
  expandAllButton.disabled = true;
  collapseAllButton.disabled = true;
}

function updateFoldVisibility() {
  const difference = new Int32Array(lineElements.length + 1);
  foldRanges.forEach((fold) => {
    const collapsed = collapsedFolds.has(fold.id);
    fold.button.textContent = collapsed ? '▸' : '▾';
    fold.button.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    fold.button.setAttribute(
      'aria-label',
      `${collapsed ? 'Expand' : 'Collapse'} ${fold.opening === '{' ? 'object' : 'array'} at line ${fold.startLine + 1}`
    );
    fold.summary.hidden = !collapsed;
    if (collapsed && fold.endLine > fold.startLine + 1) {
      difference[fold.startLine + 1] += 1;
      difference[fold.endLine] -= 1;
    }
  });

  let hiddenDepth = 0;
  lineElements.forEach((line, index) => {
    hiddenDepth += difference[index];
    line.hidden = hiddenDepth > 0;
  });
}

function renderOutput(text) {
  outputText = text;
  const model = buildModel(text);
  foldRanges = model.folds;
  collapsedFolds = new Set();
  lineElements = [];
  output.textContent = '';

  const foldByLine = new Map(foldRanges.map((fold) => [fold.startLine, fold]));
  const fragment = document.createDocumentFragment();

  model.lines.forEach((lineText, lineIndex) => {
    const row = document.createElement('div');
    row.className = 'json-line';

    const foldSlot = document.createElement('span');
    foldSlot.className = 'json-fold-slot';
    foldSlot.setAttribute('aria-hidden', 'false');

    const number = document.createElement('span');
    number.className = 'json-line-number';
    number.textContent = String(lineIndex + 1);
    number.setAttribute('aria-hidden', 'true');

    const code = document.createElement('code');
    code.className = 'json-code';
    let cursor = 0;
    (model.tokensByLine[lineIndex] || []).forEach((token) => {
      const tokenStart = token.column - 1;
      if (tokenStart > cursor) code.append(document.createTextNode(lineText.slice(cursor, tokenStart)));
      const span = document.createElement('span');
      span.className = tokenClass(token);
      span.textContent = token.raw;
      code.appendChild(span);
      cursor = tokenStart + token.raw.length;
    });
    if (cursor < lineText.length) code.append(document.createTextNode(lineText.slice(cursor)));

    const fold = foldByLine.get(lineIndex);
    if (fold) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'json-fold';
      button.textContent = '▾';
      button.setAttribute('aria-expanded', 'true');
      button.setAttribute('aria-label', `Collapse ${fold.opening === '{' ? 'object' : 'array'} at line ${lineIndex + 1}`);
      button.addEventListener('click', () => {
        if (collapsedFolds.has(fold.id)) collapsedFolds.delete(fold.id);
        else collapsedFolds.add(fold.id);
        updateFoldVisibility();
        button.focus();
      });
      button.addEventListener('keydown', (event) => {
        if (event.key === 'ArrowLeft' && !collapsedFolds.has(fold.id)) {
          event.preventDefault();
          collapsedFolds.add(fold.id);
          updateFoldVisibility();
        } else if (event.key === 'ArrowRight' && collapsedFolds.has(fold.id)) {
          event.preventDefault();
          collapsedFolds.delete(fold.id);
          updateFoldVisibility();
        }
      });
      foldSlot.appendChild(button);
      fold.button = button;

      const summary = document.createElement('span');
      summary.className = 'json-fold-summary';
      const hiddenLines = Math.max(0, fold.endLine - fold.startLine - 1);
      summary.textContent = `… ${hiddenLines} hidden ${hiddenLines === 1 ? 'line' : 'lines'}`;
      summary.hidden = true;
      code.appendChild(summary);
      fold.summary = summary;
    }

    row.append(foldSlot, number, code);
    lineElements.push(row);
    fragment.appendChild(row);
  });

  output.appendChild(fragment);
  const hasFolds = foldRanges.length > 0;
  expandAllButton.disabled = !hasFolds;
  collapseAllButton.disabled = !hasFolds;
}

function runTransform(transform, successMessage) {
  try {
    const result = transform(input.value);
    renderOutput(result);
    showOk(successMessage(result));
  } catch (error) {
    clearOutput();
    showError(error);
  }
}

document.getElementById('format-btn').addEventListener('click', () => {
  runTransform(
    (text) => JuankitJson.format(text, getIndent()),
    () => 'Valid JSON — formatted without changing values.'
  );
});

document.getElementById('minify-btn').addEventListener('click', () => {
  runTransform(
    (text) => JuankitJson.minify(text),
    (result) => `Valid JSON — minified (${result.length} characters).`
  );
});

document.getElementById('validate-btn').addEventListener('click', () => {
  try {
    JuankitJson.parse(input.value);
    showOk('Valid JSON.');
  } catch (error) {
    clearOutput();
    showError(error);
  }
});

document.getElementById('copy-btn').addEventListener('click', async () => {
  if (!outputText) return;
  try {
    await navigator.clipboard.writeText(outputText);
    showOk('Copied the complete JSON, including folded lines.');
  } catch (error) {
    showError(new Error('Copy failed — select and copy the result manually.'));
  }
});

expandAllButton.addEventListener('click', () => {
  collapsedFolds.clear();
  updateFoldVisibility();
});

collapseAllButton.addEventListener('click', () => {
  collapsedFolds = new Set(foldRanges.map((fold) => fold.id));
  updateFoldVisibility();
});

clearOutput();
