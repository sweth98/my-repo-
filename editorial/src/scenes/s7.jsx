import React from 'react';
import { Box, Photo, Words, Chip, Arrow, Bean, Tag, Line, Cup, Steam, SceneShell, useV, C } from '../art.jsx';
import { enter, exit, move, drift, words, wordsOut, draw, arrow, bar, showScene, sfx, setScene } from '../engine.js';
import gsap from 'gsap';
export const meta = { id: 's7', name: '07 The Final Cup', start: 47, end: 56 };
export const meta8 = { id: 's8', name: '08 The Ending', start: 56, end: 60 };
const CUP_H = [1040, 290, 600, 560], CUP_V = [240, 700, 600, 560];
export function Scene() { const V = useV(); const cx = V ? 540 : 1340, topY = V ? 700 : 290;
  return <SceneShell k="s7" bg={C.cream}>
    <Box k="s7-ring" h={[560, 140, 800, 800]} v={[140, 560, 800, 800]} z={1} style={{ border: `3px solid ${C.caramel}`, borderRadius: '50%' }} />
    <Words k="s7-h1" h={[90, 80, 900, 100]} v={[60, 80, 960, 90]} lines={['AND FINALLY…']} size={{ h: 84, v: 72 }} color={C.brown} z={5} />
    <Words k="s7-h2" h={[90, 170, 1000, 220]} v={[60, 160, 960, 200]} lines={['*YOUR CUP.']} size={{ h: 190, v: 160 }} chars color={C.brown} emc={C.cherry} z={5} />
    <Photo k="s7-ph" h={[100, 470, 400, 400]} v={[60, 1400, 420, 420]} src="pourtop" radius="50%" size={{ h: '873px auto', v: '917px auto' }} pos={{ h: '-288px -729px', v: '-302px -766px' }} z={3} />
    <Box k="s7-art" h={[520, 560, 380, 380]} v={[610, 1400, 420, 420]} z={4} cls="sh" style={{ borderRadius: '50%', background: C.caramel }}><svg viewBox="0 0 380 380" style={{ width: '100%', height: '100%' }}><circle cx="190" cy="190" r="178" fill="none" stroke="#FFFDF7" strokeWidth="6" />
      <g data-k="s7-milk" fill="none" stroke="#FFFDF7" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round"><path d="M190 312 C 90 270 84 150 190 168 C 296 150 290 270 190 312" /><path d="M190 270 C 126 240 124 186 190 196 C 256 186 254 240 190 270" /><path d="M190 328 L190 130" /><path d="M190 130 C 170 100 140 92 120 104" /><path d="M190 130 C 210 100 240 92 260 104" /></g></svg></Box>
    <Tag k="s7-pt" h={[100, 890, 400, 26]} v={[60, 1830, 420, 26]} color={C.brown} z={5}>Milk meets espresso</Tag>
    <Steam k="s7-steam" h={[CUP_H[0] + 150, 20, 300, 320]} v={[CUP_V[0] + 150, 400, 300, 300]} z={6} />
    <Cup k="s7-cup" h={CUP_H} v={CUP_V} z={4} />
    <Box k="s7-str" h={[cx - 13, 0, 26, 496]} v={[cx - 13, 0, 26, 906]} z={5} style={{ background: 'linear-gradient(90deg,#8A4A1E,#F2A24A 50%,#9A5322)', borderRadius: 14, transformOrigin: '50% 0%' }} />
    <Chip k="s7-c1" h={[1660, 400, 250, 50]} v={[760, 880, 250, 50]} n={1} label="Crema" c1={C.cherry} c2={C.white} style={{ color: C.brown }} z={6} />
    <Arrow k="s7-a1" d={V ? 'M770 904 L720 920' : 'M1660 424 L1500 466'} head={V ? [722, 920, 160] : [1500, 466, 164]} color={C.brown} w={4} z={6} />
    <Chip k="s7-c2" h={[100, 930, 400, 50]} v={[620, 1830, 400, 50]} n={2} label="Milk" c1={C.cherry} c2={C.white} style={{ color: C.brown, display: 'none' }} z={6} />
    {/* S8 */}
    <Words k="s8-l" h={[100, 270, 560, 420]} v={[0, 170, 1080, 200]} lines={V ? ['*FROM BEAN'] : ['*FROM', 'BEAN']} size={{ h: 190, v: 150 }} chars={false} align={V ? 'center' : 'right'} color={C.brown} emc={C.caramel} z={3} />
    <Words k="s8-r" h={[1280, 270, 560, 420]} v={[0, 1350, 1080, 200]} lines={V ? ['*TO BREW'] : ['*TO', 'BREW']} size={{ h: 190, v: 150 }} chars={false} align={V ? 'center' : 'left'} color={C.brown} emc={C.caramel} z={3} />
    <Bean k="s8-bean" h={[1150, 760, 170, 110]} v={[800, 1420, 170, 110]} c1="#8a5636" c2="#2e160c" rot={20} z={7} />
    <Words k="s8-sub" h={[0, 900, 1920, 90]} v={[0, 1610, 1080, 90]} lines={['THE LIFE OF A CUP OF COFFEE']} size={{ h: 60, v: 46 }} color={C.brown} align="center" style={{ textTransform: 'none' }} ls="-0.01em" z={5} />
    <Words k="s8-tag" h={[0, 1000, 1920, 40]} v={[0, 1730, 1080, 40]} lines={['EVERY CUP HAS A JOURNEY.']} size={{ h: 26, v: 24 }} weight={800} align="center" ls=".34em" color={C.caramel} z={5} style={{ fontFamily: 'Manrope, Inter, sans-serif', fontWeight: 800 }} />
  </SceneShell>; }
export function build(tl, c) { const { W, H, V } = c; setScene('s7'); showScene(tl, c, 's7', 47, 60); const s = 47;
  const q = (k) => c.q(k); const cupBox = V ? CUP_V : CUP_H;
  gsap.set(q('s7-cup-liq'), { y: 300 }); gsap.set(q('s7-cup-latte'), { scale: 0, svgOrigin: '300 176' }); gsap.set(q('s7-steam'), { autoAlpha: 0 }); gsap.set(q('s7-str'), { scaleY: 0, autoAlpha: 0 });
  gsap.set(q('s7-cup-crema'), { scaleY: 0, svgOrigin: '300 206' }); gsap.set(c.qa('[data-k="s7-cup-bubbles"] circle'), { scale: 0, transformOrigin: '50% 50%' });
  enter(tl, c, 's7-ring', { at: s + 0.1, type: 'circle', dur: 0.9, sfx: null });
  enter(tl, c, 's7-cup', { at: s + 0.2, type: 'slideD', dur: 1.0, dist: H * 1.0, ease: 'back.out(1.1)' }); sfx(s + 1.0, 'impact', 0.7);
  words(tl, c, 's7-h1', { at: s + 0.5, stagger: 0.12 }); words(tl, c, 's7-h2', { at: s + 0.8, mode: 'chars', stagger: 0.055 });
  // espresso stream fills the cup
  tl.set(q('s7-str'), { autoAlpha: 1 }, s + 1.5); tl.to(q('s7-str'), { scaleY: 1, duration: 0.35, ease: 'power2.out' }, s + 1.5); sfx(s + 1.5, 'extract', 0.9, 3.0);
  tl.to(q('s7-cup-liq'), { y: 0, duration: 2.2, ease: 'power1.inOut' }, s + 1.7);
  tl.to(q('s7-str'), { scaleX: 0.35, duration: 0.5, ease: 'power1.in' }, s + 3.4); tl.to(q('s7-str'), { scaleY: 0, transformOrigin: '50% 100%', duration: 0.3, ease: 'power2.in' }, s + 3.85);
  tl.to(q('s7-cup-crema'), { scaleY: 1, duration: 0.7, ease: 'power2.out' }, s + 3.3); tl.to(c.qa('[data-k="s7-cup-bubbles"] circle'), { scale: 1, duration: 0.35, ease: 'back.out(2)', stagger: 0.03 }, s + 3.6); sfx(s + 3.6, 'tick', 0.4);
  // steam
  tl.set(q('s7-steam'), { autoAlpha: 1 }, s + 4.0); draw(tl, c, '[data-k="s7-steam"] .st', { at: s + 4.0, dur: 1.1, stagger: 0.2, sfx: null });
  tl.fromTo(c.qa('[data-k="s7-steam"] .st'), { y: 0 }, { y: -26, duration: 3.5, ease: 'sine.inOut', yoyo: true, repeat: 1 }, s + 4.6);
  enter(tl, c, 's7-c1', { at: s + 3.9, type: 'pop', dur: 0.4 }); arrow(tl, c, 's7-a1', { at: s + 4.1, dur: 0.5 });
  // second photographic cutout + drawn milk pattern
  enter(tl, c, 's7-ph', { at: s + 4.3, type: 'diagL', dur: 0.85, dist: W * 0.5 }); enter(tl, c, 's7-art', { at: s + 4.7, type: 'scale', dur: 0.6, ease: 'back.out(1.6)' });
  draw(tl, c, '[data-k="s7-milk"] path', { at: s + 5.1, dur: 0.75, stagger: 0.28 }); enter(tl, c, 's7-pt', { at: s + 5.4, type: 'maskL', dur: 0.5 });
  // hero: everything else leaves, the cup takes the stage
  const e = s + 6.9;
  exit(tl, c, 's7-ph', { at: e, type: 'swishL', dur: 0.5 }); exit(tl, c, 's7-art', { at: e + 0.05, type: V ? 'swishR' : 'swishD', dur: 0.5 }); exit(tl, c, 's7-pt', { at: e, type: 'wipeR', dur: 0.3 });
  exit(tl, c, 's7-c1', { at: e, type: 'shrink', dur: 0.3 }); exit(tl, c, 's7-a1', { at: e, type: 'wipeR', dur: 0.3 }); wordsOut(tl, c, 's7-h1', { at: e, dir: 'up' }); wordsOut(tl, c, 's7-h2', { at: e + 0.05, dir: 'up' });
  tl.set(q('s7-cup-latte'), { scale: 1 }, e + 0.9); tl.fromTo(q('s7-cup-latte'), { scale: 0 }, { scale: 1, duration: 0.5, ease: 'back.out(1.6)' }, e + 0.55); sfx(e + 0.55, 'pop', 0.8);
  // cup to the centre (hero), steam follows
  const tx = V ? 0 : W / 2 - (cupBox[0] + 300), ty = V ? -60 : 40;
  tl.to(q('s7-cup'), { x: tx, y: ty, scale: V ? 1.1 : 1.0, duration: 1.0, ease: 'power3.inOut' }, e + 0.05); tl.to(q('s7-steam'), { x: tx, y: ty - 20, duration: 1.0, ease: 'power3.inOut' }, e + 0.05); sfx(e + 0.05, 'swish', 0.7);
  // S8: ending typography
  setScene('s8'); const f = 56;
  tl.to(q('s7-cup'), { scale: V ? 1.05 : 1.0, duration: 0.8, ease: 'power2.inOut' }, f);
  words(tl, c, 's8-l', { at: f + 0.15, stagger: 0.15, dur: 0.9 }); words(tl, c, 's8-r', { at: f + 0.3, stagger: 0.15, dur: 0.9 });
  enter(tl, c, 's8-bean', { at: f + 0.9, type: 'slideR', dur: 0.8, dist: W * 0.4 }); tl.to(q('s8-bean'), { rotation: 380, duration: 0.8, ease: 'power3.out' }, f + 0.9);
  words(tl, c, 's8-sub', { at: f + 1.5, stagger: 0.06, dur: 0.8 }); words(tl, c, 's8-tag', { at: f + 2.1, mode: 'rise', dur: 0.7 });
  tl.to(q('s7-cup'), { scale: '+=0.04', duration: 1.8, ease: 'sine.inOut' }, f + 2.1); }
