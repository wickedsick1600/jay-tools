const filesEl = document.getElementById('files');
const fileList = document.getElementById('file-list');
const emptyList = document.getElementById('empty-list');
const outputName = document.getElementById('output-name');
const mergeBtn = document.getElementById('merge-btn');
const clearBtn = document.getElementById('clear-btn');
const msg = document.getElementById('msg');

let orderedFiles = [];
let nextId = 1;
let draggedId = null;

function flash(text, isError) {
  msg.textContent = text;
  msg.className = isError ? 'error' : 'muted';
}

function humanBytes(n) {
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1024 / 1024).toFixed(2) + ' MB';
}

function cleanOutputName(name) {
  const trimmed = (name || 'merged-juankit.pdf').trim();
  const safe = trimmed.replace(/[\\/:*?"<>|]+/g, '-');
  const base = (/\.pdf$/i.test(safe) ? safe.replace(/\.pdf$/i, '') : safe).trim() || 'merged';
  const brandedBase = /(^|-)juankit$/i.test(base) ? base : `${base}-juankit`;
  return `${brandedBase}.pdf`;
}

function isPdfFile(file) {
  return file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf'));
}

filesEl.addEventListener('change', () => {
  addFiles(Array.from(filesEl.files || []));
  filesEl.value = '';
});

clearBtn.addEventListener('click', () => {
  orderedFiles = [];
  renderList();
  flash('');
});

function addFiles(files) {
  const pdfs = files.filter(isPdfFile);
  const skipped = files.length - pdfs.length;

  pdfs.forEach((file) => {
    const item = {
      id: nextId,
      file,
      status: 'checking',
      pages: null,
      error: '',
    };
    nextId += 1;
    orderedFiles.push(item);
    readPageCount(item);
  });

  renderList();

  if (skipped) {
    flash(`${skipped} non-PDF file${skipped === 1 ? '' : 's'} skipped.`, true);
  } else if (pdfs.length) {
    flash(`${pdfs.length} PDF file${pdfs.length === 1 ? '' : 's'} added.`);
  }
}

async function readPageCount(item) {
  try {
    const bytes = await item.file.arrayBuffer();
    const pdf = await PDFLib.PDFDocument.load(bytes);
    item.pages = pdf.getPageCount();
    item.status = 'ready';
  } catch (err) {
    item.status = 'error';
    item.error = err.message || 'Could not read PDF.';
  }
  renderList();
}

function renderList() {
  fileList.textContent = '';
  emptyList.style.display = orderedFiles.length ? 'none' : 'block';
  clearBtn.disabled = orderedFiles.length === 0;
  mergeBtn.disabled = orderedFiles.length < 2 || orderedFiles.some((item) => item.status !== 'ready');

  orderedFiles.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'file-item';
    li.draggable = true;
    li.dataset.id = String(item.id);

    const number = document.createElement('span');
    number.className = 'file-number';
    number.textContent = String(index + 1);

    const main = document.createElement('div');
    main.className = 'file-main';

    const name = document.createElement('div');
    name.className = 'file-name';
    name.textContent = item.file.name;

    const meta = document.createElement('div');
    meta.className = 'file-meta';
    meta.textContent = getMetaText(item);

    main.append(name, meta);

    const actions = document.createElement('div');
    actions.className = 'file-actions';
    actions.append(
      makeActionButton('Move up', () => moveItem(index, index - 1), index === 0),
      makeActionButton('Move down', () => moveItem(index, index + 1), index === orderedFiles.length - 1),
      makeActionButton('Remove', () => removeItem(index), false)
    );

    li.addEventListener('dragstart', (event) => {
      draggedId = item.id;
      li.classList.add('dragging');
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(item.id));
    });
    li.addEventListener('dragend', () => {
      draggedId = null;
      li.classList.remove('dragging');
    });
    li.addEventListener('dragover', (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    });
    li.addEventListener('drop', (event) => {
      event.preventDefault();
      const fromId = Number(event.dataTransfer.getData('text/plain') || draggedId);
      const toId = item.id;
      reorderById(fromId, toId);
    });

    li.append(number, main, actions);
    fileList.appendChild(li);
  });
}

function getMetaText(item) {
  const size = humanBytes(item.file.size);
  if (item.status === 'checking') return `${size} - checking pages...`;
  if (item.status === 'error') return `${size} - unreadable PDF`;
  const pageText = item.pages === 1 ? '1 page' : `${item.pages} pages`;
  return `${size} - ${pageText}`;
}

function makeActionButton(label, onClick, disabled) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'secondary';
  button.textContent = label;
  button.disabled = disabled;
  button.addEventListener('click', onClick);
  return button;
}

function moveItem(fromIndex, toIndex) {
  if (toIndex < 0 || toIndex >= orderedFiles.length || fromIndex === toIndex) return;
  const [item] = orderedFiles.splice(fromIndex, 1);
  orderedFiles.splice(toIndex, 0, item);
  renderList();
}

function removeItem(index) {
  orderedFiles.splice(index, 1);
  renderList();
}

function reorderById(fromId, toId) {
  if (!fromId || !toId || fromId === toId) return;
  const fromIndex = orderedFiles.findIndex((item) => item.id === fromId);
  const toIndex = orderedFiles.findIndex((item) => item.id === toId);
  if (fromIndex === -1 || toIndex === -1) return;
  moveItem(fromIndex, toIndex);
}

mergeBtn.addEventListener('click', async () => {
  if (orderedFiles.length < 2) {
    flash('Add at least 2 PDF files.', true);
    return;
  }

  const notReady = orderedFiles.find((item) => item.status !== 'ready');
  if (notReady) {
    flash('Wait for all PDFs to finish checking, or remove unreadable files.', true);
    return;
  }

  mergeBtn.disabled = true;
  flash('Merging PDFs...');

  try {
    const outPdf = await PDFLib.PDFDocument.create();
    for (const item of orderedFiles) {
      const bytes = await item.file.arrayBuffer();
      const srcPdf = await PDFLib.PDFDocument.load(bytes);
      const copiedPages = await outPdf.copyPages(srcPdf, srcPdf.getPageIndices());
      copiedPages.forEach((page) => outPdf.addPage(page));
    }

    const outBytes = await outPdf.save();
    const blob = new Blob([outBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = cleanOutputName(outputName.value);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    flash('Merged and downloaded.');
  } catch (err) {
    flash('Failed to merge PDFs: ' + err.message, true);
  } finally {
    renderList();
  }
});

renderList();
