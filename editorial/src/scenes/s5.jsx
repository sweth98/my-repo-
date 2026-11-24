import React from 'react';
import { Box, Photo, Words, Chip, Bean, Tag, Line, Grinder, SceneShell, useV, C } from '../art.jsx';
import { enter, exit, move, words, wordsOut, draw, showScene, colourCover, sfx, setScene } from '../engine.js';
import gsap from 'gsap';
export const meta = { id: 's5', name: '05 The Grind', start: 29, end: 37 };
const rnd = (seed) => { let s = seed; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
const BR = ['#3B2118', '#5a3320', '#24140F', '#7a4a2e', '#B77A45', '#2E170E'];
const dots = (() => { const r = rnd(99); return Array.from({ length: 70 }, () => { const a = r() * 6.283, d = Math.sqrt(r()) * 150; return { x: 170 + Math.cos(a) * d, y: 170 + Math.sin(a) * d, r: 3 + r() * 12, c: BR[Math.floor(r() * BR.length)] }; }); })();
const rain = (() => { const r = rnd(5); return Array.from({ length: 560 }, () => ({ x: r(), s: 8 + r() * 46, c: BR[Math.floor(r() * BR.length)], d: r() * 1.4 })); })();
const G = (V) => V ? { box: [100, 420, 600, 960], sc: 1.5 } : { box: [740, 150, 440, 704], sc: 1.1 };
export function Scene() { const V = useV(), g = G(V), cxg = g.box[0] + 200 * g.sc; const cy = V ? [480, 847, 1380] : [194, 463, 879];
  return <SceneShell k="s5" bg={C.cream}>
    <Photo k="s5-photo" h={[60, 380, 520, 660]} v={[60, 1440, 520, 440]} src="grindfall" radius={26} pos={{ h: '50% 40%', v: '50% 45%' }} z={2} />
    <Words k="s5-h" h={[60, 50, 700, 280]} v={[60, 70, 960, 300]} lines={['WHOLE BEANS.', 'THOUSANDS OF', '*PARTICLES.']} size={{ h: 78, v: 90 }} color={C.brown} emc={C.cherry} z={5} />
    <Grinder k="s5-g" h={G(false).box} v={G(true).box} z={4} />
    {[0, 1, 2, 3, 4, 5].map((i) => <Bean key={i} k={'s5-b' + i} h={[860 + (i % 3) * 56, 190 + Math.floor(i / 3) * 26, 90, 58]} v={[300 + (i % 3) * 80, 480 + Math.floor(i / 3) * 34, 110, 72]} c1="#8a5636" c2="#2e160c" rot={i * 40} z={6} />)}
    <Box k="s5-circ" h={[1500, 150, 340, 340]} v={[620, 1440, 400, 400]} z={4} cls="sh" style={{ borderRadius: '50%', background: C.white, overflow: 'hidden' }}><svg viewBox="0 0 340 340" style={{ width: '100%', height: '100%' }}>{dots.map((d, i) => <circle key={i} data-k="s5-dot" cx={d.x} cy={d.y} r={d.r} fill={d.c} />)}</svg></Box>
    <Tag k="s5-ct" h={[1500, 510, 340, 26]} v={[620, 1850, 400, 26]} color={C.brown} z={5}>Grounds up close</Tag>
    <Line k="s5-dl" d={V ? 'M400 915 C 700 1000, 800 1200, 820 1440' : 'M1030 513 C 1300 560, 1560 620, 1660 500'} color={C.cherry} w={4} dash="2 12" z={5} />
    {['Hopper', 'Burrs', V ? 'Grounds' : 'Ground coffee'].map((l, i) => <React.Fragment key={i}><Line k={'s5-l' + (i + 1)} d={`M${V ? g.box[0] + 480 : g.box[0] + 390} ${cy[i]} L${V ? 700 : 1220} ${cy[i]}`} color={C.brown} w={3} z={5} />
      <Chip k={'s5-c' + (i + 1)} h={[1230, cy[i] - 24, 400, 48]} v={[710, cy[i] - 24, 330, 48]} n={i + 1} label={l} c1={C.brown} c2={C.cream} style={{ color: C.brown }} z={6} /></React.Fragment>)}
    <Box k="s5-rain" h={[0, 0, 1920, 1080]} v={[0, 0, 1080, 1920]} z={30} style={{ pointerEvents: 'none' }}>{rain.map((d, i) => <span key={i} data-k="s5-grain" className="dot" style={{ left: `${d.x * 100}%`, top: -60, width: d.s, height: d.s * 0.8, background: d.c, borderRadius: '45% 55% 50% 50%' }} />)}</Box>
  </SceneShell>; }
export function build(tl, c) { const { W, H, V } = c; setScene('s5'); showScene(tl, c, 's5', 29, 37); const s = 29, g = G(V);
  enter(tl, c, 's5-photo', { at: s + 0.1, type: 'slideL', dur: 0.85 }); words(tl, c, 's5-h', { at: s + 0.35, stagger: 0.13 });
  enter(tl, c, 's5-g', { at: s + 0.6, type: 'slideD', dur: 0.8, dist: H * 0.7 });
  const bs = [0, 1, 2, 3, 4, 5].map((i) => c.q('s5-b' + i)); gsap.set(bs, { autoAlpha: 0 });
  bs.forEach((b, i) => { tl.set(b, { autoAlpha: 1 }, s + 1.3 + i * 0.2); tl.fromTo(b, { y: -(H * 0.5) }, { y: 0, duration: 0.7, ease: 'bounce.out' }, s + 1.3 + i * 0.2); sfx(s + 1.9 + i * 0.2, 'bean', 0.8);
    tl.to(b, { y: 130 * g.sc, scale: 0, duration: 0.5, ease: 'power2.in' }, s + 2.7 + i * 0.1); });
  sfx(s + 2.5, 'grind', 0.9, 2.6);
  const gp = (n) => c.q('s5-g-' + n); gsap.set([gp('hopper'), gp('burrs'), gp('body'), gp('out')], { svgOrigin: '200 300' });
  tl.to(gp('hopper'), { y: -90, duration: 0.9, ease: 'power3.inOut' }, s + 3.0); tl.to(gp('body'), { y: 70, duration: 0.9, ease: 'power3.inOut' }, s + 3.0); tl.to(gp('out'), { y: 120, duration: 0.9, ease: 'power3.inOut' }, s + 3.0); sfx(s + 3.0, 'swish', 0.6);
  ['s5-l1', 's5-l2', 's5-l3'].forEach((k, i) => { draw(tl, c, k, { at: s + 3.7 + i * 0.2, dur: 0.4, sfx: null }); enter(tl, c, 's5-c' + (i + 1), { at: s + 3.8 + i * 0.2, type: 'slideL', dist: 120, dur: 0.5, blur: 6, sfx: 'tick', vol: 0.7 }); });
  enter(tl, c, 's5-circ', { at: s + 4.1, type: 'circle', dur: 0.7 }); enter(tl, c, 's5-ct', { at: s + 4.4, type: 'maskL', dur: 0.4 }); draw(tl, c, 's5-dl', { at: s + 4.2, dur: 0.8 });
  tl.fromTo(c.qa('[data-k="s5-dot"]'), { scale: 0, transformOrigin: '50% 50%' }, { scale: 1, duration: 0.5, ease: 'back.out(2)', stagger: 0.008 }, s + 4.3);
  const e = s + 5.3;
  wordsOut(tl, c, 's5-h', { at: e, dir: 'up' }); exit(tl, c, 's5-photo', { at: e, type: 'swishL', dur: 0.5 }); exit(tl, c, 's5-circ', { at: e, type: 'shrink', dur: 0.4 }); exit(tl, c, 's5-ct', { at: e, type: 'wipeR', dur: 0.3 }); exit(tl, c, 's5-dl', { at: e, type: 'wipeR', dur: 0.3 });
  [1, 2, 3].forEach((i) => { exit(tl, c, 's5-c' + i, { at: e, type: 'swishR', dur: 0.45 }); exit(tl, c, 's5-l' + i, { at: e, type: 'wipeR', dur: 0.3 }); }); exit(tl, c, 's5-g', { at: e + 0.1, type: 'swishU', dur: 0.55 });
  tl.fromTo(c.qa('[data-k="s5-grain"]'), { y: 0, x: 0, rotation: 0 }, { y: H + 160, x: W * 0.1, rotation: 220, duration: 1.0, ease: 'power1.in', stagger: { each: 0.0026, from: 'random' } }, e + 0.1); sfx(e + 0.1, 'pour', 0.9, 2.0);
  colourCover(tl, c, 37, C.esp, { dur: 1.5 }); }
