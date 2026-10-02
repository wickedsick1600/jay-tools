const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'browser-tools', 'index.html'), 'utf8');

test('browser tools guide has complete crawlable metadata and structured data', () => {
  const title = html.match(/<title>(.*?)<\/title>/u)[1];
  const description = html.match(/<meta name="description" content="([^"]+)">/u)[1];
  const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/u)[1];
  const graph = JSON.parse(jsonLd)['@graph'];
  const itemList = graph.find((item) => item['@type'] === 'ItemList');

  assert.ok(title.length <= 60);
  assert.ok(description.length >= 140 && description.length <= 160);
  assert.match(html, /<link rel="canonical" href="https:\/\/juankit\.com\/browser-tools\/">/u);
  assert.match(html, /<meta name="robots" content="index, follow">/u);
  assert.equal((html.match(/<h1\b/gu) || []).length, 1);
  assert.equal(itemList.numberOfItems, itemList.itemListElement.length);
  assert.ok(graph.some((item) => item['@type'] === 'CollectionPage'));
  assert.ok(graph.some((item) => item['@type'] === 'BreadcrumbList'));
  assert.ok(!jsonLd.includes('AggregateRating'));
  assert.ok(!jsonLd.includes('Review'));
});

test('browser tools guide links every live tool in static HTML', () => {
  const registrySource = fs.readFileSync(path.join(root, 'tools.js'), 'utf8');
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${registrySource}\n;globalThis.__tools = TOOLS;`, context);
  const liveTools = context.__tools.filter((tool) => tool.status === 'live');

  assert.equal(liveTools.length, 23);
  liveTools.forEach((tool) => {
    const relativeUrl = tool.url.replace(/^\.\//u, '../');
    assert.match(html, new RegExp(`href="${relativeUrl.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&')}"`, 'u'));
  });
});
