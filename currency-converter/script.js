(function () {
  'use strict';

  const API_ORIGIN = 'https://api.frankfurter.dev';
  const RATES_URL = API_ORIGIN + '/v2/rates?base=EUR';
  const CURRENCIES_URL = API_ORIGIN + '/v2/currencies';
  const CACHE_KEY = 'juankit:currency-converter:rates:v1';
  const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
  const REQUEST_TIMEOUT_MS = 12000;
  const DEFAULT_TARGETS = ['PHP', 'EUR', 'AED'];
  const PREFERRED_ADDITIONS = ['JPY', 'GBP', 'CAD', 'AUD', 'SGD', 'CHF', 'CNY', 'INR'];

  const Core = window.CurrencyCore;
  const amountInput = document.getElementById('amount');
  const amountError = document.getElementById('amount-error');
  const baseSelect = document.getElementById('base-currency');
  const resultsList = document.getElementById('results');
  const addTargetButton = document.getElementById('add-target');
  const copyButton = document.getElementById('copy-results');
  const refreshButton = document.getElementById('refresh-rates');
  const statusPanel = document.querySelector('.rate-status-panel');
  const dataStatus = document.getElementById('data-status');
  const rateDetail = document.getElementById('rate-detail');

  let dataset = null;
  let currencies = [];
  let targets = [];
  let activeController = null;
  let requestNumber = 0;

  function makeDisplayNames() {
    try {
      if (typeof Intl.DisplayNames === 'function') {
        return new Intl.DisplayNames([navigator.language || 'en'], { type: 'currency' });
      }
    } catch (error) {}
    return null;
  }

  const currencyDisplayNames = makeDisplayNames();

  function currencyName(record) {
    if (record.name && record.name !== record.code) return record.name;
    if (currencyDisplayNames) {
      try { return currencyDisplayNames.of(record.code) || record.code; } catch (error) {}
    }
    return record.code;
  }

  function optionLabel(record) {
    const name = currencyName(record);
    return name === record.code ? record.code : record.code + ' — ' + name;
  }

  function recordFor(code) {
    return currencies.find(function (record) { return record.code === code; }) || { code: code, name: code, symbol: '' };
  }

  function setStatus(message, detail, isError) {
    dataStatus.textContent = message;
    rateDetail.textContent = detail || '';
    statusPanel.classList.toggle('is-error', Boolean(isError));
  }

  function formatApiDate(value) {
    if (!value) return 'unknown date';
    const parts = value.split('-').map(Number);
    if (parts.length !== 3 || parts.some(function (part) { return !Number.isFinite(part); })) return value;
    try {
      return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' })
        .format(new Date(Date.UTC(parts[0], parts[1] - 1, parts[2])));
    } catch (error) {
      return value;
    }
  }

  function rateDateLabel(data) {
    if (!data || !data.dateMin) return 'Reference date unavailable';
    if (!data.dateMax || data.dateMin === data.dateMax) return 'Reference date: ' + formatApiDate(data.dateMin);
    return 'Reference dates: ' + formatApiDate(data.dateMin) + ' to ' + formatApiDate(data.dateMax);
  }

  function savedTimeLabel(fetchedAt) {
    if (!Number.isFinite(fetchedAt)) return '';
    try {
      return 'Saved ' + new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(fetchedAt));
    } catch (error) {
      return '';
    }
  }

  function populateBaseSelect(preferred) {
    baseSelect.replaceChildren();
    currencies.forEach(function (record) {
      const option = document.createElement('option');
      option.value = record.code;
      option.textContent = optionLabel(record);
      baseSelect.appendChild(option);
    });
    const selected = dataset && dataset.rates[preferred] ? preferred : (dataset.rates.USD ? 'USD' : dataset.base);
    baseSelect.value = selected;
    baseSelect.disabled = false;
  }

  function chooseInitialTargets() {
    const available = new Set(currencies.map(function (record) { return record.code; }));
    const chosen = DEFAULT_TARGETS.filter(function (code) { return available.has(code); });
    if (!chosen.length) {
      currencies.slice(0, 3).forEach(function (record) { chosen.push(record.code); });
    }
    return chosen;
  }

  function applyData(nextDataset, nextCurrencies, fetchedAt, source) {
    const previousBase = baseSelect.value || 'USD';
    dataset = Core.validateDataset(nextDataset);
    currencies = Core.normalizeCurrenciesPayload(nextCurrencies, Object.keys(dataset.rates));
    populateBaseSelect(previousBase);

    const supported = new Set(currencies.map(function (record) { return record.code; }));
    targets = targets.filter(function (code, index) {
      return supported.has(code) && targets.indexOf(code) === index;
    });
    if (!targets.length) targets = chooseInitialTargets();

    renderResults();
    const detail = rateDateLabel(dataset) + '. ' + savedTimeLabel(fetchedAt) + '.';
    if (source === 'saved-stale') setStatus('Showing saved rates while a fresh set is requested…', detail, false);
    else if (source === 'saved') setStatus('Using recently saved reference rates.', detail, false);
    else setStatus('Reference rates updated.', detail, false);
  }

  function buildCurrencyOption(record, selectedCode, rowIndex) {
    const option = document.createElement('option');
    option.value = record.code;
    option.textContent = optionLabel(record);
    option.disabled = record.code !== selectedCode && targets.some(function (code, index) {
      return index !== rowIndex && code === record.code;
    });
    return option;
  }

  function formatCurrency(value, code) {
    return Core.formatCurrencyValue(value, code);
  }

  function formatRate(value) {
    return new Intl.NumberFormat(undefined, { maximumSignificantDigits: 7 }).format(value);
  }

  function pairDateText(source, target) {
    const dates = Core.pairDates(source, target, dataset);
    if (!dates.length) return '';
    if (dates.length === 1) return ' · ' + formatApiDate(dates[0]);
    return ' · ' + formatApiDate(dates[0]) + '–' + formatApiDate(dates[dates.length - 1]);
  }

  function renderResults() {
    resultsList.replaceChildren();
    if (!dataset) return;

    const amount = Core.parseAmount(amountInput.value);
    const validAmount = Number.isFinite(amount);
    const source = baseSelect.value;
    amountError.hidden = validAmount;
    amountInput.setAttribute('aria-invalid', validAmount ? 'false' : 'true');

    if (!targets.length) {
      const empty = document.createElement('li');
      empty.className = 'empty-results';
      empty.textContent = 'No destination currencies yet. Add one to start comparing.';
      resultsList.appendChild(empty);
    }

    targets.forEach(function (target, index) {
      const item = document.createElement('li');
      item.className = 'currency-result';

      const selectWrap = document.createElement('div');
      const label = document.createElement('label');
      const selectId = 'target-currency-' + index;
      label.className = 'visually-hidden';
      label.htmlFor = selectId;
      label.textContent = 'Destination currency ' + (index + 1);
      const select = document.createElement('select');
      select.id = selectId;
      select.dataset.index = String(index);
      select.setAttribute('aria-label', 'Destination currency ' + (index + 1));
      currencies.forEach(function (record) {
        select.appendChild(buildCurrencyOption(record, target, index));
      });
      select.value = target;
      selectWrap.append(label, select);

      const amountWrap = document.createElement('div');
      amountWrap.className = 'result-amount';
      const output = document.createElement('output');
      const detail = document.createElement('small');
      if (validAmount) {
        const converted = Core.convert(amount, source, target, dataset);
        const rate = Core.conversionRate(source, target, dataset);
        output.textContent = formatCurrency(converted, target);
        output.setAttribute('aria-label', 'Converted amount in ' + currencyName(recordFor(target)));
        detail.textContent = '1 ' + source + ' = ' + formatRate(rate) + ' ' + target + pairDateText(source, target);
      } else {
        output.textContent = '—';
        output.setAttribute('aria-label', 'Converted amount unavailable');
        detail.textContent = 'Enter a valid amount';
      }
      amountWrap.append(output, detail);

      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'remove-target';
      removeButton.dataset.removeIndex = String(index);
      removeButton.textContent = 'Remove';
      removeButton.setAttribute('aria-label', 'Remove ' + recordFor(target).code + ' result');

      item.append(selectWrap, amountWrap, removeButton);
      resultsList.appendChild(item);
    });

    const allUsed = targets.length >= currencies.length;
    addTargetButton.disabled = !currencies.length || allUsed;
    copyButton.disabled = !validAmount || targets.length === 0;
  }

  function nextAvailableTarget() {
    const used = new Set(targets);
    const preferred = PREFERRED_ADDITIONS.find(function (code) {
      return dataset.rates[code] && !used.has(code);
    });
    if (preferred) return preferred;
    const record = currencies.find(function (item) { return !used.has(item.code); });
    return record ? record.code : '';
  }

  function buildCopyText() {
    const amount = Core.parseAmount(amountInput.value);
    const source = baseSelect.value;
    const lines = [formatCurrency(amount, source)];
    targets.forEach(function (target) {
      lines.push('= ' + formatCurrency(Core.convert(amount, source, target, dataset), target));
    });
    lines.push('');
    lines.push(rateDateLabel(dataset) + ' · Reference rates via Frankfurter');
    lines.push('Estimate only; provider rates and fees may differ.');
    return lines.join('\n');
  }

  async function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    const helper = document.createElement('textarea');
    helper.value = text;
    helper.setAttribute('readonly', '');
    helper.className = 'visually-hidden';
    document.body.appendChild(helper);
    helper.select();
    const copied = document.execCommand('copy');
    helper.remove();
    if (!copied) throw new Error('Copy was blocked.');
  }

  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.version !== 1 || !Number.isFinite(parsed.fetchedAt)) return null;
      return {
        dataset: Core.validateDataset(parsed.dataset),
        currencies: Core.normalizeCurrenciesPayload(parsed.currencies, Object.keys(parsed.dataset.rates || {})),
        fetchedAt: parsed.fetchedAt,
      };
    } catch (error) {
      try { localStorage.removeItem(CACHE_KEY); } catch (ignored) {}
      return null;
    }
  }

  function writeCache(nextDataset, nextCurrencies, fetchedAt) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        version: 1,
        fetchedAt: fetchedAt,
        dataset: nextDataset,
        currencies: nextCurrencies,
      }));
    } catch (error) {}
  }

  async function fetchJson(url, signal) {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      headers: { Accept: 'application/json' },
      signal: signal,
    });
    if (!response.ok) throw new Error('Rate service returned HTTP ' + response.status + '.');
    return response.json();
  }

  async function refreshRates(hasUsableData) {
    const thisRequest = ++requestNumber;
    if (activeController) activeController.abort();
    const controller = new AbortController();
    activeController = controller;
    const timeout = window.setTimeout(function () { controller.abort(); }, REQUEST_TIMEOUT_MS);

    refreshButton.disabled = true;
    if (hasUsableData) {
      setStatus('Refreshing reference rates…', rateDateLabel(dataset) + '.', false);
    } else {
      setStatus('Loading current reference rates…', 'No amount is included in this request.', false);
    }

    try {
      const responses = await Promise.allSettled([
        fetchJson(RATES_URL, controller.signal),
        fetchJson(CURRENCIES_URL, controller.signal),
      ]);
      if (thisRequest !== requestNumber) return;
      if (responses[0].status !== 'fulfilled') throw responses[0].reason;

      const nextDataset = Core.normalizeRatesPayload(responses[0].value);
      let nextCurrencies = responses[1].status === 'fulfilled'
        ? Core.normalizeCurrenciesPayload(responses[1].value, Object.keys(nextDataset.rates))
        : Core.normalizeCurrenciesPayload(currencies, Object.keys(nextDataset.rates));
      if (!nextCurrencies.length) {
        nextCurrencies = Core.normalizeCurrenciesPayload(null, Object.keys(nextDataset.rates));
      }
      const fetchedAt = Date.now();
      writeCache(nextDataset, nextCurrencies, fetchedAt);
      applyData(nextDataset, nextCurrencies, fetchedAt, 'network');
    } catch (error) {
      if (thisRequest !== requestNumber) return;
      if (hasUsableData || dataset) {
        setStatus(
          'Could not refresh; saved reference rates are still available.',
          rateDateLabel(dataset) + '. Check your connection before relying on these rates.',
          true,
        );
      } else {
        setStatus(
          'Reference rates are unavailable right now.',
          'Check your connection and choose “Refresh rates” to try again.',
          true,
        );
      }
    } finally {
      window.clearTimeout(timeout);
      if (thisRequest === requestNumber) {
        if (activeController === controller) activeController = null;
        refreshButton.disabled = false;
      }
    }
  }

  amountInput.addEventListener('input', renderResults);
  baseSelect.addEventListener('change', renderResults);

  resultsList.addEventListener('change', function (event) {
    const select = event.target.closest('select[data-index]');
    if (!select) return;
    const index = Number(select.dataset.index);
    if (!Number.isInteger(index) || index < 0 || index >= targets.length) return;
    if (targets.some(function (code, targetIndex) { return targetIndex !== index && code === select.value; })) {
      renderResults();
      return;
    }
    targets[index] = select.value;
    renderResults();
  });

  resultsList.addEventListener('click', function (event) {
    const button = event.target.closest('button[data-remove-index]');
    if (!button) return;
    const index = Number(button.dataset.removeIndex);
    if (!Number.isInteger(index) || index < 0 || index >= targets.length) return;
    targets.splice(index, 1);
    renderResults();
  });

  addTargetButton.addEventListener('click', function () {
    const next = nextAvailableTarget();
    if (!next) return;
    targets.push(next);
    renderResults();
    const select = document.getElementById('target-currency-' + (targets.length - 1));
    if (select) select.focus();
  });

  copyButton.addEventListener('click', async function () {
    try {
      await copyText(buildCopyText());
      copyButton.textContent = 'Copied';
      window.setTimeout(function () { copyButton.textContent = 'Copy results'; }, 1400);
    } catch (error) {
      setStatus('Copy was blocked by the browser.', 'Select the results manually and try again.', true);
    }
  });

  refreshButton.addEventListener('click', function () { refreshRates(Boolean(dataset)); });

  const cached = readCache();
  if (cached) {
    const age = Date.now() - cached.fetchedAt;
    const isFresh = age >= 0 && age < CACHE_TTL_MS;
    applyData(cached.dataset, cached.currencies, cached.fetchedAt, isFresh ? 'saved' : 'saved-stale');
    if (!isFresh) refreshRates(true);
  } else {
    refreshRates(false);
  }
})();
