const fileEl = document.getElementById('file');
const startEl = document.getElementById('start');
const endEl = document.getElementById('end');
const msg = document.getElementById('msg');
let audioBuffer = null;
function flash(text, isError) { msg.textContent = text; msg.className = isError ? 'error' : 'muted'; }
fileEl.addEventListener('change', async () => {
  const f = fileEl.files?.[0];
  if (!f) return;
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  audioBuffer = await ctx.decodeAudioData(await f.arrayBuffer());
  startEl.value = 0;
  endEl.value = audioBuffer.duration.toFixed(2);
  flash(`Loaded ${f.name} (${audioBuffer.duration.toFixed(2)}s).`);
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
document.getElementById('trim-btn').addEventListener('click', () => {
  if (!audioBuffer) { flash('Load audio first.', true); return; }
  const start = Math.max(0, Number(startEl.value) || 0);
  const end = Math.min(audioBuffer.duration, Number(endEl.value) || audioBuffer.duration);
  if (end <= start) { flash('End must be greater than start.', true); return; }
  const sampleRate = audioBuffer.sampleRate;
  const startSample = Math.floor(start * sampleRate);
  const endSample = Math.floor(end * sampleRate);
  const length = endSample - startSample;
  const out = new AudioBuffer({ numberOfChannels: audioBuffer.numberOfChannels, length, sampleRate });
  for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
    out.copyToChannel(audioBuffer.getChannelData(ch).slice(startSample, endSample), ch);
  }
  const blob = new Blob([encodeWav(out)], { type: 'audio/wav' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'trimmed.wav';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  flash('Trimmed audio downloaded.');
});
