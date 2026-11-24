import * as THREE from 'three';
import { lerp } from './util';

const B = (top, bottom, glow, glowAmt, bokeh, bokehColor, dir = [0.55, 0.5, -0.65]) => ({ top, bottom, glow, glowAmt, bokeh, bokehColor, dir });
export const BACKDROP_KEYS = [
  [0, B(0xa9c06f, 0x1d3912, 0xffd98a, 0.7, 0.9, 0xfff0b0)],
  [7.6, B(0xa9c06f, 0x1d3912, 0xffd98a, 0.7, 0.9, 0xfff0b0)],
  [8.8, B(0x2e1809, 0x0b0503, 0xff9a4a, 0.35, 0.3, 0xffb060, [0.4, 0.6, -0.7])],
  [9.95, B(0x2e1809, 0x0b0503, 0xff9a4a, 0.35, 0.3, 0xffb060)],
  [10.0, B(0xd9c5a3, 0x8e7656, 0xfff0d0, 0.5, 0.2, 0xfff6e0)],
  [14.95, B(0xd9c5a3, 0x8e7656, 0xfff0d0, 0.5, 0.2, 0xfff6e0)],
  [15.0, B(0xe7d6b8, 0xa68c66, 0xffe9c0, 0.55, 0.35, 0xfff1d0)],
  [19.95, B(0xe7d6b8, 0xa68c66, 0xffe9c0, 0.55, 0.35, 0xfff1d0)],
  [20.0, B(0x1c0e07, 0x050201, 0xff7a22, 0.22, 0.12, 0xff8a30)],
  [26.95, B(0x1c0e07, 0x050201, 0xff7a22, 0.22, 0.12, 0xff8a30)],
  [27.0, B(0x2a150a, 0x070302, 0xff9a50, 0.45, 0.55, 0xffb060)],
  [31.95, B(0x2a150a, 0x070302, 0xff9a50, 0.45, 0.55, 0xffb060)],
  [32.0, B(0x241810, 0x060403, 0xffa860, 0.3, 0.25, 0xffb870)],
  [36.95, B(0x241810, 0x060403, 0xffa860, 0.3, 0.25, 0xffb870)],
  [37.0, B(0x35241a, 0x0a0604, 0xffc080, 0.35, 0.22, 0xffc890)],
  [44.95, B(0x35241a, 0x0a0604, 0xffc080, 0.35, 0.22, 0xffc890)],
  [45.0, B(0x46301d, 0x0b0503, 0xffc98a, 0.65, 0.6, 0xffcf90)],
  [57.9, B(0x46301d, 0x0b0503, 0xffc98a, 0.65, 0.6, 0xffcf90)],
  [58.0, B(0xa9c06f, 0x1d3912, 0xffd98a, 0.7, 0.9, 0xfff0b0)],
  [60, B(0xa9c06f, 0x1d3912, 0xffd98a, 0.7, 0.9, 0xfff0b0)],
];
const c1 = new THREE.Color(), c2 = new THREE.Color();
export function applyBackdrop(mat, t) {
  let i = 0;
  while (i < BACKDROP_KEYS.length - 2 && t >= BACKDROP_KEYS[i + 1][0]) i++;
  const [t0, a] = BACKDROP_KEYS[i], [t1, b] = BACKDROP_KEYS[i + 1];
  const f = t1 > t0 ? Math.min(1, Math.max(0, (t - t0) / (t1 - t0))) : 0;
  const u = mat.uniforms;
  const mix = (o, x, y) => { c1.set(x); c2.set(y); o.copy(c1).lerp(c2, f); };
  mix(u.uTop.value, a.top, b.top); mix(u.uBottom.value, a.bottom, b.bottom); mix(u.uGlow.value, a.glow, b.glow); mix(u.uBokehColor.value, a.bokehColor, b.bokehColor);
  u.uGlowAmt.value = lerp(a.glowAmt, b.glowAmt, f); u.uBokeh.value = lerp(a.bokeh, b.bokeh, f);
  u.uGlowDir.value.set(lerp(a.dir[0], b.dir[0], f), lerp(a.dir[1], b.dir[1], f), lerp(a.dir[2], b.dir[2], f)).normalize();
  u.uTime.value = t;
}
