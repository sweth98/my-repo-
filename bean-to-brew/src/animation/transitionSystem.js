// Match-cut transition system. Every cut happens while the hero object is isolated inside a shrinking iris,
// so the eye follows the object (flower→cherry, cherry→bean, bean→bean …) and never sees a generic fade.
import { lerp, remap, easeInOut } from './util';

const DARK = [0.045, 0.022, 0.011];
const CREAM = [0.93, 0.86, 0.72];
const GOLD = [0.12, 0.07, 0.02];

export const TRANSITIONS = [
  { id: 1, at: 5, name: 'Coffee flower → coffee cherry', hero: 0.34, color: DARK, shape: 0.0, blur: 0.0, dur: 0.5 },
  { id: 2, at: 10, name: 'Red cherry → revealed green bean', hero: 0.26, color: DARK, shape: 0.0, blur: 0.0, dur: 0.5 },
  { id: 'a', at: 15, name: 'Wet bean → floating green bean', hero: 0.24, color: CREAM, shape: 1.0, blur: 0.0, dur: 0.45 },
  { id: 3, at: 20, name: 'Green bean → roaster (material transformation)', hero: 0.28, color: DARK, shape: 1.0, blur: 0.0, dur: 0.5 },
  { id: 4, at: 27, name: 'Roasted bean → hero bean', hero: 0.34, color: DARK, shape: 1.0, blur: 0.0, dur: 0.5 },
  { id: 5, at: 32, name: 'Bean fills frame → grinder (particle transformation)', hero: 0.75, color: DARK, shape: 0.0, blur: 0.1, dur: 0.45 },
  { id: 6, at: 37, name: 'Grounds → espresso machine', hero: 0.3, color: GOLD, shape: 0.0, blur: 0.0, dur: 0.5 },
  { id: 7, at: 45, name: 'Espresso stream → final cup', hero: 0.3, color: GOLD, shape: 0.0, blur: 0.0, dur: 0.5 },
  { id: 8, at: 58, name: 'Final cup → bean → plantation (circle)', hero: 0.16, color: CREAM, shape: 1.0, blur: 0.0, dur: 0.7 },
];

const OPEN = 1.6;

/** Returns iris/blur state for time t (pure function). */
export function transitionAt(t) {
  for (const tr of TRANSITIONS) {
    const a = tr.at - tr.dur, b = tr.at + tr.dur;
    if (t >= a && t < b) {
      const x = t < tr.at ? easeInOut(remap(t, a, tr.at)) : easeInOut(remap(t, tr.at, b));
      const closed = t < tr.at ? x : 1 - x; // 0 open … 1 closed to hero
      return { iris: lerp(OPEN, tr.hero, closed), color: tr.color, shape: tr.shape, blur: tr.blur * closed, soft: lerp(0.4, 0.12, closed), active: true, cut: t >= tr.at ? 1 : 0 };
    }
  }
  return { iris: OPEN, color: DARK, shape: 0, blur: 0, soft: 0.2, active: false, cut: 0 };
}
