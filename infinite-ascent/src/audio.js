// Procedural soundscape, rendered offline into a loop-safe stereo buffer and played in
// sync with the timeline. Nothing is random at runtime (seeded noise), so it is deterministic.
import { DURATION } from './config.js';
import { rng } from './easing.js';
import { buildCueList } from './cues.js';
import { CURVES, curve } from './lighting.js';

const SR = 44100;
const TAIL = 5; // seconds rendered past the end, folded back onto the start for a seamless loop

function noiseBuffer(ctx, seconds, seed) {
  const r = rng(seed);
  const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
  const d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) { const w = r() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = w * 0.6 + last * 6; } // slightly pinked
  return b;
}

export async function renderSoundtrack(arch, tCross) {
  const { cues } = buildCueList(arch, tCross);
  const total = DURATION + TAIL;
  const ctx = new OfflineAudioContext(2, Math.floor(SR * total), SR);
  const master = ctx.createGain();
  master.gain.value = 0.9;
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -20; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.3;
  master.connect(comp); comp.connect(ctx.destination);
  const noise = noiseBuffer(ctx, 3.5, 31); // 3.5 s x 10 = exactly one loop
  const width = curve([[0, 0.25], [14, 0.35], [24, 1.0], [31, 1.0], [34, 0.35], [DURATION, 0.25]]);

  const panFor = (pos, t) => {
    const x = (pos.x - 10) / 22;
    return Math.max(-1, Math.min(1, x * width(t)));
  };
  const out = (pan, gain, at) => {
    const g = ctx.createGain(); g.gain.value = gain;
    const p = ctx.createStereoPanner(); p.pan.value = pan;
    g.connect(p); p.connect(master);
    void at; return g;
  };

  // ---- drone: two detuned low voices + breathy filtered noise; level loops (same at 0 and 35)
  const droneLevel = curve([[0, 0.10], [1.5, 0.16], [10, 0.2], [22, 0.3], [29, 0.36], [32, 0.25], [DURATION, 0.10]]);
  const droneG = ctx.createGain();
  droneG.connect(master);
  for (let s = 0; s <= DURATION; s += 0.25) droneG.gain.setValueAtTime(droneLevel(s), s);
  // every drone frequency is k / 35 Hz: a whole number of cycles per loop, so the seam is silent
  const cyc = (f) => Math.round(f * DURATION) / DURATION;
  for (const [f, g] of [[55, 0.5], [55.3, 0.35], [82.41, 0.18], [110.6, 0.08]]) {
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = cyc(f);
    // slow wobble with an integer number of cycles per loop => seamless
    const lfo = ctx.createOscillator(); lfo.frequency.value = 3 / DURATION; const lg = ctx.createGain(); lg.gain.value = 0.6;
    lfo.connect(lg); lg.connect(o.frequency); lfo.start(0); lfo.stop(DURATION);
    const og = ctx.createGain(); og.gain.value = g; o.connect(og); og.connect(droneG); o.start(0); o.stop(DURATION);
  }
  {
    const n = ctx.createBufferSource(); n.buffer = noise; n.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass';
    const fc = curve([[0, 240], [14, 420], [24, 900], [29, 1300], [32, 700], [DURATION, 240]]);
    for (let s = 0; s <= DURATION; s += 0.25) f.frequency.setValueAtTime(fc(s), s);
    const g = ctx.createGain(); g.gain.value = 0.35; n.connect(f); f.connect(g); g.connect(droneG); n.start(0); n.stop(DURATION);
  }

  // ---- voices
  const thud = (t, f0, dur, gain, pan, noiseAmt = 0.4) => {
    const o = ctx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(f0 * 1.6, t); o.frequency.exponentialRampToValueAtTime(f0, t + 0.08);
    const g = out(pan, 0, t); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
    o.connect(g); o.start(t); o.stop(t + dur + 0.05);
    if (noiseAmt) {
      const n = ctx.createBufferSource(); n.buffer = noise; n.playbackRate.value = 1;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900 + f0 * 6; f.Q.value = 0.8;
      const ng = out(pan, 0, t); ng.gain.setValueAtTime(gain * noiseAmt, t); ng.gain.exponentialRampToValueAtTime(0.0005, t + 0.12);
      n.connect(f); f.connect(ng); n.start(t, (t * 7.3) % 2, 0.2);
    }
  };
  const tick = (t, pan, gain) => {
    const n = ctx.createBufferSource(); n.buffer = noise;
    const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2600;
    const g = out(pan, 0, t); g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.035);
    n.connect(f); f.connect(g); n.start(t, (t * 3.1) % 2, 0.06);
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = 1900;
    const og = out(pan, 0, t); og.gain.setValueAtTime(gain * 0.25, t); og.gain.exponentialRampToValueAtTime(0.0003, t + 0.05);
    o.connect(og); o.start(t); o.stop(t + 0.07);
  };
  const sweep = (t, dur, f0, f1, gain, pan, q = 1.2) => {
    const n = ctx.createBufferSource(); n.buffer = noise; n.loop = true;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = q;
    f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = out(pan, 0, t);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + dur * 0.4); g.gain.linearRampToValueAtTime(0, t + dur);
    n.connect(f); f.connect(g); n.start(t, (t * 1.7) % 2); n.stop(t + dur + 0.1);
  };
  const resonance = (t, base, dur, gain, partials = [1, 2.01, 2.76, 4.2]) => {
    partials.forEach((p, i) => {
      const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = base * p;
      const g = out(i % 2 ? 0.2 : -0.2, 0, t);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain / (1 + i * 1.4), t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0005, t + dur / (1 + i * 0.5));
      o.connect(g); o.start(t); o.stop(t + dur + 0.1);
    });
  };

  resonance(1.05, 196, 3.2, 0.16);
  for (const c of cues) {
    const pan = panFor(c.pos, c.t);
    const w = c.w;
    switch (c.kind) {
      case 'stone': thud(c.t, 62 + (c.pos.y * 1.3) % 30, 0.45, 0.2 * w, pan); break;
      case 'click': tick(c.t, pan, 0.07 * w); break;
      case 'slab': thud(c.t, 48, 0.8, 0.26 * w, pan, 0.5); break;
      case 'slide': sweep(c.t, 0.7, 220, 520, 0.045 * w, pan, 2); break;
      case 'clunk': thud(c.t, 80, 0.3, 0.14 * w, pan, 0.3); tick(c.t + 0.01, pan, 0.05); break;
      case 'low': thud(c.t, 38, 1.4, 0.24 * w, pan, 0.2); break;
      case 'shards': for (let k = 0; k < 9; k++) tick(c.t + 0.15 * k + (k * k % 5) * 0.03, pan + (k % 3 - 1) * 0.3, 0.04); break;
      default: break;
    }
  }
  // portal / camera / reveal / retract — gradual and restrained
  sweep(18.3, 1.8, 300, 1800, 0.08, 0.0, 1.0);
  sweep(tCross - 0.6, 1.6, 400, 3400, 0.12, -0.3, 0.9);
  sweep(22.0, 7.0, 500, 4200, 0.07, 0.4, 0.7);
  sweep(24.0, 5.0, 900, 2200, 0.05, -0.5, 0.7);
  resonance(29.0, 41.2, 5.5, 0.2, [1, 1.5, 2.0]);
  sweep(31.0, 3.5, 3200, 280, 0.06, 0.0, 0.8);

  const rendered = await ctx.startRendering();
  // fold the tail onto the start so the loop is seamless
  const n = Math.floor(SR * DURATION);
  const buf = new AudioBuffer({ length: n, numberOfChannels: 2, sampleRate: SR });
  let peak = 0;
  for (let ch = 0; ch < 2; ch++) {
    const src = rendered.getChannelData(ch);
    const dst = buf.getChannelData(ch);
    for (let i = 0; i < n; i++) dst[i] = src[i];
    for (let i = 0; i < Math.floor(SR * TAIL); i++) dst[i] += src[n + i] ?? 0;
    for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(dst[i]));
  }
  const norm = 0.7 / Math.max(peak, 1e-4);
  for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < n; i++) d[i] *= norm; }
  return buf;
}

export function bufferToWav(buf) {
  const ch = buf.numberOfChannels;
  const len = buf.length * ch * 2;
  const ab = new ArrayBuffer(44 + len);
  const v = new DataView(ab);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + len, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true);
  v.setUint16(22, ch, true); v.setUint32(24, buf.sampleRate, true); v.setUint32(28, buf.sampleRate * ch * 2, true);
  v.setUint16(32, ch * 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, len, true);
  const d = [0, 1].map((c) => buf.getChannelData(c));
  let o = 44;
  for (let i = 0; i < buf.length; i++) for (let c = 0; c < ch; c++) { const s = Math.max(-1, Math.min(1, d[c][i])); v.setInt16(o, s * 32767, true); o += 2; }
  return new Blob([ab], { type: 'audio/wav' });
}

export class AudioPlayer {
  constructor(film) { this.film = film; this.ctx = null; this.buffer = null; this.src = null; this.on = false; this.t0 = 0; }
  async enable() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: SR });
    await this.ctx.resume();
    if (!this.buffer) this.buffer = await renderSoundtrack(this.film.arch, this.film.rig.tCross);
    this.on = true;
  }
  start(t) {
    this.stop();
    if (!this.on) return;
    const s = this.ctx.createBufferSource();
    s.buffer = this.buffer; s.loop = true;
    s.connect(this.ctx.destination);
    s.start(0, t % DURATION);
    this.src = s; this.t0 = this.ctx.currentTime - t;
  }
  stop() { if (this.src) { try { this.src.stop(); } catch {} this.src.disconnect(); this.src = null; } }
  /** Re-sync if playback drifted from the timeline by more than ~80 ms. */
  sync(t) {
    if (!this.src) return;
    const at = (this.ctx.currentTime - this.t0) % DURATION;
    let d = Math.abs(at - t); d = Math.min(d, DURATION - d);
    if (d > 0.08) this.start(t);
  }
}
