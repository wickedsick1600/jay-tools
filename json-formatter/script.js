const input = document.getElementById('input');
const output = document.getElementById('output');
const status = document.getElementById('status');
const indentSelect = document.getElementById('indent');
const sortKeys = document.getElementById('sort-keys');
const jsonFile = document.getElementById('json-file');
const findInput = document.getElementById('find-input');
const outputEditor = document.getElementById('output-editor');
const editResultButton = document.getElementById('edit-result-btn');
const expandAllButton = document.getElementById('expand-all-btn');
const collapseAllButton = document.getElementById('collapse-all-btn');

let outputText = '';
let foldRanges = [];
let collapsedFolds = new Set();
let lineElements = [];
let isEditingOutput = false;
let openedFileName = '';

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

function showError(error, target = input) {
  setStatus('status-err', `✕ ${error.message}`);
  if (Number.isInteger(error.offset)) {
    target.focus();
    target.setSelectionRange(error.offset, Math.min(error.offset + 1, target.value.length));
  }
}

function setOutputMode(editing) {
  isEditingOutput = editing;
  output.hidden = editing;
  outputEditor.hidden = !editing;
  editResultButton.textContent = editing ? 'Preview' : 'Edit result';
  const foldsAvailable = foldRanges.length > 0 && !editing;
  expandAllButton.disabled = !foldsAvailable;
  collapseAllButton.disabled = !foldsAvailable;
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
  outputEditor.value = '';
  foldRanges = [];
  collapsedFolds = new Set();
  lineElements = [];
  output.textContent = '';
  const empty = document.createElement('p');
  empty.className = 'json-empty';
  empty.textContent = 'Format or minify JSON to see the result.';
  output.appendChild(empty);
  editResultButton.disabled = true;
  setOutputMode(false);
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
  outputEditor.value = text;
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
  editResultButton.disabled = false;
  setOutputMode(false);
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
    (text) => sortKeys.checked
      ? JuankitJson.sortKeys(text, getIndent())
      : JuankitJson.format(text, getIndent()),
    () => sortKeys.checked
      ? 'Valid JSON — formatted with object keys sorted.'
      : 'Valid JSON — formatted without changing values.'
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
    if (!isEditingOutput) clearOutput();
    showError(error, isEditingOutput ? outputEditor : input);
  }
});

editResultButton.addEventListener('click', () => {
  if (!isEditingOutput) {
    setOutputMode(true);
    outputEditor.focus();
    return;
  }

  try {
    JuankitJson.parse(outputEditor.value);
    renderOutput(outputEditor.value);
    showOk('Valid JSON — result edits synced to your JSON.');
  } catch (error) {
    showError(error, outputEditor);
  }
});

outputEditor.addEventListener('input', () => {
  outputText = outputEditor.value;
  input.value = outputText;
  setStatus('muted', 'Result edited — changes synced to your JSON. Select Preview to validate.');
});

input.addEventListener('input', () => {
  if (!isEditingOutput && outputText) {
    clearOutput();
    setStatus('muted', 'Source changed — format or minify again to refresh the result.');
  }
});

document.getElementById('open-file-btn').addEventListener('click', () => jsonFile.click());

jsonFile.addEventListener('change', async () => {
  const file = jsonFile.files[0];
  jsonFile.value = '';
  if (!file) return;

  try {
    input.value = await file.text();
    openedFileName = file.name;
    clearOutput();
    showOk(`${file.name} loaded locally.`);
    input.focus();
  } catch (error) {
    showError(new Error('Could not read that JSON file.'));
  }
});

function runHistoryCommand(command) {
  const target = isEditingOutput ? outputEditor : input;
  target.focus();
  const changed = document.execCommand(command);
  if (!changed) setStatus('muted', `Nothing to ${command}.`);
}

document.getElementById('undo-btn').addEventListener('click', () => runHistoryCommand('undo'));
document.getElementById('redo-btn').addEventListener('click', () => runHistoryCommand('redo'));

function findText(direction) {
  const query = findInput.value;
  if (!query) {
    setStatus('muted', 'Enter text to find.');
    findInput.focus();
    return;
  }

  const target = isEditingOutput ? outputEditor : input;
  const haystack = target.value.toLocaleLowerCase();
  const needle = query.toLocaleLowerCase();
  let index;

  if (direction > 0) {
    index = haystack.indexOf(needle, target.selectionEnd);
    if (index === -1) index = haystack.indexOf(needle);
  } else {
    index = haystack.lastIndexOf(needle, Math.max(0, target.selectionStart - 1));
    if (index === -1) index = haystack.lastIndexOf(needle);
  }

  if (index === -1) {
    setStatus('status-err', `✕ No match for “${query}”.`);
    return;
  }

  target.hidden = false;
  target.focus();
  target.setSelectionRange(index, index + query.length);
  setStatus('status-ok', `✓ Match at character ${index + 1}.`);
}

document.getElementById('find-previous-btn').addEventListener('click', () => findText(-1));
document.getElementById('find-next-btn').addEventListener('click', () => findText(1));
findInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    findText(event.shiftKey ? -1 : 1);
  }
});

document.getElementById('copy-btn').addEventListener('click', async () => {
  if (!outputText) return;
  try {
    await navigator.clipboard.writeText(outputText);
    showOk(isEditingOutput ? 'Copied the edited result.' : 'Copied the complete JSON, including folded lines.');
  } catch (error) {
    showError(new Error('Copy failed — select and copy the result manually.'));
  }
});

document.getElementById('download-btn').addEventListener('click', () => {
  const target = isEditingOutput ? outputEditor : input;
  const text = isEditingOutput ? outputEditor.value : (outputText || input.value);
  try {
    JuankitJson.parse(text);
    const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const base = (openedFileName || 'formatted.json')
      .replace(/\.json$/i, '')
      .replace(/[\\/:*?"<>|]+/g, '-')
      .trim() || 'formatted';
    link.download = `${base}-juankit.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    showOk('JSON downloaded.');
  } catch (error) {
    showError(error, target);
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
