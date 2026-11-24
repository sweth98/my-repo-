// Tiny external store for transport state (time, play, speed, quality…)
import { DURATION, FPS } from './masterTimeline';

const listeners = new Set();
export const clock = {
  time: 0,
  playing: false,
  speed: 1,
  quality: 'high',
  autoQuality: true,
  aspect: '16:9',
  cameraMode: 'cinematic',
  cinematic: false,
  solo: false,          // loop a single scene
  soloRange: null,
  version: 0,
};
function emit() { clock.version++; listeners.forEach((l) => l()); }
export const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
export const getSnapshot = () => clock.version;

export function setTime(t, { snap = false } = {}) {
  let v = Math.max(0, Math.min(DURATION - 1e-4, t));
  if (snap) v = Math.round(v * FPS) / FPS;
  clock.time = v;
  emit();
}
export function set(patch) { Object.assign(clock, patch); emit(); }
export const frameOf = (t) => Math.min(FPS * DURATION - 1, Math.floor(t * FPS + 1e-6));

let raf = 0, last = 0;
function tick(now) {
  if (!clock.playing) return;
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  let t = clock.time + dt * clock.speed;
  if (clock.solo && clock.soloRange && t >= clock.soloRange[1]) t = clock.soloRange[0] + (t - clock.soloRange[1]);
  if (t >= DURATION - 1e-3) { clock.time = DURATION - 1e-3; clock.playing = false; emit(); return; }
  clock.time = t; emit();
  raf = requestAnimationFrame(tick);
}
export function play() {
  if (clock.time >= DURATION - 0.05) clock.time = 0;
  clock.playing = true; last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); emit();
}
export function pause() { clock.playing = false; cancelAnimationFrame(raf); emit(); }
export function toggle() { clock.playing ? pause() : play(); }
export function restart() { setTime(0); play(); }
