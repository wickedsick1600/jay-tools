(function () {
  const container = document.querySelector('[data-related-tools]');
  if (!container || typeof TOOLS === 'undefined') return;

  const currentToolSlug = getCurrentToolSlug();
  const candidates = TOOLS
    .filter((tool) => tool.status === 'live' && tool.url && tool.url !== '#')
    .filter((tool) => tool.id !== currentToolSlug && toolSlug(tool) !== currentToolSlug);

  const picks = shuffle(candidates).slice(0, 3);
  if (!picks.length) return;

  const titleId = container.id ? `${container.id}-title` : 'related-tools-title';
  container.classList.add('related-tools');
  container.setAttribute('aria-labelledby', titleId);

  const heading = document.createElement('h2');
  heading.id = titleId;
  heading.textContent = 'Try another tool';

  const grid = document.createElement('div');
  grid.className = 'related-tools__grid';

  picks.forEach((tool) => {
    const link = document.createElement('a');
    link.className = 'related-tools__card';
    link.href = rootRelativeUrl(tool.url);

    const iconWrap = document.createElement('span');
    iconWrap.className = 'related-tools__icon';
    iconWrap.setAttribute('aria-hidden', 'true');
    if (typeof iconMarkup === 'function') {
      iconWrap.innerHTML = iconMarkup(tool.icon);
    }

    const body = document.createElement('span');
    body.className = 'related-tools__body';

    const name = document.createElement('strong');
    name.textContent = tool.shortTitle || tool.title;

    const text = document.createElement('span');
    text.className = 'related-tools__hint';
    text.textContent = tool.hint || tool.description || 'Open tool';

    body.append(name, text);
    link.append(iconWrap, body);
    grid.appendChild(link);
  });

  container.append(heading, grid);

  function shuffle(items) {
    const copy = items.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function getCurrentToolSlug() {
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      try {
        const pathname = new URL(canonical.href).pathname;
        const slug = firstPathSegment(pathname);
        if (slug) return slug;
      } catch (err) {}
    }
    return firstPathSegment(window.location.pathname);
  }

  function firstPathSegment(pathname) {
    return (pathname || '').split('/').filter(Boolean)[0] || '';
  }

  function toolSlug(tool) {
    return firstPathSegment(rootRelativeUrl(tool.url));
  }

  function rootRelativeUrl(url) {
    return '/' + String(url).replace(/^\.\//, '').replace(/^\/+/, '');
  }
})();
