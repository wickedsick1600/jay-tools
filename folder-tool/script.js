const treeInput = document.getElementById('tree');
const zipBtn = document.getElementById('zip-btn');
const asciiBtn = document.getElementById('ascii-btn');
const msg = document.getElementById('msg');

function flash(text, isError) {
  msg.textContent = text;
  msg.className = isError ? 'error' : 'muted';
  if (!isError) setTimeout(() => { if (msg.textContent === text) msg.textContent = ''; }, 3000);
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

zipBtn.addEventListener('click', async () => {
  const nodes = parseTree(treeInput.value);
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
  const nodes = parseTree(treeInput.value);
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
