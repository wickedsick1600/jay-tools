const left = document.getElementById('left');
const right = document.getElementById('right');
const result = document.getElementById('result');
function esc(s) { return s.replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c])); }
document.getElementById('compare-btn').addEventListener('click', () => {
  const parts = Diff.diffWordsWithSpace(left.value, right.value);
  result.innerHTML = parts.map(p => `<span class="${p.added ? 'add' : p.removed ? 'del' : ''}">${esc(p.value)}</span>`).join('');
});
left.value = 'Version one text goes here.';
right.value = 'Version two text goes here with changes.';
document.getElementById('compare-btn').click();
