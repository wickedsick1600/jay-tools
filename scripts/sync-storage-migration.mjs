import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, '..');
const migrationFile = path.join(root, 'storage-migration.js');
const checkOnly = process.argv.includes('--check');
const skipDirectories = new Set(['.git', '.netlify', '.github', '_shared', 'node_modules', 'tmp']);
const migrationTagPattern = /<script\s+src=["'][^"']*storage-migration\.js["']\s*><\/script>/iu;
let processed = 0;
let wouldChange = 0;

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && (skipDirectories.has(entry.name) || entry.name.startsWith('.'))) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (entry.name.endsWith('.html')) processFile(fullPath);
  }
}

function processFile(file) {
  let html = fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const source = path.relative(path.dirname(file), migrationFile).replace(/\\/gu, '/');
  const expectedTag = `<script src="${source}"></script>`;
  let next = html;

  if (migrationTagPattern.test(next)) {
    next = next.replace(migrationTagPattern, expectedTag);
  } else {
    const charsetPattern = /(<meta\s+charset=["'][^"']+["']\s*>)/iu;
    if (!charsetPattern.test(next)) {
      throw new Error(`Cannot inject storage migration into ${path.relative(root, file)}: quoted <meta charset> tag is missing.`);
    }
    next = next.replace(charsetPattern, `$1\n${expectedTag}`);
  }

  if (!next.includes(expectedTag)) {
    throw new Error(`Storage migration injection failed for ${path.relative(root, file)}.`);
  }

  processed += 1;
  if (next === html) return;
  wouldChange += 1;
  if (!checkOnly) fs.writeFileSync(file, next, 'utf8');
}

if (!fs.existsSync(migrationFile)) throw new Error('storage-migration.js is missing.');
walk(root);

if (checkOnly && wouldChange) {
  console.error(`Storage migration drift: ${wouldChange} production HTML file(s). Run npm run build.`);
  process.exit(1);
}

console.log(checkOnly
  ? `Storage migration tag OK (${processed} production HTML files).`
  : `Synced storage migration tag in ${processed} production HTML files; updated ${wouldChange}.`);
