// Sound cue list: derived from the very same timeline that drives the pictures,
// so every impact lands on the frame where the component locks in.
import { DURATION } from './config.js';

export function buildCueList(arch, tCross = 20.3) {
  const cues = arch.cues.map((c) => ({ ...c }));
  const design = [
    { t: 0.0, kind: 'drone', note: 'Atmospheric drone fades up (identical level at 0 s and 35 s so it loops)' },
    { t: 1.05, kind: 'resonance', note: 'One quiet stone resonance as the first tread shifts into place' },
    { t: 18.3, kind: 'portal', note: 'Portal iris opens — soft airy swell' },
    { t: tCross, kind: 'whoosh', note: 'Camera passes through the monumental opening — spatial whoosh, stereo field opens' },
    { t: 22.0, kind: 'rise', note: 'Gradual atmospheric rise begins (filtered air, widening stereo)' },
    { t: 24.0, kind: 'orbit', note: 'Orbital movement — slow spatial sweeps' },
    { t: 29.0, kind: 'reveal', note: 'Final reveal: deep, restrained resonance (no trailer boom)' },
    { t: 31.0, kind: 'recede', note: 'Structure retracts — soft descending air, returns to opening ambience' },
  ];
  return { cues, design, duration: DURATION };
}

export function cueSheetMarkdown(arch, tCross) {
  const { cues, design } = buildCueList(arch, tCross);
  const fmt = (t) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${(t % 60).toFixed(2).padStart(5, '0')}`;
  const lines = [];
  lines.push('# THE INFINITE ASCENT — sound cue sheet');
  lines.push('');
  lines.push('Generated from the master timeline (`npm run cuesheet`). Duration 35.00 s, 30 fps (frame = t × 30).');
  lines.push('The in-browser soundtrack is synthesised from exactly these cues; the same list can drive a DAW session.');
  lines.push('');
  lines.push('## Design cues');
  lines.push('| Time | Frame | Cue | Note |');
  lines.push('|---|---|---|---|');
  for (const d of [...design].sort((a, b) => a.t - b.t)) lines.push(`| ${fmt(d.t)} | ${Math.round(d.t * 30)} | ${d.kind} | ${d.note} |`);
  lines.push('');
  lines.push('## Construction cues (component settle events)');
  lines.push('| Time | Frame | Cue | Weight | World position (x, y, z) |');
  lines.push('|---|---|---|---|---|');
  const p = (v) => `${v.x.toFixed(1)}, ${v.y.toFixed(1)}, ${v.z.toFixed(1)}`;
  for (const c of [...cues].sort((a, b) => a.t - b.t)) {
    lines.push(`| ${fmt(c.t)} | ${Math.round(c.t * 30)} | ${c.kind} | ${c.w.toFixed(1)} | ${p(c.pos)} |`);
  }
  lines.push('');
  lines.push('Cue vocabulary: `stone` soft stone impact · `click` precise latch click · `slab` heavy slab settle · `slide` low mechanical slide · `clunk` beam seat · `low` deep column lock · `shards` fragment grain.');
  return lines.join('\n');
}
