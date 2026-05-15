const fileEl = document.getElementById('file');
const startEl = document.getElementById('start');
const endEl = document.getElementById('end');
const timeline = document.getElementById('timeline');
const timelineRegion = document.getElementById('timeline-region');
const timelinePlayhead = document.getElementById('timeline-playhead');
const handleStart = document.getElementById('handle-start');
const handleEnd = document.getElementById('handle-end');
const selectionInfo = document.getElementById('selection-info');
const msg = document.getElementById('msg');
const playPauseBtn = document.getElementById('play-pause-btn');
const resetBtn = document.getElementById('reset-btn');
const trimBtn = document.getElementById('trim-btn');
const exportFormatEl = document.getElementById('export-format');

const MIN_GAP = 0.05;

let audioBuffer = null;
let audioCtx = null;
let previewSource = null;
let previewStartedAtCtx = 0;
let previewStartedAtBuffer = 0;
let previewPausedAt = null;
let previewRaf = null;
let ignorePreviewEnded = false;

let dragKind = null;
let lastGoodStart = 0;
let lastGoodEnd = 1;

function flash(text, isError) { msg.textContent = text; msg.className = isError ? 'error' : 'muted'; }

function parseMmSs(str, maxSeconds) {
  const s = String(str).trim();
  const idx = s.indexOf(':');
  if (idx === -1) return null;
  const minPart = s.slice(0, idx).trim();
  const secPart = s.slice(idx + 1).trim();
  if (secPart === '') return null;
  const m = Number(minPart);
  const sec = Number(secPart);
  if (!Number.isFinite(m) || !Number.isFinite(sec) || m < 0 || sec < 0) return null;
  const t = m * 60 + sec;
  if (!Number.isFinite(t)) return null;
  return Math.min(maxSeconds, Math.max(0, t));
}

function formatMmSs(totalSeconds) {
  const t = Math.max(0, totalSeconds);
  const m = Math.floor(t / 60);
  let s = t - m * 60;
  s = Math.round(s * 100) / 100;
  const whole = Math.floor(s + 1e-6);
  const frac = s - whole;
  let secStr = String(whole).padStart(2, '0');
  if (frac >= 0.005) {
    let f = frac.toFixed(3).replace(/0+$/, '');
    if (f.endsWith('.')) f = f.slice(0, -1);
    secStr += f.slice(1);
  }
  return `${m}:${secStr}`;
}

function getDuration() {
  return audioBuffer ? audioBuffer.duration : 1;
}

function readStartEnd() {
  const duration = getDuration();
  const ps = parseMmSs(startEl.value, duration);
  const pe = parseMmSs(endEl.value, duration);
  let start = ps === null ? lastGoodStart : ps;
  let end = pe === null ? lastGoodEnd : pe;
  start = Math.max(0, Math.min(start, duration - MIN_GAP));
  end = Math.min(duration, Math.max(end, 0));
  if (end <= start) end = Math.min(duration, start + MIN_GAP);
  lastGoodStart = start;
  lastGoodEnd = end;
  return { start, end, duration };
}

function commitStartEnd(start, end) {
  const duration = getDuration();
  const s = Math.max(0, Math.min(start, duration - MIN_GAP));
  let e = Math.min(duration, Math.max(end, s + MIN_GAP));
  startEl.value = formatMmSs(s);
  endEl.value = formatMmSs(e);
  lastGoodStart = s;
  lastGoodEnd = e;
  updateSelectionInfo();
  updateTimelineVisuals();
}

function updateSelectionInfo() {
  if (!audioBuffer) {
    selectionInfo.textContent = '';
    return;
  }
  const { start, end } = readStartEnd();
  const length = Math.max(0, end - start);
  selectionInfo.textContent = `Selection: ${formatMmSs(start)} → ${formatMmSs(end)} (${formatMmSs(length)})`;
}

function updateTimelineVisuals() {
  if (!audioBuffer) {
    timeline.classList.add('is-disabled');
    timelinePlayhead.classList.remove('is-visible');
    return;
  }
  timeline.classList.remove('is-disabled');
  const { start, end, duration } = readStartEnd();
  const p0 = (start / duration) * 100;
  const pw = ((end - start) / duration) * 100;
  timelineRegion.style.left = p0 + '%';
  timelineRegion.style.width = Math.max(0, pw) + '%';
  handleStart.style.left = (start / duration) * 100 + '%';
  handleEnd.style.left = (end / duration) * 100 + '%';

  let headT = start;
  if (previewSource && audioCtx) {
    headT = previewStartedAtBuffer + (audioCtx.currentTime - previewStartedAtCtx);
    headT = Math.min(headT, end);
  } else if (previewPausedAt != null) {
    headT = previewPausedAt;
  }
  headT = Math.max(0, Math.min(duration, headT));
  timelinePlayhead.style.left = (headT / duration) * 100 + '%';
  timelinePlayhead.classList.add('is-visible');
}

function syncFromInputs() {
  if (!audioBuffer) return;
  const { start, end, duration } = readStartEnd();
  startEl.value = formatMmSs(start);
  endEl.value = formatMmSs(end);
  if (previewPausedAt != null) {
    previewPausedAt = Math.max(start, Math.min(end, previewPausedAt));
  }
  updateSelectionInfo();
  updateTimelineVisuals();
}

function normalizeTimeFields() {
  if (!audioBuffer) return;
  syncFromInputs();
}

function getTrimRange() {
  if (!audioBuffer) return null;
  const { start, end, duration } = readStartEnd();
  if (end <= start) {
    flash('End must be greater than start.', true);
    return null;
  }
  return { start, end, duration };
}

function timeFromClientX(clientX) {
  const rect = timeline.getBoundingClientRect();
  if (rect.width <= 0) return 0;
  const t = ((clientX - rect.left) / rect.width) * getDuration();
  return Math.max(0, Math.min(getDuration(), t));
}

function stopPreviewPlayback() {
  ignorePreviewEnded = true;
  if (previewSource) {
    try { previewSource.stop(); } catch (_) {}
    previewSource.disconnect();
    previewSource = null;
  }
  ignorePreviewEnded = false;
  if (previewRaf) {
    cancelAnimationFrame(previewRaf);
    previewRaf = null;
  }
}

function updatePlayPauseUi() {
  const playing = !!previewSource;
  playPauseBtn.disabled = !audioBuffer;
  playPauseBtn.textContent = playing ? 'Pause' : 'Play';
  playPauseBtn.setAttribute('aria-label', playing ? 'Pause playback' : 'Play selection');
}

function tickPlayhead() {
  if (!previewSource || !audioCtx) return;
  updateTimelineVisuals();
  previewRaf = requestAnimationFrame(tickPlayhead);
}

function onPreviewEnded() {
  if (ignorePreviewEnded) return;
  previewSource = null;
  if (previewRaf) {
    cancelAnimationFrame(previewRaf);
    previewRaf = null;
  }
  const r = audioBuffer ? readStartEnd() : null;
  previewPausedAt = r ? r.start : null;
  updatePlayPauseUi();
  updateTimelineVisuals();
}

function playPreview() {
  if (!audioBuffer) { flash('Load audio first.', true); return; }
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const r = getTrimRange();
  if (!r) return;
  audioCtx.resume().catch(() => {});

  let from = r.start;
  if (previewPausedAt != null && previewPausedAt >= r.start && previewPausedAt < r.end - 0.02) {
    from = previewPausedAt;
  } else {
    previewPausedAt = null;
  }
  if (from >= r.end - 0.02) from = r.start;

  stopPreviewPlayback();

  const playDuration = r.end - from;
  const source = audioCtx.createBufferSource();
  source.buffer = audioBuffer;
  source.connect(audioCtx.destination);
  previewStartedAtCtx = audioCtx.currentTime;
  previewStartedAtBuffer = from;
  source.onended = onPreviewEnded;
  source.start(previewStartedAtCtx, from, playDuration);
  previewSource = source;
  updatePlayPauseUi();
  if (previewRaf) cancelAnimationFrame(previewRaf);
  previewRaf = requestAnimationFrame(tickPlayhead);
}

function pausePreview() {
  if (!previewSource || !audioCtx) return;
  const elapsed = audioCtx.currentTime - previewStartedAtCtx;
  let pos = previewStartedAtBuffer + elapsed;
  const r = readStartEnd();
  pos = Math.max(r.start, Math.min(r.end, pos));
  previewPausedAt = pos;
  stopPreviewPlayback();
  updatePlayPauseUi();
  updateTimelineVisuals();
}

function togglePlayPause() {
  if (!audioBuffer) return;
  if (previewSource) pausePreview();
  else playPreview();
}

fileEl.addEventListener('change', async () => {
  const f = fileEl.files?.[0];
  if (!f) return;
  stopPreviewPlayback();
  previewPausedAt = null;
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  audioBuffer = await audioCtx.decodeAudioData(await f.arrayBuffer());
  lastGoodStart = 0;
  lastGoodEnd = audioBuffer.duration;
  startEl.value = formatMmSs(0);
  endEl.value = formatMmSs(audioBuffer.duration);
  syncFromInputs();
  updatePlayPauseUi();
  flash(`Loaded ${f.name} (${formatMmSs(audioBuffer.duration)}).`);
});

function encodeWav(buffer) {
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const samples = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = channels * bytesPerSample;
  const dataSize = samples * blockAlign;
  const out = new ArrayBuffer(44 + dataSize);
  const view = new DataView(out);
  let o = 0;
  const writeStr = (s) => { for (let i = 0; i < s.length; i++) view.setUint8(o++, s.charCodeAt(i)); };
  writeStr('RIFF'); view.setUint32(o, 36 + dataSize, true); o += 4; writeStr('WAVE');
  writeStr('fmt '); view.setUint32(o, 16, true); o += 4; view.setUint16(o, 1, true); o += 2;
  view.setUint16(o, channels, true); o += 2; view.setUint32(o, sampleRate, true); o += 4;
  view.setUint32(o, sampleRate * blockAlign, true); o += 4; view.setUint16(o, blockAlign, true); o += 2;
  view.setUint16(o, 16, true); o += 2; writeStr('data'); view.setUint32(o, dataSize, true); o += 4;
  const channelData = Array.from({ length: channels }, (_, ch) => buffer.getChannelData(ch));
  for (let i = 0; i < samples; i++) {
    for (let ch = 0; ch < channels; ch++) {
      const s = Math.max(-1, Math.min(1, channelData[ch][i]));
      view.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      o += 2;
    }
  }
  return out;
}

function floatToInt16Sample(x) {
  const s = Math.max(-1, Math.min(1, x));
  return s < 0 ? Math.round(s * 0x8000) : Math.round(s * 0x7FFF);
}

function encodeBufferToMp3(buffer) {
  if (typeof lamejs === 'undefined' || !lamejs.Mp3Encoder) {
    throw new Error('MP3 encoder not loaded.');
  }
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const kbps = 128;
  const encoder = new lamejs.Mp3Encoder(channels, sampleRate, kbps);
  const blockSize = 1152;
  const left = buffer.getChannelData(0);
  const right = channels > 1 ? buffer.getChannelData(1) : left;
  const leftI = new Int16Array(left.length);
  const rightI = new Int16Array(right.length);
  for (let i = 0; i < left.length; i++) {
    leftI[i] = floatToInt16Sample(left[i]);
    rightI[i] = floatToInt16Sample(right[i]);
  }
  const chunks = [];
  for (let i = 0; i < leftI.length; i += blockSize) {
    const l = leftI.subarray(i, i + blockSize);
    const r = rightI.subarray(i, i + blockSize);
    const mp3buf = encoder.encodeBuffer(l, r);
    if (mp3buf && mp3buf.length > 0) chunks.push(new Uint8Array(mp3buf));
  }
  const end = encoder.flush();
  if (end && end.length > 0) chunks.push(new Uint8Array(end));
  return new Blob(chunks, { type: 'audio/mpeg' });
}

function triggerDownload(blob, filename) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
endEl.addEventListener('input', syncFromInputs);
startEl.addEventListener('blur', normalizeTimeFields);
endEl.addEventListener('blur', normalizeTimeFields);

playPauseBtn.addEventListener('click', () => { togglePlayPause(); });

resetBtn.addEventListener('click', () => {
  if (!audioBuffer) return;
  stopPreviewPlayback();
  previewPausedAt = null;
  lastGoodStart = 0;
  lastGoodEnd = audioBuffer.duration;
  startEl.value = formatMmSs(0);
  endEl.value = formatMmSs(audioBuffer.duration);
  syncFromInputs();
  updatePlayPauseUi();
  flash('Selection reset to full clip.');
});

trimBtn.addEventListener('click', async () => {
  if (!audioBuffer) { flash('Load audio first.', true); return; }
  const range = getTrimRange();
  if (!range) return;
  const { start, end } = range;
  const sampleRate = audioBuffer.sampleRate;
  const startSample = Math.floor(start * sampleRate);
  const endSample = Math.floor(end * sampleRate);
  const length = endSample - startSample;
  const out = new AudioBuffer({ numberOfChannels: audioBuffer.numberOfChannels, length, sampleRate });
  for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
    out.copyToChannel(audioBuffer.getChannelData(ch).slice(startSample, endSample), ch);
  }

  const fmt = exportFormatEl.value;
  trimBtn.disabled = true;
  try {
    let blob;
    let filename;
    if (fmt === 'wav') {
      blob = new Blob([encodeWav(out)], { type: 'audio/wav' });
      filename = 'trimmed-juankit.wav';
    } else {
      if (typeof lamejs === 'undefined' || !lamejs.Mp3Encoder) {
        flash('MP3 encoder did not load. Pick WAV or refresh the page.', true);
        return;
      }
      flash('Encoding MP3…');
      await new Promise((r) => setTimeout(r, 0));
      blob = encodeBufferToMp3(out);
      filename = 'trimmed-juankit.mp3';
    }
    triggerDownload(blob, filename);
    flash('Download started.');
  } catch (err) {
    flash('Export failed: ' + (err && err.message ? err.message : String(err)) + ' Try WAV or another sample rate.', true);
  } finally {
    trimBtn.disabled = false;
  }
});

function beginDrag(kind, e) {
  if (!audioBuffer) return;
  e.preventDefault();
  e.stopPropagation();
  stopPreviewPlayback();
  previewPausedAt = null;
  updatePlayPauseUi();
  dragKind = kind;
  const el = kind === 'start' ? handleStart : handleEnd;
  el.setPointerCapture(e.pointerId);
}

function moveDrag(e) {
  if (!dragKind || !audioBuffer) return;
  const t = timeFromClientX(e.clientX);
  const { start, end, duration } = readStartEnd();
  if (dragKind === 'start') {
    const ns = Math.min(t, end - MIN_GAP);
    commitStartEnd(ns, end);
  } else {
    const ne = Math.max(t, start + MIN_GAP);
    commitStartEnd(start, ne);
  }
}

function endDrag(e) {
  if (!dragKind) return;
  const el = dragKind === 'start' ? handleStart : handleEnd;
  if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
  dragKind = null;
}

handleStart.addEventListener('pointerdown', (e) => beginDrag('start', e));
handleEnd.addEventListener('pointerdown', (e) => beginDrag('end', e));
handleStart.addEventListener('pointermove', (e) => { if (dragKind === 'start') moveDrag(e); });
handleEnd.addEventListener('pointermove', (e) => { if (dragKind === 'end') moveDrag(e); });
handleStart.addEventListener('pointerup', endDrag);
handleStart.addEventListener('pointercancel', endDrag);
handleEnd.addEventListener('pointerup', endDrag);
handleEnd.addEventListener('pointercancel', endDrag);

const timelineTrack = timeline.querySelector('.audio-timeline__track');
timelineTrack.addEventListener('pointerdown', (e) => {
  if (!audioBuffer || e.button !== 0) return;
  if (e.target !== timelineTrack) return;
  const t = timeFromClientX(e.clientX);
  const { start, end } = readStartEnd();
  const distStart = Math.abs(t - start);
  const distEnd = Math.abs(t - end);
  stopPreviewPlayback();
  previewPausedAt = null;
  if (distStart <= distEnd) {
    commitStartEnd(Math.min(t, end - MIN_GAP), end);
  } else {
    commitStartEnd(start, Math.max(t, start + MIN_GAP));
  }
  updatePlayPauseUi();
});

updatePlayPauseUi();
updateTimelineVisuals();
