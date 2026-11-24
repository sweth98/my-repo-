import React from 'react';
import { Box, Words, Chip, Arrow, Cherry, Bean, Tag, SceneShell, useV, C } from '../art.jsx';
import { enter, exit, move, words, wordsOut, arrow, showScene, wipeTransition, sfx, setScene } from '../engine.js';
import gsap from 'gsap';
export const meta = { id: 's3', name: '03 Inside the Cherry', start: 13, end: 19 };
const OFF = [-165, -85, -5, 75, 155], NAMES = ['Outer skin', 'Pulp', 'Mucilage', 'Parchment', 'Coffee seed'], NAMESV = ['Skin', 'Pulp', 'Mucilage', 'Parchment', 'Seed'], RX = [190, 172, 150, 128, 84];
const geo = (V) => V ? { box: [290, 700, 500, 550], sc: 1.25, cx: 540, cy: 975, lx: 800 } : { box: [680, 240, 560, 616], sc: 1.4, cx: 960, cy: 548, lx: 1330 };
export function Scene() { const V = useV(), g = geo(V), yc = (i) => g.cy + OFF[i] * g.sc;
  return <SceneShell k="s3" bg={C.green}>
    <Cherry k="s3-whole" h={[720, 252, 480, 576]} v={[270, 660, 540, 648]} z={5} />
    <Cherry k="s3-hl" h={[720, 252, 480, 576]} v={[270, 660, 540, 648]} z={5} style={{ clipPath: 'inset(0 50% 0 0)' }} />
    <Cherry k="s3-hr" h={[720, 252, 480, 576]} v={[270, 660, 540, 648]} z={5} style={{ clipPath: 'inset(0 0 0 50%)' }} />
    <Box k="s3-cut" h={geo(false).box} v={geo(true).box} z={4}><svg viewBox="0 0 400 440">
      <g data-k="s3-L1"><ellipse cx="200" cy="220" rx="190" ry="205" fill="#BD493D" stroke="#7C241F" strokeWidth="7" /></g>
      <g data-k="s3-L2"><ellipse cx="200" cy="220" rx="172" ry="186" fill="#E3825A" stroke="#B85A3A" strokeWidth="4" /></g>
      <g data-k="s3-L3"><ellipse cx="200" cy="220" rx="150" ry="164" fill="#F4D79F" stroke="#D9B26C" strokeWidth="4" /><ellipse cx="160" cy="170" rx="40" ry="16" fill="#fff" opacity=".35" /></g>
      <g data-k="s3-L4"><ellipse cx="200" cy="220" rx="128" ry="142" fill="#E8D9B5" stroke="#B9A57A" strokeWidth="5" /></g>
      <g data-k="s3-L5"><ellipse cx="200" cy="220" rx="84" ry="112" fill="#8FA56A" stroke="#46602B" strokeWidth="5" /><path d="M200 120 C170 180 230 260 200 322" fill="none" stroke="#2E4220" strokeWidth="7" strokeLinecap="round" /><ellipse cx="170" cy="170" rx="22" ry="40" fill="#fff" opacity=".2" /></g></svg></Box>
    <Words k="s3-h" h={[80, 100, 640, 300]} v={[60, 100, 960, 300]} lines={['THE BEAN', 'IS *INSIDE.']} size={{ h: 108, v: 130 }} color={C.white} emc="#F3C98F" z={6} />
    <Tag k="s3-tag" h={[84, 52, 600, 28]} v={[64, 56, 700, 28]} color={C.cream} z={6}>03 — Inside the cherry</Tag>
    {NAMES.map((n, i) => { const edge = g.cx + RX[i] * g.sc; return <React.Fragment key={i}>
      <Arrow k={'s3-a' + (i + 1)} d={`M${edge + 12} ${yc(i)} L${g.lx - 14} ${yc(i)}`} head={[g.lx - 14, yc(i), 0]} color={C.cream} w={4} z={7} />
      <Chip k={'s3-c' + (i + 1)} h={[g.lx, yc(i) - 23, 440, 46]} v={[g.lx, yc(i) - 23, 270, 46]} n={i + 1} label={V ? NAMESV[i] : n} c1={C.cream} c2={C.green} style={{ color: C.cream }} z={7} /></React.Fragment>; })}
    <Bean k="s3-bean" h={[700, 371, 520, 338]} v={[190, 732, 700, 455]} z={9} />
  </SceneShell>; }
export function build(tl, c) { const { W, H, V } = c; setScene('s3'); showScene(tl, c, 's3', 13, 19); const s = 13, g = geo(V);
  const Ls = [1, 2, 3, 4, 5].map((i) => c.q('s3-L' + i)); gsap.set(Ls, { svgOrigin: '200 220' }); gsap.set(c.q('s3-cut'), { autoAlpha: 0 }); gsap.set([c.q('s3-hl'), c.q('s3-hr')], { autoAlpha: 0 }); gsap.set(c.q('s3-bean'), { autoAlpha: 0 });
  enter(tl, c, 's3-tag', { at: s + 0.4, type: 'maskL', dur: 0.5 });
  move(tl, c, 's3-whole', { scale: 1.35 }, { at: s + 0.0, dur: 0.9, ease: 'power2.inOut' }); sfx(s + 0.0, 'swish', 0.7);   // zoom into the cherry
  tl.set(c.q('s3-whole'), { autoAlpha: 0 }, s + 0.9); tl.set([c.q('s3-hl'), c.q('s3-hr')], { autoAlpha: 1, scale: 1.35 }, s + 0.9);
  tl.set(c.q('s3-cut'), { autoAlpha: 1 }, s + 0.9); tl.fromTo(c.q('s3-cut'), { scale: 0.55 }, { scale: 1, duration: 0.6, ease: 'back.out(1.5)' }, s + 0.92); sfx(s + 0.92, 'impact', 0.8);
  move(tl, c, 's3-hl', { x: -W * 0.9, rotation: -8, filter: 'blur(8px)' }, { at: s + 1.0, dur: 0.6, ease: 'power3.in' }); move(tl, c, 's3-hr', { x: W * 0.9, rotation: 8, filter: 'blur(8px)' }, { at: s + 1.0, dur: 0.6, ease: 'power3.in' });
  tl.set([c.q('s3-hl'), c.q('s3-hr')], { autoAlpha: 0 }, s + 1.7);
  words(tl, c, 's3-h', { at: s + 1.5, stagger: 0.14 });
  // exploded view: concentric -> stacked discs
  Ls.slice(0, 4).forEach((L, i) => tl.to(L, { y: OFF[i], scaleY: 0.3, duration: 0.85, ease: 'power3.inOut' }, s + 2.6 + i * 0.08)); tl.to(Ls[4], { y: OFF[4], scale: 0.8, duration: 0.85, ease: 'power3.inOut' }, s + 2.6 + 0.32); sfx(s + 2.6, 'swishBig', 0.7);
  [1, 2, 3, 4, 5].forEach((i, k) => { arrow(tl, c, 's3-a' + i, { at: s + 3.3 + k * 0.2, dur: 0.45 }); enter(tl, c, 's3-c' + i, { at: s + 3.3 + k * 0.2, type: 'slideL', dist: 140, dur: 0.5, blur: 6, sfx: 'tick', vol: 0.7 }); });
  const e = s + 4.9;
  [1, 2, 3, 4, 5].forEach((i, k) => { exit(tl, c, 's3-a' + i, { at: e, type: 'wipeR', dur: 0.35 }); exit(tl, c, 's3-c' + i, { at: e + k * 0.04, type: 'swishR', dur: 0.45 }); });
  exit(tl, c, 's3-L1', { at: e, type: 'swishU', dur: 0.5 }); exit(tl, c, 's3-L2', { at: e + 0.04, type: 'swishL', dur: 0.5 }); exit(tl, c, 's3-L3', { at: e + 0.08, type: 'swishR', dur: 0.5 }); exit(tl, c, 's3-L4', { at: e + 0.12, type: 'swishD', dur: 0.5 });
  wordsOut(tl, c, 's3-h', { at: e, dir: 'up' }); exit(tl, c, 's3-tag', { at: e, type: 'wipeR', dur: 0.3 });
  // the seed becomes the bean and moves to centre
  tl.set(Ls[4], { autoAlpha: 0 }, e + 0.15); tl.set(c.q('s3-bean'), { autoAlpha: 1 }, e + 0.15);
  const dy = g.cy + OFF[4] * g.sc - (V ? 960 : 540); tl.fromTo(c.q('s3-bean'), { y: dy, scale: 0.42, rotation: 90 }, { y: 0, scale: 1.1, rotation: 0, duration: 0.75, ease: 'back.out(1.3)' }, e + 0.16); sfx(e + 0.3, 'bean', 1);
  wipeTransition(tl, c, 19, { color: C.caramel, accent: C.cream, dir: 'R' }); }
