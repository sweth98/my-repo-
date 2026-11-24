// Reusable GSAP animation vocabulary + element registry (the editable "timeline spec").
// Every helper records start/end/entrance/hold/exit/ease/layer so the film is data, not magic.
import gsap from 'gsap';
export const REG = new Map();      // id -> spec row
export const SFX = [];             // [{t,type,vol,dur}] consumed by audio.js
export const reset = () => { REG.clear(); SFX.length = 0; };
let CUR = 's?';
export const setScene = (s) => { CUR = s; };

export function createCtx(root, fmt) {
  const V = fmt === 'v', W = V ? 1080 : 1920, H = V ? 1920 : 1080;
  const q = (k) => { const e = root.querySelector(`[data-k="${k}"]`); if (!e) console.warn('missing element', k); return e; };
  const qa = (s) => Array.from(root.querySelectorAll(s));
  return { root, fmt, V, W, H, q, qa };
}
const res = (c, t) => (typeof t === 'string' ? (t.startsWith('.') || t.includes(' ') || t.includes('[') ? c.qa(t) : [c.q(t)]) : Array.isArray(t) ? t : [t]).filter(Boolean);
const key = (t) => (typeof t === 'string' ? t : t?.dataset?.k || 'node');
const log = (id, patch) => { const r = REG.get(id) || { id, scene: CUR, layer: 0 }; Object.assign(r, patch); REG.set(id, r); };
export const sfx = (t, type, vol = 1, dur) => SFX.push({ t, type, vol, dur });

const IN = {
  slideL: (c, d) => ({ f: { x: -(d ?? c.W * 1.15) }, t: { x: 0 }, blur: 1, sfx: 'swish' }),
  slideR: (c, d) => ({ f: { x: d ?? c.W * 1.15 }, t: { x: 0 }, blur: 1, sfx: 'swish' }),
  slideU: (c, d) => ({ f: { y: -(d ?? c.H * 1.15) }, t: { y: 0 }, blur: 1, sfx: 'swish' }),
  slideD: (c, d) => ({ f: { y: d ?? c.H * 1.15 }, t: { y: 0 }, blur: 1, sfx: 'swish' }),
  diag: (c, d) => ({ f: { x: d ?? c.W * 0.7, y: c.H * 0.5, rotation: 5 }, t: { x: 0, y: 0, rotation: 0 }, blur: 1, sfx: 'swish' }),
  diagL: (c, d) => ({ f: { x: -(d ?? c.W * 0.7), y: c.H * 0.5, rotation: -5 }, t: { x: 0, y: 0, rotation: 0 }, blur: 1, sfx: 'swish' }),
  scale: () => ({ f: { scale: 0.45, opacity: 0 }, t: { scale: 1, opacity: 1 }, sfx: 'pop' }),
  pop: () => ({ f: { scale: 0, opacity: 0 }, t: { scale: 1, opacity: 1 }, sfx: 'pop' }),
  zoom: () => ({ f: { scale: 2.4, opacity: 0 }, t: { scale: 1, opacity: 1 }, blur: 1, sfx: 'swish' }),
  maskL: () => ({ f: { clipPath: 'inset(-20% 120% -20% -20%)' }, t: { clipPath: 'inset(-20% -20% -20% -20%)' }, sfx: 'paper' }),
  maskR: () => ({ f: { clipPath: 'inset(-20% -20% -20% 120%)' }, t: { clipPath: 'inset(-20% -20% -20% -20%)' }, sfx: 'paper' }),
  maskU: () => ({ f: { clipPath: 'inset(120% -20% -20% -20%)' }, t: { clipPath: 'inset(-20% -20% -20% -20%)' }, sfx: 'paper' }),
  maskD: () => ({ f: { clipPath: 'inset(-20% -20% 120% -20%)' }, t: { clipPath: 'inset(-20% -20% -20% -20%)' }, sfx: 'paper' }),
  circle: () => ({ f: { clipPath: 'circle(0% at 50% 50%)' }, t: { clipPath: 'circle(80% at 50% 50%)' }, sfx: 'pop' }),
  none: () => ({ f: {}, t: {}, sfx: null }),
};
export function enter(tl, c, id, o = {}) {
  const { at = 0, type = 'slideR', dur = 0.8, ease = 'expo.out', dist, delay = 0, stagger, from = {}, to = {}, blur = 14, vol = 1, sfx: sx, layer } = o;
  const els = res(c, id); if (!els.length) return;
  const m = IN[type](c, dist), t0 = at + delay;
  const f = { ...m.f, ...from }, tt = { ...m.t, ...to, duration: dur, ease };
  if (m.blur && blur) { f.filter = `blur(${blur}px)`; tt.filter = 'blur(0px)'; }
  if (dist !== undefined && Math.abs(dist) < c.W * 0.5 && /^slide/.test(type)) { f.opacity = 0; tt.opacity = 1; }
  if (stagger) tt.stagger = stagger;
  tl.fromTo(els, f, tt, t0);
  const s = sx === undefined ? m.sfx : sx; if (s) sfx(t0, s, vol);
  log(key(id), { start: t0, entrance: type, dur, ease, layer: layer ?? REG.get(key(id))?.layer ?? 0, end: REG.get(key(id))?.end });
}
const OUT = {
  swishL: (c) => ({ to: { x: `-=${c.W * 1.15}` }, blur: 1 }), swishR: (c) => ({ to: { x: `+=${c.W * 1.15}` }, blur: 1 }),
  swishU: (c) => ({ to: { y: `-=${c.H * 1.15}` }, blur: 1 }), swishD: (c) => ({ to: { y: `+=${c.H * 1.15}` }, blur: 1 }),
  diag: (c) => ({ to: { x: `+=${c.W * 0.8}`, y: `-=${c.H * 0.6}`, rotation: '+=6' }, blur: 1 }),
  shrink: () => ({ to: { scale: 0, opacity: 0 } }),
  spin: () => ({ to: { scale: 0, rotation: '+=140', opacity: 0 } }),
  wipeL: () => ({ f: { clipPath: 'inset(-20% -20% -20% -20%)' }, to: { clipPath: 'inset(-20% 120% -20% -20%)' } }),
  wipeR: () => ({ f: { clipPath: 'inset(-20% -20% -20% -20%)' }, to: { clipPath: 'inset(-20% -20% -20% 120%)' } }),
  wipeU: () => ({ f: { clipPath: 'inset(-20% -20% -20% -20%)' }, to: { clipPath: 'inset(-20% -20% 120% -20%)' } }),
  wipeD: () => ({ f: { clipPath: 'inset(-20% -20% -20% -20%)' }, to: { clipPath: 'inset(120% -20% -20% -20%)' } }),
};
export function exit(tl, c, id, o = {}) {
  const { at = 0, type = 'swishL', dur = 0.55, ease = 'power3.in', stagger, to = {}, blur = 12, vol = 0.8, sfx: sx } = o;
  const els = res(c, id); if (!els.length) return;
  const m = OUT[type](c), tt = { ...m.to, ...to, duration: dur, ease };
  if (m.blur && blur) tt.filter = `blur(${blur}px)`;
  if (stagger) tt.stagger = stagger;
  if (m.f) tl.fromTo(els, m.f, { ...tt, immediateRender: false }, at); else tl.to(els, tt, at);
  const s = sx === undefined ? (type.startsWith('wipe') ? 'paper' : type === 'shrink' || type === 'spin' ? 'pop' : 'swish') : sx; if (s) sfx(at, s, vol);
  const r = REG.get(key(id)); log(key(id), { exit: type, exitAt: at, end: at + dur, hold: r ? +(at - (r.start + r.dur)).toFixed(2) : 0 });
}
export const move = (tl, c, id, to, o = {}) => { const { at = 0, dur = 0.8, ease = 'power3.inOut', from } = o; const els = res(c, id); if (!els.length) return; const v = { ...to, duration: dur, ease }; from ? tl.fromTo(els, from, { ...v, immediateRender: false }, at) : tl.to(els, v, at); };
export const drift = (tl, c, id, o = {}) => { const { at = 0, dur = 3, dx = 0, dy = 0, scale, rotation, ease = 'none' } = o; const els = res(c, id); if (!els.length) return; const v = { x: `+=${dx}`, y: `+=${dy}`, duration: dur, ease }; if (scale) v.scale = scale; if (rotation) v.rotation = `+=${rotation}`; tl.to(els, v, at); };
// parallax: several layers drifting at different depths over the same window
export const parallax = (tl, c, layers, o = {}) => { const { at = 0, dur = 3, dx = -60, dy = 0 } = o; layers.forEach(([id, depth]) => drift(tl, c, id, { at, dur, dx: dx * depth, dy: dy * depth })); };
export const bar = (tl, c, id, o = {}) => { const { at = 0, dur = 0.55, ease = 'power3.out' } = o; tl.fromTo(res(c, id), { scaleX: 0 }, { scaleX: 1, duration: dur, ease }, at); sfx(at, 'paper', 0.5); };
export function draw(tl, c, id, o = {}) {
  const { at = 0, dur = 0.9, ease = 'power2.inOut', stagger = 0, sfx: sx = 'pen' } = o;
  const els = res(c, id).flatMap((e) => (e.matches?.('path,line,polyline,circle,ellipse,rect') ? [e] : Array.from(e.querySelectorAll('path,line,polyline,circle,ellipse'))));
  els.forEach((e, i) => { const L = e.getTotalLength?.() || 600; gsap.set(e, { strokeDasharray: L, strokeDashoffset: L }); tl.to(e, { strokeDashoffset: 0, duration: dur, ease }, at + i * stagger); });
  if (sx) sfx(at, sx, 0.5);
}
export function arrow(tl, c, id, o = {}) { const { at = 0, dur = 0.8 } = o; draw(tl, c, `[data-k="${id}"] .shaft`, { at, dur }); enter(tl, c, `[data-k="${id}"] .head`, { at: at + dur * 0.85, type: 'pop', dur: 0.25, sfx: null, from: { transformOrigin: 'center' } }); log(id, { start: at, entrance: 'draw', dur, ease: 'power2.inOut' }); }
// text: masked word rise / directional words / character stagger
export function words(tl, c, id, o = {}) {
  const { at = 0, mode = 'rise', stagger = 0.1, dur = 0.75, ease = 'expo.out', sel } = o;
  const base = `[data-k="${id}"] ` + (sel || (mode === 'chars' ? '.ch' : '.wi')); const els = c.qa(base); if (!els.length) return;
  if (mode === 'rise') tl.fromTo(els, { yPercent: 118 }, { yPercent: 0, duration: dur, ease, stagger }, at);
  if (mode === 'chars') tl.fromTo(els, { yPercent: 120, rotation: 8 }, { yPercent: 0, rotation: 0, duration: dur, ease, stagger }, at);
  if (mode === 'dir') els.forEach((e, i) => { const d = [[-1, 0], [0, 1], [1, 0], [0, -1]][i % 4]; tl.fromTo(e, { x: d[0] * c.W * 0.5, y: d[1] * c.H * 0.4, filter: 'blur(10px)' }, { x: 0, y: 0, filter: 'blur(0px)', duration: dur, ease }, at + i * stagger); });
  sfx(at, 'tick', 0.6); log(id, { start: at, entrance: 'words-' + mode, dur: dur + stagger * els.length, ease });
}
export function wordsOut(tl, c, id, o = {}) { const { at = 0, dir = 'up', stagger = 0.05, dur = 0.5 } = o; const els = c.qa(`[data-k="${id}"] .wi`); const v = dir === 'up' ? { yPercent: -125 } : dir === 'down' ? { yPercent: 125 } : { x: dir === 'left' ? -c.W : c.W, filter: 'blur(10px)' }; tl.to(els, { ...v, duration: dur, ease: 'power3.in', stagger }, at); log(id, { exit: 'words-' + dir, exitAt: at, end: at + dur }); }
export const showScene = (tl, c, k, from, to) => { const e = c.q(k); gsap.set(e, { autoAlpha: 0 }); tl.set(e, { autoAlpha: 1 }, from); tl.set(e, { autoAlpha: 0 }, to); log(k, { scene: k, start: from, end: to, entrance: 'scene', exit: 'scene', layer: -1 }); };

// ---- scene transitions (Wipe layer lives above every scene) ----
export function wipeTransition(tl, c, at, o = {}) { // directional skewed panels sweep; swap happens at `at`
  const { color = '#B77A45', accent = '#F2EBDD', dir = 'R', dur = 0.9 } = o; const p = c.q('wipe-a'), p2 = c.q('wipe-b'); const dx = dir === 'R' ? 1 : -1, W = c.W * 1.6;
  [[p2, color, accent, 0.06], [p, color, color, 0]].forEach(([el, , , lag], i) => {
    tl.set(el, { visibility: 'visible', backgroundColor: i === 0 ? accent : color }, at - dur / 2 + lag - 0.001);
    tl.fromTo(el, { x: -dx * W, skewX: -dx * 14 }, { x: dx * W, skewX: -dx * 14, duration: dur, ease: 'power2.inOut' }, at - dur / 2 + lag);
    tl.set(el, { visibility: 'hidden' }, at + dur / 2 + lag + 0.01);
  });
  sfx(at - dur / 2, 'swishBig', 1);
}
export function discTransition(tl, c, at, o = {}) { // shape transformation: a coloured disc grows from an object, then wipes away
  const { color = '#526A43', cx = c.W / 2, cy = c.H / 2, grow = 0.55, out = 0.55 } = o; const el = c.q('wipe-c'); const R = Math.hypot(c.W, c.H);
  tl.set(el, { visibility: 'visible', backgroundColor: color, clipPath: `circle(0px at ${cx}px ${cy}px)` }, at - grow);
  tl.fromTo(el, { clipPath: `circle(0px at ${cx}px ${cy}px)` }, { clipPath: `circle(${R}px at ${cx}px ${cy}px)`, duration: grow, ease: 'power3.in' }, at - grow);
  tl.fromTo(el, { clipPath: `circle(${R}px at ${cx}px ${cy}px)` }, { clipPath: `circle(0px at ${c.W - 0}px ${c.H * 0.5}px)`, duration: out, ease: 'power3.inOut' }, at);
  tl.set(el, { visibility: 'hidden' }, at + out + 0.01); sfx(at - grow, 'swishBig', 0.9);
}
export function liquidTransition(tl, c, at, o = {}) { // caramel liquid rises through the frame
  const { dur = 1.1 } = o; const el = c.q('wipe-d');
  tl.set(el, { visibility: 'visible' }, at - dur / 2 - 0.01);
  tl.fromTo(el, { y: c.H + 140 }, { y: -(c.H + 410), duration: dur, ease: 'power2.inOut' }, at - dur / 2);
  tl.fromTo(c.q('wipe-d-wave'), { xPercent: 0 }, { xPercent: -50, duration: dur, ease: 'none' }, at - dur / 2);
  tl.set(el, { visibility: 'hidden' }, at + dur / 2 + 0.01); sfx(at - dur / 2, 'pour', 1, dur);
}
export function colourCover(tl, c, at, color, o = {}) { // flat colour panel from top (used after the grounds cascade)
  const { dur = 0.8 } = o; const el = c.q('wipe-e');
  tl.set(el, { visibility: 'visible', backgroundColor: color }, at - dur);
  tl.fromTo(el, { yPercent: -101 }, { yPercent: 0, duration: dur, ease: 'power3.in' }, at - dur);
  tl.to(el, { yPercent: 101, duration: 0.6, ease: 'power3.inOut' }, at + 0.0); tl.set(el, { visibility: 'hidden' }, at + 0.62);
}
