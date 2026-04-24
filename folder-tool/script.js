const treeInput = document.getElementById('tree');
const zipBtn = document.getElementById('zip-btn');
const asciiBtn = document.getElementById('ascii-btn');
const msg = document.getElementById('msg');
const addRootBtn = document.getElementById('add-root-btn');
const resetSampleBtn = document.getElementById('reset-sample-btn');
const sampleAdminBtn = document.getElementById('sample-admin-btn');
const samplePersonalBtn = document.getElementById('sample-personal-btn');
const importBtn = document.getElementById('import-btn');
const copyPlainBtn = document.getElementById('copy-plain-btn');
const pasteImport = document.getElementById('paste-import');
const builderList = document.getElementById('builder-list');

const SAMPLE_TEXT_HR = `HR-Operations
  Recruitment
    Job Descriptions.docx
    Candidate Tracker.xlsx
    Interview Notes
  Onboarding
    New Hire Checklist.pdf
    Employee Handbook.pdf
    Orientation Schedule.docx
  Payroll
    Timesheets
    Salary Adjustments.xlsx
  Policies
    Leave Policy.docx
    Code of Conduct.pdf`;

const SAMPLE_TEXT_ADMIN = `Business-Operations
  Finance
    Invoices
    Expense Reports.xlsx
    Tax Documents
  Legal
    Contracts
    Vendor Agreements.docx
  Office
    Supplies List.xlsx
    Meeting Notes
  Customer Support
    Templates
    Escalations`;

const SAMPLE_TEXT_PERSONAL = `Family-Files
  Home
    Utility Bills
    Appliance Manuals
  School
    Assignments
    Reading List.docx
  Travel
    Booking Confirmations.pdf
    Trip Plans
  Photos
    Birthdays
    Holidays`;

let items = [];
let nextId = 1;

function flash(text, isError) {
  msg.textContent = text;
  msg.className = isError ? 'error' : 'muted';
  if (!isError) setTimeout(() => { if (msg.textContent === text) msg.textContent = ''; }, 3000);
}

function createItem(name, type, depth) {
  return { id: nextId++, name, type, depth };
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function flattenNodes(nodes, depth = 0, out = []) {
  for (const node of nodes) {
    out.push(createItem(node.name, node.isFolder ? 'folder' : 'file', depth));
    if (node.isFolder && node.children.length) flattenNodes(node.children, depth + 1, out);
  }
  return out;
}

function toTextFromItems() {
  return items
    .map((item) => {
      const name = item.type === 'folder' && !item.name.endsWith('/') ? `${item.name}/` : item.name;
      return `${'  '.repeat(item.depth)}${name}`;
    })
    .join('\n');
}

function syncTreeInput() {
  treeInput.value = toTextFromItems();
}

function renderBuilder() {
  if (!items.length) {
    builderList.innerHTML = '<div class="muted">No items yet. Click "Add top-level item" to start.</div>';
    syncTreeInput();
    return;
  }

  builderList.innerHTML = items.map((item, index) => {
    const rowStyle = `style="margin-left:${item.depth * 20}px"`;
    return `<div class="builder-row" ${rowStyle} data-id="${item.id}">
      <input type="text" data-action="name" value="${escapeHtml(item.name)}" placeholder="${item.type === 'folder' ? 'Folder name' : 'File name'}">
      <select data-action="type">
        <option value="folder" ${item.type === 'folder' ? 'selected' : ''}>Folder</option>
        <option value="file" ${item.type === 'file' ? 'selected' : ''}>File</option>
      </select>
      <div class="builder-actions">
        <button type="button" class="secondary" data-action="outdent" ${item.depth === 0 ? 'disabled' : ''}>Outdent</button>
        <button type="button" class="secondary" data-action="indent" ${index === 0 ? 'disabled' : ''}>Indent</button>
        <button type="button" class="secondary" data-action="add-sibling">+ Row</button>
        <button type="button" class="secondary" data-action="add-child">+ Child</button>
        <button type="button" class="secondary" data-action="delete">Delete</button>
      </div>
    </div>`;
  }).join('');

  syncTreeInput();
}

function loadSample() {
  const parsed = parseTree(SAMPLE_TEXT_HR);
  items = flattenNodes(parsed);
  renderBuilder();
}

function loadSampleFromText(text) {
  const parsed = parseTree(text);
  items = flattenNodes(parsed);
  renderBuilder();
}

function depthAt(index) {
  return items[index]?.depth ?? 0;
}

function subtreeEnd(index) {
  const baseDepth = depthAt(index);
  let i = index + 1;
  while (i < items.length && depthAt(i) > baseDepth) i++;
  return i;
}

function nodesFromItems() {
  const root = [];
  const stack = [{ depth: -1, children: root }];

  for (const item of items) {
    const name = item.name.trim();
    if (!name) continue;

    while (stack.length > 1 && stack[stack.length - 1].depth >= item.depth) stack.pop();
    const node = { name, isFolder: item.type === 'folder', children: [] };
    stack[stack.length - 1].children.push(node);
    if (node.isFolder) stack.push({ depth: item.depth, children: node.children });
  }

  return root;
}

function parsePastedRows(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\u00a0/g, ' '))
    .filter((line) => line.trim().length > 0);
  if (!lines.length) return [];

  const parsed = [];
  const warnings = [];
  let previousDepth = 0;
  for (const rawLine of lines) {
    const tabs = rawLine.split('\t').map((cell) => cell.trim()).filter(Boolean);
    let depth = 0;
    let name = '';
    let typeHint = '';

    if (tabs.length > 1) {
      if (/^(folder|file)$/i.test(tabs[tabs.length - 2])) {
        typeHint = tabs[tabs.length - 2].toLowerCase();
        depth = Math.max(0, tabs.length - 3);
      } else {
        depth = tabs.length - 1;
      }
      name = tabs[tabs.length - 1];
    } else {
      const line = rawLine.replace(/\t/g, '  ');
      const indentMatch = line.match(/^( *)(.*)$/);
      depth = Math.floor((indentMatch?.[1].length || 0) / 2);
      name = (indentMatch?.[2] || '').trim();
    }

    if (!name) continue;
    const cleanName = name.replace(/[\\/]+$/, '');
    const isFolderByName = !/\.[A-Za-z0-9]{1,8}$/.test(cleanName);
    const type = typeHint || (isFolderByName ? 'folder' : 'file');
    if (!typeHint && isFolderByName) {
      warnings.push(`"${cleanName}" assumed as folder`);
    }

    depth = Math.max(0, depth);
    if (depth > previousDepth + 1) {
      depth = previousDepth + 1;
      warnings.push(`Adjusted deep indent near "${cleanName}"`);
    }
    previousDepth = depth;

    parsed.push(createItem(cleanName, type, depth));
  }

  return { parsed, warnings };
}

// Parse the indented text into a nested structure.
// Returns an array of nodes: { name, isFolder, children }.
function parseTree(text) {
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length === 0) return [];

  // Detect indent unit from first indented line.
  let indentUnit = '  ';
  for (const line of lines) {
    const m = line.match(/^([ \t]+)/);
    if (m) { indentUnit = m[1][0] === '\t' ? '\t' : '  '; break; }
  }

  const root = [];
  const stack = [{ depth: -1, children: root }];

  for (const rawLine of lines) {
    const stripped = rawLine.replace(/[|├└─`]/g, '').replace(/\t/g, '  ');
    const leadMatch = stripped.match(/^( *)(.*)$/);
    const leading = leadMatch[1].length;
    const depth = Math.floor(leading / 2);
    let name = leadMatch[2].trim();
    if (!name) continue;

    const endsWithSlash = name.endsWith('/') || name.endsWith('\\');
    if (endsWithSlash) name = name.slice(0, -1);
    const hasExt = /\.[A-Za-z0-9]+$/.test(name);
    const isFolder = endsWithSlash || !hasExt;

    const node = { name, isFolder, children: [] };

    while (stack.length > 1 && stack[stack.length - 1].depth >= depth) stack.pop();
    stack[stack.length - 1].children.push(node);
    if (isFolder) stack.push({ depth, children: node.children });
  }

  return root;
}

function addNodesToZip(zip, nodes, prefix) {
  for (const node of nodes) {
    const path = prefix + node.name;
    if (node.isFolder) {
      zip.folder(path);
      if (node.children.length) addNodesToZip(zip, node.children, path + '/');
    } else {
      zip.file(path, '');
    }
  }
}

function toAscii(nodes, prefix) {
  const lines = [];
  nodes.forEach((node, i) => {
    const isLast = i === nodes.length - 1;
    const branch = isLast ? '└── ' : '├── ';
    const suffix = node.isFolder ? '/' : '';
    lines.push(prefix + branch + node.name + suffix);
    if (node.isFolder && node.children.length) {
      const childPrefix = prefix + (isLast ? '    ' : '│   ');
      lines.push(toAscii(node.children, childPrefix));
    }
  });
  return lines.join('\n');
}

builderList.addEventListener('input', (event) => {
  const row = event.target.closest('.builder-row');
  if (!row) return;
  const id = Number(row.dataset.id);
  const item = items.find((x) => x.id === id);
  if (!item) return;

  if (event.target.dataset.action === 'name') {
    item.name = event.target.value;
  } else if (event.target.dataset.action === 'type') {
    item.type = event.target.value;
  }
  syncTreeInput();
});

builderList.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const row = event.target.closest('.builder-row');
  if (!row) return;
  const id = Number(row.dataset.id);
  const index = items.findIndex((x) => x.id === id);
  if (index < 0) return;
  const action = button.dataset.action;

  if (action === 'delete') {
    const end = subtreeEnd(index);
    items.splice(index, end - index);
  } else if (action === 'indent' && index > 0) {
    const maxDepth = items[index - 1].depth + 1;
    items[index].depth = Math.min(items[index].depth + 1, maxDepth);
  } else if (action === 'outdent') {
    items[index].depth = Math.max(0, items[index].depth - 1);
  } else if (action === 'add-sibling') {
    const newItem = createItem('New Folder', 'folder', items[index].depth);
    const end = subtreeEnd(index);
    items.splice(end, 0, newItem);
  } else if (action === 'add-child') {
    const childDepth = items[index].depth + 1;
    const newItem = createItem('New Item', 'folder', childDepth);
    const end = subtreeEnd(index);
    items.splice(end, 0, newItem);
  }

  renderBuilder();
});

addRootBtn.addEventListener('click', () => {
  items.push(createItem('New Folder', 'folder', 0));
  renderBuilder();
});

resetSampleBtn.addEventListener('click', () => {
  loadSample();
  flash('HR sample restored.');
});

sampleAdminBtn.addEventListener('click', () => {
  loadSampleFromText(SAMPLE_TEXT_ADMIN);
  flash('Admin sample loaded.');
});

samplePersonalBtn.addEventListener('click', () => {
  loadSampleFromText(SAMPLE_TEXT_PERSONAL);
  flash('Personal sample loaded.');
});

importBtn.addEventListener('click', () => {
  const raw = pasteImport.value.trim();
  if (!raw) {
    flash('Paste your list first, then click import.', true);
    return;
  }
  const { parsed: imported, warnings } = parsePastedRows(raw);
  if (!imported.length) {
    flash('Could not read any rows from the pasted text.', true);
    return;
  }
  items = imported;
  renderBuilder();
  if (warnings.length) {
    flash(`Imported ${imported.length} rows. ${warnings[0]}.`);
  } else {
    flash(`Imported ${imported.length} rows.`);
  }
});

copyPlainBtn.addEventListener('click', async () => {
  const plain = toTextFromItems();
  if (!plain.trim()) {
    flash('Nothing to copy yet.', true);
    return;
  }
  try {
    await navigator.clipboard.writeText(plain);
    flash('Plain list copied.');
  } catch {
    flash('Copy failed. Select and copy from the list manually.', true);
  }
});

zipBtn.addEventListener('click', async () => {
  const nodes = nodesFromItems();
  if (!nodes.length) { flash('Nothing to generate — the tree is empty.', true); return; }

  const zip = new JSZip();
  const rootName = nodes.length === 1 && nodes[0].isFolder ? nodes[0].name : 'folder-structure';

  if (nodes.length === 1 && nodes[0].isFolder) {
    addNodesToZip(zip, nodes[0].children, nodes[0].name + '/');
    zip.folder(nodes[0].name);
  } else {
    addNodesToZip(zip, nodes, '');
  }

  try {
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, rootName + '.zip');
    flash('ZIP downloaded.');
  } catch (err) {
    flash('Failed to generate ZIP: ' + err.message, true);
  }
});

asciiBtn.addEventListener('click', async () => {
  const nodes = nodesFromItems();
  if (!nodes.length) { flash('Nothing to format — the tree is empty.', true); return; }

  const ascii = toAscii(nodes, '');
  try {
    await navigator.clipboard.writeText(ascii);
    flash('ASCII tree copied to clipboard.');
  } catch {
    treeInput.value = ascii;
    flash('Clipboard blocked — ASCII tree placed in the textarea instead.');
  }
});

loadSample();
