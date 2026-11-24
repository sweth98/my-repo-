import React from 'react';
import { Box, Photo, Words, Chip, Arrow, Tag, Machine, Diagram, SceneShell, useV, C } from '../art.jsx';
import { enter, exit, move, drift, words, wordsOut, draw, arrow, bar, showScene, liquidTransition, sfx, setScene } from '../engine.js';
import gsap from 'gsap';
export const meta = { id: 's6', name: '06 The Brew', start: 37, end: 47 };
export function Scene() { const V = useV(); return <SceneShell k="s6" bg={C.esp}>
  <Photo k="s6-p" h={[1040, 0, 880, 1080]} v={[0, 0, 1080, 1920]} src="stream" pos={{ h: '50% 50%', v: '50% 50%' }} z={1} cls="" />
  <Box k="s6-str" h={[240, 0, 600, 1080]} v={[300, 0, 480, 1920]} z={3}><svg viewBox="0 0 400 1000" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}><defs><linearGradient id="lq" x1="0" x2="1"><stop offset="0" stopColor="#8A4A1E" /><stop offset=".45" stopColor="#F2A24A" /><stop offset=".6" stopColor="#FFD08A" /><stop offset="1" stopColor="#9A5322" /></linearGradient></defs>
    <path data-k="s6-sp" d="M178 0 L222 0 C 220 300 214 600 206 1000 L194 1000 C 186 600 180 300 178 0Z" fill="url(#lq)" style={{ transformOrigin: '50% 0%' }} /></svg></Box>
  <Machine k="s6-m" h={[1040, 120, 780, 780]} v={[190, 120, 700, 700]} z={3} />
  <Words k="s6-h" h={[90, 110, 900, 420]} v={[60, 880, 960, 420]} lines={['PRESSURE.', 'WATER.', '*EXTRACTION.']} size={{ h: 112, v: 104 }} color={C.cream} emc="#F2B35E" z={5} />
  <Box k="s6-bar" h={[96, 498, 860, 14]} v={[64, 1282, 800, 12]} z={4} style={{ background: C.caramel }} />
  <Diagram k="s6-d" h={[90, 560, 560, 512]} v={[60, 1330, 520, 475]} z={4} />
  <Chip k="s6-c1" h={[680, 580, 340, 50]} v={[600, 1360, 440, 50]} n={1} label="Hot water" c1={C.caramel} c2={C.esp} style={{ color: C.cream }} z={6} />
  <Chip k="s6-c2" h={[680, 780, 340, 50]} v={[600, 1560, 440, 50]} n={2} label="Packed coffee" c1={C.caramel} c2={C.esp} style={{ color: C.cream }} z={6} />
  <Chip k="s6-c3" h={[680, 990, 340, 50]} v={[600, 1730, 440, 50]} n={3} label="Espresso" c1={C.caramel} c2={C.esp} style={{ color: C.cream }} z={6} />
  <Tag k="s6-t" h={[94, 52, 460, 28]} v={[64, 60, 900, 28]} color="#F2B35E" z={6}>06 — The brew</Tag>
  <Tag k="s6-esp" h={[190, 960, 560, 28]} v={[100, 150, 560, 28]} color={C.cream} z={6}>Espresso, up close</Tag>
  <Arrow k="s6-ar" d={V ? 'M330 196 C 400 250, 460 300, 500 380' : 'M440 940 C 520 900, 600 800, 700 700'} head={V ? [500, 380, 60] : [700, 700, -50]} color={C.cream} w={5} z={6} />
</SceneShell>; }
export function build(tl, c) { const { W, H, V } = c; setScene('s6'); showScene(tl, c, 's6', 37, 47); const s = 37;
  gsap.set(c.q('s6-p'), { autoAlpha: 0 }); gsap.set(c.q('s6-str'), { autoAlpha: 0 });
  enter(tl, c, 's6-m', { at: s + 0.75, type: 'slideR', dur: 0.85 }); enter(tl, c, 's6-t', { at: s + 0.9, type: 'maskL', dur: 0.5 });
  words(tl, c, 's6-h', { at: s + 1.0, stagger: 0.45, dur: 0.7 }); bar(tl, c, 's6-bar', { at: s + 2.4 });
  enter(tl, c, 's6-d', { at: s + 1.8, type: 'maskL', dur: 0.8 });
  tl.to(c.qa('[data-k="s6-d-water"] .drop'), { strokeDashoffset: -220, duration: 3.2, ease: 'none', stagger: 0.08 }, s + 2.2);                       // water flowing down
  tl.fromTo(c.q('s6-d-puck'), { scaleY: 1, svgOrigin: '350 250' }, { scaleY: 0.82, duration: 0.8, ease: 'power2.inOut' }, s + 2.4);               // puck compresses
  draw(tl, c, 's6-d-drip', { at: s + 3.1, dur: 0.7, stagger: 0.15 }); sfx(s + 3.1, 'extract', 0.8, 3.5);
  ['s6-c1', 's6-c2', 's6-c3'].forEach((k, i) => enter(tl, c, k, { at: s + 2.4 + i * 0.5, type: 'slideL', dist: 160, dur: 0.55, blur: 6, sfx: 'tick' }));
  drift(tl, c, 's6-m', { at: s + 1.7, dur: 2.9, dx: -26, dy: 0 });
  // phase B: the extraction close-up grows to fill the frame
  const e = s + 4.7;
  exit(tl, c, 's6-m', { at: e, type: 'swishU', dur: 0.5 }); exit(tl, c, 's6-d', { at: e, type: 'wipeL', dur: 0.45 }); wordsOut(tl, c, 's6-h', { at: e, dir: 'up' }); exit(tl, c, 's6-bar', { at: e, type: 'wipeR', dur: 0.3 }); exit(tl, c, 's6-t', { at: e, type: 'wipeR', dur: 0.3 });
  ['s6-c1', 's6-c2', 's6-c3'].forEach((k, i) => exit(tl, c, k, { at: e + i * 0.05, type: 'swishL', dur: 0.4 }));
  tl.set(c.q('s6-p'), { autoAlpha: 1 }, e + 0.1); tl.fromTo(c.q('s6-p'), { x: W * 0.6, filter: 'blur(14px)' }, { x: 0, filter: 'blur(0px)', duration: 0.8, ease: 'expo.out' }, e + 0.1); sfx(e + 0.1, 'swishBig', 0.8);
  tl.fromTo(c.q('s6-p'), { scale: 1.0 }, { scale: 1.15, duration: 4.5, ease: 'none' }, e + 0.9);
  tl.set(c.q('s6-str'), { autoAlpha: 1 }, e + 0.4); tl.fromTo(c.q('s6-str'), { clipPath: 'inset(-20% -20% 120% -20%)' }, { clipPath: 'inset(-20% -20% -20% -20%)', duration: 1.3, ease: 'power2.inOut' }, e + 0.4);
  tl.fromTo(c.q('s6-sp'), { scaleX: 1, svgOrigin: '200 0' }, { scaleX: 6, svgOrigin: '200 0', duration: 3.6, ease: 'power2.inOut' }, e + 1.2); sfx(e + 0.4, 'extract', 1, 4.5);                         // the stream grows larger
  enter(tl, c, 's6-esp', { at: e + 1.3, type: 'maskL', dur: 0.5 }); arrow(tl, c, 's6-ar', { at: e + 1.6, dur: 0.7 });
  liquidTransition(tl, c, 47, { dur: 1.1 }); }
