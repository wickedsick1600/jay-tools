const els = {
  page: document.querySelector('.studio-page'),
  prompt: document.getElementById('prompt'),
  examples: document.getElementById('examples'),
  target: document.getElementById('target'),
  tone: document.getElementById('tone'),
  outputFormat: document.getElementById('output-format'),
  length: document.getElementById('length'),
  creativity: document.getElementById('creativity'),
  creativityValue: document.getElementById('creativity-value'),
  audience: document.getElementById('audience'),
  constraints: document.getElementById('constraints'),
  enhanceBtn: document.getElementById('enhance-btn'),
  variantsBtn: document.getElementById('variants-btn'),
  testBtn: document.getElementById('test-btn'),
  copyResultBtn: document.getElementById('copy-result-btn'),
  newChatBtn: document.getElementById('new-chat-btn'),
  msg: document.getElementById('msg'),
  historyList: document.getElementById('history-list'),
  clearHistoryBtn: document.getElementById('clear-history-btn'),
  templateList: document.getElementById('template-list'),
  collectionList: document.getElementById('collection-list'),
  saveResultBtn: document.getElementById('save-result-btn'),
  exportJsonBtn: document.getElementById('export-json-btn'),
  exportMdBtn: document.getElementById('export-md-btn'),
  targetChips: Array.from(document.querySelectorAll('[data-target-chip]')),
  saveHistoryToggle: document.getElementById('save-history-toggle'),
  privacyPanel: document.getElementById('privacy-panel'),
  privacySummary: document.getElementById('privacy-summary'),
  redactBtn: document.getElementById('redact-btn'),
  sendAnywayBtn: document.getElementById('send-anyway-btn'),
  turnstileWrap: document.getElementById('turnstile-wrap'),
  turnstileContainer: document.getElementById('turnstile-container'),
  resultPanel: document.getElementById('result-panel'),
  resultTitle: document.getElementById('result-title'),
  resultActions: document.getElementById('result-actions'),
  resultEmpty: document.getElementById('result-empty'),
  processingCard: document.getElementById('processing-card'),
  processingTitle: document.getElementById('processing-title'),
  processingDetail: document.getElementById('processing-detail'),
  resultCard: document.getElementById('result-card'),
  resultText: document.getElementById('result-text'),
  resultMeta: document.getElementById('result-meta'),
  assumptionsPanel: document.getElementById('assumptions-panel'),
  assumptionsList: document.getElementById('assumptions-list'),
  warningsPanel: document.getElementById('warnings-panel'),
  warningsList: document.getElementById('warnings-list'),
  scorePanel: document.getElementById('score-panel'),
  scoreTotal: document.getElementById('score-total'),
  scoreBreakdown: document.getElementById('score-breakdown'),
  scoreSuggestions: document.getElementById('score-suggestions'),
  applySuggestionsBtn: document.getElementById('apply-suggestions-btn'),
  clarifyPanel: document.getElementById('clarify-panel'),
  clarifyList: document.getElementById('clarify-list'),
  answerQuestionsBtn: document.getElementById('answer-questions-btn'),
  errorPanel: document.getElementById('error-panel'),
  errorText: document.getElementById('error-text'),
  retryBtn: document.getElementById('retry-btn'),
  postResultActions: document.getElementById('post-result-actions'),
  variantsPanel: document.getElementById('variants-panel'),
  variantsList: document.getElementById('variants-list'),
  testPanel: document.getElementById('test-panel'),
  testInput: document.getElementById('test-input'),
  runTestBtn: document.getElementById('run-test-btn'),
  testOutput: document.getElementById('test-output'),
  feedbackPanel: document.getElementById('feedback-panel'),
  feedbackReasons: document.getElementById('feedback-reasons'),
  feedbackIncludeContent: document.getElementById('feedback-include-content'),
  submitFeedbackBtn: document.getElementById('submit-feedback-btn'),
};

const HISTORY_KEY = 'promptEnhancerHistoryV2';
const HISTORY_ENABLED_KEY = 'promptEnhancerHistoryEnabledV1';
const COLLECTION_KEY = 'promptEnhancerCollectionV1';
const HISTORY_MAX = 8;
const COLLECTION_MAX = 24;
const PROMPT_MAX = 4000;

const TARGET_PRESETS = {
  chatgpt: { label: 'ChatGPT / OpenAI', tone: 'clear', outputFormat: 'structured', length: 'balanced', creativity: 45 },
  claude: { label: 'Claude', tone: 'clear', outputFormat: 'structured', length: 'detailed', creativity: 40 },
  gemini: { label: 'Gemini', tone: 'clear', outputFormat: 'structured', length: 'balanced', creativity: 45 },
  midjourney: { label: 'Midjourney', tone: 'creative', outputFormat: 'prompt-only', length: 'detailed', creativity: 75 },
  'stable-diffusion': { label: 'Stable Diffusion', tone: 'creative', outputFormat: 'prompt-only', length: 'detailed', creativity: 70 },
  'email-draft': { label: 'Professional email', tone: 'professional', outputFormat: 'structured', length: 'balanced', creativity: 25 },
  'linkedin-post': { label: 'LinkedIn post', tone: 'professional', outputFormat: 'structured', length: 'balanced', creativity: 55 },
  'youtube-script': { label: 'YouTube script', tone: 'friendly', outputFormat: 'structured', length: 'detailed', creativity: 65 },
  coding: { label: 'Coding assistant', tone: 'technical', outputFormat: 'structured', length: 'detailed', creativity: 25 },
  research: { label: 'Research assistant', tone: 'professional', outputFormat: 'structured', length: 'detailed', creativity: 30 },
  'data-analysis': { label: 'Data analysis', tone: 'technical', outputFormat: 'table', length: 'detailed', creativity: 20 },
  'agent-workflow': { label: 'Agent workflow', tone: 'technical', outputFormat: 'structured', length: 'comprehensive', creativity: 35 },
  generic: { label: 'Generic AI tool', tone: 'clear', outputFormat: 'structured', length: 'balanced', creativity: 45 },
};

const TEMPLATES = [
  {
    id: 'summarize',
    title: 'Summarize',
    target: 'chatgpt',
    prompt: 'Summarize these notes into the key points, decisions, risks, and next actions.',
    constraints: 'Keep the summary faithful to the source and call out missing context.',
  },
  {
    id: 'brainstorm',
    title: 'Brainstorm',
    target: 'generic',
    prompt: 'Generate practical ideas for this goal and rank them by impact, effort, and risk.',
    constraints: 'Avoid generic ideas. Include a short reason for each suggestion.',
  },
  {
    id: 'email',
    title: 'Write Email',
    target: 'email-draft',
    prompt: 'Draft a professional email that clearly explains the situation and asks for the next step.',
    constraints: 'Use a respectful tone, concise paragraphs, and a clear subject line.',
  },
  {
    id: 'code-review',
    title: 'Code Review',
    target: 'coding',
    prompt: 'Review this code or pull request for bugs, regressions, security issues, and missing tests.',
    constraints: 'Prioritize actionable findings with severity and file references when available.',
  },
  {
    id: 'debug',
    title: 'Debug',
    target: 'coding',
    prompt: 'Help diagnose this bug from the symptoms, expected behavior, logs, and attempted fixes.',
    constraints: 'Ask for missing information only when necessary. Provide likely causes and verification steps.',
  },
  {
    id: 'image',
    title: 'Image Prompt',
    target: 'midjourney',
    prompt: 'Create an image prompt for a visually rich scene with a clear subject, setting, style, lighting, and composition.',
    constraints: 'Avoid copyrighted character names unless I provide them. Include aspect ratio guidance.',
  },
  {
    id: 'study-guide',
    title: 'Study Guide',
    target: 'chatgpt',
    prompt: 'Turn this topic into a study guide with explanations, examples, practice questions, and an answer key.',
    constraints: 'Start simple, then increase difficulty. Define unfamiliar terms.',
  },
  {
    id: 'agent',
    title: 'Agent Task',
    target: 'agent-workflow',
    prompt: 'Create an agent instruction prompt for completing this workflow end to end.',
    constraints: 'Include goal, tools, boundaries, progress updates, failure handling, and final output format.',
  },
  {
    id: 'messy-notes',
    title: 'Clean Notes',
    target: 'research',
    prompt: 'Transform these messy notes into a structured prompt that preserves facts and separates assumptions from unknowns.',
    constraints: 'Do not invent facts. Mark gaps as questions.',
  },
];

const PRIVACY_PATTERNS = [
  { type: 'email address', label: '[redacted-email]', pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { type: 'phone number', label: '[redacted-phone]', pattern: /(?:\+?\d[\s().-]?){8,}\d/g },
  { type: 'API key or token', label: '[redacted-token]', pattern: /\b(?:sk-[A-Za-z0-9_-]{16,}|[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{20,}|(?:api[_-]?key|access[_-]?token|secret|password)\s*[:=]\s*["']?[^"'\s]{6,})/gi },
  { type: 'credit card number', label: '[redacted-card]', pattern: /\b(?:\d[ -]*?){13,19}\b/g },
  { type: 'private identifier', label: '[redacted-private-id]', pattern: /\b(?:ssn|social security|passport|tax id)\s*[:#-]?\s*[A-Z0-9-]{4,}/gi },
];

let currentResult = null;
let pendingSubmit = null;
let selectedFeedbackRating = '';
let turnstileToken = '';
let turnstileWidgetId = null;
let applyingPreset = false;

function flash(text, isError = false) {
  els.msg.textContent = text;
  els.msg.className = isError ? 'error' : 'muted';
}

function readStore(key, fallback) {
  try {
    const parsed = JSON.parse(readLocalString(key) || 'null');
    return parsed === null ? fallback : parsed;
  } catch {
    return fallback;
  }
}

function readLocalString(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocalString(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    flash('Local storage is blocked in this browser.', true);
    return false;
  }
}

function removeLocalString(key) {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

function writeStore(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    flash('Local storage is full or blocked in this browser.', true);
    return false;
  }
}

function targetLabel(targetValue = els.target.value) {
  return TARGET_PRESETS[targetValue]?.label || targetValue || 'Generic AI tool';
}

function getMode() {
  return document.querySelector('input[name="prompt-mode"]:checked')?.value || 'enhance';
}

function getOptions() {
  return {
    tone: els.tone.value,
    outputFormat: els.outputFormat.value,
    length: els.length.value,
    creativity: Number(els.creativity.value),
    audience: els.audience.value.trim(),
    constraints: els.constraints.value.trim(),
    examples: els.examples.value.trim(),
  };
}

function historyEnabled() {
  return readLocalString(HISTORY_ENABLED_KEY) === 'true';
}

function setButtonLoading(button, isLoading, loadingLabel = '') {
  if (!button) return;
  if (!button.dataset.defaultLabel) button.dataset.defaultLabel = button.textContent.trim();
  button.classList.toggle('is-loading', isLoading);
  button.setAttribute('aria-busy', isLoading ? 'true' : 'false');
  button.textContent = '';

  if (isLoading) {
    const spinner = document.createElement('span');
    spinner.className = 'button-spinner';
    spinner.setAttribute('aria-hidden', 'true');

    const label = document.createElement('span');
    label.className = 'button-label';
    label.textContent = loadingLabel || button.dataset.defaultLabel;

    button.append(spinner, label);
    return;
  }

  button.textContent = button.dataset.defaultLabel;
}

function showProcessing(kind) {
  const isClarify = kind === 'clarify';
  els.page.classList.add('has-result');
  els.resultPanel.hidden = false;
  els.resultPanel.setAttribute('aria-busy', 'true');
  els.processingCard.hidden = false;
  els.resultEmpty.hidden = true;
  els.resultCard.hidden = true;
  els.clarifyPanel.hidden = true;
  els.errorPanel.hidden = true;
  els.variantsPanel.hidden = true;
  els.testPanel.hidden = true;
  showResultActions(false);
  els.resultTitle.textContent = isClarify ? 'Questions' : 'Result';
  els.resultMeta.textContent = '';
  els.processingTitle.textContent = isClarify ? 'Preparing your questions' : 'Preparing your prompt';
  els.processingDetail.textContent = 'This usually takes a few seconds.';
}

function hideProcessing() {
  els.processingCard.hidden = true;
  els.resultPanel.removeAttribute('aria-busy');
}

function setBusy(isBusy, text = '', kind = 'enhance') {
  els.enhanceBtn.disabled = isBusy;
  els.variantsBtn.disabled = isBusy || !currentResult?.enhanced;
  els.testBtn.disabled = isBusy || !currentResult?.enhanced;
  els.copyResultBtn.disabled = isBusy || !currentResult?.enhanced;
  els.saveResultBtn.disabled = isBusy || !currentResult?.enhanced;
  els.page.classList.toggle('is-processing', isBusy);
  els.msg.classList.remove('processing-status');

  if (isBusy) {
    if (kind === 'variants') {
      if (text) flash(text);
      setButtonLoading(els.variantsBtn, true, 'Generating...');
    } else if (kind === 'test') {
      if (text) flash(text);
      setButtonLoading(els.runTestBtn, true, 'Running...');
    } else {
      els.msg.textContent = '';
      els.msg.className = 'muted';
      showProcessing(kind);
      setButtonLoading(els.enhanceBtn, true, 'Working...');
    }
    return;
  }

  hideProcessing();
  setButtonLoading(els.enhanceBtn, false);
  setButtonLoading(els.variantsBtn, false);
  setButtonLoading(els.runTestBtn, false);
  if (!els.msg.textContent) flash('Ready.');
}

function resetTurnstile() {
  if (window.turnstile && turnstileWidgetId !== null) {
    window.turnstile.reset(turnstileWidgetId);
    turnstileToken = '';
  }
}

function safeText(value) {
  return typeof value === 'string' ? value : '';
}

function detectSensitiveText(text) {
  const matches = [];
  PRIVACY_PATTERNS.forEach((entry) => {
    const found = text.match(entry.pattern);
    if (found?.length) {
      matches.push({ type: entry.type, count: found.length });
    }
  });
  return matches;
}

function redactSensitiveText(text) {
  return PRIVACY_PATTERNS.reduce((value, entry) => value.replace(entry.pattern, entry.label), text);
}

function summarizePrivacyMatches(matches) {
  return matches.map((item) => `${item.count} ${item.type}${item.count > 1 ? 's' : ''}`).join(', ');
}

function hidePrivacyPanel() {
  els.privacyPanel.hidden = true;
  els.privacySummary.textContent = '';
}

function setOptionalToolsOpen(isOpen) {
  document.querySelectorAll('.progressive-tools details').forEach((details) => {
    details.open = Boolean(isOpen);
  });
}

function showResultActions(isVisible) {
  const visible = Boolean(isVisible);
  els.resultActions.hidden = !visible;
  els.postResultActions.hidden = !visible;
  els.feedbackPanel.hidden = !visible;
}

function renderTemplates() {
  els.templateList.textContent = '';
  TEMPLATES.forEach((template) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'template-btn';
    button.dataset.templateId = template.id;

    const title = document.createElement('strong');
    title.textContent = template.title;
    const meta = document.createElement('span');
    meta.textContent = targetLabel(template.target);

    button.append(title, meta);
    els.templateList.appendChild(button);
  });
}

function renderHistory() {
  const history = readStore(HISTORY_KEY, []);
  els.historyList.textContent = '';

  if (!Array.isArray(history) || !history.length) {
    const empty = document.createElement('p');
    empty.className = 'muted empty-copy';
    empty.textContent = 'No saved history yet.';
    els.historyList.appendChild(empty);
    return;
  }

  history.slice(0, HISTORY_MAX).forEach((entry, idx) => {
    const item = document.createElement('div');
    item.className = 'history-item';

    const meta = document.createElement('div');
    meta.className = 'history-item-meta';
    meta.textContent = `${targetLabel(entry.target)} - ${new Date(entry.time).toLocaleString()}`;

    const preview = document.createElement('p');
    preview.textContent = entry.prompt || entry.enhanced || '';

    const load = document.createElement('button');
    load.type = 'button';
    load.className = 'secondary small-btn';
    load.dataset.historyIndex = String(idx);
    load.textContent = 'Load';

    item.append(meta, preview, load);
    els.historyList.appendChild(item);
  });
}

function renderCollections() {
  const collection = readStore(COLLECTION_KEY, []);
  els.collectionList.textContent = '';

  if (!Array.isArray(collection) || !collection.length) {
    const empty = document.createElement('p');
    empty.className = 'muted empty-copy';
    empty.textContent = 'No collection items yet.';
    els.collectionList.appendChild(empty);
    return;
  }

  collection.slice(0, COLLECTION_MAX).forEach((entry, idx) => {
    const item = document.createElement('div');
    item.className = 'history-item';

    const meta = document.createElement('div');
    meta.className = 'history-item-meta';
    meta.textContent = `${targetLabel(entry.target)} - ${new Date(entry.time).toLocaleDateString()}`;

    const preview = document.createElement('p');
    preview.textContent = entry.enhanced || entry.prompt || '';

    const actions = document.createElement('div');
    actions.className = 'mini-actions';

    const load = document.createElement('button');
    load.type = 'button';
    load.className = 'secondary small-btn';
    load.dataset.collectionIndex = String(idx);
    load.textContent = 'Load';

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'secondary small-btn';
    remove.dataset.collectionDelete = String(idx);
    remove.textContent = 'Delete';

    actions.append(load, remove);
    item.append(meta, preview, actions);
    els.collectionList.appendChild(item);
  });
}

function saveHistoryItem(result) {
  if (!historyEnabled() || !result?.enhanced) return;
  const history = readStore(HISTORY_KEY, []);
  const next = [result, ...(Array.isArray(history) ? history : [])].slice(0, HISTORY_MAX);
  writeStore(HISTORY_KEY, next);
  renderHistory();
}

function saveCurrentResult() {
  if (!currentResult?.enhanced) return;
  const collection = readStore(COLLECTION_KEY, []);
  const entry = {
    ...currentResult,
    time: Date.now(),
  };
  const next = [entry, ...(Array.isArray(collection) ? collection : [])].slice(0, COLLECTION_MAX);
  if (writeStore(COLLECTION_KEY, next)) {
    renderCollections();
    flash('Saved to local collection.');
  }
}

function syncTargetChips() {
  els.targetChips.forEach((chip) => {
    chip.classList.toggle('is-active', chip.dataset.targetChip === els.target.value);
  });
}

function applyTargetPreset(target, force = false) {
  const preset = TARGET_PRESETS[target] || TARGET_PRESETS.generic;
  applyingPreset = true;
  if (force || !els.tone.dataset.userEdited) els.tone.value = preset.tone;
  if (force || !els.outputFormat.dataset.userEdited) els.outputFormat.value = preset.outputFormat;
  if (force || !els.length.dataset.userEdited) els.length.value = preset.length;
  if (force || !els.creativity.dataset.userEdited) els.creativity.value = preset.creativity;
  els.creativityValue.textContent = els.creativity.value;
  applyingPreset = false;
  syncTargetChips();
}

function applyTemplate(templateId) {
  const template = TEMPLATES.find((item) => item.id === templateId);
  if (!template) return;
  els.target.value = template.target;
  applyTargetPreset(template.target, true);
  els.prompt.value = template.prompt;
  els.constraints.value = template.constraints;
  els.prompt.focus();
  flash(`Loaded ${template.title} template.`);
}

function setList(listEl, items) {
  listEl.textContent = '';
  if (!items?.length) return;
  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item;
    listEl.appendChild(li);
  });
}

function renderScore(score) {
  const total = Number(score?.total);
  if (!Number.isFinite(total)) {
    els.scorePanel.hidden = true;
    return;
  }

  els.scorePanel.hidden = false;
  els.scoreTotal.textContent = Math.max(0, Math.min(100, Math.round(total)));
  els.scoreBreakdown.textContent = '';

  const criteria = score.criteria && typeof score.criteria === 'object' ? score.criteria : {};
  Object.entries(criteria).forEach(([name, value]) => {
    const row = document.createElement('div');
    row.className = 'score-row';
    const label = document.createElement('span');
    label.textContent = name.replace(/-/g, ' ');
    const meter = document.createElement('meter');
    meter.min = 0;
    meter.max = 20;
    meter.value = Number(value) || 0;
    const number = document.createElement('span');
    number.textContent = `${Math.round(Number(value) || 0)}/20`;
    row.append(label, meter, number);
    els.scoreBreakdown.appendChild(row);
  });

  els.scoreSuggestions.textContent = '';
  const suggestions = Array.isArray(score.suggestions) ? score.suggestions : [];
  suggestions.forEach((suggestion) => {
    const p = document.createElement('p');
    p.textContent = suggestion;
    els.scoreSuggestions.appendChild(p);
  });
  els.applySuggestionsBtn.hidden = suggestions.length === 0;
}

function renderVariants(variants) {
  els.variantsList.textContent = '';
  if (!Array.isArray(variants) || !variants.length) {
    els.variantsPanel.hidden = true;
    return;
  }

  els.variantsPanel.hidden = false;
  variants.forEach((variant, idx) => {
    const card = document.createElement('article');
    card.className = 'variant-card';

    const title = document.createElement('h4');
    title.textContent = safeText(variant.title) || `Variant ${idx + 1}`;

    const pre = document.createElement('pre');
    pre.textContent = safeText(variant.prompt || variant.text);

    const copy = document.createElement('button');
    copy.type = 'button';
    copy.className = 'secondary small-btn';
    copy.dataset.copyVariant = String(idx);
    copy.textContent = 'Copy';

    const use = document.createElement('button');
    use.type = 'button';
    use.className = 'secondary small-btn';
    use.dataset.useVariant = String(idx);
    use.textContent = 'Use';

    const actions = document.createElement('div');
    actions.className = 'mini-actions';
    actions.append(copy, use);
    card.append(title, pre, actions);
    els.variantsList.appendChild(card);
  });
}

function renderResult(data, request, opts = {}) {
  const enhanced = safeText(data.enhanced).trim();
  const questions = Array.isArray(data.questions) ? data.questions.filter(Boolean) : [];
  const hasOutput = Boolean(enhanced || questions.length);

  els.page.classList.toggle('has-result', hasOutput);
  els.resultPanel.hidden = !hasOutput;
  els.resultTitle.textContent = questions.length && !enhanced ? 'Questions' : 'Result';
  els.resultEmpty.hidden = hasOutput;
  showResultActions(Boolean(enhanced));
  els.resultCard.hidden = !enhanced;
  els.clarifyPanel.hidden = !questions.length;
  els.errorPanel.hidden = true;
  els.variantsPanel.hidden = true;
  els.testPanel.hidden = true;

  setList(els.assumptionsList, data.assumptions || []);
  els.assumptionsPanel.hidden = !data.assumptions?.length;

  setList(els.warningsList, data.warnings || []);
  els.warningsPanel.hidden = !data.warnings?.length;

  if (questions.length) {
    els.clarifyList.textContent = '';
    questions.forEach((question) => {
      const li = document.createElement('li');
      li.textContent = question;
      els.clarifyList.appendChild(li);
    });
    els.resultMeta.textContent = 'Answer these to improve the final prompt.';
  }

  if (!enhanced) {
    currentResult = null;
    renderScore(null);
    renderVariants([]);
    setBusy(false);
    return;
  }

  currentResult = {
    prompt: request.prompt,
    target: request.target,
    options: request.options,
    mode: request.mode,
    enhanced,
    assumptions: data.assumptions || [],
    warnings: data.warnings || [],
    score: data.score || null,
    variants: data.variants || [],
    requestId: data.requestId || '',
    time: Date.now(),
  };

  els.resultText.textContent = enhanced;
  els.resultMeta.textContent = `${targetLabel(request.target)} - ${new Date(currentResult.time).toLocaleString()}`;
  renderScore(data.score);
  renderVariants(data.variants);
  if (!opts.skipHistory) saveHistoryItem(currentResult);
  setBusy(false);
  flash('Done.');
}

function resetStudio() {
  currentResult = null;
  selectedFeedbackRating = '';
  pendingSubmit = null;
  els.prompt.value = '';
  els.examples.value = '';
  els.audience.value = '';
  els.constraints.value = '';
  els.testInput.value = '';
  els.testOutput.textContent = '';
  els.resultText.textContent = '';
  els.resultTitle.textContent = 'Result';
  els.resultMeta.textContent = 'No result yet.';
  els.page.classList.remove('has-result');
  els.page.classList.remove('is-processing');
  els.resultPanel.hidden = true;
  hideProcessing();
  els.resultEmpty.hidden = false;
  els.resultCard.hidden = true;
  els.clarifyPanel.hidden = true;
  els.errorPanel.hidden = true;
  els.variantsPanel.hidden = true;
  els.testPanel.hidden = true;
  showResultActions(false);
  hidePrivacyPanel();
  setBusy(false);
  flash('Ready.');
}

function buildRequest(variantCount = 0) {
  const prompt = (els.prompt.value.trim() || currentResult?.prompt || '').trim();
  const options = getOptions();
  return {
    prompt,
    target: els.target.value,
    mode: getMode(),
    options,
    variantCount,
    turnstileToken: turnstileToken || undefined,
  };
}

function showErrorResult(message) {
  els.page.classList.add('has-result');
  els.page.classList.remove('is-processing');
  els.resultPanel.hidden = false;
  els.resultPanel.removeAttribute('aria-busy');
  els.resultTitle.textContent = 'Result';
  els.resultMeta.textContent = 'Request failed.';
  els.processingCard.hidden = true;
  els.resultEmpty.hidden = true;
  els.resultCard.hidden = true;
  els.clarifyPanel.hidden = true;
  els.variantsPanel.hidden = true;
  els.testPanel.hidden = true;
  showResultActions(false);
  els.errorText.textContent = message || 'The request failed. Check your input and try again.';
  els.errorPanel.hidden = false;
}

async function readJsonResponse(res) {
  const raw = await res.text();
  if (!raw.trim()) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`Server returned unreadable JSON (HTTP ${res.status}).`);
  }
}

async function submitEnhancement({ variantCount = 0, bypassPrivacy = false } = {}) {
  const request = buildRequest(variantCount);
  if (!request.prompt) {
    flash('Type a prompt first.', true);
    return;
  }
  if (request.prompt.length > PROMPT_MAX) {
    flash(`Keep the input under ${PROMPT_MAX} characters.`, true);
    return;
  }

  const privacyText = `${request.prompt}\n${request.options.examples || ''}`;
  const privacyMatches = detectSensitiveText(privacyText);
  if (privacyMatches.length && !bypassPrivacy) {
    pendingSubmit = { variantCount };
    els.privacySummary.textContent = `Found ${summarizePrivacyMatches(privacyMatches)}. Redact before sending, or continue if this is intentional.`;
    els.privacyPanel.hidden = false;
    flash('Review privacy warning before sending.', true);
    return;
  }
  hidePrivacyPanel();

  if (!variantCount) {
    currentResult = null;
  }
  setOptionalToolsOpen(false);

  const busyKind = variantCount ? 'variants' : request.mode === 'clarify' ? 'clarify' : 'enhance';
  setBusy(true, variantCount ? 'Generating variants...' : request.mode === 'clarify' ? 'Preparing your questions' : 'Preparing your prompt', busyKind);

  try {
    const res = await fetch('/.netlify/functions/enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
    const data = await readJsonResponse(res);
    if (!res.ok) {
      throw new Error(data.error || 'Enhancement failed. Try again shortly.');
    }

    if (variantCount && currentResult?.enhanced && data.variants?.length) {
      currentResult.variants = data.variants;
      renderVariants(data.variants);
      flash('Variants ready.');
      return;
    }

    renderResult(data, request);
  } catch (err) {
    const message = err.message || 'Unexpected failure.';
    flash(message, true);
    if (!variantCount && !currentResult?.enhanced) {
      showErrorResult(message);
    }
  } finally {
    setBusy(false);
    resetTurnstile();
  }
}

async function copyText(text) {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', '');
    helper.style.position = 'fixed';
    helper.style.left = '-9999px';
    document.body.appendChild(helper);
    helper.select();
    const ok = document.execCommand('copy');
    helper.remove();
    return ok;
  }
}

function downloadText(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportCollection(format) {
  const collection = readStore(COLLECTION_KEY, []);
  if (!Array.isArray(collection) || !collection.length) {
    flash('No collection items to export.', true);
    return;
  }

  if (format === 'json') {
    downloadText('prompt-enhancer-collection-juankit.json', JSON.stringify(collection, null, 2), 'application/json');
    flash('Collection exported as JSON.');
    return;
  }

  const markdown = collection.map((item, idx) => {
    const parts = [
      `## ${idx + 1}. ${targetLabel(item.target)}`,
      '',
      `Saved: ${new Date(item.time).toLocaleString()}`,
      '',
      '### Original',
      item.prompt || '',
      '',
      '### Enhanced',
      item.enhanced || '',
    ];
    if (item.score?.total) {
      parts.push('', `Score: ${item.score.total}/100`);
    }
    return parts.join('\n');
  }).join('\n\n---\n\n');

  downloadText('prompt-enhancer-collection-juankit.md', markdown, 'text/markdown');
  flash('Collection exported as Markdown.');
}

function loadResultEntry(entry) {
  if (!entry) return;
  els.target.value = entry.target || 'generic';
  applyTargetPreset(els.target.value, false);
  els.prompt.value = entry.prompt || '';
  els.examples.value = entry.options?.examples || '';
  els.audience.value = entry.options?.audience || '';
  els.constraints.value = entry.options?.constraints || '';
  if (entry.options?.tone) els.tone.value = entry.options.tone;
  if (entry.options?.outputFormat) els.outputFormat.value = entry.options.outputFormat;
  if (entry.options?.length) els.length.value = entry.options.length;
  if (Number.isFinite(Number(entry.options?.creativity))) {
    els.creativity.value = Number(entry.options.creativity);
    els.creativityValue.textContent = els.creativity.value;
  }
  renderResult(entry, {
    prompt: entry.prompt || '',
    target: entry.target || 'generic',
    mode: entry.mode || 'enhance',
    options: entry.options || getOptions(),
  }, { skipHistory: true });
  flash('Loaded locally saved prompt.');
}

function applyScoreSuggestions() {
  const suggestions = currentResult?.score?.suggestions || [];
  if (!suggestions.length || !currentResult?.enhanced) return;
  els.prompt.value = `Improve this prompt by applying these suggestions:\n- ${suggestions.join('\n- ')}\n\n${currentResult.enhanced}`;
  els.prompt.focus();
  flash('Suggestions loaded into editor.');
}

function answerClarifyingQuestions() {
  const questions = Array.from(els.clarifyList.querySelectorAll('li')).map((li) => li.textContent);
  if (!questions.length) return;
  els.prompt.value = `${els.prompt.value.trim()}\n\nAnswers to clarify:\n${questions.map((question) => `- ${question}: `).join('\n')}`;
  els.prompt.focus();
  flash('Questions added to the editor.');
}

async function runTestPreview() {
  if (!currentResult?.enhanced) return;
  els.testOutput.textContent = 'Running preview...';
  els.testOutput.classList.add('is-loading');
  els.runTestBtn.disabled = true;
  setButtonLoading(els.runTestBtn, true, 'Running...');
  try {
    const res = await fetch('/.netlify/functions/test-prompt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: currentResult.enhanced,
        sampleInput: els.testInput.value.trim(),
        target: currentResult.target,
        turnstileToken: turnstileToken || undefined,
      }),
    });
    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'Test preview failed.');
    els.testOutput.textContent = `${data.preview || ''}\n\nCritique:\n${data.critique || ''}`.trim();
    flash('Test preview ready.');
  } catch (err) {
    els.testOutput.textContent = err.message || 'Test preview failed.';
    flash(err.message || 'Test preview failed.', true);
  } finally {
    els.testOutput.classList.remove('is-loading');
    els.runTestBtn.disabled = false;
    setButtonLoading(els.runTestBtn, false);
    resetTurnstile();
  }
}

function anonymize(value) {
  return redactSensitiveText(value || '').slice(0, 1200);
}

async function submitFeedback() {
  if (!selectedFeedbackRating || !currentResult) return;
  const reasons = Array.from(els.feedbackReasons.querySelectorAll('input[type="checkbox"]:checked'))
    .filter((input) => input !== els.feedbackIncludeContent)
    .map((input) => input.value);
  const includeContent = els.feedbackIncludeContent.checked;
  try {
    const res = await fetch('/.netlify/functions/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating: selectedFeedbackRating,
        reasons,
        target: currentResult.target,
        requestId: currentResult.requestId,
        includeContent,
        prompt: includeContent ? anonymize(currentResult.prompt) : undefined,
        enhanced: includeContent ? anonymize(currentResult.enhanced) : undefined,
      }),
    });
    const data = await readJsonResponse(res);
    if (!res.ok) throw new Error(data.error || 'Feedback failed.');
    els.feedbackReasons.hidden = true;
    flash('Feedback saved. Thanks.');
  } catch (err) {
    flash(err.message || 'Feedback failed.', true);
  }
}

async function getTurnstileSiteKey() {
  const meta = document.querySelector('meta[name="turnstile-site-key"]');
  const staticKey = (meta?.content || '').trim();
  if (staticKey) return staticKey;

  try {
    const res = await fetch('/.netlify/functions/config');
    if (!res.ok) return '';
    const data = await res.json();
    return safeText(data.turnstileSiteKey).trim();
  } catch {
    return '';
  }
}

function loadTurnstileScript() {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-turnstile-script="1"]');
    if (existing) {
      if (window.turnstile) resolve();
      else existing.addEventListener('load', resolve, { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.turnstileScript = '1';
    script.addEventListener('load', resolve, { once: true });
    script.addEventListener('error', reject, { once: true });
    document.head.appendChild(script);
  });
}

async function initTurnstile() {
  if (!els.turnstileWrap || !els.turnstileContainer) return;
  const siteKey = await getTurnstileSiteKey();
  if (!siteKey) return;

  els.turnstileWrap.hidden = false;
  try {
    await loadTurnstileScript();
    if (!window.turnstile) {
      flash('Human verification unavailable right now.', true);
      return;
    }
    turnstileWidgetId = window.turnstile.render(els.turnstileContainer, {
      sitekey: siteKey,
      callback: (token) => { turnstileToken = token; },
      'expired-callback': () => { turnstileToken = ''; },
      'error-callback': () => { turnstileToken = ''; },
    });
  } catch {
    flash('Failed to load human verification.', true);
  }
}

function initEvents() {
  els.enhanceBtn.addEventListener('click', () => submitEnhancement({ variantCount: 0 }));
  els.variantsBtn.addEventListener('click', () => submitEnhancement({ variantCount: 3 }));
  els.copyResultBtn.addEventListener('click', async () => {
    const ok = await copyText(currentResult?.enhanced || '');
    flash(ok ? 'Copied result.' : 'Copy failed. Select the result manually.', !ok);
  });
  els.testBtn.addEventListener('click', () => {
    els.testPanel.hidden = !els.testPanel.hidden;
    if (!els.testPanel.hidden) els.testInput.focus();
  });
  els.runTestBtn.addEventListener('click', runTestPreview);
  els.retryBtn.addEventListener('click', () => submitEnhancement({ variantCount: 0 }));
  els.newChatBtn.addEventListener('click', resetStudio);
  els.saveResultBtn.addEventListener('click', saveCurrentResult);
  els.exportJsonBtn.addEventListener('click', () => exportCollection('json'));
  els.exportMdBtn.addEventListener('click', () => exportCollection('markdown'));
  els.applySuggestionsBtn.addEventListener('click', applyScoreSuggestions);
  els.answerQuestionsBtn.addEventListener('click', answerClarifyingQuestions);
  els.submitFeedbackBtn.addEventListener('click', submitFeedback);

  els.prompt.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      submitEnhancement({ variantCount: 0 });
    }
  });

  els.creativity.addEventListener('input', () => {
    if (!applyingPreset) els.creativity.dataset.userEdited = 'true';
    els.creativityValue.textContent = els.creativity.value;
  });

  [els.tone, els.outputFormat, els.length].forEach((control) => {
    control.addEventListener('change', () => {
      if (!applyingPreset) control.dataset.userEdited = 'true';
    });
  });

  els.target.addEventListener('change', () => applyTargetPreset(els.target.value, false));

  els.targetChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      els.target.value = chip.dataset.targetChip;
      applyTargetPreset(els.target.value, true);
      flash(`Target set to ${targetLabel()}.`);
    });
  });

  els.templateList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-template-id]');
    if (button) applyTemplate(button.dataset.templateId);
  });

  els.historyList.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-history-index]');
    if (!button) return;
    const item = readStore(HISTORY_KEY, [])[Number(button.dataset.historyIndex)];
    loadResultEntry(item);
  });

  els.collectionList.addEventListener('click', (event) => {
    const load = event.target.closest('button[data-collection-index]');
    const remove = event.target.closest('button[data-collection-delete]');
    const collection = readStore(COLLECTION_KEY, []);
    if (load) {
      loadResultEntry(collection[Number(load.dataset.collectionIndex)]);
      return;
    }
    if (remove) {
      collection.splice(Number(remove.dataset.collectionDelete), 1);
      writeStore(COLLECTION_KEY, collection);
      renderCollections();
      flash('Removed from collection.');
    }
  });

  els.clearHistoryBtn.addEventListener('click', () => {
    removeLocalString(HISTORY_KEY);
    renderHistory();
    flash('History cleared.');
  });

  els.saveHistoryToggle.addEventListener('change', () => {
    writeLocalString(HISTORY_ENABLED_KEY, els.saveHistoryToggle.checked ? 'true' : 'false');
    if (!els.saveHistoryToggle.checked) {
      removeLocalString(HISTORY_KEY);
      renderHistory();
    }
    flash(els.saveHistoryToggle.checked ? 'Local history enabled.' : 'Local history disabled and cleared.');
  });

  els.redactBtn.addEventListener('click', () => {
    els.prompt.value = redactSensitiveText(els.prompt.value);
    els.examples.value = redactSensitiveText(els.examples.value);
    hidePrivacyPanel();
    submitEnhancement({ variantCount: pendingSubmit?.variantCount || 0, bypassPrivacy: true });
  });

  els.sendAnywayBtn.addEventListener('click', () => {
    hidePrivacyPanel();
    submitEnhancement({ variantCount: pendingSubmit?.variantCount || 0, bypassPrivacy: true });
  });

  els.variantsList.addEventListener('click', async (event) => {
    const copy = event.target.closest('button[data-copy-variant]');
    const use = event.target.closest('button[data-use-variant]');
    const variants = currentResult?.variants || [];
    if (copy) {
      const variant = variants[Number(copy.dataset.copyVariant)];
      const ok = await copyText(variant?.prompt || variant?.text || '');
      flash(ok ? 'Variant copied.' : 'Copy failed.', !ok);
      return;
    }
    if (use) {
      const variant = variants[Number(use.dataset.useVariant)];
      if (!variant) return;
      currentResult.enhanced = variant.prompt || variant.text || '';
      els.resultText.textContent = currentResult.enhanced;
      flash('Variant is now the active result.');
    }
  });

  els.feedbackPanel.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-feedback-rating]');
    if (!button) return;
    selectedFeedbackRating = button.dataset.feedbackRating;
    els.feedbackReasons.hidden = selectedFeedbackRating === 'helpful';
    if (selectedFeedbackRating === 'helpful') {
      submitFeedback();
    } else {
      flash('Choose any reasons, then submit feedback.');
    }
  });
}

function init() {
  if (readLocalString(HISTORY_ENABLED_KEY) === null) {
    writeLocalString(HISTORY_ENABLED_KEY, 'false');
  }
  els.saveHistoryToggle.checked = historyEnabled();
  renderTemplates();
  renderHistory();
  renderCollections();
  applyTargetPreset(els.target.value, true);
  initEvents();
  initTurnstile();
  setBusy(false);
}

init();
