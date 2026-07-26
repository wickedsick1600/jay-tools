const test = require('node:test');
const assert = require('node:assert/strict');

const CurrencyCore = require('../currency-converter/currency-core.js');

test('normalizes Frankfurter v2 rows and keeps the newest duplicate quote', () => {
  const data = CurrencyCore.normalizeRatesPayload([
    { date: '2026-07-20', base: 'EUR', quote: 'USD', rate: 1.15 },
    { date: '2026-07-21', base: 'EUR', quote: 'USD', rate: 1.16 },
    { date: '2026-07-20', base: 'EUR', quote: 'PHP', rate: 66.5 },
  ]);

  assert.equal(data.base, 'EUR');
  assert.equal(data.rates.EUR, 1);
  assert.equal(data.rates.USD, 1.16);
  assert.equal(data.dates.USD, '2026-07-21');
  assert.equal(data.dateMin, '2026-07-20');
  assert.equal(data.dateMax, '2026-07-21');
});

test('accepts the legacy v1 response as a defensive fallback', () => {
  const data = CurrencyCore.normalizeRatesPayload({
    base: 'EUR',
    date: '2026-07-20',
    rates: { USD: 1.15, AED: 4.22 },
  });

  assert.deepEqual(Object.assign({}, data.rates), { USD: 1.15, AED: 4.22, EUR: 1 });
  assert.equal(data.dates.AED, '2026-07-20');
});

test('converts between any two currencies through the dataset base', () => {
  const data = CurrencyCore.normalizeRatesPayload([
    { date: '2026-07-20', base: 'EUR', quote: 'USD', rate: 1.2 },
    { date: '2026-07-20', base: 'EUR', quote: 'PHP', rate: 68.4 },
  ]);

  assert.ok(Math.abs(CurrencyCore.conversionRate('USD', 'PHP', data) - 57) < 1e-12);
  assert.ok(Math.abs(CurrencyCore.convert('100', 'USD', 'PHP', data) - 5700) < 1e-9);
  assert.equal(CurrencyCore.convert(5, 'USD', 'USD', data), 5);
});

test('formats very small nonzero conversions without rounding them to zero', () => {
  const displayed = CurrencyCore.formatCurrencyValue(0.0000000573504, 'PHP', 'en-US');
  assert.match(displayed, /0\.0000000573504/);
  assert.doesNotMatch(displayed, /PHP\s*0(?:\.0+)?$/);
});

test('reports the relevant dates for cross-rate calculations', () => {
  const data = CurrencyCore.normalizeRatesPayload([
    { date: '2026-07-20', base: 'EUR', quote: 'USD', rate: 1.2 },
    { date: '2026-07-21', base: 'EUR', quote: 'PHP', rate: 68.4 },
  ]);

  assert.deepEqual(CurrencyCore.pairDates('EUR', 'USD', data), ['2026-07-20']);
  assert.deepEqual(CurrencyCore.pairDates('USD', 'PHP', data), ['2026-07-20', '2026-07-21']);
});

test('normalizes v2 and v1 currency metadata and fills supported gaps', () => {
  const v2 = CurrencyCore.normalizeCurrenciesPayload([
    { iso_code: 'USD', name: 'US Dollar', symbol: '$' },
    { iso_code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
    { iso_code: 'OLD', name: 'Unsupported' },
  ], ['USD', 'PHP', 'AED']);
  assert.deepEqual(v2.map((item) => item.code), ['AED', 'PHP', 'USD']);
  assert.equal(v2.find((item) => item.code === 'AED').name, 'AED');

  const v1 = CurrencyCore.normalizeCurrenciesPayload({ USD: 'United States Dollar' }, ['USD']);
  assert.equal(v1[0].name, 'United States Dollar');
});

test('rejects malformed, mixed-base, unsupported, and unsafe amounts', () => {
  assert.throws(() => CurrencyCore.normalizeRatesPayload([]), /usable rates/);
  assert.throws(() => CurrencyCore.normalizeRatesPayload([
    { date: '2026-07-20', base: 'EUR', quote: 'USD', rate: 1.2 },
    { date: '2026-07-20', base: 'GBP', quote: 'PHP', rate: 70 },
  ]), /mixed multiple base/);
  assert.ok(Number.isNaN(CurrencyCore.parseAmount('-1')));
  assert.ok(Number.isNaN(CurrencyCore.parseAmount('Infinity')));
  assert.throws(() => CurrencyCore.convert(1, 'ABC', 'USD', {
    base: 'EUR', rates: { EUR: 1, USD: 1.2 }, dates: {},
  }), /not available/);
});
