import React from 'react';
import { Box, Photo, Words, Chip, Arrow, Bean, Tag, SceneShell, useV, C } from '../art.jsx';
import { enter, exit, move, drift, words, wordsOut, draw, arrow, showScene, wipeTransition, sfx, setScene } from '../engine.js';
import gsap from 'gsap';
export const meta = { id: 's4', name: '04 The Transformation', start: 19, end: 29 };
const rnd = (() => { let s = 7; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); })();
const BEANS = Array.from({ length: 26 }, () => { const a = rnd() * 6.283, r = 40 + Math.sqrt(rnd()) * 150; return { x: 350 + Math.cos(a) * r, y: 350 + Math.sin(a) * r * 0.95, rot: rnd() * 180, s: 0.7 + rnd() * 0.5 }; });
function Drum({ k, h, v, z }) { return <Box k={k} h={h} v={v} z={z}><svg viewBox="0 0 700 700"><defs><radialGradient id="heat"><stop offset="0" stopColor="#F28B2E" stopOpacity=".55" /><stop offset=".7" stopColor="#BD493D" stopOpacity=".18" /><stop offset="1" stopColor="#BD493D" stopOpacity="0" /></radialGradient></defs>
  <circle data-k="s4-glow" cx="350" cy="380" r="340" fill="url(#heat)" />
  <circle cx="350" cy="350" r="322" fill="none" stroke="rgba(242,235,221,.25)" strokeWidth="8" /><circle data-k="s4-ring" cx="350" cy="350" r="322" fill="none" stroke="#F2B35E" strokeWidth="12" strokeLinecap="round" transform="rotate(-90 350 350)" />
  <circle cx="350" cy="350" r="240" fill="#24140F" stroke="#B77A45" strokeWidth="9" /><circle cx="350" cy="350" r="222" fill="none" stroke="rgba(242,235,221,.16)" strokeWidth="3" />
  <g data-k="s4-spin"><g data-k="s4-beans" style={{ '--bc': '#8FA56A' }}>{BEANS.map((b, i) => <g key={i} transform={`translate(${b.x} ${b.y}) rotate(${b.rot}) scale(${b.s})`}><ellipse rx="34" ry="21" style={{ fill: 'var(--bc)' }} stroke="rgba(0,0,0,.35)" strokeWidth="2" /><path d="M-30 0 C-10 -8 10 8 30 0" stroke="rgba(0,0,0,.5)" strokeWidth="4" fill="none" strokeLinecap="round" /><ellipse cx="-10" cy="-8" rx="14" ry="4" fill="#fff" opacity=".25" /></g>)}</g>
    {[0, 120, 240].map((a) => <line key={a} x1="350" y1="350" x2="350" y2="150" stroke="rgba(242,235,221,.3)" strokeWidth="8" strokeLinecap="round" transform={`rotate(${a} 350 350)`} />)}</g>
  <circle cx="350" cy="350" r="26" fill="#B77A45" stroke="#24140F" strokeWidth="6" />
  <g data-k="s4-flame" transform="translate(350 610)">{[-80, -30, 30, 80].map((x, i) => <g key={i} className="fl" transform={`translate(${x} 0)`}><path d={`M0 0 C-26 -20 -18 -50 0 -${70 - (i % 2) * 18} C18 -50 26 -20 0 0Z`} fill="#F28B2E" /><path d="M0 0 C-12 -10 -8 -26 0 -34 C8 -26 12 -10 0 0Z" fill="#FFD27A" /></g>)}</g></svg></Box>; }
export function Scene() { const V = useV(); const dr = V ? [190, 610, 700, 700] : [610, 270, 700, 700]; return <SceneShell k="s4" bg={C.cream}>
  <Box k="s4-pl" h={[0, 0, 960, 1080]} v={[0, 0, 1080, 960]} z={1} style={{ background: C.green }} /><Box k="s4-pr" h={[960, 0, 960, 1080]} v={[0, 960, 1080, 960]} z={1} style={{ background: C.brown }} />
  <Photo k="s4-pg" h={[90, 360, 280, 498]} v={[70, 450, 300, 533]} src="greendrum" radius={22} pos="50% 50%" z={3} />
  <Photo k="s4-pb" h={[1550, 360, 280, 498]} v={[710, 1090, 300, 533]} src="roastbed" radius={22} z={3} />
  <Tag k="s4-cg" h={[90, 880, 400, 26]} v={[70, 1000, 400, 26]} color={C.cream} z={4}>Before · green</Tag><Tag k="s4-cb" h={[1550, 880, 400, 26]} v={[710, 1640, 400, 26]} color={C.cream} z={4}>After · roasted</Tag>
  <Arrow k="s4-arrow" d={V ? 'M200 700 L840 1260' : 'M400 640 L1500 640'} head={V ? [840, 1260, 41] : [1500, 640, 0]} color={C.caramel} w={16} hs={1.6} z={2} />
  <Drum k="s4-drum" h={dr} v={dr} z={4} />
  <Words k="s4-h" h={[0, 56, 1920, 230]} v={[0, 90, 1080, 300]} lines={['HEAT CHANGES', '*EVERYTHING.']} size={{ h: 104, v: 104 }} color={C.white} emc="#F2B35E" align="center" free z={6} />
  {[['g1', 30, 150, -20], ['g2', 450, 860, 30], ['g3', 520, 300, 60], ['g4', 40, 960, 10]].map(([n, x, y, r]) => <Bean key={n} k={'s4-' + n} h={[x, y, 140, 91]} v={[x * 0.5, y * 1.6 + 80, 120, 78]} rot={r} z={5} />)}
  {[['r1', 1700, 130, 25], ['r2', 1380, 860, -30], ['r3', 1370, 300, 80], ['r4', 1730, 960, -10]].map(([n, x, y, r]) => <Bean key={n} k={'s4-' + n} h={[x, y, 140, 91]} v={[540 + x * 0.3, y * 1.4 + 520, 120, 78]} rot={r} c1="#8a5636" c2="#2e160c" z={5} />)}
  <Chip k="s4-c1" h={[520, 990, 240, 54]} v={[60, 1830, 220, 54]} n={1} label="Heat" pill pillbg={C.cream} pillfg={C.brown} c1={C.cherry} c2={C.white} z={6} />
  <Chip k="s4-c2" h={[790, 990, 330, 54]} v={[310, 1830, 330, 54]} n={2} label="Tumbling" pill pillbg={C.cream} pillfg={C.brown} c1={C.cherry} c2={C.white} z={6} />
  <Chip k="s4-c3" h={[1150, 990, 400, 54]} v={[660, 1830, 400, 54]} n={3} label="Colour + aroma" pill pillbg={C.cream} pillfg={C.brown} c1={C.cherry} c2={C.white} z={6} />
  <Photo k="s4-full" h={[0, 0, 1920, 1080]} v={[0, 0, 1080, 1920]} src="roastbed" pos={{ h: '50% 62%', v: '50% 50%' }} z={20} cls="" />
</SceneShell>; }
export function build(tl, c) { const { W, H, V } = c; setScene('s4'); showScene(tl, c, 's4', 19, 29); const s = 19;
  gsap.set(c.q('s4-full'), { autoAlpha: 0 }); gsap.set(c.q('s4-ring'), { strokeDasharray: 2020, strokeDashoffset: 2020 });
  enter(tl, c, 's4-pl', { at: s + 0.0, type: V ? 'slideU' : 'slideL', dur: 0.7, blur: 0, sfx: 'swishBig' }); enter(tl, c, 's4-pr', { at: s + 0.0, type: V ? 'slideD' : 'slideR', dur: 0.7, blur: 0, sfx: null });
  words(tl, c, 's4-h', { at: s + 0.4, mode: 'dir', stagger: 0.15, dur: 0.8 });
  enter(tl, c, 's4-pg', { at: s + 0.9, type: 'slideL', dur: 0.8 }); enter(tl, c, 's4-pb', { at: s + 1.0, type: 'slideR', dur: 0.8 }); enter(tl, c, 's4-cg', { at: s + 1.3, type: 'maskL', dur: 0.4 }); enter(tl, c, 's4-cb', { at: s + 1.4, type: 'maskL', dur: 0.4 });
  enter(tl, c, 's4-drum', { at: s + 1.1, type: 'pop', dur: 0.7, ease: 'back.out(1.5)' });
  ['g1', 'g2', 'g3', 'g4'].forEach((n, i) => enter(tl, c, 's4-' + n, { at: s + 1.3 + i * 0.12, type: 'diagL', dur: 0.7, sfx: i ? null : 'bean' }));
  ['r1', 'r2', 'r3', 'r4'].forEach((n, i) => enter(tl, c, 's4-' + n, { at: s + 1.6 + i * 0.12, type: 'diag', dur: 0.7, sfx: i ? null : 'bean' }));
  arrow(tl, c, 's4-arrow', { at: s + 1.7, dur: 1.0 });
  tl.to(c.q('s4-spin'), { rotation: 1080, svgOrigin: '350 350', duration: 5.2, ease: 'none' }, s + 1.9); sfx(s + 2.0, 'grind', 0.35, 4);
  tl.to(c.q('s4-ring'), { strokeDashoffset: 2020 * 0.22, duration: 3.6, ease: 'power1.inOut' }, s + 2.2);
  tl.to(c.q('s4-beans'), { '--bc': '#4B2A17', duration: 3.4, ease: 'power1.inOut' }, s + 2.4);
  tl.fromTo(c.qa('.fl'), { scaleY: 0.7, transformOrigin: '50% 100%' }, { scaleY: 1.25, duration: 0.28, yoyo: true, repeat: 15, ease: 'sine.inOut', stagger: 0.07 }, s + 1.4);
  tl.fromTo(c.q('s4-glow'), { scale: 0.92, svgOrigin: '350 380' }, { scale: 1.06, duration: 1.1, yoyo: true, repeat: 4, ease: 'sine.inOut' }, s + 1.6);
  ['s4-c1', 's4-c2', 's4-c3'].forEach((k, i) => enter(tl, c, k, { at: s + 3.0 + i * 0.25, type: 'slideU', dist: 110, dur: 0.55 }));
  drift(tl, c, 's4-pg', { at: s + 1.9, dur: 4.6, dx: V ? 0 : 24, dy: V ? 14 : 0 }); drift(tl, c, 's4-pb', { at: s + 2.0, dur: 4.5, dx: V ? 0 : -24, dy: V ? -14 : 0 });
  const e = s + 6.8, cx = V ? 860 : 1690, cy = V ? 1356 : 640;
  wordsOut(tl, c, 's4-h', { at: e - 0.2, dir: 'up' }); exit(tl, c, 's4-arrow', { at: e - 0.2, type: 'wipeR', dur: 0.4 }); ['s4-c1', 's4-c2', 's4-c3'].forEach((k, i) => exit(tl, c, k, { at: e - 0.2 + i * 0.05, type: 'swishD', dur: 0.4 }));
  ['g1', 'g2', 'g3', 'g4'].forEach((n) => exit(tl, c, 's4-' + n, { at: e - 0.2, type: 'swishL', dur: 0.45 })); ['r1', 'r2', 'r3', 'r4'].forEach((n) => exit(tl, c, 's4-' + n, { at: e - 0.2, type: 'swishR', dur: 0.45 }));
  exit(tl, c, 's4-pg', { at: e - 0.1, type: 'swishL', dur: 0.45 }); exit(tl, c, 's4-cg', { at: e - 0.2, type: 'wipeL', dur: 0.3 }); exit(tl, c, 's4-cb', { at: e - 0.2, type: 'wipeR', dur: 0.3 });
  tl.set(c.q('s4-full'), { autoAlpha: 1 }, e); tl.fromTo(c.q('s4-full'), { clipPath: `circle(0px at ${cx}px ${cy}px)` }, { clipPath: `circle(2600px at ${cx}px ${cy}px)`, duration: 0.95, ease: 'power3.in' }, e); sfx(e, 'swishBig', 1); sfx(e + 0.85, 'impact', 1);
  tl.set(c.qa('[data-k^="s4-"]:not([data-k="s4-full"])'), { autoAlpha: 0 }, e + 1.0);
  tl.fromTo(c.q('s4-full'), { scale: 1 }, { scale: 1.12, duration: 1.2, ease: 'none' }, e + 0.95);
  exit(tl, c, 's4-full', { at: e + 2.05, type: 'swishR', dur: 0.5 });
  wipeTransition(tl, c, 29, { color: C.caramel, accent: C.green, dir: 'R' }); }
