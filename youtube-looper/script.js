const urlInput = document.getElementById('url-input');
const loadBtn = document.getElementById('load-btn');
const urlMsg = document.getElementById('url-msg');
const playerWrap = document.getElementById('player-wrap');
const controls = document.getElementById('controls');
const startInput = document.getElementById('start-input');
const endInput = document.getElementById('end-input');
const startNow = document.getElementById('start-now');
const endNow = document.getElementById('end-now');
const loopToggle = document.getElementById('loop-toggle');
const jumpStart = document.getElementById('jump-start');
const msg = document.getElementById('msg');
const rangeEl = document.getElementById('range');
const rangeTrack = rangeEl.querySelector('.range-track');
const rangeFill = document.getElementById('range-fill');
const rangePlayhead = document.getElementById('range-playhead');
const thumbStart = document.getElementById('thumb-start');
const thumbEnd = document.getElementById('thumb-end');
const rangeStartLabel = document.getElementById('range-start-label');
const rangeEndLabel = document.getElementById('range-end-label');

const speedSelect = document.getElementById('speed-select');
const loopCountInput = document.getElementById('loop-count');
const copyShareBtn = document.getElementById('copy-share');
const recentsEl = document.getElementById('recents');
const recentsList = document.getElementById('recents-list');
const clearRecentsBtn = document.getElementById('clear-recents');

let player = null;
let apiReady = false;
let pendingVideoId = null;
let pendingStart = null;
let pendingEnd = null;
let pendingRate = null;
let loopTimer = null;
let duration = 0;
let startSec = 0;
let endSec = 0;
let currentVideoId = null;
let loopsPlayed = 0;
let loopsRemaining = Infinity;

const RECENTS_KEY = 'yt-looper-recents';
const MAX_RECENTS = 5;

const tag = document.createElement('script');
tag.src = 'https://www.youtube.com/iframe_api';
document.head.appendChild(tag);

window.onYouTubeIframeAPIReady = () => {
  apiReady = true;
  if (pendingVideoId) createPlayer(pendingVideoId);
};

function parseVideoId(input) {
  const s = input.trim();
  if (!s) return null;
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).slice(0, 11) || null;
    if (u.hostname.endsWith('youtube.com') || u.hostname.endsWith('youtube-nocookie.com')) {
      const v = u.searchParams.get('v');
      if (v) return v.slice(0, 11);
      const parts = u.pathname.split('/').filter(Boolean);
      const i = parts.findIndex(p => p === 'embed' || p === 'shorts' || p === 'live');
      if (i >= 0 && parts[i + 1]) return parts[i + 1].slice(0, 11);
    }
  } catch {}
  return null;
}

function parseTime(s) {
  if (s == null) return NaN;
  const t = String(s).trim();
  if (!t) return NaN;
  if (/^\d+(\.\d+)?$/.test(t)) return parseFloat(t);
  const parts = t.split(':');
  if (parts.length < 2 || parts.length > 3) return NaN;
  for (const p of parts) if (!/^\d+(\.\d+)?$/.test(p)) return NaN;
  const nums = parts.map(parseFloat);
  if (nums.length === 2) return nums[0] * 60 + nums[1];
  return nums[0] * 3600 + nums[1] * 60 + nums[2];
}

function fmt(sec) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const whole = Math.floor(sec);
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const s = whole % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function flash(text, isError) {
  msg.textContent = text;
  msg.className = isError ? 'error' : 'muted';
  setTimeout(() => { if (msg.textContent === text) msg.textContent = ''; }, 2000);
}

function createPlayer(videoId) {
  currentVideoId = videoId;
  playerWrap.hidden = false;
  controls.hidden = false;
  if (loopTimer) { clearInterval(loopTimer); loopTimer = null; }
  duration = 0;
  startSec = 0;
  endSec = 0;
  rangeEl.classList.add('disabled');
  rangePlayhead.style.display = 'none';
  if (player) {
    player.cueVideoById(videoId);
    setTimeout(onPlayerReady, 400);
    return;
  }
  player = new YT.Player('player', {
    videoId,
    playerVars: { rel: 0, modestbranding: 1, playsinline: 1 },
    events: {
      onReady: () => { onPlayerReady(); },
      onStateChange: (e) => { if (e.data === YT.PlayerState.PLAYING) loopsPlayed = 0; },
    },
  });
}

function onPlayerReady() {
  duration = player.getDuration() || 0;
  if (duration <= 0) {
    setTimeout(onPlayerReady, 300);
    return;
  }
  startSec = isFinite(pendingStart) ? clamp(pendingStart, 0, duration - 0.5) : 0;
  endSec = isFinite(pendingEnd) ? clamp(pendingEnd, startSec + 0.5, duration) : duration;
  pendingStart = pendingEnd = null;
  startInput.value = fmt(startSec);
  endInput.value = fmt(endSec);
  if (pendingRate) {
    speedSelect.value = String(pendingRate);
    player.setPlaybackRate(pendingRate);
    pendingRate = null;
  } else {
    player.setPlaybackRate(parseFloat(speedSelect.value));
  }
  loopsPlayed = 0;
  loopsRemaining = parseLoopCount();
  rangeEl.classList.remove('disabled');
  rangePlayhead.style.display = 'block';
  renderRange();
  startLoopWatcher();
  const title = (player.getVideoData && player.getVideoData().title) || '';
  saveRecent(currentVideoId, startSec, endSec, title);
}

function parseLoopCount() {
  const v = parseInt(loopCountInput.value, 10);
  return (isFinite(v) && v > 0) ? v : Infinity;
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function renderRange() {
  if (duration <= 0) return;
  const sp = (startSec / duration) * 100;
  const ep = (endSec / duration) * 100;
  thumbStart.style.left = sp + '%';
  thumbEnd.style.left = ep + '%';
  rangeFill.style.left = sp + '%';
  rangeFill.style.width = (ep - sp) + '%';
  rangeStartLabel.textContent = fmt(startSec);
  rangeEndLabel.textContent = fmt(endSec);
  thumbStart.setAttribute('aria-valuetext', fmt(startSec));
  thumbEnd.setAttribute('aria-valuetext', fmt(endSec));
}

function updatePlayhead() {
  if (!player || !player.getCurrentTime || duration <= 0) return;
  const t = player.getCurrentTime();
  rangePlayhead.style.left = ((t / duration) * 100) + '%';
}

function setFromDrag(which, clientX) {
  const rect = rangeTrack.getBoundingClientRect();
  const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
  const sec = ratio * duration;
  const minGap = 0.5;
  if (which === 'start') {
    startSec = clamp(sec, 0, endSec - minGap);
    startInput.value = fmt(startSec);
  } else {
    endSec = clamp(sec, startSec + minGap, duration);
    endInput.value = fmt(endSec);
  }
  renderRange();
}

function attachDrag(thumb, which) {
  thumb.addEventListener('pointerdown', (e) => {
    if (duration <= 0) return;
    e.preventDefault();
    thumb.setPointerCapture(e.pointerId);
    const onMove = (ev) => setFromDrag(which, ev.clientX);
    const onUp = (ev) => {
      thumb.releasePointerCapture(e.pointerId);
      thumb.removeEventListener('pointermove', onMove);
      thumb.removeEventListener('pointerup', onUp);
      thumb.removeEventListener('pointercancel', onUp);
      scheduleSaveRecent();
    };
    thumb.addEventListener('pointermove', onMove);
    thumb.addEventListener('pointerup', onUp);
    thumb.addEventListener('pointercancel', onUp);
  });
  thumb.addEventListener('keydown', (e) => {
    if (duration <= 0) return;
    const step = e.shiftKey ? 5 : 1;
    let changed = true;
    if (e.key === 'ArrowLeft') {
      if (which === 'start') startSec = clamp(startSec - step, 0, endSec - 0.5);
      else endSec = clamp(endSec - step, startSec + 0.5, duration);
    } else if (e.key === 'ArrowRight') {
      if (which === 'start') startSec = clamp(startSec + step, 0, endSec - 0.5);
      else endSec = clamp(endSec + step, startSec + 0.5, duration);
    } else { changed = false; }
    if (changed) {
      e.preventDefault();
      startInput.value = fmt(startSec);
      endInput.value = fmt(endSec);
      renderRange();
    }
  });
}
attachDrag(thumbStart, 'start');
attachDrag(thumbEnd, 'end');

rangeTrack.addEventListener('pointerdown', (e) => {
  if (e.target.classList.contains('range-thumb') || duration <= 0) return;
  const rect = rangeTrack.getBoundingClientRect();
  const ratio = (e.clientX - rect.left) / rect.width;
  const sec = ratio * duration;
  const which = Math.abs(sec - startSec) < Math.abs(sec - endSec) ? 'start' : 'end';
  setFromDrag(which, e.clientX);
});

function startLoopWatcher() {
  if (loopTimer) clearInterval(loopTimer);
  loopTimer = setInterval(() => {
    if (!player || !player.getCurrentTime) return;
    updatePlayhead();
    if (!loopToggle.checked) return;
    if (!(endSec > startSec)) return;
    const t = player.getCurrentTime();
    if (t >= endSec || t < startSec - 0.5) {
      loopsPlayed++;
      if (loopsPlayed >= loopsRemaining) {
        player.pauseVideo();
        player.seekTo(startSec, true);
        flash(`Played ${loopsPlayed}×. Loop finished.`);
        loopsPlayed = 0;
        return;
      }
      player.seekTo(startSec, true);
    }
  }, 200);
}

loadBtn.addEventListener('click', () => {
  const id = parseVideoId(urlInput.value);
  if (!id) {
    urlMsg.textContent = "That doesn't look like a YouTube URL or video ID.";
    urlMsg.className = 'error';
    return;
  }
  urlMsg.textContent = '';
  if (apiReady) createPlayer(id); else pendingVideoId = id;
});

urlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); loadBtn.click(); }
});

const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
function doSearch() {
  const q = searchInput.value.trim();
  if (!q) return;
  const url = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(q);
  window.open(url, '_blank', 'noopener');
}
searchBtn.addEventListener('click', doSearch);
searchInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); doSearch(); }
});

startNow.addEventListener('click', () => {
  if (!player || !player.getCurrentTime || duration <= 0) return;
  startSec = clamp(player.getCurrentTime(), 0, endSec - 0.5);
  startInput.value = fmt(startSec);
  renderRange();
  flash('Start set.');
});

endNow.addEventListener('click', () => {
  if (!player || !player.getCurrentTime || duration <= 0) return;
  endSec = clamp(player.getCurrentTime(), startSec + 0.5, duration);
  endInput.value = fmt(endSec);
  renderRange();
  flash('End set.');
});

jumpStart.addEventListener('click', () => {
  if (!player || duration <= 0) { flash('Load a video first.', true); return; }
  player.seekTo(startSec, true);
  player.playVideo();
});

let saveTimer = null;
function scheduleSaveRecent() {
  if (!currentVideoId || duration <= 0) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveRecent(currentVideoId, startSec, endSec), 600);
}

function commitInput(el, which) {
  const v = parseTime(el.value);
  if (el.value.trim() && !isFinite(v)) {
    flash('Time format: 1:20, 1:20.5, 80, or 1:02:03.', true);
    el.value = fmt(which === 'start' ? startSec : endSec);
    return;
  }
  if (duration <= 0) return;
  if (which === 'start') {
    startSec = clamp(v, 0, endSec - 0.5);
    el.value = fmt(startSec);
  } else {
    endSec = clamp(v, startSec + 0.5, duration);
    el.value = fmt(endSec);
  }
  renderRange();
  scheduleSaveRecent();
}
startInput.addEventListener('change', () => commitInput(startInput, 'start'));
endInput.addEventListener('change', () => commitInput(endInput, 'end'));

rangeEl.classList.add('disabled');

speedSelect.addEventListener('change', () => {
  const rate = parseFloat(speedSelect.value);
  if (player && player.setPlaybackRate) player.setPlaybackRate(rate);
});

loopCountInput.addEventListener('change', () => {
  loopsRemaining = parseLoopCount();
  loopsPlayed = 0;
});

copyShareBtn.addEventListener('click', async () => {
  if (!currentVideoId) { flash('Load a video first.', true); return; }
  const params = new URLSearchParams({
    v: currentVideoId,
    s: String(Math.round(startSec * 10) / 10),
    e: String(Math.round(endSec * 10) / 10),
  });
  const rate = parseFloat(speedSelect.value);
  if (rate !== 1) params.set('r', String(rate));
  const link = `${location.origin}${location.pathname}#${params.toString()}`;
  try { await navigator.clipboard.writeText(link); flash('Share link copied.'); }
  catch { flash('Copy failed.', true); }
});

function readHash() {
  const h = location.hash.replace(/^#/, '');
  if (!h) return null;
  const p = new URLSearchParams(h);
  const v = p.get('v');
  if (!v) return null;
  return {
    v,
    s: parseFloat(p.get('s')),
    e: parseFloat(p.get('e')),
    r: parseFloat(p.get('r')),
  };
}

function loadFromHash() {
  const h = readHash();
  if (!h) return;
  const id = parseVideoId(h.v);
  if (!id) return;
  pendingStart = isFinite(h.s) ? h.s : null;
  pendingEnd = isFinite(h.e) ? h.e : null;
  pendingRate = isFinite(h.r) ? h.r : null;
  urlInput.value = id;
  if (apiReady) createPlayer(id); else pendingVideoId = id;
}

function loadRecents() {
  try { return JSON.parse(localStorage.getItem(RECENTS_KEY) || '[]'); }
  catch { return []; }
}

function saveRecent(id, s, e, title) {
  if (!id) return;
  const list = loadRecents();
  const prev = list.find(x => x.id === id);
  const keptTitle = title || (prev && prev.title) || '';
  const filtered = list.filter(x => x.id !== id);
  filtered.unshift({ id, s: Math.round(s * 10) / 10, e: Math.round(e * 10) / 10, title: keptTitle, ts: Date.now() });
  try { localStorage.setItem(RECENTS_KEY, JSON.stringify(filtered.slice(0, MAX_RECENTS))); }
  catch {}
  renderRecents();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function renderRecents() {
  const list = loadRecents();
  if (list.length === 0) { recentsEl.hidden = true; return; }
  recentsEl.hidden = false;
  recentsList.innerHTML = '';
  for (const r of list) {
    const btn = document.createElement('button');
    btn.className = 'recent-item';
    const title = r.title || r.id;
    btn.title = `${title}  (${fmt(r.s)}–${fmt(r.e)})`;
    btn.innerHTML = `
      <img src="https://i.ytimg.com/vi/${encodeURIComponent(r.id)}/mqdefault.jpg" alt="" loading="lazy">
      <div class="meta">
        <div class="recent-title">${escapeHtml(title)}</div>
        <div class="recent-time">${fmt(r.s)}–${fmt(r.e)}</div>
      </div>
    `;
    btn.addEventListener('click', () => {
      pendingStart = r.s;
      pendingEnd = r.e;
      urlInput.value = r.id;
      if (apiReady) createPlayer(r.id); else pendingVideoId = r.id;
    });
    recentsList.appendChild(btn);
  }
}

clearRecentsBtn.addEventListener('click', () => {
  localStorage.removeItem(RECENTS_KEY);
  renderRecents();
});

renderRecents();
loadFromHash();

document.addEventListener('keydown', (e) => {
  const tag = (e.target.tagName || '').toUpperCase();
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (!player || duration <= 0) return;
  const k = e.key;
  if (k === ' ') {
    e.preventDefault();
    const st = player.getPlayerState();
    if (st === YT.PlayerState.PLAYING) player.pauseVideo(); else player.playVideo();
  } else if (k === '[') {
    startSec = clamp(player.getCurrentTime(), 0, endSec - 0.5);
    startInput.value = fmt(startSec); renderRange(); flash('Start set.');
  } else if (k === ']') {
    endSec = clamp(player.getCurrentTime(), startSec + 0.5, duration);
    endInput.value = fmt(endSec); renderRange(); flash('End set.');
  } else if (k === 'l' || k === 'L') {
    loopToggle.checked = !loopToggle.checked;
    flash(loopToggle.checked ? 'Loop on.' : 'Loop off.');
  } else if (k === 'j' || k === 'J') {
    startSec = clamp(startSec - 1, 0, endSec - 0.5);
    startInput.value = fmt(startSec); renderRange();
  } else if (k === 'k' || k === 'K') {
    startSec = clamp(startSec + 1, 0, endSec - 0.5);
    startInput.value = fmt(startSec); renderRange();
  } else if (k === ',') {
    endSec = clamp(endSec - 1, startSec + 0.5, duration);
    endInput.value = fmt(endSec); renderRange();
  } else if (k === '.') {
    endSec = clamp(endSec + 1, startSec + 0.5, duration);
    endInput.value = fmt(endSec); renderRange();
  } else if (k === 'Home') {
    e.preventDefault();
    player.seekTo(startSec, true);
    player.playVideo();
  }
});
