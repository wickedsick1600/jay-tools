(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CurrencyCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const CODE_PATTERN = /^[A-Z]{3}$/;
  const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

  function normalizeCode(value) {
    const code = String(value == null ? '' : value).trim().toUpperCase();
    return CODE_PATTERN.test(code) ? code : '';
  }

  function normalizeDate(value) {
    const date = String(value == null ? '' : value).trim();
    return DATE_PATTERN.test(date) ? date : '';
  }

  function normalizeRate(value) {
    const rate = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(rate) && rate > 0 ? rate : 0;
  }

  function finishDataset(base, selected) {
    if (!base || selected.size === 0) {
      throw new TypeError('The exchange-rate response did not contain usable rates.');
    }

    const rates = Object.create(null);
    const dates = Object.create(null);
    const observedDates = [];

    selected.forEach(function (row, quote) {
      rates[quote] = row.rate;
      if (row.date) {
        dates[quote] = row.date;
        observedDates.push(row.date);
      }
    });

    rates[base] = 1;
    observedDates.sort();
    const dateMin = observedDates[0] || '';
    const dateMax = observedDates[observedDates.length - 1] || '';
    if (dateMax) dates[base] = dateMax;

    if (Object.keys(rates).length < 2) {
      throw new TypeError('The exchange-rate response did not contain enough currencies.');
    }

    return { base: base, rates: rates, dates: dates, dateMin: dateMin, dateMax: dateMax };
  }

  function normalizeV2Rows(rows) {
    let base = '';
    const selected = new Map();

    rows.forEach(function (raw) {
      if (!raw || typeof raw !== 'object') return;
      const rowBase = normalizeCode(raw.base);
      const quote = normalizeCode(raw.quote || raw.currency);
      const rate = normalizeRate(raw.rate);
      const date = normalizeDate(raw.date);
      if (!rowBase || !quote || !rate) return;
      if (!base) base = rowBase;
      if (rowBase !== base) {
        throw new TypeError('The exchange-rate response mixed multiple base currencies.');
      }

      const previous = selected.get(quote);
      if (!previous || (date && (!previous.date || date > previous.date))) {
        selected.set(quote, { rate: rate, date: date });
      }
    });

    return finishDataset(base, selected);
  }

  function normalizeV1Object(payload) {
    const base = normalizeCode(payload.base);
    const date = normalizeDate(payload.date);
    const selected = new Map();
    if (!base || !payload.rates || typeof payload.rates !== 'object') {
      throw new TypeError('The exchange-rate response had an unsupported shape.');
    }

    Object.keys(payload.rates).forEach(function (rawCode) {
      const quote = normalizeCode(rawCode);
      const rate = normalizeRate(payload.rates[rawCode]);
      if (quote && rate) selected.set(quote, { rate: rate, date: date });
    });

    return finishDataset(base, selected);
  }

  /**
   * Accepts Frankfurter v2's flat array and the legacy v1 object shape. A
   * wrapped { data: [...] } array is also accepted so a harmless proxy wrapper
   * cannot break the converter.
   */
  function normalizeRatesPayload(payload) {
    if (Array.isArray(payload)) return normalizeV2Rows(payload);
    if (payload && Array.isArray(payload.data)) return normalizeV2Rows(payload.data);
    if (payload && Array.isArray(payload.rates)) return normalizeV2Rows(payload.rates);
    if (payload && typeof payload === 'object') return normalizeV1Object(payload);
    throw new TypeError('The exchange-rate response had an unsupported shape.');
  }

  function validateDataset(raw) {
    if (!raw || typeof raw !== 'object') {
      throw new TypeError('The saved exchange-rate data is invalid.');
    }

    const base = normalizeCode(raw.base);
    const rates = Object.create(null);
    const dates = Object.create(null);
    if (!base || !raw.rates || typeof raw.rates !== 'object') {
      throw new TypeError('The saved exchange-rate data is invalid.');
    }

    Object.keys(raw.rates).slice(0, 500).forEach(function (rawCode) {
      const code = normalizeCode(rawCode);
      const rate = normalizeRate(raw.rates[rawCode]);
      if (!code || !rate) return;
      rates[code] = rate;
      const date = raw.dates && normalizeDate(raw.dates[rawCode]);
      if (date) dates[code] = date;
    });
    rates[base] = 1;

    const dateValues = Object.keys(dates).map(function (code) { return dates[code]; }).sort();
    if (Object.keys(rates).length < 2) {
      throw new TypeError('The saved exchange-rate data is incomplete.');
    }

    return {
      base: base,
      rates: rates,
      dates: dates,
      dateMin: normalizeDate(raw.dateMin) || dateValues[0] || '',
      dateMax: normalizeDate(raw.dateMax) || dateValues[dateValues.length - 1] || '',
    };
  }

  function normalizeCurrenciesPayload(payload, supportedCodes) {
    const supported = new Set((supportedCodes || []).map(normalizeCode).filter(Boolean));
    const records = new Map();
    let items = [];

    if (Array.isArray(payload)) items = payload;
    else if (payload && Array.isArray(payload.data)) items = payload.data;
    else if (payload && Array.isArray(payload.currencies)) items = payload.currencies;
    else if (payload && typeof payload === 'object') {
      items = Object.keys(payload).map(function (key) {
        const value = payload[key];
        if (value && typeof value === 'object') return Object.assign({ code: key }, value);
        return { code: key, name: value };
      });
    }

    items.forEach(function (item) {
      if (!item || typeof item !== 'object') return;
      const code = normalizeCode(item.iso_code || item.code || item.currency);
      if (!code || (supported.size && !supported.has(code))) return;
      const nameValue = item.name || item.currency_name || item.label;
      const symbolValue = item.symbol;
      records.set(code, {
        code: code,
        name: typeof nameValue === 'string' && nameValue.trim() ? nameValue.trim() : code,
        symbol: typeof symbolValue === 'string' ? symbolValue.trim() : '',
      });
    });

    supported.forEach(function (code) {
      if (!records.has(code)) records.set(code, { code: code, name: code, symbol: '' });
    });

    return Array.from(records.values()).sort(function (a, b) {
      return a.code.localeCompare(b.code);
    });
  }

  function parseAmount(value) {
    if (value === '' || value == null) return NaN;
    const amount = typeof value === 'number' ? value : Number(String(value).trim());
    return Number.isFinite(amount) && amount >= 0 && Math.abs(amount) <= 1e15 ? amount : NaN;
  }

  function conversionRate(sourceCode, targetCode, dataset) {
    const source = normalizeCode(sourceCode);
    const target = normalizeCode(targetCode);
    const clean = validateDataset(dataset);
    const sourceRate = clean.rates[source];
    const targetRate = clean.rates[target];
    if (!sourceRate || !targetRate) throw new RangeError('That currency is not available in this rate set.');
    return targetRate / sourceRate;
  }

  function convert(amountValue, sourceCode, targetCode, dataset) {
    const amount = parseAmount(amountValue);
    if (!Number.isFinite(amount)) throw new RangeError('Enter an amount from 0 to 1 quadrillion.');
    return amount * conversionRate(sourceCode, targetCode, dataset);
  }

  function formatCurrencyValue(value, currencyCode, locale) {
    const amount = Number(value);
    const code = normalizeCode(currencyCode);
    if (!Number.isFinite(amount) || !code) throw new TypeError('Cannot format an invalid currency value.');
    const absolute = Math.abs(amount);
    try {
      if (absolute > 0 && absolute < 0.01) {
        return new Intl.NumberFormat(locale || undefined, {
          style: 'currency',
          currency: code,
          currencyDisplay: 'code',
          maximumSignificantDigits: 6,
        }).format(amount);
      }
      const extraDigits = absolute < 1 ? 4 : 2;
      const defaults = new Intl.NumberFormat(locale || undefined, { style: 'currency', currency: code }).resolvedOptions();
      return new Intl.NumberFormat(locale || undefined, {
        style: 'currency',
        currency: code,
        currencyDisplay: 'code',
        minimumFractionDigits: Math.min(defaults.minimumFractionDigits, extraDigits),
        maximumFractionDigits: Math.max(defaults.maximumFractionDigits, extraDigits),
      }).format(amount);
    } catch (error) {
      return code + ' ' + amount.toLocaleString(locale || undefined, { maximumSignificantDigits: 12 });
    }
  }

  function pairDates(sourceCode, targetCode, dataset) {
    const source = normalizeCode(sourceCode);
    const target = normalizeCode(targetCode);
    const clean = validateDataset(dataset);
    const values = [];
    if (source !== clean.base && clean.dates[source]) values.push(clean.dates[source]);
    if (target !== clean.base && clean.dates[target]) values.push(clean.dates[target]);
    return Array.from(new Set(values)).sort();
  }

  return Object.freeze({
    normalizeCode: normalizeCode,
    normalizeRatesPayload: normalizeRatesPayload,
    validateDataset: validateDataset,
    normalizeCurrenciesPayload: normalizeCurrenciesPayload,
    parseAmount: parseAmount,
    conversionRate: conversionRate,
    convert: convert,
    formatCurrencyValue: formatCurrencyValue,
    pairDates: pairDates,
  });
});
