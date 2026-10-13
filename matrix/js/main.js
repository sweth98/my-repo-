import { MatrixScene } from './scene.js';
import { FallbackRain } from './fallback.js';
import { AudioEngine } from './audio.js';
import { Terminal } from './terminal.js';
import { Director, fx } from './events.js';
import { MODES, MODE_KEYS } from './modes.js';

const $ = (id) => document.getElementById(id);
const params = new URLSearchParams(location.search);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const pad = (n) => String(n).padStart(2, '0');

const LAYER_NAMES = ['SURFACE', 'SUBSTRATE', 'KERNEL', 'FIRMWARE', 'VOID', 'ORIGIN'];
const BOOT_LINES = [
  'MATRIX-OS 4.2.0  //  SIMULATION SYSTEMS',
  'CHECKING MEMORY ...................... OK',
  'MOUNTING /dev/reality ................ OK',
  'LOADING GLYPH TABLE [128] ............ OK',
  'SYNCHRONISING DATA STREAMS ........... OK',
  'INITIALISING DIGITAL ENVIRONMENT...',
].join('\n');
const BOOT_CPS = 85;       // characters per second
const BOOT_RAMP = 5.5;     // seconds for the full rain to emerge

const els = {
  canvas: $('stage'), hud: $('hud'), hudMode: $('hud-mode'), hudLayer: $('hud-layer'), paused: $('hud-paused'),
  sound: $('btn-sound'), full: $('btn-full'), keys: $('btn-keys'), menuBtn: $('btn-menu'),
  console: $('console'), consoleToggle: $('console-toggle'), consoleBody: $('console-body'),
  guide: $('guide'), guideClose: $('guide-close'),
  alert: $('alert'), alertText: $('alert-text'),
  menu: $('menu'), modes: $('modes'), start: $('start'), note: $('menu-note'),
  boot: $('boot'), bootText: $('boot-text'),
};

// ---- listeners with guaranteed cleanup ---------------------------------------
const offs = [];
function on(target, type, fn, opts) {
  target.addEventListener(type, fn, opts);
  offs.push(() => target.removeEventListener(type, fn, opts));
}

// ---- backend (WebGL2 scene or 2D fallback) -----------------------------------
const QMAP = { low: 0, med: 1, medium: 1, high: 2 };
const fixedQuality = params.has('quality') ? QMAP[params.get('quality')] : undefined;
let scene;
try {
  scene = new MatrixScene(els.canvas, { reducedMotion, quality: fixedQuality ?? 2 });
} catch (err) {
  console.warn('WebGL2 unavailable, using 2D fallback:', err);
  scene = new FallbackRain(els.canvas, { reducedMotion });
}
const isFallback = !!scene.fallback;

const audio = new AudioEngine();
const term = new Terminal({
  log: $('console-log'), form: $('console-form'), input: $('console-input'),
  onKey: () => audio.key(),
});

const S = {
  phase: 'menu',        // menu | boot | run
  paused: false,
  mode: 'rain',
  userSpeed: 1,
  level: 0,
  bootT: 0,
  bootRamp: -1,
  pulse: 0,
  fps: 60,
  autoQuality: fixedQuality === undefined && !isFallback && !params.has('noauto'),
  qWatch: 0, qFrames: 0,
  lost: false,
  needsResize: false,
  uptime: 0,
};

const director = new Director({
  log: (t, c) => term.print(t, c || 'warn'),
  alert: showAlert,
  audio,
  reducedMotion,
});

// ---- UI helpers --------------------------------------------------------------
function showAlert(text) {
  els.alertText.textContent = text;
  els.alert.classList.remove('show');
  void els.alert.offsetWidth; // restart the CSS animation
  els.alert.classList.add('show');
  term.print('!! SYSTEM ALERT: ' + text, 'warn');
}

function updateHud() {
  els.hudMode.textContent = MODES[S.mode].label;
  els.hudLayer.textContent = `LAYER ${pad(S.level + 1)}`;
  els.paused.hidden = !S.paused;
  const m = audio.muted;
  els.sound.textContent = !audio.supported ? 'SND N/A' : m ? 'SND OFF' : 'SND ON';
  els.sound.setAttribute('aria-pressed', String(!m));
  els.sound.disabled = !audio.supported;
}

function selectMode(key, announce = false) {
  if (!MODES[key]) return false;
  S.mode = key;
  scene.setMode(key);
  director.setMode(key);
  els.modes.querySelectorAll('[role=radio]').forEach((b) => {
    const on = b.dataset.mode === key;
    b.setAttribute('aria-checked', String(on));
    b.tabIndex = on ? 0 : -1;
  });
  updateHud();
  if (announce) term.say(`MODE: ${MODES[key].label}`);
  return true;
}

function setPaused(p) {
  S.paused = p;
  updateHud();
  term.print(p ? 'ANIMATION PAUSED' : 'ANIMATION RESUMED', 'sys');
}

function toggleFullscreen() {
  const d = document, el = d.documentElement;
  const isFs = d.fullscreenElement || d.webkitFullscreenElement;
  try {
    if (isFs) (d.exitFullscreen || d.webkitExitFullscreen).call(d);
    else if (el.requestFullscreen) el.requestFullscreen().catch(() => term.print('FULLSCREEN REQUEST DENIED', 'err'));
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else term.print('FULLSCREEN NOT SUPPORTED BY THIS BROWSER', 'err');
  } catch { term.print('FULLSCREEN NOT AVAILABLE', 'err'); }
}

function setMuted(m) {
  audio.setMuted(m);
  updateHud();
  term.print(m ? 'AUDIO MUTED' : 'AUDIO ENABLED', 'sys');
}

function dive() {
  if (S.phase !== 'run') return;
  S.level++;
  scene.level = S.level;
  scene.kick(70);
  S.pulse = 1;
  audio.alert(0.8);
  updateHud();
  const name = LAYER_NAMES[S.level % LAYER_NAMES.length];
  term.say(`LAYER ${pad(S.level + 1)} ACCESSED: ${name}`);
}

function resetScene() {
  scene.resetCamera();
  S.level = 0;
  S.userSpeed = 1;
  S.pulse = 0;
  scene.level = 0;
  director.reset();
  scene.snapMode(S.mode);
  updateHud();
  term.print('SCENE RESET', 'sys');
}

function goMenu() {
  S.phase = 'menu';
  document.body.className = 'phase-menu';
  els.hud.hidden = true;
  els.console.hidden = true;
  els.guide.hidden = true;
  director.enabled = false;
  term.enabled = false;
  els.start.focus({ preventScroll: true });
}

function enterRun() {
  S.phase = 'run';
  document.body.className = 'phase-run';
  els.hud.hidden = false;
  els.console.hidden = false;
  els.guide.hidden = innerWidth <= 760;
  els.keys.setAttribute('aria-expanded', String(!els.guide.hidden));
  els.boot.classList.remove('on');
  els.boot.classList.add('fade');
  term.enabled = true;
  director.reset();
  director.enabled = true;
  updateHud();
}

// ---- boot sequence -----------------------------------------------------------
function startExperience() {
  if (S.phase !== 'menu') return;
  audio.start().then((ok) => { if (ok) audio.startup(); updateHud(); });
  S.phase = 'boot';
  S.bootT = 0;
  S.bootRamp = -1;
  S.level = 0; scene.level = 0; scene.resetCamera();
  document.body.className = 'phase-boot';
  els.boot.classList.remove('fade');
  els.boot.classList.add('on');
  els.bootText.textContent = '';
  scene.boot = 0;
  term.clear();
  term.say('INITIALISING DIGITAL ENVIRONMENT...');
  term.say(`MODE: ${MODES[S.mode].label}`);
  term.say("TYPE 'help' FOR COMMANDS");
  els.start.blur();
}

function skipBoot() {
  if (S.phase !== 'boot') return;
  S.bootT = Math.max(S.bootT, BOOT_LINES.length / BOOT_CPS + 0.2);
}

function updateBoot(dt) {
  S.bootT += dt;
  const typed = Math.min(BOOT_LINES.length, Math.floor(S.bootT * BOOT_CPS));
  if (S.bootRamp < 0) {
    const done = typed >= BOOT_LINES.length;
    els.bootText.textContent = BOOT_LINES.slice(0, typed) + (done ? '' : '█');
    if (typed % 3 === 0 && !done) audio.key();
    if (done && S.bootT > BOOT_LINES.length / BOOT_CPS + 0.6) {
      S.bootRamp = 0;
      enterRunEarly();
    }
  }
}

function enterRunEarly() {
  // overlay fades out while the rain emerges, then events become active
  enterRun();
  director.enabled = false;
}

// ---- console commands --------------------------------------------------------
term.register('help', 'list available commands', () => term.helpLines().forEach((l) => term.print(l, 'out')));
term.register('status', 'show animation and rendering status', () => {
  const q = ['LOW', 'MEDIUM', 'HIGH'][scene.quality ?? 0];
  const r = scene.renderer
    ? `${scene.w}x${scene.h} @${scene.pr.toFixed(2)}x`
    : `${scene.w}x${scene.h}`;
  const speed = (scene.p.speed * S.userSpeed).toFixed(2);
  const lines = [
    ['STATE', S.paused ? 'PAUSED' : 'RUNNING'],
    ['MODE', MODES[S.mode].label],
    ['LAYER', `${pad(S.level + 1)} ${LAYER_NAMES[S.level % LAYER_NAMES.length]}`],
    ['STREAM SPEED', `x${speed}`],
    ['RENDERER', isFallback ? '2D CANVAS FALLBACK' : 'WEBGL2 / THREE.JS'],
    ['QUALITY', q + (S.autoQuality ? ' (ADAPTIVE)' : '')],
    ['RESOLUTION', r],
    ['FPS', String(Math.round(S.fps))],
    ['AUDIO', !audio.supported ? 'UNAVAILABLE' : !audio.active ? 'IDLE' : audio.muted ? 'MUTED' : 'ON'],
    ['UPTIME', `${Math.floor(S.uptime)}s`],
  ];
  lines.forEach(([k, v]) => term.print(`${k.padEnd(13, '.')} ${v}`, 'out'));
});
term.register('glitch', 'trigger a brief visual distortion', () => director.trigger('glitch', { strength: 1 }));
term.register('slow', 'reduce stream speed', () => {
  S.userSpeed = Math.max(0.2, S.userSpeed * 0.7);
  term.print(`STREAM SPEED x${S.userSpeed.toFixed(2)}`, 'out');
});
term.register('fast', 'increase stream speed', () => {
  S.userSpeed = Math.min(3.5, S.userSpeed * 1.4);
  term.print(`STREAM SPEED x${S.userSpeed.toFixed(2)}`, 'out');
});
term.register('clear', 'clear console messages', () => term.clear());
term.register('mode', 'mode <rain|deep|glitch>', (a) => {
  if (!selectMode(a[0], true)) term.print('usage: mode <rain|deep|glitch>', 'err');
});
term.register('converge', 'pull streams toward a focal point', () => director.trigger('converge'));
term.register('alert', 'raise a system alert', () => director.trigger('alert'));
term.register('dive', 'enter a deeper layer', () => dive());
term.register('pause', 'pause / resume animation', () => setPaused(!S.paused));
term.register('mute', 'toggle sound', () => setMuted(!audio.muted));
term.register('reset', 'reset camera, speed and layer', () => resetScene());

// ---- input -------------------------------------------------------------------
let drag = null;
let lastTap = 0;

on(els.canvas, 'pointerdown', (e) => {
  if (e.button !== 0 && e.pointerType === 'mouse') return;
  drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0 };
  try { els.canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
  document.activeElement?.blur?.();
});
on(window, 'pointermove', (e) => {
  scene.setPointer((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1);
  if (drag && e.pointerId === drag.id) {
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.x = e.clientX; drag.y = e.clientY;
    drag.moved += Math.abs(dx) + Math.abs(dy);
    if (drag.moved > 4) document.body.classList.add('dragging');
    scene.drag(dx, dy);
  }
});
const endDrag = (e) => {
  if (!drag || e.pointerId !== drag.id) return;
  const wasTap = drag.moved < 6;
  drag = null;
  document.body.classList.remove('dragging');
  // double-tap for touch (mouse uses dblclick)
  if (wasTap && e.pointerType !== 'mouse' && e.type === 'pointerup') {
    const now = performance.now();
    if (now - lastTap < 320) { dive(); lastTap = 0; } else lastTap = now;
  }
};
on(window, 'pointerup', endDrag);
on(window, 'pointercancel', endDrag);
on(els.canvas, 'dblclick', (e) => { e.preventDefault(); dive(); });
on(els.canvas, 'wheel', (e) => {
  e.preventDefault();
  const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
  scene.kick(-e.deltaY * unit * 0.05);
}, { passive: false });
on(els.canvas, 'contextmenu', (e) => e.preventDefault());

on(window, 'keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const t = e.target;
  const typing = t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement;
  if (S.phase === 'boot') { skipBoot(); return; }
  if (typing) { if (e.key === 'Escape') t.blur(); return; }
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  if (key === 'f') { e.preventDefault(); toggleFullscreen(); return; }
  if (S.phase !== 'run') return;
  const onButton = t instanceof HTMLButtonElement;
  if (e.repeat) return;
  switch (key) {
    case ' ': if (onButton) return; e.preventDefault(); setPaused(!S.paused); break;
    case 'r': resetScene(); break;
    case 'm': setMuted(!audio.muted); break;
    case 'h': toggleGuide(); break;
    case '1': case '2': case '3': selectMode(MODE_KEYS[Number(key) - 1], true); break;
    case '/': e.preventDefault(); $('console-input').focus(); break;
    case 'Enter': if (onButton) return; e.preventDefault(); $('console-input').focus(); break;
    default:
  }
});

// menu
els.modes.addEventListener('click', (e) => {
  const b = e.target.closest('[role=radio]');
  if (b) selectMode(b.dataset.mode);
});
els.modes.addEventListener('keydown', (e) => {
  const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
  if (!dir) return;
  e.preventDefault();
  const i = (MODE_KEYS.indexOf(S.mode) + dir + MODE_KEYS.length) % MODE_KEYS.length;
  selectMode(MODE_KEYS[i]);
  els.modes.querySelector(`[data-mode=${MODE_KEYS[i]}]`).focus();
});
on(els.start, 'click', startExperience);
on(els.boot, 'pointerdown', skipBoot);

function toggleGuide(force) {
  els.guide.hidden = force !== undefined ? !force : !els.guide.hidden;
  els.keys.setAttribute('aria-expanded', String(!els.guide.hidden));
}
const blurAfterClick = (fn) => (e) => { fn(e); if (e.detail > 0) e.currentTarget.blur(); };
on(els.sound, 'click', blurAfterClick(() => setMuted(!audio.muted)));
on(els.full, 'click', blurAfterClick(toggleFullscreen));
on(els.keys, 'click', blurAfterClick(() => toggleGuide()));
on(els.guideClose, 'click', blurAfterClick(() => toggleGuide(false)));
on(els.menuBtn, 'click', blurAfterClick(goMenu));
on(els.consoleToggle, 'click', () => {
  const c = els.console.classList.toggle('collapsed');
  els.consoleToggle.setAttribute('aria-expanded', String(!c));
  els.consoleToggle.setAttribute('aria-label', c ? 'Expand console' : 'Collapse console');
});
if (!(document.fullscreenEnabled || document.webkitFullscreenEnabled)) els.full.hidden = true;

on(window, 'resize', () => { S.needsResize = true; });
on(window, 'orientationchange', () => { S.needsResize = true; });
on(document, 'fullscreenchange', () => { S.needsResize = true; });
if (!isFallback) {
  on(els.canvas, 'webglcontextlost', (e) => { e.preventDefault(); S.lost = true; term.print('GRAPHICS CONTEXT LOST. RECOVERING...', 'err'); });
  on(els.canvas, 'webglcontextrestored', () => { S.lost = false; S.needsResize = true; term.print('GRAPHICS CONTEXT RESTORED', 'sys'); });
}

// ---- main loop ---------------------------------------------------------------
let raf = 0;
let last = performance.now();
const smooth01 = (x) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };

function frame(now) {
  raf = requestAnimationFrame(frame);
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  S.fps += (1 / Math.max(dt, 1e-3) - S.fps) * 0.05;

  if (S.needsResize) { S.needsResize = false; scene.resize(); }

  if (S.phase === 'boot') updateBoot(dt);

  // rain emergence
  if (S.phase === 'menu') scene.boot += (0.3 - scene.boot) * (1 - Math.exp(-dt * 2));
  else if (S.bootRamp >= 0) {
    S.bootRamp += dt;
    scene.boot = smooth01(S.bootRamp / BOOT_RAMP);
    if (S.bootRamp >= BOOT_RAMP) {
      S.bootRamp = -1;
      scene.boot = 1;
      director.enabled = true;
      director.reset();
      term.say('SYSTEM STATUS: OPERATIONAL');
    }
  }

  const running = S.phase !== 'boot' || S.bootRamp >= 0;
  const simDt = S.paused ? 0 : dt * scene.p.speed * S.userSpeed;
  if (!S.paused && S.phase === 'run') { director.update(dt); S.uptime += dt; }
  S.pulse *= Math.exp(-dt * 1.4);
  scene.brightMul = 1 + 0.25 * S.pulse;
  term.tick(dt);

  if (!S.lost) {
    scene.update(dt, simDt);
    scene.render();
  }
  if (!running && S.phase === 'boot') scene.boot = 0;

  // adaptive quality: step down if the device can't hold ~40fps
  if (S.autoQuality && S.phase === 'run' && !S.paused && document.visibilityState === 'visible') {
    S.qWatch += dt; S.qFrames++;
    if (S.qWatch > 3) {
      const fps = S.qFrames / S.qWatch;
      S.qWatch = 0; S.qFrames = 0;
      if (fps < 38 && scene.quality > 0) {
        scene.setQuality(scene.quality - 1);
        term.say(`ADAPTIVE QUALITY: ${['LOW', 'MEDIUM', 'HIGH'][scene.quality]} (${Math.round(fps)} FPS)`);
      }
    }
  } else { S.qWatch = 0; S.qFrames = 0; }
}

// ---- teardown ----------------------------------------------------------------
let disposed = false;
function dispose() {
  if (disposed) return;
  disposed = true;
  cancelAnimationFrame(raf);
  offs.forEach((f) => f());
  offs.length = 0;
  term.dispose();
  audio.dispose();
  scene.dispose();
}
window.addEventListener('pagehide', (e) => { if (!e.persisted) dispose(); });
if (import.meta.hot) import.meta.hot.dispose(dispose);

// ---- go ----------------------------------------------------------------------
selectMode('rain');
scene.snapMode('rain');
scene.boot = 0;
if (isFallback) els.note.textContent = 'WebGL2 is unavailable. Running in 2D compatibility mode. Sound begins after you press start.';
if (!audio.supported) els.note.textContent = 'Audio is unavailable in this browser. The experience will be silent.';
if (params.has('debug')) window.matrix = { scene, S, director, term, audio, fx, dive, selectMode };
els.start.focus({ preventScroll: true });
raf = requestAnimationFrame(frame);
