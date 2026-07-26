import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, '..');
const skipDirectories = new Set(['.git', '.netlify', 'node_modules', 'tmp']);
const sourceExtensions = new Set(['.js', '.mjs']);
const errors = [];

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && (skipDirectories.has(entry.name) || entry.name.startsWith('.'))) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath, files);
    else files.push(fullPath);
  }
  return files;
}

const files = walk(root);

for (const file of files.filter((candidate) => sourceExtensions.has(path.extname(candidate)))) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    errors.push(`JavaScript syntax failed: ${path.relative(root, file)}\n${result.stderr.trim()}`);
  }
}

const registryPath = path.join(root, 'tools.js');
const registrySource = `${fs.readFileSync(registryPath, 'utf8')}\n;globalThis.__registry = { TOOLS, CATEGORIES, TOOL_GROUPS };`;
const context = {};
vm.createContext(context);
try {
  vm.runInContext(registrySource, context, { filename: registryPath });
} catch (error) {
  errors.push(`Could not load tools.js: ${error.message}`);
}

const registry = context.__registry;
if (registry) {
  const categoryIds = new Set(registry.CATEGORIES.map((item) => item.id));
  const groupIds = new Set(registry.TOOL_GROUPS.map((item) => item.id));
  const toolIds = new Set();
  const sitemap = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');

  for (const tool of registry.TOOLS) {
    if (toolIds.has(tool.id)) errors.push(`Duplicate tool id: ${tool.id}`);
    toolIds.add(tool.id);
    if (!categoryIds.has(tool.category)) errors.push(`${tool.id} uses unknown category: ${tool.category}`);
    if (!groupIds.has(tool.group)) errors.push(`${tool.id} uses unknown group: ${tool.group}`);
    if (tool.status !== 'live') continue;
    if (!tool.url || tool.url === '#') {
      errors.push(`${tool.id} is live without a usable URL.`);
      continue;
    }
    const relative = tool.url.replace(/^\.\//u, '').replace(/\/$/u, '');
    const indexPath = path.join(root, relative, 'index.html');
    if (!fs.existsSync(indexPath)) {
      errors.push(`${tool.id} is live but ${path.relative(root, indexPath)} is missing.`);
      continue;
    }
    const expectedCanonical = `https://juankit.com/${relative}/`;
    const html = fs.readFileSync(indexPath, 'utf8');
    if (!html.includes(`<link rel="canonical" href="${expectedCanonical}">`)) {
      errors.push(`${tool.id} is missing canonical URL ${expectedCanonical}`);
    }
    if (!sitemap.includes(`<loc>${expectedCanonical}</loc>`)) {
      errors.push(`${tool.id} is missing from sitemap.xml.`);
    }
  }
}

for (const file of files.filter((candidate) => path.extname(candidate) === '.html')) {
  const html = fs.readFileSync(file, 'utf8');
  const seenIds = new Set();
  for (const match of html.matchAll(/\sid=["']([^"']+)["']/giu)) {
    if (seenIds.has(match[1])) errors.push(`${path.relative(root, file)} contains duplicate id="${match[1]}".`);
    seenIds.add(match[1]);
  }
  for (const match of html.matchAll(/<(?:script|link)\b[^>]*(?:src|href)=["']([^"']+)["'][^>]*>/giu)) {
    const reference = match[1].split(/[?#]/u)[0];
    if (!reference || /^(?:https?:|data:|#|mailto:)/iu.test(reference)) continue;
    if (!/\.(?:js|css)$/iu.test(reference)) continue;
    const target = reference.startsWith('/')
      ? path.join(root, reference.replace(/^\/+/, ''))
      : path.resolve(path.dirname(file), reference);
    if (!fs.existsSync(target)) {
      errors.push(`${path.relative(root, file)} references missing asset ${reference}.`);
    }
  }
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join('\n'));
  process.exit(1);
}

const liveCount = registry ? registry.TOOLS.filter((tool) => tool.status === 'live').length : 0;
console.log(`Project checks passed: ${liveCount} live tools, ${files.length} files inspected.`);
