// Espresso extraction timeline shared by scenes 8 & 9. All values are pure functions of absolute time.
import { remap, smoothstep, easeInOut, easeOut, lerp, clamp } from './util';

export const EX = {
  pumpOn: 39.5, firstDrop: 40.0, dropsEnd: 40.95, streamStart: 40.95, streamFull: 42.4,
  fillStart: 41.4, fillEnd: 48.6, streamEnd: 48.5, cremaStart: 43.8, cremaEnd: 49.8, artStart: 50.2, artEnd: 52.8,
  G: 7.0, // slow-motion gravity
};

/** Cup liquid level 0..1 (rises while the stream lands, with soft deceleration at the top). */
export const fillLevel = (t) => 0.9 * easeInOut(remap(t, EX.fillStart, EX.fillEnd)) ** 0.9;
export const cremaAmount = (t) => smoothstep(EX.cremaStart, EX.cremaEnd, t);
export const artAmount = (t) => easeInOut(remap(t, EX.artStart, EX.artEnd));
/** Liquid surface height inside the cup (cup-local, y of saucer base = 0). */
export const liquidY = (level) => 0.28 + 0.9 + level * 3.05;

/**
 * State of the vertical espresso column.
 * topY: where the column leaves the portafilter (world). surfaceY: world height of the liquid surface.
 */
export function streamState(t, topY, surfaceY) {
  const start = EX.streamStart, end = EX.streamEnd;
  let top = topY, bottom = surfaceY, r0 = 0, flow = 0, on = 0;
  if (t >= start) {
    const fall = Math.max(0, t - start);
    const front = topY - 0.5 * EX.G * fall * fall;
    bottom = Math.max(front, surfaceY);
    flow = front <= surfaceY ? 1 : 0;
    r0 = 0.27 * smoothstep(start - 0.1, EX.streamFull, t) + 0.05;
    if (t > end) {
      // flow cuts: the upper end of the column releases and falls
      const f = t - end;
      top = Math.min(topY - 0.5 * 9 * f * f - f * 2.0, surfaceY);
      r0 *= 1 - smoothstep(end, end + 0.35, t) * 0.7;
    }
    on = top > bottom + 0.02 ? 1 : 0;
    if (!on) flow = 0;
  }
  return { top, bottom, r0, flow, on };
}

/** Droplets before the continuous stream: j-th drop released every 0.17 s. */
export function dropState(t, j, topY, surfaceY) {
  const t0 = EX.firstDrop + j * 0.2;
  const tau = t - t0;
  if (tau < 0) return { visible: false };
  // swelling at the spout, then release
  const swell = Math.min(1, tau / 0.12);
  const fall = Math.max(0, tau - 0.1);
  const y = topY - 0.1 - 0.5 * EX.G * fall * fall;
  const v = EX.G * fall;
  return { visible: y > surfaceY && t < EX.streamStart + 0.25, y, sx: 0.07 + 0.08 * swell, sy: 0.1 + 0.08 * swell + v * 0.05 };
}
