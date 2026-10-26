// Easing curves tuned for heavy architectural motion: long, decisive
// deceleration, no bounce, no elastic overshoot.

export const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
export const lerp = (a, b, t) => a + (b - a) * t;
export const smoothstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const smootherstep = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

export const EASE = {
  linear: (t) => t,
  // Decelerates hard into place: reads as mass arriving and locking.
  heavy: (t) => 1 - Math.pow(1 - t, 3.4),
  // Slower, more deliberate version for big slabs and columns.
  massive: (t) => {
    const a = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; // inOutCubic
    const b = 1 - Math.pow(1 - t, 4);
    return a * 0.45 + b * 0.55;
  },
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  inOutQuint: (t) => (t < 0.5 ? 16 * t ** 5 : 1 - Math.pow(-2 * t + 2, 5) / 2),
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inCubic: (t) => t * t * t,
  // Gentle start, soft landing. Used for secondary components.
  soft: (t) => t * t * (3 - 2 * t),
};

export function ease(name, t) {
  return (EASE[name] || EASE.heavy)(clamp01(t));
}

// Tiny, strictly non-bouncing settle: a single damped dip that returns to 0.
// s in [0,1] after the component locks in.
export function settleCurve(s) {
  if (s <= 0 || s >= 1) return 0;
  return Math.sin(Math.PI * s) * Math.exp(-2.6 * s);
}

// Deterministic PRNG (mulberry32) so every run is identical.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
