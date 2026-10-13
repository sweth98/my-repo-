import * as THREE from 'three';

const COLS = 16;
const ROWS = 8;
const CELL = 64;

// Deterministic PRNG so the abstract "machine pattern" glyphs are stable between runs.
function mulberry(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function drawPattern(ctx, rnd, cx, cy) {
  // Random polyline across a 3x4 node grid: reads as a cryptic machine-readable mark.
  const gw = 14, gh = 13;
  const node = () => [cx + (Math.floor(rnd() * 3) - 1) * gw, cy + (Math.floor(rnd() * 4) - 1.5) * gh];
  ctx.lineWidth = 4;
  ctx.lineCap = 'square';
  ctx.beginPath();
  let [x, y] = node();
  ctx.moveTo(x, y);
  const steps = 3 + Math.floor(rnd() * 3);
  for (let i = 0; i < steps; i++) {
    [x, y] = node();
    ctx.lineTo(x, y);
  }
  ctx.stroke();
  if (rnd() > 0.5) {
    const [dx, dy] = node();
    ctx.fillRect(dx - 3, dy - 3, 6, 6);
  }
}

/** Builds the 16x8 glyph atlas (white on black) used by every rain layer. */
export function createGlyphAtlas(renderer) {
  const canvas = document.createElement('canvas');
  canvas.width = COLS * CELL;
  canvas.height = ROWS * CELL;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 42px "JetBrains Mono","DejaVu Sans Mono",Menlo,Consolas,monospace';

  const digits = '0123456789'.repeat(2) + '01'.repeat(4);
  const latin = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + 'acdefghkmnrstuyz';
  const math = '+−×÷=≠≈∑∏∫√∞∂∇π≤≥±<>∈∩∪⊕⊗∴∀∃Δλμσφψω';
  const mirrored = 'EZSJ3L7RKNHB';

  const items = [];
  for (const ch of digits + latin + math) items.push({ ch, flip: false });
  for (const ch of mirrored) items.push({ ch, flip: true });
  const rnd = mulberry(1999);
  while (items.length < COLS * ROWS) items.push({ pattern: true });
  items.length = COLS * ROWS;

  items.forEach((it, i) => {
    const cx = (i % COLS) * CELL + CELL / 2;
    const cy = Math.floor(i / COLS) * CELL + CELL / 2;
    if (it.pattern) {
      drawPattern(ctx, rnd, cx, cy);
    } else if (it.flip) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(-1, 1);
      ctx.fillText(it.ch, 0, 2);
      ctx.restore();
    } else {
      ctx.fillText(it.ch, cx, cy + 2);
    }
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  tex.colorSpace = THREE.NoColorSpace;
  tex.needsUpdate = true;
  return tex;
}
