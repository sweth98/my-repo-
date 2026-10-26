import { Film } from './film.js';
import { DURATION, FPS } from './config.js';
import { AudioPlayer, bufferToWav } from './audio.js';
import { exportVideo, exportSupported, download } from './exporter.js';
import { initDev } from './dev.js';

const params = new URLSearchParams(location.search);
const stage = document.getElementById('stage');
const hudPlay = document.getElementById('play');
const scrub = document.getElementById('scrub');
const timeEl = document.getElementById('time');

const capture = params.has('capture') || params.has('export');
const film = new Film(stage, {
  preserve: capture || params.has('dev'),
  shadowSize: +params.get('shadow') || 4096,
  samples: params.has('samples') ? +params.get('samples') : 4,
});
window.__ascent = { film };

function layout() {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = Math.floor(Math.min(vw, (vh * 9) / 16));
  const h = Math.round((w * 16) / 9);
  stage.style.width = `${w}px`;
  stage.style.height = `${h}px`;
  let pr = params.has('pr') ? +params.get('pr') : Math.min(window.devicePixelRatio || 1, 2);
  // never render beyond the 1080x1920 reference
  pr = Math.min(pr, 1080 / w);
  film.setSize(w, h, pr);
  film.renderAt(film.t);
}

// ---- deterministic playback: wall clock -> quantised 30 fps timeline time
let playing = !params.has('t') && !params.has('paused');
let clock = params.has('t') ? +params.get('t') : 0;
let last = performance.now();
let lastFrame = -1;

function setTime(t, force = false) {
  clock = ((t % DURATION) + DURATION) % DURATION;
  lastFrame = -1;
  frame(force);
}
function frame() {
  const f = Math.floor(clock * FPS + 1e-6);
  if (f === lastFrame) return;
  lastFrame = f;
  const t = f / FPS;
  film.renderAt(t);
  scrub.value = t;
  timeEl.textContent = `${t.toFixed(2)} / ${DURATION.toFixed(2)}`;
}
function tick(now) {
  requestAnimationFrame(tick);
  const dt = (now - last) / 1000;
  last = now;
  if (playing) {
    clock += Math.min(dt, 0.25);
    if (clock >= DURATION) clock -= DURATION; // seamless wrap
    frame();
    audio.sync(clock);
  }
}

const audio = new AudioPlayer(film);
const soundBtn = document.getElementById('sound');
function syncAudio() { if (playing) audio.start(clock); else audio.stop(); }
soundBtn.addEventListener('click', async () => {
  if (audio.on) { audio.on = false; audio.stop(); soundBtn.textContent = 'Sound off'; soundBtn.setAttribute('aria-pressed', 'false'); return; }
  soundBtn.textContent = 'Synthesising…';
  await audio.enable();
  soundBtn.textContent = 'Sound on'; soundBtn.setAttribute('aria-pressed', 'true');
  syncAudio();
});
hudPlay.addEventListener('click', () => {
  playing = !playing;
  hudPlay.textContent = playing ? 'Pause' : 'Play';
  syncAudio();
});
document.getElementById('restart').addEventListener('click', () => { clock = 0; lastFrame = -1; playing = true; hudPlay.textContent = 'Pause'; frame(); syncAudio(); });
scrub.addEventListener('input', () => { playing = false; hudPlay.textContent = 'Play'; setTime(+scrub.value); audio.stop(); });
if (exportSupported()) {
  const b = document.getElementById('export');
  b.hidden = false;
  b.addEventListener('click', () => runExport());
}
async function runExport(opts = {}) {
  const b = document.getElementById('export');
  const was = playing; playing = false; audio.stop();
  try {
    if (!audio.buffer) { b.textContent = 'Synthesising…'; await audio.enable(); audio.on = false; audio.stop(); }
    const r = await exportVideo(film, { ...opts, audioBuffer: audio.buffer, onProgress: (p) => { b.textContent = `Export ${Math.round(p * 100)}%`; } });
    download(r.blob, 'the-infinite-ascent.mp4');
    download(bufferToWav(audio.buffer), 'the-infinite-ascent.wav');
    b.textContent = 'Export';
    return r;
  } finally { playing = was; layout(); }
}
window.__ascent.exportVideo = runExport;
if (params.has('dev')) initDev(film, { onSeek: (t) => setTime(t) });
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') { e.preventDefault(); hudPlay.click(); }
  if (e.code === 'ArrowRight') setTime(clock + 1 / FPS);
  if (e.code === 'ArrowLeft') setTime(clock - 1 / FPS);
});
stage.addEventListener('pointerdown', () => stage.classList.add('touched'));
window.addEventListener('resize', layout);

layout();
setTime(clock);
requestAnimationFrame((n) => { last = n; tick(n); });
document.getElementById('loading').classList.add('done');

window.__ascent.setTime = setTime;
window.__ascent.render = (t) => { film.renderAt(t); };
