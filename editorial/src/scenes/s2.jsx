import React from 'react';
import { Box, Photo, Words, Chip, Tag, Cherry, CherryCluster, Leaves, WorldMap, MapMarker, MARK, SceneShell, useV, C } from '../art.jsx';
import { enter, exit, move, drift, parallax, words, wordsOut, draw, showScene, discTransition, sfx, setScene } from '../engine.js';
import gsap from 'gsap';
import { TROPIC_N, TROPIC_S } from '../mapdata.js';
export const meta = { id: 's2', name: '02 Where It Begins', start: 6, end: 13 };
const MBH = [770, 350, 1080, 540], MBV = [60, 1180, 960, 480];
const MK = [['colombia', 'COLOMBIA', 'l'], ['brazil', 'BRAZIL', 'r'], ['ethiopia', 'ETHIOPIA', 'r'], ['vietnam', 'VIETNAM', 'r'], ['indonesia', 'INDONESIA', 'r']];
export function Scene() { const V = useV(); const B = V ? MBV : MBH; const mp = (n) => [B[0] + MARK[n][0] * B[2] / 1000, B[1] + MARK[n][1] * B[3] / 500];
  return <SceneShell k="s2" bg={C.cream}>
    <Photo k="s2-photo" h={[70, 60, 640, 960]} v={[60, 70, 960, 740]} src="branch" radius={28} pos={{ h: '50% 40%', v: '50% 30%' }} z={2} />
    <Leaves k="s2-leaves" h={[420, 440, 420, 345]} v={[600, 20, 460, 378]} z={4} flip />
    <CherryCluster k="s2-cc" h={[520, 700, 300, 300]} v={[640, 560, 300, 300]} z={4} />
    <Words k="s2-h" h={[790, 70, 1100, 270]} v={[60, 850, 960, 300]} lines={['IT BEGINS', 'IN THE *TROPICS.']} size={{ h: 118, v: 100 }} color={C.brown} emc={C.cherry} z={5} />
    <WorldMap k="s2-map" h={MBH} v={MBV} z={3} />
    {MK.map(([n, l, s]) => { const [x, y] = mp(n); return <MapMarker key={n} k={'s2-m-' + n} x={x} y={y} label={l} side={s} />; })}
    <Tag k="s2-belt" h={[800, 372, 700, 26]} v={[80, 1196, 800, 26]} color={C.brown} z={6}>The coffee belt · between the tropics</Tag>
    <Photo k="s2-harv" h={[1540, 690, 320, 270]} v={[690, 1470, 330, 200]} src="sorting" radius={22} pos="50% 40%" z={7} />
    <Chip k="s2-n1" h={[300, 400, 46, 46]} v={[300, 330, 46, 46]} n={1} label="" c1={C.cherry} c2={C.white} z={8} />
    <Chip k="s2-n2" h={[640, 780, 46, 46]} v={[860, 600, 46, 46]} n={2} label="" c1={C.cherry} c2={C.white} z={8} />
    <Chip k="s2-n3" h={[1520, 670, 46, 46]} v={[670, 1450, 46, 46]} n={3} label="" c1={C.cherry} c2={C.white} z={8} />
    <Chip k="s2-l1" h={[790, 950, 350, 54]} v={[60, 1700, 420, 54]} n={1} label="Coffee plantation" pill pillbg={C.brown} pillfg={C.cream} c1={C.cherry} c2={C.white} z={6} />
    <Chip k="s2-l2" h={[1160, 950, 300, 54]} v={[60, 1764, 420, 54]} n={2} label="Coffee cherry" pill pillbg={C.brown} pillfg={C.cream} c1={C.cherry} c2={C.white} z={6} />
    <Chip k="s2-l3" h={[1490, 950, 300, 54]} v={[60, 1828, 420, 54]} n={3} label="Harvest" pill pillbg={C.brown} pillfg={C.cream} c1={C.cherry} c2={C.white} z={6} />
    <Cherry k="s2-cherry" h={[720, 252, 480, 576]} v={[270, 660, 540, 648]} z={9} />
  </SceneShell>; }
export function build(tl, c) { const { W, H, V } = c; setScene('s2'); showScene(tl, c, 's2', 6, 13); const s = 6;
  enter(tl, c, 's2-photo', { at: s + 0.15, type: 'slideU', dur: 0.95 }); enter(tl, c, 's2-leaves', { at: s + 0.35, type: 'slideR', dur: 0.8, dist: W * 0.6 }); enter(tl, c, 's2-cc', { at: s + 0.5, type: 'slideD', dur: 0.85, dist: H * 0.6 });
  words(tl, c, 's2-h', { at: s + 0.5, stagger: 0.1 });
  enter(tl, c, 's2-map', { at: s + 1.0, type: 'maskL', dur: 0.9 });
  tl.fromTo(c.q('s2-map-band'), { scaleY: 0, svgOrigin: `500 ${(TROPIC_N + TROPIC_S) / 2}` }, { scaleY: 1, duration: 0.7, ease: 'power3.out' }, s + 1.5); sfx(s + 1.5, 'paper', 0.6);
  draw(tl, c, '[data-k="s2-map"] .tl', { at: s + 1.6, dur: 0.8, stagger: 0.12 }); draw(tl, c, 's2-map-route', { at: s + 2.4, dur: 1.5 });
  enter(tl, c, 's2-belt', { at: s + 1.5, type: 'maskL', dur: 0.5 });
  ['colombia', 'brazil', 'ethiopia', 'vietnam', 'indonesia'].forEach((n, i) => { enter(tl, c, 's2-m-' + n, { at: s + 1.9 + i * 0.22, type: 'pop', dur: 0.45, ease: 'back.out(2)', sfx: 'tick', vol: 0.8 });
    tl.fromTo(c.q('s2-m-' + n + '-ring'), { scale: 0.4, opacity: 0.9 }, { scale: 1.8, opacity: 0, duration: 0.9, ease: 'power1.out', repeat: 2 }, s + 2.1 + i * 0.22); });
  enter(tl, c, 's2-harv', { at: s + 2.2, type: 'diag', dur: 0.8, dist: W * 0.4 });
  ['s2-n1', 's2-n2', 's2-n3'].forEach((k, i) => enter(tl, c, k, { at: s + 2.7 + i * 0.12, type: 'pop', dur: 0.4, sfx: 'tick', vol: 0.6 }));
  ['s2-l1', 's2-l2', 's2-l3'].forEach((k, i) => enter(tl, c, k, { at: s + 3.0 + i * 0.15, type: 'slideU', dist: 120, dur: 0.6 }));
  parallax(tl, c, [['s2-photo', 0.5], ['s2-leaves', 1.2], ['s2-cc', 0.9]], { at: s + 1.3, dur: 3.4, dx: -50 });
  // exits: photo swishes away; the cherry remains
  const e = s + 4.9;
  exit(tl, c, 's2-photo', { at: e, type: 'swishL', dur: 0.55 }); exit(tl, c, 's2-leaves', { at: e + 0.05, type: 'swishU', dur: 0.5 }); exit(tl, c, 's2-cc', { at: e + 0.05, type: 'swishD', dur: 0.5 });
  exit(tl, c, 's2-map', { at: e, type: 'wipeR', dur: 0.5 }); c.qa('[data-k^="s2-m-"]').forEach((el) => exit(tl, c, el, { at: e, type: 'shrink', dur: 0.3 }));
  exit(tl, c, 's2-belt', { at: e, type: 'wipeR', dur: 0.4 }); wordsOut(tl, c, 's2-h', { at: e, dir: 'up' }); exit(tl, c, 's2-harv', { at: e, type: 'swishR', dur: 0.5 });
  ['s2-n1', 's2-n2', 's2-n3'].forEach((k) => exit(tl, c, k, { at: e, type: 'shrink', dur: 0.25 })); ['s2-l1', 's2-l2', 's2-l3'].forEach((k, i) => exit(tl, c, k, { at: e + i * 0.06, type: 'swishD', dur: 0.45 }));
  enter(tl, c, 's2-cherry', { at: e + 0.25, type: 'pop', dur: 0.6, ease: 'back.out(1.8)' });
  tl.to(c.q('s2-cherry'), { rotation: 4, y: '-=10', duration: 0.5, yoyo: true, repeat: 1, ease: 'sine.inOut' }, e + 0.9);
  discTransition(tl, c, 13, { color: C.cherry, cx: W / 2, cy: H / 2 }); }
