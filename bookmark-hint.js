(function () {
  var STORAGE_KEY = 'juankit_bookmark_hint_v1';
  try {
    if (localStorage.getItem(STORAGE_KEY)) return;
  } catch (e) {
    return;
  }

  var footer = document.querySelector('footer.site-footer');
  if (!footer) return;

  var bar = document.createElement('div');
  bar.className = 'bookmark-hint-bar';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Save Juankit for later');

  var inner = document.createElement('div');
  inner.className = 'bookmark-hint-inner';

  var p = document.createElement('p');
  p.textContent =
    'Come back often? Bookmark this page — Ctrl+D on Windows, ⌘D on Mac, or your browser menu — so Juankit stays one click away.';

  var actions = document.createElement('div');
  actions.className = 'bookmark-hint-actions';

  var dismiss = document.createElement('button');
  dismiss.type = 'button';
  dismiss.className = 'secondary';
  dismiss.textContent = 'Dismiss';
  dismiss.addEventListener('click', function () {
    try {
      localStorage.setItem(STORAGE_KEY, '1');
    } catch (err) {}
    bar.remove();
  });

  actions.appendChild(dismiss);
  inner.appendChild(p);
  inner.appendChild(actions);
  bar.appendChild(inner);
  footer.insertAdjacentElement('beforebegin', bar);
})();
