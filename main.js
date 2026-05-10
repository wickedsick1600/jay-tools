// TOOL_GROUPS, CATEGORIES, and TOOLS come from tools.js, loaded before this file.

const GROUPS = typeof TOOL_GROUPS !== 'undefined'
  ? TOOL_GROUPS
  : [
      { id: 'all', label: 'All' },
      { id: 'pdf', label: 'PDF' },
      { id: 'image', label: 'Images' },
      { id: 'code', label: 'Code' },
      { id: 'text', label: 'Text' },
      { id: 'ai', label: 'AI' },
      { id: 'media', label: 'Media' },
    ];

const searchInput = document.getElementById('search');
const tabsContainer = document.getElementById('tabs');
const listContainer = document.getElementById('tool-list');
const heroShortcuts = document.getElementById('popular-tools');
const comingSection = document.getElementById('coming-section');
const comingList = document.getElementById('coming-list');
const emptyState = document.getElementById('empty');
const resultsSummary = document.getElementById('results-summary');
const clearSearchButton = document.getElementById('clear-search');
const feedbackCard = document.getElementById('feedback-card');
const catalogTitle = document.getElementById('catalog-title');

const initialParams = new URLSearchParams(window.location.search);

let activeGroup = 'all';
let query = (initialParams.get('q') || '').trim().toLowerCase();

if (searchInput) {
  searchInput.value = initialParams.get('q') || '';
}

function liveTools() {
  return TOOLS.filter((tool) => tool.status === 'live');
}

function categoryLabel(id) {
  if (typeof CATEGORIES === 'undefined') return id;

  const category = CATEGORIES.find((item) => item.id === id);
  return category ? category.label : id;
}

function groupFor(tool) {
  if (tool.group) return tool.group;
  if (tool.category === 'image') return 'image';
  if (tool.category === 'audio' || tool.category === 'video') return 'media';
  if (tool.category === 'ai') return 'ai';
  if (tool.category === 'text') return 'text';
  return 'code';
}

function groupConfig(id) {
  return GROUPS.find((group) => group.id === id) || { id: id, label: id };
}

function groupLabel(id) {
  return groupConfig(id).label;
}

function displayTitle(tool) {
  return tool.shortTitle || tool.title;
}

function displayHint(tool) {
  return tool.description || tool.hint;
}

function clearElement(element) {
  if (element) element.textContent = '';
}

function groupSortValue(tool) {
  const id = groupFor(tool);
  const index = GROUPS.findIndex((group) => group.id === id);
  return index === -1 ? 99 : index;
}

function searchableText(tool) {
  const groupId = groupFor(tool);

  return [
    tool.title,
    tool.shortTitle,
    tool.description,
    tool.hint,
    tool.longDescription,
    categoryLabel(tool.category),
    tool.category,
    groupLabel(groupId),
    groupId,
    ...(tool.tags || []),
  ].filter(Boolean).join(' ').toLowerCase();
}

function toolMatches(tool) {
  if (activeGroup !== 'all' && groupFor(tool) !== activeGroup) return false;
  if (!query) return true;

  const haystack = searchableText(tool);
  return query.split(/\s+/).every((term) => haystack.includes(term));
}

function countLiveInGroup(groupId) {
  if (groupId === 'all') return liveTools().length;
  return liveTools().filter((tool) => groupFor(tool) === groupId).length;
}

function chipLabel(group) {
  return `${group.label} (${countLiveInGroup(group.id)})`;
}

function renderTabs() {
  clearElement(tabsContainer);

  for (const group of GROUPS) {
    const button = document.createElement('button');
    button.className = 'chip' + (group.id === activeGroup ? ' active' : '');
    button.type = 'button';
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', group.id === activeGroup ? 'true' : 'false');
    button.textContent = chipLabel(group);
    button.addEventListener('click', () => {
      activeGroup = group.id;
      render();
    });
    tabsContainer.appendChild(button);
  }
}

function iconMarkup(icon) {
  const icons = {
    pdf: '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5"/><path d="M8.8 15h6.4"/><path d="M8.8 18h4.6"/></svg>',
    merge: '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8v8H6z"/><path d="M10 12h8v8h-8z"/><path d="M14 8h3v3"/></svg>',
    image: '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="14" rx="2"/><path d="m7 16 3.5-4 3 3 2-2.2L19 16"/><circle cx="9" cy="9" r="1.2"/></svg>',
    resize: '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="14" height="14" rx="2"/><path d="M9 5H5v4"/><path d="M15 19h4v-4"/><path d="m5 5 5 5"/><path d="m19 19-5-5"/></svg>',
    folder: '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7h7l2 2h9v9.5A2.5 2.5 0 0 1 18.5 21h-13A2.5 2.5 0 0 1 3 18.5z"/><path d="M3 7v-1.5A2.5 2.5 0 0 1 5.5 3h4L12 5.5h6.5A2.5 2.5 0 0 1 21 8"/></svg>',
    prompt: '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 6h10a3 3 0 0 1 3 3v5a3 3 0 0 1-3 3H9l-4 3v-3a3 3 0 0 1-3-3V9a3 3 0 0 1 3-3z"/><path d="M18 3v4"/><path d="M16 5h4"/></svg>',
    video: '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="6" width="16" height="12" rx="2"/><path d="m10 9 5 3-5 3z"/></svg>',
    audio: '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 13v-2"/><path d="M8 16V8"/><path d="M12 19V5"/><path d="M16 16V8"/><path d="M20 13v-2"/></svg>',
    qr: '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><path d="M14 14h2v2h-2z"/><path d="M18 14h2v6h-6v-2"/></svg>',
    password: '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="12" r="3"/><path d="M11 12h9"/><path d="M17 12v3"/><path d="M14 12v2"/></svg>',
    timer: '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="7"/><path d="M9 2h6"/><path d="M12 6V2"/><path d="m12 13 3-2"/></svg>',
    word: '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 6h14"/><path d="M7 10h10"/><path d="M8 14h8"/><path d="M10 18h4"/></svg>',
    ocr: '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8V5h3"/><path d="M17 5h3v3"/><path d="M20 16v3h-3"/><path d="M7 19H4v-3"/><path d="M7 12h10"/><path d="M9 9h6"/><path d="M9 15h6"/></svg>',
    exam: '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v16H7z"/><path d="m9 9 1 1 2-2"/><path d="M14 9h2"/><path d="m9 15 1 1 2-2"/><path d="M14 15h2"/></svg>',
    json: '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5H7a2 2 0 0 0-2 2v2a2 2 0 0 1-2 2 2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h2"/><path d="M15 5h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2 2 2 0 0 0-2 2v2a2 2 0 0 1-2 2h-2"/></svg>',
    regex: '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/><path d="m7 7 10 10"/><path d="m17 7-10 10"/></svg>',
    diff: '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h9"/><path d="M5 16h9"/><path d="M18 5v6"/><path d="M15 8h6"/><path d="M15 16h6"/></svg>',
    unit: '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M5 7h14"/><path d="M5 17h14"/><path d="M7 5v4"/><path d="M17 15v4"/><path d="m9 12-3-3 3-3"/><path d="m15 12 3 3-3 3"/></svg>',
    token: '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 7v10l8 4 8-4V7z"/><path d="M4 7l8 4 8-4"/><path d="M12 11v10"/></svg>',
    svg: '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9z"/><path d="M8 9h8"/><path d="M8 15h8"/></svg>',
    tool: '<svg aria-hidden="true" focusable="false" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/></svg>',
  };

  return icons[icon] || icons.tool;
}

function appendTags(parent, tool) {
  const tags = (tool.tags || []).slice(0, 5);
  if (tags.length === 0) return;

  const row = document.createElement('span');
  row.className = 'tool-tags';

  for (const tagName of tags) {
    const tag = document.createElement('span');
    tag.className = 'tool-tag';
    tag.textContent = tagName;
    row.appendChild(tag);
  }

  parent.appendChild(row);
}

function renderCard(tool) {
  const isLive = tool.status === 'live';
  const card = document.createElement(isLive ? 'a' : 'article');
  card.className = 'tool-card' + (isLive ? '' : ' coming-soon');

  if (isLive) {
    card.href = tool.url;
    card.setAttribute('aria-label', `Open ${tool.title}`);
  } else {
    card.setAttribute('aria-label', `${tool.title} coming soon`);
  }

  const icon = document.createElement('span');
  icon.className = 'tool-icon';
  icon.innerHTML = iconMarkup(tool.icon);

  const body = document.createElement('span');
  body.className = 'tool-body';

  const title = document.createElement('span');
  title.className = 'tool-title';
  title.textContent = displayTitle(tool);

  const category = document.createElement('span');
  category.className = 'tool-category';
  category.textContent = groupLabel(groupFor(tool));

  const hint = document.createElement('span');
  hint.className = 'tool-hint';
  hint.textContent = displayHint(tool);

  body.append(title, hint);

  const top = document.createElement('span');
  top.className = 'tool-card-top';
  top.append(icon, category);

  appendTags(body, tool);
  card.append(top, body);

  return card;
}

function renderHeroShortcuts() {
  clearElement(heroShortcuts);

  const shortcuts = liveTools()
    .filter((tool) => tool.featured)
    .sort((a, b) => groupSortValue(a) - groupSortValue(b))
    .slice(0, 6);

  for (const tool of shortcuts) {
    const link = document.createElement('a');
    link.className = 'shortcut-card';
    link.href = tool.url;
    link.setAttribute('aria-label', `Open ${tool.title}`);

    const icon = document.createElement('span');
    icon.className = 'shortcut-icon';
    icon.innerHTML = iconMarkup(tool.icon);

    const body = document.createElement('span');

    const title = document.createElement('span');
    title.className = 'shortcut-title';
    title.textContent = displayTitle(tool);

    const hint = document.createElement('span');
    hint.className = 'shortcut-hint';
    hint.textContent = groupLabel(groupFor(tool));

    body.append(title, hint);
    link.append(icon, body);
    heroShortcuts.appendChild(link);
  }
}

function renderToolGroups(tools, container, options) {
  clearElement(container);

  const prefix = options && options.prefix ? options.prefix : 'tools';
  const groupsToRender = activeGroup === 'all'
    ? GROUPS.filter((group) => group.id !== 'all')
    : GROUPS.filter((group) => group.id === activeGroup);

  for (const group of groupsToRender) {
    const groupTools = tools.filter((tool) => groupFor(tool) === group.id);
    if (groupTools.length === 0) continue;

    const section = document.createElement('section');
    section.className = 'tool-group';

    const headingId = `${prefix}-${group.id}-title`;
    section.setAttribute('aria-labelledby', headingId);

    const header = document.createElement('div');
    header.className = 'tool-group-header';

    const title = document.createElement('h3');
    title.className = 'tool-group-title';
    title.id = headingId;
    title.textContent = group.label;

    const count = document.createElement('span');
    count.className = 'tool-group-count';
    count.textContent = `${groupTools.length} ${groupTools.length === 1 ? 'tool' : 'tools'}`;

    const grid = document.createElement('div');
    grid.className = 'tool-grid';

    for (const tool of groupTools) {
      grid.appendChild(renderCard(tool));
    }

    header.append(title, count);
    section.append(header, grid);
    container.appendChild(section);
  }
}

function updateUrlQuery() {
  const params = new URLSearchParams(window.location.search);

  if (query) {
    params.set('q', searchInput.value.trim());
  } else {
    params.delete('q');
  }

  params.delete('thanks');

  const nextQuery = params.toString();
  const nextUrl = nextQuery
    ? `${window.location.pathname}?${nextQuery}${window.location.hash}`
    : `${window.location.pathname}${window.location.hash}`;

  try {
    window.history.replaceState({}, '', nextUrl);
  } catch (error) {
    // Some local file previews are strict about history updates.
  }
}

function updateResultsSummary(liveMatches, comingMatches) {
  if (query) {
    const roadmapText = comingMatches.length > 0
      ? `, ${comingMatches.length} roadmap`
      : '';
    resultsSummary.textContent = `${liveMatches.length} live${roadmapText} for "${searchInput.value.trim()}"`;
    catalogTitle.textContent = 'Search Results';
    return;
  }

  if (activeGroup !== 'all') {
    resultsSummary.textContent = `${liveMatches.length} ${groupLabel(activeGroup)} tools`;
    catalogTitle.textContent = groupLabel(activeGroup);
    return;
  }

  resultsSummary.textContent = `${liveTools().length} tools ready now`;
  catalogTitle.textContent = 'Choose a tool';
}

function render() {
  renderTabs();

  const liveMatches = liveTools().filter(toolMatches);
  const comingMatches = TOOLS.filter((tool) => tool.status === 'coming-soon' && toolMatches(tool));
  const showRoadmap = comingMatches.length > 0 && (Boolean(query) || activeGroup !== 'all');

  renderToolGroups(liveMatches, listContainer, { prefix: 'live' });
  renderToolGroups(comingMatches, comingList, { prefix: 'coming' });

  emptyState.style.display = liveMatches.length === 0 && !showRoadmap ? 'block' : 'none';
  comingSection.style.display = showRoadmap ? 'block' : 'none';
  clearSearchButton.classList.toggle('visible', Boolean(query) || activeGroup !== 'all');

  updateResultsSummary(liveMatches, showRoadmap ? comingMatches : []);
}

searchInput.addEventListener('input', (event) => {
  query = event.target.value.trim().toLowerCase();
  updateUrlQuery();
  render();
});

clearSearchButton.addEventListener('click', () => {
  searchInput.value = '';
  query = '';
  activeGroup = 'all';
  updateUrlQuery();
  render();
  searchInput.focus();
});

function initHeroChrome() {
  const countEl = document.getElementById('hero-tool-count');
  if (countEl && typeof TOOLS !== 'undefined') {
    countEl.textContent = `${liveTools().length}+`;
  }
  document.getElementById('hero-cta-primary')?.addEventListener('click', () => {
    requestAnimationFrame(() => searchInput?.focus());
  });
}

initHeroChrome();
renderHeroShortcuts();
render();

if (initialParams.get('thanks') === '1') {
  feedbackCard?.classList.add('submitted');
  requestAnimationFrame(() => {
    document.getElementById('feedback')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}
