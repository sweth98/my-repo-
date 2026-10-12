import {Easing, interpolate, spring, useCurrentFrame} from 'remotion';

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
/** slow-in / slow-out tween between two frames */
export const ease = (f: number, a: number, b: number, from: number, to: number, easing: (t: number) => number = Easing.inOut(Easing.cubic)) =>
  interpolate(f, [a, b], [from, to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing});
export const easeOut = (f: number, a: number, b: number, from: number, to: number) => ease(f, a, b, from, to, Easing.out(Easing.cubic));
export const easeIn = (f: number, a: number, b: number, from: number, to: number) => ease(f, a, b, from, to, Easing.in(Easing.cubic));
/** spring with overshoot (follow-through) */
export const sp = (f: number, start: number, cfg: Partial<{damping: number; stiffness: number; mass: number}> = {}) =>
  spring({frame: f - start, fps: 30, config: {damping: 11, stiffness: 150, mass: 0.8, ...cfg}});
export const spSoft = (f: number, start: number) => sp(f, start, {damping: 16, stiffness: 90, mass: 1});
/** squash & stretch after an impact at frame `at`: returns [scaleX, scaleY] (volume preserving) */
export const squash = (f: number, at: number, amp = 0.35, decay = 0.16, freq = 0.6): [number, number] => {
  const t = f - at;
  if (t < 0) return [1, 1];
  const k = amp * Math.exp(-decay * t) * Math.cos(freq * t);
  return [1 + k, 1 / (1 + k)];
};
/** stretch along motion while fast (v in px/frame) */
export const stretchV = (v: number, max = 0.35): [number, number] => {
  const k = clamp(Math.abs(v) / 60, 0, 1) * max;
  return [1 + k, 1 / (1 + k)];
};
export const seeded = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
export const useF = () => useCurrentFrame();
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
