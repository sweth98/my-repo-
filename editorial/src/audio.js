// Procedural soundtrack: 112 BPM electronic bed + synthesized SFX cued from engine.SFX.
// Everything is generated with WebAudio (no sample files), and the same scheduler drives
// live playback (AudioContext) and offline export (OfflineAudioContext -> WAV).
import { SFX } from './engine.js';
export const DURATION = 60, BPM = 112, BEAT = 60 / BPM;

function noiseBuf(ctx) { const n = ctx.sampleRate * 2, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0); let s = 12345; for (let i = 0; i < n; i++) { s = (s * 1664525 + 1013904223) >>> 0; d[i] = (s / 4294967296) * 2 - 1; } return b; }
function env(g, t, a, d, peak, end = 0.0001) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + a); g.gain.exponentialRampToValueAtTime(end, t + a + d); }

const V = {
  swish(c, o, t, v) { const s = c.createBufferSource(); s.buffer = o.nb; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 1.2; f.frequency.setValueAtTime(500, t); f.frequency.exponentialRampToValueAtTime(5200, t + 0.28); const g = c.createGain(); env(g, t, 0.08, 0.28, 0.5 * v); s.connect(f).connect(g).connect(o.out); s.start(t, Math.random() * 0); s.stop(t + 0.5); },
  swishBig(c, o, t, v) { const s = c.createBufferSource(); s.buffer = o.nb; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.8; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(7000, t + 0.55); f.frequency.exponentialRampToValueAtTime(900, t + 0.9); const g = c.createGain(); env(g, t, 0.3, 0.55, 0.65 * v); s.connect(f).connect(g).connect(o.out); s.start(t); s.stop(t + 1); },
  pop(c, o, t, v) { const x = c.createOscillator(), g = c.createGain(); x.frequency.setValueAtTime(420, t); x.frequency.exponentialRampToValueAtTime(130, t + 0.12); env(g, t, 0.005, 0.14, 0.4 * v); x.connect(g).connect(o.out); x.start(t); x.stop(t + 0.2); },
  tick(c, o, t, v) { const x = c.createOscillator(), g = c.createGain(); x.type = 'triangle'; x.frequency.value = 1800; env(g, t, 0.002, 0.05, 0.18 * v); x.connect(g).connect(o.out); x.start(t); x.stop(t + 0.08); },
  paper(c, o, t, v) { const s = c.createBufferSource(); s.buffer = o.nb; const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 2500; const g = c.createGain(); env(g, t, 0.02, 0.16, 0.28 * v); s.connect(f).connect(g).connect(o.out); s.start(t); s.stop(t + 0.3); },
  pen(c, o, t, v) { const s = c.createBufferSource(); s.buffer = o.nb; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 3400; f.Q.value = 3; const g = c.createGain(); env(g, t, 0.03, 0.5, 0.1 * v); s.connect(f).connect(g).connect(o.out); s.start(t); s.stop(t + 0.7); },
  impact(c, o, t, v) { const x = c.createOscillator(), g = c.createGain(); x.frequency.setValueAtTime(150, t); x.frequency.exponentialRampToValueAtTime(48, t + 0.2); env(g, t, 0.004, 0.3, 0.7 * v); x.connect(g).connect(o.out); x.start(t); x.stop(t + 0.4); V.paper(c, o, t, v * 1.2); },
  bean(c, o, t, v) { const x = c.createOscillator(), g = c.createGain(); x.type = 'triangle'; x.frequency.setValueAtTime(900, t); x.frequency.exponentialRampToValueAtTime(300, t + 0.05); env(g, t, 0.002, 0.07, 0.25 * v); x.connect(g).connect(o.out); x.start(t); x.stop(t + 0.1); },
  grind(c, o, t, v, dur = 3) { const s = c.createBufferSource(); s.buffer = o.nb; s.loop = true; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 900; const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35 * v, t + 0.2); g.gain.setValueAtTime(0.35 * v, t + dur - 0.3); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 23; lg.gain.value = 260; lfo.connect(lg).connect(f.frequency); const x = c.createOscillator(); x.type = 'sawtooth'; x.frequency.value = 64; const xg = c.createGain(); xg.gain.value = 0.05 * v; x.connect(xg).connect(g); s.connect(f).connect(g).connect(o.out); [s, lfo, x].forEach((n) => { n.start(t); n.stop(t + dur); }); },
  pour(c, o, t, v, dur = 2) { const s = c.createBufferSource(); s.buffer = o.nb; s.loop = true; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.9; f.frequency.value = 1500; const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.22 * v, t + 0.25); g.gain.setValueAtTime(0.22 * v, t + dur - 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 9; lg.gain.value = 400; lfo.connect(lg).connect(f.frequency); s.connect(f).connect(g).connect(o.out); s.start(t); lfo.start(t); s.stop(t + dur); lfo.stop(t + dur); },
  extract(c, o, t, v, dur = 3) { V.pour(c, o, t, v * 0.8, dur); const s = c.createBufferSource(); s.buffer = o.nb; s.loop = true; const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 5500; const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.1 * v, t + 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); s.connect(f).connect(g).connect(o.out); s.start(t); s.stop(t + dur); },
  riser(c, o, t, v, dur = 1.2) { const s = c.createBufferSource(); s.buffer = o.nb; s.loop = true; const f = c.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 2; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(6000, t + dur); const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.25 * v, t + dur); g.gain.linearRampToValueAtTime(0, t + dur + 0.05); s.connect(f).connect(g).connect(o.out); s.start(t); s.stop(t + dur + 0.1); },
  bell(c, o, t, v) { [1, 2.76, 5.4].forEach((m, i) => { const x = c.createOscillator(), g = c.createGain(); x.frequency.value = 660 * m; env(g, t, 0.005, 2.2 / (i + 1), 0.16 * v / (i + 1)); x.connect(g).connect(o.out); x.start(t); x.stop(t + 2.4); }); },
};
const kick = (c, o, t, v = 1) => { const x = c.createOscillator(), g = c.createGain(); x.frequency.setValueAtTime(140, t); x.frequency.exponentialRampToValueAtTime(42, t + 0.12); env(g, t, 0.003, 0.26, 0.8 * v); x.connect(g).connect(o.out); x.start(t); x.stop(t + 0.35); };
const hat = (c, o, t, v = 1) => { const s = c.createBufferSource(); s.buffer = o.nb; const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7500; const g = c.createGain(); env(g, t, 0.001, 0.045, 0.16 * v); s.connect(f).connect(g).connect(o.out); s.start(t); s.stop(t + 0.1); };
const snare = (c, o, t, v = 1) => { V.paper(c, o, t, v * 1.5); const x = c.createOscillator(), g = c.createGain(); x.type = 'triangle'; x.frequency.value = 190; env(g, t, 0.002, 0.1, 0.25 * v); x.connect(g).connect(o.out); x.start(t); x.stop(t + 0.15); };
const note = (c, o, t, f, d, type, peak, lp = 1800) => { const x = c.createOscillator(), g = c.createGain(), fl = c.createBiquadFilter(); x.type = type; x.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = lp; env(g, t, 0.005, d, peak); x.connect(fl).connect(g).connect(o.out); x.start(t); x.stop(t + d + 0.05); };
const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

// section intensity map (0 sparse .. 1 full), aligned to the film structure
const INTENSITY = (t) => (t < 6 ? 0.35 : t < 19 ? 0.7 : t < 29 ? 0.95 : t < 37 ? 0.85 : t < 47 ? 1 : t < 56 ? 0.8 : 0.4);
const CH = [45, 41, 48, 43]; // Am F C G roots (MIDI)

export function schedule(ctx, o, from, rate = 1) {
  const at = (t) => ctx.currentTime + (t - from) / rate, ok = (t) => t >= from - 0.001 && t < DURATION;
  // music
  for (let b = 0; b * BEAT < DURATION; b++) {
    const t = b * BEAT; if (!ok(t)) continue; const I = INTENSITY(t), bar = Math.floor(b / 4), root = CH[Math.floor(bar / 2) % 4], step = b % 4;
    if (I > 0.3 && t >= 0.5) kick(ctx, o, at(t), 0.55 + 0.4 * I);
    if (t > 1) { hat(ctx, o, at(t + BEAT / 2), 0.7 + I * 0.5); if (I > 0.7) { hat(ctx, o, at(t + BEAT / 4), 0.4); hat(ctx, o, at(t + BEAT * 0.75), 0.5); } }
    if (step === 2 && I > 0.6) snare(ctx, o, at(t), I);
    if (I > 0.5) note(ctx, o, at(t + BEAT / 2), mtof(root - 12 + (step === 3 ? 7 : 0)), BEAT * 0.9, 'sawtooth', 0.11, 420);
    if (I > 0.6) [0, 7, 12, 15].forEach((iv, i) => { const tt = t + i * (BEAT / 4); if (ok(tt)) note(ctx, o, at(tt), mtof(root + 24 + iv), 0.18, 'triangle', 0.045 * I, 3200); });
    if (step === 0 && b % 8 === 0) [0, 3, 7].forEach((iv) => note(ctx, o, at(t), mtof(root + 12 + iv), BEAT * 8, 'sine', 0.035, 1400)); // soft pad
  }
  // transition risers + sfx
  [6, 13, 19, 29, 37, 47].forEach((T) => { if (ok(T - 1.3)) V.riser(ctx, o, at(T - 1.3), 0.6, 1.0); });
  const ev = SFX.filter((e) => ok(e.t)).sort((a, b) => a.t - b.t);
  ev.forEach((e) => { const f = V[e.type]; if (f) f(ctx, o, at(e.t), e.vol ?? 1, e.dur); });
  if (ok(56.05)) V.bell(ctx, o, at(56.05), 1);
}

function bus(ctx) { const nb = noiseBuf(ctx), master = ctx.createGain(), comp = ctx.createDynamicsCompressor(); master.gain.value = 0.9; master.connect(comp).connect(ctx.destination); return { nb, out: master, master }; }
let LIVE = null;
export function start(from = 0, rate = 1, muted = false) {
  stop(); const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return; const ctx = LIVE?.ctx || new AC(); ctx.resume?.();
  const o = bus(ctx); o.master.gain.value = muted ? 0 : 0.9;
  o.master.gain.setValueAtTime(muted ? 0 : 0.0001, ctx.currentTime); if (!muted) o.master.gain.exponentialRampToValueAtTime(0.9, ctx.currentTime + 0.3);
  const endT = ctx.currentTime + Math.max(0, (58.4 - from)) / rate; if (!muted && from < 58.4) { o.master.gain.setValueAtTime(0.9, endT); o.master.gain.exponentialRampToValueAtTime(0.0001, endT + 1.5 / rate); }
  schedule(ctx, o, from, rate); LIVE = { ctx, o };
}
export function stop() { if (!LIVE) return; try { LIVE.o.master.gain.cancelScheduledValues(0); LIVE.o.master.disconnect(); } catch (e) {} const ctx = LIVE.ctx; LIVE = { ctx, o: null }; }
export function setMuted(m) { if (LIVE?.o) LIVE.o.master.gain.value = m ? 0 : 0.9; }

export async function renderWav(sampleRate = 44100) {
  const ctx = new OfflineAudioContext(2, sampleRate * DURATION, sampleRate), o = bus(ctx);
  o.master.gain.setValueAtTime(0.0001, 0); o.master.gain.exponentialRampToValueAtTime(0.9, 0.5); o.master.gain.setValueAtTime(0.9, 58.4); o.master.gain.exponentialRampToValueAtTime(0.0001, 59.95);
  schedule(ctx, o, 0, 1); const buf = await ctx.startRendering();
  const L = buf.getChannelData(0), R = buf.getChannelData(1), n = L.length, out = new DataView(new ArrayBuffer(44 + n * 4)); const w = (o2, s) => [...s].forEach((ch, i) => out.setUint8(o2 + i, ch.charCodeAt(0)));
  w(0, 'RIFF'); out.setUint32(4, 36 + n * 4, true); w(8, 'WAVEfmt '); out.setUint32(16, 16, true); out.setUint16(20, 1, true); out.setUint16(22, 2, true); out.setUint32(24, sampleRate, true); out.setUint32(28, sampleRate * 4, true); out.setUint16(32, 4, true); out.setUint16(34, 16, true); w(36, 'data'); out.setUint32(40, n * 4, true);
  for (let i = 0; i < n; i++) { out.setInt16(44 + i * 4, Math.max(-1, Math.min(1, L[i])) * 32767, true); out.setInt16(46 + i * 4, Math.max(-1, Math.min(1, R[i])) * 32767, true); }
  return new Uint8Array(out.buffer);
}
