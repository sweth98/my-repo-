// Procedural soundtrack: the whole 60 s mix is rendered once with an OfflineAudioContext (all events placed at
// absolute times, seeded randomness), then played back from any timestamp – so audio scrubs/syncs with the film.
// NOTE: this is synthesized sound, not recorded audio. See soundTimeline.js for the cue sheet.
import { DURATION } from '../animation/masterTimeline';
import { mulberry32 } from '../animation/util';

const SR = 44100;
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
const BPM = 96, BEAT = 60 / BPM;

function makeNoise(ctx, secs, seed = 1) {
  const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * secs), ctx.sampleRate);
  const d = buf.getChannelData(0), r = mulberry32(seed);
  for (let i = 0; i < d.length; i++) d[i] = r() * 2 - 1;
  return buf;
}
function impulse(ctx, secs = 2.8, seed = 9) {
  const n = Math.floor(ctx.sampleRate * secs), buf = ctx.createBuffer(2, n, ctx.sampleRate), r = mulberry32(seed);
  for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < n; i++) d[i] = (r() * 2 - 1) * Math.pow(1 - i / n, 2.6); }
  return buf;
}

export async function renderSoundtrack(onProgress) {
  const ctx = new OfflineAudioContext(2, Math.ceil(SR * DURATION), SR);
  const noise = makeNoise(ctx, 4, 3);
  const rand = mulberry32(2024);
  // buses ---------------------------------------------------------------
  const master = ctx.createGain(); master.gain.value = 0.85;
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.attack.value = 0.01; comp.release.value = 0.25;
  const lim = ctx.createGain(); master.connect(comp); comp.connect(lim); lim.connect(ctx.destination);
  lim.gain.setValueAtTime(1, DURATION - 1.2); lim.gain.linearRampToValueAtTime(0.0, DURATION - 0.02);
  const verb = ctx.createConvolver(); verb.buffer = impulse(ctx); const verbGain = ctx.createGain(); verbGain.gain.value = 0.32; verb.connect(verbGain); verbGain.connect(master);
  const mk = (g) => { const b = ctx.createGain(); b.gain.value = g; b.connect(master); const s = ctx.createGain(); s.gain.value = 0.5; b.connect(s); s.connect(verb); return b; };
  const musicBus = mk(0.9), sfxBus = mk(0.9), ambBus = mk(0.8);
  const pan = (node, p, dest) => { const st = ctx.createStereoPanner(); st.pan.value = p; node.connect(st); st.connect(dest); return st; };

  // primitives ------------------------------------------------------------
  function tone({ t: t_, dur = 0.5, f, f2 = null, type = 'sine', g = 0.2, a = 0.005, r = 0.2, lp = 0, bus = sfxBus, p = 0, det = 0 }) {
    const t = Math.max(0, t_);
    const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur); o.detune.value = det;
    const e = ctx.createGain(); e.gain.setValueAtTime(0.0001, t); e.gain.linearRampToValueAtTime(g, t + a); e.gain.setTargetAtTime(0.0001, t + Math.max(a, dur - r), r / 3);
    let n = o; if (lp) { const f_ = ctx.createBiquadFilter(); f_.type = 'lowpass'; f_.frequency.value = lp; o.connect(f_); n = f_; }
    n.connect(e); pan(e, p, bus); o.start(t); o.stop(t + dur + r);
  }
  function hit({ t: t_, dur = 0.2, g = 0.2, type = 'bandpass', f = 1000, f2 = null, q = 1, a = 0.002, p = 0, bus = sfxBus, off = null }) {
    const t = Math.max(0, t_);
    const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true;
    const flt = ctx.createBiquadFilter(); flt.type = type; flt.frequency.setValueAtTime(f, t); if (f2) flt.frequency.exponentialRampToValueAtTime(f2, t + dur); flt.Q.value = q;
    const e = ctx.createGain(); e.gain.setValueAtTime(0.0001, t); e.gain.linearRampToValueAtTime(g, t + a); e.gain.setTargetAtTime(0.0001, t + a, dur / 3.2);
    s.connect(flt); flt.connect(e); pan(e, p, bus); s.start(t, off ?? rand() * 3); s.stop(t + dur * 1.6 + 0.05);
  }
  /** continuous noise bed with a gain envelope [[time, gain], ...] and optional LFO */
  function bed({ t0, t1, env, f = 800, f2 = null, type = 'bandpass', q = 0.7, bus = ambBus, lfo = 0, lfoDepth = 0.4, p = 0 }) {
    const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true;
    const flt = ctx.createBiquadFilter(); flt.type = type; flt.frequency.setValueAtTime(f, t0); if (f2) flt.frequency.exponentialRampToValueAtTime(f2, t1); flt.Q.value = q;
    const gn = ctx.createGain(); gn.gain.setValueAtTime(0.0001, t0);
    env.forEach(([tt, gg]) => gn.gain.linearRampToValueAtTime(Math.max(0.0001, gg), tt));
    gn.gain.linearRampToValueAtTime(0.0001, t1);
    s.connect(flt); flt.connect(gn);
    if (lfo) { const l = ctx.createOscillator(); l.frequency.value = lfo; const lg = ctx.createGain(); lg.gain.value = lfoDepth * 0.5; l.connect(lg); const dc = ctx.createGain(); dc.gain.value = 1 - lfoDepth * 0.5; gn.connect(dc); lg.connect(dc.gain); l.start(t0); l.stop(t1 + 0.1); pan(dc, p, bus); }
    else pan(gn, p, bus);
    s.start(t0, rand() * 2); s.stop(t1 + 0.1);
  }
  function bell(t, f, g = 0.12, dur = 3.2, bus = musicBus, p = 0) {
    [[1, 1], [2.76, 0.45], [5.4, 0.22], [8.93, 0.1]].forEach(([m, a]) => tone({ t, dur: dur / (0.6 + m * 0.4), f: f * m, g: g * a, a: 0.003, r: dur / (0.6 + m * 0.4) * 0.9, bus, p }));
  }
  const thud = (t, g = 0.5, f = 95, f2 = 42, dur = 0.35) => { tone({ t, dur, f, f2, g, a: 0.003, r: dur * 0.9, bus: sfxBus }); hit({ t, dur: 0.08, g: g * 0.35, type: 'lowpass', f: 600, bus: sfxBus }); };
  const click = (t, g = 0.15, f = 3200) => hit({ t, dur: 0.012, g, type: 'highpass', f, q: 0.7, a: 0.0005, p: rand() - 0.5 });

  // MUSIC -----------------------------------------------------------------
  const chords = [[48, 55, 64, 71, 74], [45, 52, 60, 67, 71], [41, 48, 57, 64, 72], [43, 50, 59, 62, 69],
    [48, 55, 64, 71, 74], [45, 52, 60, 67, 76], [41, 48, 57, 64, 72], [48, 55, 64, 67, 72]];
  const CH = DURATION / chords.length;
  const level = (t) => (t < 10 ? 0.5 + t * 0.03 : t < 27 ? 0.8 + (t - 10) * 0.02 : t < 45 ? 1.15 : t < 55 ? 1.25 : 1.0);
  chords.forEach((ch, ci) => {
    const t0 = ci * CH, t1 = t0 + CH + 1.6;
    ch.forEach((n, i) => {
      [-9, 0, 9].forEach((det) => {
        tone({ t: t0 - 0.2, dur: CH + 1.6, f: midi(n + (i === 0 ? 0 : 0)), type: i < 2 ? 'sawtooth' : 'triangle', g: (i < 2 ? 0.014 : 0.012) * level(t0), a: 1.6, r: 1.6, lp: 850 + ci * 90, det, bus: musicBus, p: (i - 2) * 0.15 });
      });
    });
    if (t0 >= 20) tone({ t: t0, dur: CH, f: midi(ch[0] - 12), type: 'sine', g: 0.2 * Math.min(1, level(t0) - 0.7), a: 0.08, r: 0.8, bus: musicBus });
  });
  // kalimba-like arpeggio
  const step = BEAT / 2;
  for (let t = 3.1; t < 56; t += step) {
    const idx = Math.round((t - 3.1) / step), ci = Math.min(chords.length - 1, Math.floor(t / CH));
    const dens = t < 10 ? 2 : t < 27 ? 1 : 1; if (idx % dens) continue;
    const ch = chords[ci]; const note = ch[(idx * 2 + (idx >> 2)) % ch.length] + 12 + (idx % 8 === 7 ? 12 : 0);
    const gA = (t < 10 ? 0.07 : 0.09) * (t > 52 ? 1 - (t - 52) / 4 : 1);
    tone({ t, dur: 0.9, f: midi(note), type: 'triangle', g: gA, a: 0.003, r: 0.8, lp: 3600, bus: musicBus, p: Math.sin(idx) * 0.5 });
    tone({ t, dur: 0.3, f: midi(note) * 2, type: 'sine', g: gA * 0.35, a: 0.002, r: 0.25, bus: musicBus, p: Math.sin(idx) * 0.5 });
  }
  // percussion: shaker 8ths from 10s, frame-drum on bar downbeats from 15s, rim/snare on 2&4 from 27s, build to 45s
  for (let t = 10; t < 56; t += step) {
    const idx = Math.round(t / step), accent = idx % 2 === 0;
    const lvl = t < 27 ? 0.5 : 1;
    hit({ t, dur: 0.07, g: (accent ? 0.05 : 0.032) * lvl * (t > 53 ? 0.5 : 1), type: 'highpass', f: 6200, q: 0.5, p: accent ? -0.2 : 0.25, bus: musicBus });
  }
  for (let t = 15; t < 55.5; t += BEAT * 4) { thud(t, t < 27 ? 0.22 : 0.35, 110, 52, 0.45); if (t >= 27) thud(t + BEAT * 2.5, 0.2, 100, 50, 0.3); }
  for (let t = 27 + BEAT; t < 53; t += BEAT * 2) { hit({ t, dur: 0.16, g: 0.07, type: 'bandpass', f: 1900, q: 0.8, bus: musicBus, p: 0.1 }); tone({ t, dur: 0.1, f: 330, f2: 190, g: 0.05, bus: musicBus }); }
  // resolution
  [55.0, 58.4].forEach((t, i) => chords[chords.length - 1].slice(1).forEach((n, k) => bell(t + k * 0.12, midi(n + 12), i ? 0.1 : 0.06, i ? 3.4 : 2.4, musicBus, (k - 1.5) * 0.3)));

  // AMBIENCE / SFX ---------------------------------------------------------
  // 1 plantation
  bed({ t0: 0, t1: 6, env: [[0.6, 0.05], [4, 0.06], [5.5, 0.025]], f: 420, q: 0.5, lfo: 0.23, lfoDepth: 0.6 });
  bed({ t0: 0, t1: 5.5, env: [[1, 0.012], [4, 0.015]], f: 4200, type: 'highpass', q: 0.4, lfo: 0.7, lfoDepth: 0.8, p: 0.2 });
  [[0.9, 3600, 0.4], [1.0, 4100, 0.4], [1.12, 3900, 0.4], [2.4, 2800, -0.5], [2.52, 3300, -0.5], [3.3, 4300, 0.6], [3.42, 3700, 0.6], [3.55, 4400, 0.6], [4.2, 3100, -0.3]].forEach(([t, f, p]) => tone({ t, dur: 0.09, f, f2: f * 1.3, g: 0.028, a: 0.005, r: 0.07, bus: ambBus, p }));
  // 2 harvest
  hit({ t: 7.42, dur: 0.1, g: 0.12, type: 'highpass', f: 1500 }); tone({ t: 7.45, dur: 0.18, f: 420, f2: 190, g: 0.14, a: 0.002, r: 0.15 });
  bed({ t0: 7.5, t1: 9.2, env: [[8.1, 0.05], [8.8, 0.02]], f: 900, f2: 300, q: 0.5 });
  thud(9.05, 0.38, 150, 70, 0.4); hit({ t: 9.05, dur: 0.25, g: 0.1, type: 'lowpass', f: 900 });
  // 3 processing
  hit({ t: 10.2, dur: 0.5, g: 0.1, type: 'bandpass', f: 500, f2: 1600, q: 1.2 }); hit({ t: 10.9, dur: 0.4, g: 0.07, type: 'bandpass', f: 800, f2: 2400, q: 1.5 });
  bed({ t0: 11.0, t1: 15.4, env: [[12.2, 0.045], [13.5, 0.075], [14.8, 0.06]], f: 1400, q: 0.5, lfo: 1.7, lfoDepth: 0.5 });
  for (let i = 0; i < 26; i++) { const t = 12.5 + rand() * 2.5; tone({ t, dur: 0.07, f: 500 + rand() * 500, f2: 900 + rand() * 900, g: 0.03, a: 0.004, r: 0.05, bus: ambBus, p: rand() - 0.5 }); }
  hit({ t: 12.45, dur: 0.6, g: 0.14, type: 'bandpass', f: 1500, f2: 400, q: 0.8 });
  tone({ t: 12.0, dur: 3.2, f: 82, g: 0.05, type: 'sawtooth', lp: 220, a: 0.8, r: 0.8, bus: ambBus });
  // 4 green bean / drying
  bed({ t0: 15, t1: 20.2, env: [[16, 0.018], [18, 0.03]], f: 2600, type: 'bandpass', q: 0.4, lfo: 0.4, lfoDepth: 0.7 });
  for (let i = 0; i < 70; i++) { const t = 17.3 + rand() * 2.7; hit({ t, dur: 0.02, g: 0.02 + rand() * 0.03, type: 'bandpass', f: 1800 + rand() * 3000, q: 1.5, bus: ambBus, p: rand() * 2 - 1 }); }
  thud(17.9, 0.12, 220, 120, 0.2);
  // 5 roast
  click(20.2, 0.18, 1800); hit({ t: 20.15, dur: 0.6, g: 0.06, type: 'bandpass', f: 400, f2: 900, q: 1 });
  for (let i = 0; i < 90; i++) hit({ t: 20.9 + i * 0.011 + rand() * 0.006, dur: 0.03, g: 0.025 + rand() * 0.04, type: 'bandpass', f: 1500 + rand() * 2500, q: 1.4, p: rand() * 0.6 - 0.3 });
  // drum motor ramps up then rolls
  const motor = ctx.createOscillator(); motor.type = 'sawtooth'; motor.frequency.setValueAtTime(30, 21.9); motor.frequency.linearRampToValueAtTime(58, 23.4);
  const mf = ctx.createBiquadFilter(); mf.type = 'lowpass'; mf.frequency.value = 240; const mg = ctx.createGain(); mg.gain.setValueAtTime(0.0001, 21.9); mg.gain.linearRampToValueAtTime(0.085, 23.3); mg.gain.setValueAtTime(0.085, 26.4); mg.gain.linearRampToValueAtTime(0.0001, 27.2);
  motor.connect(mf); mf.connect(mg); pan(mg, 0, sfxBus); motor.start(21.9); motor.stop(27.3);
  for (let t = 22.3; t < 26.9; t += 0.52) { hit({ t, dur: 0.38, g: 0.07, type: 'lowpass', f: 380, q: 0.6 }); hit({ t: t + 0.18, dur: 0.14, g: 0.035, type: 'bandpass', f: 1400, q: 1 }); }
  bed({ t0: 22.2, t1: 27.1, env: [[23.5, 0.035], [26, 0.045]], f: 320, type: 'lowpass', q: 0.7 });
  for (let i = 0; i < 130; i++) { const d = Math.pow(rand(), 0.7); const t = 24.5 + d * 2.4; const big = rand() > 0.82; hit({ t, dur: big ? 0.05 : 0.018, g: big ? 0.11 : 0.045 + rand() * 0.04, type: 'highpass', f: big ? 1400 : 2600, q: 0.8, p: rand() * 1.6 - 0.8 }); if (big) tone({ t, dur: 0.05, f: 500 + rand() * 300, f2: 250, g: 0.05, a: 0.001, r: 0.04 }); }
  // 6 transformation
  thud(27.02, 0.7, 70, 34, 0.9); hit({ t: 27.0, dur: 0.9, g: 0.12, type: 'lowpass', f: 500, f2: 120 });
  bed({ t0: 26.0, t1: 27.05, env: [[26.9, 0.07]], f: 400, f2: 5000, type: 'bandpass', q: 0.7 });
  thud(28.5, 0.55, 80, 38, 0.8);
  for (let i = 0; i < 120; i++) { const t = 28.5 + Math.pow(rand(), 1.4) * 2.6; hit({ t, dur: 0.025, g: 0.02 + rand() * 0.03, type: 'bandpass', f: 1200 + rand() * 3500, q: 1.6, bus: sfxBus, p: rand() * 2 - 1 }); }
  bed({ t0: 30.7, t1: 32.1, env: [[32.0, 0.1]], f: 300, type: 'bandpass', q: 0.9 });
  // 7 grind
  const gm = ctx.createOscillator(); gm.type = 'sawtooth'; gm.frequency.setValueAtTime(40, 32.5); gm.frequency.linearRampToValueAtTime(96, 33.3);
  const gf = ctx.createBiquadFilter(); gf.type = 'lowpass'; gf.frequency.value = 700; gf.Q.value = 2; const gg = ctx.createGain(); gg.gain.setValueAtTime(0.0001, 32.5); gg.gain.linearRampToValueAtTime(0.1, 33.3); gg.gain.setValueAtTime(0.1, 36.6); gg.gain.linearRampToValueAtTime(0.0001, 37.0);
  const lfo = ctx.createOscillator(); lfo.frequency.value = 29; const lg = ctx.createGain(); lg.gain.value = 0.04; lfo.connect(lg); lg.connect(gg.gain);
  gm.connect(gf); gf.connect(gg); pan(gg, 0, sfxBus); gm.start(32.5); gm.stop(37.1); lfo.start(32.5); lfo.stop(37.1);
  bed({ t0: 33.0, t1: 37.0, env: [[33.6, 0.06], [36.5, 0.06]], f: 1500, q: 0.9, bus: sfxBus, lfo: 29, lfoDepth: 0.6 });
  bed({ t0: 34.0, t1: 37.1, env: [[34.4, 0.05], [36.6, 0.06]], f: 5200, type: 'highpass', q: 0.5, bus: sfxBus, p: 0.3 });
  for (let i = 0; i < 60; i++) { const t = 33.0 + rand() * 3.8; hit({ t, dur: 0.025, g: 0.03 + rand() * 0.05, type: 'bandpass', f: 900 + rand() * 1600, q: 2, bus: sfxBus, p: rand() * 2 - 1 }); }
  // 8 brew
  thud(37.82, 0.25, 180, 90, 0.18); hit({ t: 37.82, dur: 0.1, g: 0.08, type: 'highpass', f: 2200 });
  tone({ t: 39.35, dur: 0.12, f: 2300, g: 0.1, a: 0.001, r: 0.1 }); tone({ t: 39.35, dur: 0.1, f: 3100, g: 0.05, a: 0.001, r: 0.08 }); thud(39.38, 0.2, 140, 80, 0.15);
  const pm = ctx.createOscillator(); pm.type = 'sawtooth'; pm.frequency.setValueAtTime(50, 39.5); pm.frequency.linearRampToValueAtTime(100, 40.8);
  const pf = ctx.createBiquadFilter(); pf.type = 'lowpass'; pf.frequency.value = 520; const pg = ctx.createGain(); pg.gain.setValueAtTime(0.0001, 39.5); pg.gain.linearRampToValueAtTime(0.09, 40.4); pg.gain.setValueAtTime(0.09, 48.4); pg.gain.linearRampToValueAtTime(0.0001, 49.1);
  const pl = ctx.createOscillator(); pl.frequency.value = 6.5; const plg = ctx.createGain(); plg.gain.value = 0.014; pl.connect(plg); plg.connect(pg.gain);
  pm.connect(pf); pf.connect(pg); pan(pg, 0, sfxBus); pm.start(39.5); pm.stop(49.2); pl.start(39.5); pl.stop(49.2);
  bed({ t0: 39.5, t1: 41.4, env: [[40, 0.05]], f: 6500, type: 'highpass', q: 0.5, bus: sfxBus });
  for (let j = 0; j < 5; j++) { const t = 40.1 + j * 0.2; tone({ t, dur: 0.08, f: 1500 + j * 90, f2: 900, g: 0.07, a: 0.002, r: 0.07 }); }
  bed({ t0: 40.9, t1: 48.8, env: [[42.2, 0.085], [47, 0.1], [48.4, 0.07]], f: 1100, q: 1.1, bus: sfxBus, lfo: 5.5, lfoDepth: 0.35 });
  bed({ t0: 41.5, t1: 48.6, env: [[44, 0.035], [48, 0.04]], f: 3500, q: 0.8, bus: sfxBus, lfo: 11, lfoDepth: 0.5, p: 0.2 });
  for (let i = 0; i < 40; i++) { const t = 42 + i * 0.16 + rand() * 0.1; if (t < 48.4) tone({ t, dur: 0.08, f: 400 + i * 12 + rand() * 80, f2: 700 + i * 14, g: 0.03, a: 0.003, r: 0.06, p: rand() - 0.5 }); }
  // 9 cup
  const cupT = 45.38; [[3300, 0.14], [4550, 0.08], [7900, 0.04]].forEach(([f, g]) => tone({ t: cupT, dur: 0.35, f, g, a: 0.001, r: 0.3 })); thud(cupT, 0.16, 210, 130, 0.12);
  bed({ t0: 46.5, t1: 58.2, env: [[49, 0.022], [55, 0.02]], f: 5200, type: 'highpass', q: 0.4, bus: ambBus, lfo: 0.3, lfoDepth: 0.6 });
  [48.75, 49.1, 49.7].forEach((t, i) => tone({ t, dur: 0.09, f: 900 - i * 120, f2: 520, g: 0.07, a: 0.003, r: 0.08 }));
  // 10 circle
  for (let i = 0; i < 6; i++) tone({ t: 55.3 + i * 0.07, dur: 0.5, f: midi(84 + [0, 4, 7, 11, 12, 16][i]), g: 0.035, a: 0.002, r: 0.45, bus: musicBus, p: (i - 3) * 0.2 });
  bed({ t0: 57.3, t1: 58.6, env: [[58.0, 0.09]], f: 500, f2: 3000, type: 'bandpass', q: 0.6, bus: sfxBus });
  // transition air hits on the cuts
  [5, 10, 15, 20, 37, 45].forEach((t) => hit({ t: t - 0.2, dur: 0.5, g: 0.05, type: 'bandpass', f: 600, f2: 3500, q: 0.7, bus: sfxBus }));
  onProgress && onProgress(0.5);
  const buf = await ctx.startRendering();
  onProgress && onProgress(1);
  return buf;
}

/** Playback of the pre-rendered soundtrack from any timestamp. */
export class SoundPlayer {
  constructor() { this.buffer = null; this.ctx = null; this.src = null; this.gain = null; this.startedAt = 0; this.offset = 0; this.muted = false; this.volume = 0.9; }
  async prepare(onProgress) { if (!this.buffer) this.buffer = await renderSoundtrack(onProgress); return this.buffer; }
  _ensure() {
    if (!this.ctx) { this.ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: SR }); this.gain = this.ctx.createGain(); this.gain.connect(this.ctx.destination); }
    this.gain.gain.value = this.muted ? 0 : this.volume;
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }
  stop() { if (this.src) { try { this.src.stop(); } catch (e) { /* already stopped */ } this.src.disconnect(); this.src = null; } }
  playFrom(t) {
    if (!this.buffer) return;
    this._ensure(); this.stop();
    const s = this.ctx.createBufferSource(); s.buffer = this.buffer; s.connect(this.gain);
    s.start(0, Math.max(0, Math.min(DURATION - 0.01, t))); this.src = s; this.startedAt = this.ctx.currentTime; this.offset = t;
  }
  position() { return this.src ? this.offset + (this.ctx.currentTime - this.startedAt) : null; }
  setMuted(m) { this.muted = m; if (this.gain) this.gain.gain.value = m ? 0 : this.volume; }
  setVolume(v) { this.volume = v; if (this.gain && !this.muted) this.gain.gain.value = v; }
}
export const soundPlayer = new SoundPlayer();
