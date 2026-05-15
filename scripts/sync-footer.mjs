/**
 * Single source of truth for the site footer: reads _shared/site-footer.html
 * and replaces every <footer class="site-footer">...</footer> in *.html.
 *
 * Usage: node scripts/sync-footer.mjs [--check]
 * --check: exit 1 if any file would change (for CI).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const footerPath = path.join(root, '_shared', 'site-footer.html');
const FOOTER = fs.readFileSync(footerPath, 'utf8').trim().replace(/\r\n/g, '\n');
const FOOTER_BLOCK =
  /<footer\s+class="site-footer"[^>]*>[\s\S]*?<\/footer>/i;

const SKIP_DIRS = new Set(['node_modules', '.git', '.cursor']);

const checkOnly = process.argv.includes('--check');
let wouldChange = 0;
let processed = 0;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    if (ent.name.startsWith('.') && ent.name !== '.') continue;
    if (SKIP_DIRS.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full);
    else if (ent.name.endsWith('.html')) processFile(full);
  }
}

function processFile(file) {
  const rel = path.relative(root, file);
  let html = fs.readFileSync(file, 'utf8');
  const normalized = html.replace(/\r\n/g, '\n');

  const globalRe = new RegExp(FOOTER_BLOCK.source, 'gi');
  const matches = [...normalized.matchAll(globalRe)];
  if (matches.length === 0) {
    return;
  }
  if (matches.length > 1) {
    throw new Error(`Multiple site footers in ${rel}`);
  }

  processed += 1;
  const next = normalized.replace(new RegExp(FOOTER_BLOCK.source, 'i'), FOOTER);
  if (next !== normalized) {
    wouldChange += 1;
    if (!checkOnly) {
      fs.writeFileSync(file, next, 'utf8');
    }
  }
}

walk(root);

if (checkOnly && wouldChange > 0) {
  console.error(
    `Footer drift: ${wouldChange} file(s) out of sync. Run: npm run build`,
  );
  process.exit(1);
}

if (checkOnly) {
  console.log(`Footer OK (${processed} HTML file(s) with site footer).`);
} else {
  console.log(
    `Synced footer in ${processed} file(s); updated ${wouldChange} file(s).`,
  );
}
