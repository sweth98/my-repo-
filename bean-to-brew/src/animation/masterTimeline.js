// Absolute-time master timeline. Everything in the film is a pure function of
// t (seconds). GSAP drives the typography/grade state and can be scrubbed to any
// timestamp deterministically via master.time(t).
import gsap from 'gsap';

export const FPS = 30;
export const DURATION = 60;
export const TOTAL_FRAMES = FPS * DURATION; // 1800

export const SCENES = [
  { id: 1, key: 'origin', name: 'The Origin', start: 0, end: 5 },
  { id: 2, key: 'harvest', name: 'The Harvest', start: 5, end: 10 },
  { id: 3, key: 'processing', name: 'The Processing', start: 10, end: 15 },
  { id: 4, key: 'bean', name: 'The Green Bean', start: 15, end: 20 },
  { id: 5, key: 'roast', name: 'The Roast', start: 20, end: 27 },
  { id: 6, key: 'transformation', name: 'The Transformation', start: 27, end: 32 },
  { id: 7, key: 'grind', name: 'The Grind', start: 32, end: 37 },
  { id: 8, key: 'brew', name: 'The Brew', start: 37, end: 45 },
  { id: 9, key: 'cup', name: 'The Cup', start: 45, end: 55 },
  { id: 10, key: 'circle', name: 'The Circle', start: 55, end: 60 },
];

export const sceneAt = (t) =>
  SCENES.find((s) => t >= s.start && t < s.end) || SCENES[SCENES.length - 1];

// Exact wording only. `style`: 'line' (lower-left), 'title' (final lock-up)
export const TEXT_CUES = [
  { id: 'c1', text: 'EVERY GREAT CUP BEGINS SOMEWHERE.', start: 0.7, end: 4.4, style: 'line' },
  { id: 'c2', text: 'CAREFULLY GROWN. NATURALLY HARVESTED.', start: 5.6, end: 9.4, style: 'line' },
  { id: 'c3', text: 'THE JOURNEY CONTINUES.', start: 10.6, end: 14.4, style: 'line' },
  { id: 'c4', text: 'SMALL BEANS. A RICH STORY.', start: 15.6, end: 19.4, style: 'line' },
  { id: 'c5', text: 'HEAT TRANSFORMS EVERYTHING.', start: 20.8, end: 26.2, style: 'line' },
  { id: 'c6', text: 'FLAVOUR TAKES FORM.', start: 27.8, end: 31.2, style: 'line' },
  { id: 'c7', text: 'PRECISION IN EVERY PARTICLE.', start: 32.8, end: 36.2, style: 'line' },
  { id: 'c8', text: 'THE PERFECT MOMENT.', start: 38.2, end: 44.2, style: 'line' },
  { id: 'c9', text: 'FROM A SINGLE BEAN TO A MOMENT OF JOY.', start: 47.0, end: 54.2, style: 'line' },
  { id: 'title', text: 'FROM BEAN TO BREW', sub: 'THE LIFE OF A CUP OF COFFEE', start: 58.3, end: 61, style: 'title', fadeOut: false },
  { id: 'final', text: 'EVERY CUP HAS A JOURNEY.', start: 59.0, end: 61, style: 'final', fadeOut: false },
];

// per-theme grade (colour progression follows the story)
export const GRADES = {
  plantation: { tint: [1.0, 0.98, 0.9], sat: 1.08, contrast: 1.04, lift: [0.0, 0.01, 0.0] },
  processing: { tint: [1.0, 0.96, 0.88], sat: 0.98, contrast: 1.0, lift: [0.01, 0.007, 0.0] },
  roast: { tint: [1.05, 0.95, 0.84], sat: 1.12, contrast: 1.12, lift: [0.006, 0.0, 0.0] },
  brew: { tint: [1.04, 0.97, 0.88], sat: 1.05, contrast: 1.1, lift: [0.004, 0.0, 0.0] },
  cup: { tint: [1.04, 0.97, 0.89], sat: 1.04, contrast: 1.08, lift: [0.006, 0.002, 0.0] },
};
const THEME_AT = [
  [0, 'plantation'], [10, 'processing'], [20, 'roast'], [37, 'brew'], [45, 'cup'], [58, 'plantation'],
];

export const filmState = {
  cues: Object.fromEntries(TEXT_CUES.map((c) => [c.id, { o: 0, y: 14, track: 0.0 }])),
  grade: { tr: 1, tg: 1, tb: 1, sat: 1, contrast: 1, lr: 0, lg: 0, lb: 0 },
  shimmer: 0,
};

function buildMaster() {
  const tl = gsap.timeline({ paused: true, defaults: { overwrite: false } });
  TEXT_CUES.forEach((c) => {
    const s = filmState.cues[c.id];
    tl.fromTo(s, { o: 0, y: 16, track: 0.06 }, { o: 1, y: 0, track: 0.16, duration: 1.1, ease: 'power2.out' }, c.start);
    if (c.fadeOut !== false) tl.to(s, { o: 0, y: -6, duration: 0.8, ease: 'power2.in' }, c.end - 0.8);
  });
  // colour progression: tween the grade between themes
  const g = filmState.grade;
  const flat = (o) => ({ tr: o.tint[0], tg: o.tint[1], tb: o.tint[2], sat: o.sat, contrast: o.contrast, lr: o.lift[0], lg: o.lift[1], lb: o.lift[2] });
  tl.set(g, flat(GRADES.plantation), 0);
  THEME_AT.slice(1).forEach(([time, name]) => {
    const to = GRADES[name];
    tl.to(g, { ...flat(to), duration: 1.2, ease: 'sine.inOut' }, time - 0.6);
  });
  // heat shimmer during the roast
  tl.fromTo(filmState, { shimmer: 0 }, { shimmer: 1, duration: 1.5, ease: 'sine.inOut' }, 21.5);
  tl.to(filmState, { shimmer: 0, duration: 1.2, ease: 'sine.inOut' }, 26.0);
  tl.addLabel('end', DURATION);
  SCENES.forEach((s) => tl.addLabel(s.key, s.start));
  return tl;
}

export const master = buildMaster();
/** Seek the GSAP master timeline to an absolute time (frame accurate, order independent). */
export function seekMaster(t) {
  master.time(Math.max(0, Math.min(DURATION, t)), false);
}
