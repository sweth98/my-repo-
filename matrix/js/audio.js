// Procedural sound design (WebAudio). No audio assets and no network: everything is synthesised.
// The context is only created after a user gesture (the Start button).

export class AudioEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.noise = null;
    this.lastKey = 0;
    this.nodes = [];
    this.muted = false;
    try { this.muted = localStorage.getItem('matrix.muted') === '1'; } catch { /* storage unavailable */ }
    this.supported = !!(window.AudioContext || window.webkitAudioContext);
  }

  get active() { return !!this.ctx; }

  async start() {
    if (!this.supported) return false;
    if (this.ctx) { if (this.ctx.state === 'suspended') await this.ctx.resume(); return true; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = this.ctx = new AC();
      this.master = ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.8;
      this.master.connect(ctx.destination);

      const len = Math.floor(ctx.sampleRate * 0.5);
      this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

      this._hum();
      if (ctx.state === 'suspended') await ctx.resume();
      return true;
    } catch {
      this.supported = false;
      this.ctx = null;
      return false;
    }
  }

  _hum() {
    const ctx = this.ctx;
    const out = ctx.createGain();
    out.gain.value = 0.0;
    out.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 4);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 240; lp.Q.value = 0.6;
    lp.connect(out); out.connect(this.master);

    const mk = (type, f, g) => {
      const o = ctx.createOscillator(); const gn = ctx.createGain();
      o.type = type; o.frequency.value = f; gn.gain.value = g;
      o.connect(gn); gn.connect(lp); o.start();
      this.nodes.push(o);
    };
    mk('sine', 49, 0.07); mk('sine', 49.6, 0.055); mk('triangle', 98.4, 0.018); mk('sine', 147.2, 0.006);

    // slow breathing on the hum
    const lfo = ctx.createOscillator(); const lg = ctx.createGain();
    lfo.frequency.value = 0.07; lg.gain.value = 0.18;
    lfo.connect(lg); lg.connect(out.gain); lfo.start();
    this.nodes.push(lfo);

    // faint air bed
    const src = ctx.createBufferSource(); src.buffer = this.noise; src.loop = true;
    const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 0.7;
    const ng = ctx.createGain(); ng.gain.value = 0.004;
    src.connect(bp); bp.connect(ng); ng.connect(this.master); src.start();
    this.nodes.push(src);
  }

  setMuted(m) {
    this.muted = m;
    try { localStorage.setItem('matrix.muted', m ? '1' : '0'); } catch { /* ignore */ }
    if (this.master) this.master.gain.setTargetAtTime(m ? 0 : 0.8, this.ctx.currentTime, 0.08);
  }

  _tone(freq, t0, dur, gain, type = 'sine', slideTo = null) {
    const ctx = this.ctx;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(this.master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  _burst(t0, dur, gain, freq, q = 1) {
    const ctx = this.ctx;
    const s = ctx.createBufferSource(); s.buffer = this.noise;
    const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    s.connect(f); f.connect(g); g.connect(this.master);
    s.start(t0, Math.random() * 0.3, dur + 0.02);
  }

  startup() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + 0.05;
    [220, 330, 495, 660].forEach((f, i) => this._tone(f, t + i * 0.22, 0.7, 0.045));
  }

  key() {
    if (!this.ctx || this.muted) return;
    const now = this.ctx.currentTime;
    if (now - this.lastKey < 0.03) return;
    this.lastKey = now;
    this._burst(now, 0.018, 0.09, 2400 + Math.random() * 1800, 2);
  }

  glitch() {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    this._burst(t, 0.12, 0.16, 1800, 0.8);
    this._burst(t + 0.14, 0.07, 0.1, 3600, 1.2);
    this._tone(700, t, 0.22, 0.03, 'square', 90);
  }

  alert(level = 1) {
    if (!this.ctx || this.muted) return;
    const t = this.ctx.currentTime;
    this._tone(880 * (level < 1 ? 0.75 : 1), t, 0.5, 0.04 * level);
    this._tone(1320 * (level < 1 ? 0.75 : 1), t + 0.09, 0.4, 0.025 * level);
  }

  dispose() {
    for (const n of this.nodes) { try { n.stop(); } catch { /* already stopped */ } }
    this.nodes.length = 0;
    if (this.ctx) { this.ctx.close().catch(() => {}); this.ctx = null; }
  }
}
