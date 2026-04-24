const filesEl = document.getElementById('files');
const msg = document.getElementById('msg');
function flash(text, isError) { msg.textContent = text; msg.className = isError ? 'error' : 'muted'; }
document.getElementById('merge-btn').addEventListener('click', async () => {
  const files = Array.from(filesEl.files || []);
  if (files.length < 2) { flash('Select at least 2 PDF files.', true); return; }
  try {
    const outPdf = await PDFLib.PDFDocument.create();
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const srcPdf = await PDFLib.PDFDocument.load(bytes);
      const copiedPages = await outPdf.copyPages(srcPdf, srcPdf.getPageIndices());
      copiedPages.forEach((p) => outPdf.addPage(p));
    }
    const outBytes = await outPdf.save();
    const blob = new Blob([outBytes], { type: 'application/pdf' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'merged.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    flash('Merged and downloaded.');
  } catch (err) {
    flash('Failed to merge PDFs: ' + err.message, true);
  }
});
