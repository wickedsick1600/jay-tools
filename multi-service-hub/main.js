// CATEGORIES and TOOLS come from tools.js (loaded via <script> tag before this file).

const searchInput = document.getElementById('search');
const tabsContainer = document.getElementById('tabs');
const listContainer = document.getElementById('tool-list');
const emptyState = document.getElementById('empty');

let activeCategory = 'all';
let query = '';

function toolMatches(tool) {
  if (activeCategory !== 'all' && tool.category !== activeCategory) return false;
  if (!query) return true;

  const haystack = [
    tool.title,
    tool.description,
    tool.longDescription,
    tool.category,
    ...(tool.tags || []),
  ].join(' ').toLowerCase();

  return query.split(/\s+/).every(term => haystack.includes(term));
}

function categoryLabel(id) {
  return CATEGORIES.find(c => c.id === id)?.label || id;
}

function renderTabs() {
  tabsContainer.innerHTML = '';
  const counts = Object.fromEntries(CATEGORIES.map(c => [c.id, 0]));
  counts.all = TOOLS.length;
  for (const t of TOOLS) if (counts[t.category] !== undefined) counts[t.category]++;

  for (const cat of CATEGORIES) {
    const btn = document.createElement('button');
    btn.className = 'tab' + (cat.id === activeCategory ? ' active' : '');
    btn.type = 'button';
    btn.textContent = `${cat.label} (${counts[cat.id] || 0})`;
    btn.addEventListener('click', () => { activeCategory = cat.id; render(); });
    tabsContainer.appendChild(btn);
  }
}

function renderCard(tool) {
  const card = document.createElement('article');
  card.className = 'tool-card' + (tool.status === 'coming-soon' ? ' coming-soon' : '');

  const titleEl = tool.status === 'live'
    ? Object.assign(document.createElement('a'), { href: tool.url, className: 'tool-title', textContent: tool.title })
    : Object.assign(document.createElement('span'), { className: 'tool-title', textContent: tool.title });

  const catEl = document.createElement('span');
  catEl.className = 'tool-cat';
  catEl.textContent = categoryLabel(tool.category);

  const header = document.createElement('header');
  header.append(titleEl, catEl);

  const desc = document.createElement('p');
  desc.className = 'tool-desc';
  desc.textContent = tool.description;

  const tags = document.createElement('div');
  tags.className = 'tool-tags';
  (tool.tags || []).slice(0, 6).forEach(t => {
    const tag = document.createElement('span');
    tag.className = 'tool-tag';
    tag.textContent = t;
    tags.appendChild(tag);
  });

  card.append(header, desc, tags);

  if (tool.status === 'coming-soon') {
    const badge = document.createElement('span');
    badge.className = 'tool-badge';
    badge.textContent = 'Coming soon';
    card.appendChild(badge);
  }

  return card;
}

function render() {
  renderTabs();

  const matches = TOOLS.filter(toolMatches);
  listContainer.innerHTML = '';

  if (matches.length === 0) {
    emptyState.style.display = 'block';
    return;
  }
  emptyState.style.display = 'none';

  matches
    .sort((a, b) => (a.status === 'coming-soon') - (b.status === 'coming-soon'))
    .forEach(t => listContainer.appendChild(renderCard(t)));
}

searchInput.addEventListener('input', (e) => {
  query = e.target.value.trim().toLowerCase();
  render();
});

render();
