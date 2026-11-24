import React from 'react';
import { Box, Photo, Words, Bean, Tag, SceneShell, C } from '../art.jsx';
import { enter, exit, move, words, wordsOut, bar, showScene, discTransition, sfx, setScene } from '../engine.js';
export const meta = { id: 's1', name: '01 The Question', start: 0, end: 6 };
export function Scene() { return <SceneShell k="s1" bg={C.cream}>
  <Photo k="s1-cup" h={[580, 160, 760, 760]} v={[90, 380, 900, 900]} src="final" radius="50%" size={{ h: '880px auto', v: '1041px auto' }} pos={{ h: '-55px -546px', v: '-65px -646px' }} z={5} />
  <Words k="s1-t1" h={[110, 110, 1500, 320]} v={[70, 170, 960, 280]} lines={['EVERY CUP', 'HAS A']} size={{ h: 150, v: 130 }} color={C.white} z={6} />
  <Words k="s1-story" h={[100, 430, 1750, 400]} v={[60, 520, 980, 300]} lines={['STORY.']} size={{ h: 380, v: 250 }} color={C.white} chars z={6} />
  <Box k="s1-bar" h={[110, 800, 1150, 30]} v={[64, 790, 700, 24]} z={5} style={{ background: C.cherry }} />
  <Bean k="s1-bean" h={[1560, 880, 230, 150]} v={[740, 1700, 300, 195]} c1="#8a5636" c2="#2e160c" rot={-20} z={9} />
  <Tag k="s1-tag" h={[110, 56, 600, 30]} v={[70, 56, 700, 30]} color={C.brown} z={7}>01 — The question</Tag>
</SceneShell>; }
export function build(tl, c) { const { W, H, V } = c; setScene('s1'); showScene(tl, c, 's1', 0, 6);
  enter(tl, c, 's1-cup', { at: 0, type: 'slideR', dist: W * 1.2, dur: 0.9 });          // cup swishes in from the right
  enter(tl, c, 's1-bean', { at: 0.4, type: 'slideL', dur: 0.8 });                      // bean swishes in from the left
  enter(tl, c, 's1-tag', { at: 0.6, type: 'maskL', dur: 0.6 });
  move(tl, c, 's1-cup', { scale: 3.4 }, { at: 1.2, dur: 1.4, ease: 'power3.inOut' }); sfx(1.2, 'swish', 0.8); // zoom into the coffee surface
  words(tl, c, 's1-t1', { at: 2.0, stagger: 0.12 });
  words(tl, c, 's1-story', { at: 2.5, mode: 'chars', stagger: 0.06 });
  move(tl, c, 's1-story', { scale: 1.2, transformOrigin: '0% 50%' }, { at: 3.15, dur: 0.6, ease: 'expo.out' }); sfx(3.15, 'impact', 0.9); // STORY expands
  bar(tl, c, 's1-bar', { at: 3.3 });
  exit(tl, c, 's1-cup', { at: 3.75, type: 'swishL', dur: 0.6, to: { x: `-=${W * 2.2}` } });                       // cup slides away
  tl.to(c.qa('[data-k="s1-t1"],[data-k="s1-story"]'), { color: C.brown, duration: 0.3 }, 3.72);
  exit(tl, c, 's1-bar', { at: 4.65, type: 'wipeR', dur: 0.4 }); wordsOut(tl, c, 's1-t1', { at: 4.65, dir: 'up' }); wordsOut(tl, c, 's1-story', { at: 4.7, dir: 'down' });
  move(tl, c, 's1-bean', V ? { x: -350, y: -837, scale: 1.7, rotation: 340 } : { x: -715, y: -415, scale: 1.7, rotation: 340 }, { at: 4.75, dur: 0.75, ease: 'back.out(1.4)' }); sfx(4.9, 'bean', 1);
  tl.to(c.q('s1-bean'), { y: '-=16', duration: 0.3, yoyo: true, repeat: 1, ease: 'sine.inOut' }, 5.5);
  discTransition(tl, c, 6, { color: C.green, cx: W / 2, cy: H / 2 }); }
