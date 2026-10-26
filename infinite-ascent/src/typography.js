// Editorial typography, drawn into a 2D canvas that is composited by the final
// post pass — so the text is part of the rendered frame (and of every exported frame),
// stays crisp at any resolution, and is a pure function of timeline time.
import { PALETTE } from './config.js';
import { clamp01 } from './easing.js';

const FONT = '"Helvetica Neue", "Inter", "Segoe UI", "Helvetica", Arial, sans-serif';
const hex = (n) => `#${n.toString(16).padStart(6, '0')}`;
const CREAM = hex(PALETTE.cream);
const SLATE = hex(PALETTE.slate);

const easeOut = (x) => 1 - Math.pow(1 - clamp01(x), 3);
const easeInOut = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };

// visibility windows (seconds): [inStart, inEnd, outStart, outEnd]
export const TITLE_WINDOWS = [
  [0.55, 2.9, 5.6, 7.0],      // opening title (hidden again well before the loop point)
];

function visibility(t, w) {
  const i = easeOut((t - w[0]) / (w[1] - w[0]));
  const o = easeInOut((t - w[2]) / (w[3] - w[2]));
  return i * (1 - o);
}

export function titleAlpha(t) {
  return Math.max(...TITLE_WINDOWS.map((w) => visibility(t, w)));
}

function tracked(ctx, text, x, y, tracking) {
  // manual letter-spacing (consistent across browsers)
  let cx = x;
  for (const ch of text) {
    ctx.fillText(ch, cx, y);
    cx += ctx.measureText(ch).width + tracking;
  }
  return cx - tracking;
}
function trackedWidth(ctx, text, tracking) {
  let w = 0;
  for (const ch of text) w += ctx.measureText(ch).width + tracking;
  return w - tracking;
}

export class Typography {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this._key = '';
  }
  resize(w, h) {
    this.canvas.width = w;
    this.canvas.height = h;
    this._key = '';
  }
  /** Returns true if the canvas content changed. */
  draw(t) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    const u = h / 1920;
    const vis = TITLE_WINDOWS.map((win) => visibility(t, win));
    const key = `${w}x${h}|${vis.map((v) => v.toFixed(4)).join(',')}`;
    if (key === this._key) return false;
    this._key = key;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, w, h);
    ctx.textBaseline = 'alphabetic';

    const left = w * 0.085;

    // small label — constant, so frame 0 === frame 35
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = SLATE;
    ctx.font = `500 ${Math.round(21 * u)}px ${FONT}`;
    tracked(ctx, 'MOTION STUDY / 003', left, h * 0.062, 5.2 * u);
    ctx.globalAlpha = 0.45;
    ctx.fillRect(left, h * 0.062 + 16 * u, 38 * u, Math.max(1, 1.5 * u));

    // title block, bottom-left; the lines enter one after another
    const a = Math.max(...vis);
    if (a > 0.001) {
      const base = h * 0.145;
      const lines = [
        { text: 'THE INFINITE', size: 74, y: base, color: CREAM, weight: 300, track: 15, delay: 0 },
        { text: 'ASCENT', size: 74, y: base + 92 * u, color: CREAM, weight: 300, track: 15, delay: 0.12 },
        { text: 'AN EXPERIMENT IN', size: 21, y: base + 92 * u + 62 * u, color: SLATE, weight: 500, track: 7, delay: 0.26 },
        { text: 'IMPOSSIBLE ARCHITECTURE', size: 21, y: base + 92 * u + 62 * u + 33 * u, color: SLATE, weight: 500, track: 7, delay: 0.32 },
      ];
      // use whichever window is more visible; map `a` into per-line stagger
      const phase = 0;
      const win = TITLE_WINDOWS[phase];
      for (const L of lines) {
        const li = easeOut((t - win[0] - L.delay) / (win[1] - win[0]));
        const lo = easeInOut((t - win[2] - L.delay * 0.4) / (win[3] - win[2]));
        const alpha = li * (1 - lo);
        if (alpha <= 0.001) continue;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = L.color;
        ctx.font = `${L.weight} ${Math.round(L.size * u)}px ${FONT}`;
        const rise = (1 - li) * 22 * u - lo * 10 * u;
        tracked(ctx, L.text, left, L.y + rise, L.track * u);
      }
      // hairline between title and subtitle
      const ruleA = easeOut((t - win[0] - 0.2) / (win[1] - win[0])) * (1 - easeInOut((t - win[2]) / (win[3] - win[2])));
      if (ruleA > 0.001) {
        ctx.globalAlpha = 0.55 * ruleA;
        ctx.fillStyle = SLATE;
        const ww = 150 * u;
        ctx.fillRect(left, base + 92 * u + 28 * u, ww * ruleA, Math.max(1, 1.5 * u));
      }
    }
    ctx.globalAlpha = 1;
    return true;
  }
}
