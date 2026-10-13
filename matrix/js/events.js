import { MODES } from './modes.js';

/** Shared, allocation-free output of the event director. The scene reads these each frame. */
export const fx = {
  glitch: 0,                          // 0..1 envelope for the screen-space distortion
  gRect: new Float32Array(4),         // glitch region (uv)
  gSeed: 0,
  revDelta: 0, revAmt: 0,             // reversing / flickering code streams
  conv: 0, focalX: 0, focalY: 0,      // convergence amount + focus in NDC
  speedBoost: 1,
  dolly: 0,                           // extra forward velocity (camera drifts forward)
};

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const rand = (a, b) => a + Math.random() * (b - a);

const GLITCH_DUR = 0.8;
const REV_DUR = 1.6;
const CONV_DUR = 7.0;

const ALERTS = [
  'ANOMALY DETECTED IN SECTOR 7G',
  'UNREGISTERED OBSERVER WITHIN THE SIMULATION',
  'SIMULATION INTEGRITY: 99.7%',
  'DEJA VU EVENT LOGGED. NO ACTION REQUIRED',
  'SIGNAL RECEIVED: THE RABBIT HOLE IS OPEN',
  'PATCH 11.4 APPLIED. REALITY RECOMPILED',
  'MEMORY LEAK TRACED TO HUMAN PERCEPTION',
];

/**
 * Schedules and animates the cinematic system events. It runs on simulation time,
 * so pausing the experience also pauses the event timers.
 */
export class Director {
  constructor({ log, alert, audio, reducedMotion }) {
    this.log = log;
    this.alert = alert;
    this.audio = audio;
    this.reduced = reducedMotion;
    this.mode = 'rain';
    this.enabled = false;
    this.glitchT = -1;
    this.revT = -1;
    this.convT = -1;
    this.gStrength = 1;
    this.next = { glitch: 0, converge: 0, alert: 0 };
    this.alertIdx = 0;
    this.reset();
  }

  setMode(key) {
    this.mode = key;
    this.schedule('glitch');
    this.schedule('converge');
    this.schedule('alert');
  }

  schedule(kind, soon = false) {
    const [lo, hi] = MODES[this.mode].events[kind];
    this.next[kind] = lo === 0 && hi === 0 ? Infinity : soon ? rand(lo * 0.4, hi * 0.5) : rand(lo, hi);
  }

  reset() {
    this.glitchT = this.revT = this.convT = -1;
    fx.glitch = 0; fx.revDelta = 0; fx.revAmt = 0; fx.conv = 0; fx.speedBoost = 1; fx.dolly = 0;
    this.setMode(this.mode);
  }

  trigger(kind, opts) {
    if (kind === 'glitch') this.glitch(opts?.strength ?? MODES[this.mode].events.glitchStrength, opts?.quiet);
    else if (kind === 'converge') this.converge();
    else if (kind === 'alert') this.systemAlert(opts?.text);
  }

  glitch(strength = 1, quiet = false) {
    const k = this.reduced ? 0.4 : 1;
    this.gStrength = strength * k;
    this.glitchT = 0;
    this.revT = 0;
    const w = rand(0.18, 0.34), h = rand(0.08, 0.2);
    const x = rand(0.04, 0.96 - w), y = rand(0.08, 0.92 - h);
    fx.gRect[0] = x; fx.gRect[1] = y; fx.gRect[2] = x + w; fx.gRect[3] = y + h;
    fx.gSeed = Math.random() * 50;
    if (!quiet) {
      this.audio.glitch();
      this.log('!! REALITY GLITCH DETECTED. STREAMS UNSTABLE', 'warn');
    }
  }

  converge() {
    if (this.convT >= 0) return;
    this.convT = 0;
    fx.focalX = rand(-0.35, 0.35);
    fx.focalY = rand(-0.2, 0.3);
    this.audio.alert(0.7);
    this.log('>> CODE CONVERGENCE INITIATED', 'warn');
  }

  systemAlert(text) {
    const msg = text || ALERTS[this.alertIdx++ % ALERTS.length];
    this.alert(msg);
    this.audio.alert(1);
  }

  /** @param dt simulation seconds */
  update(dt) {
    if (this.enabled) {
      for (const k of ['glitch', 'converge', 'alert']) {
        this.next[k] -= dt;
        if (this.next[k] <= 0) {
          if (k === 'converge' && this.convT >= 0) { this.next[k] = 5; continue; }
          this.trigger(k, { quiet: false });
          this.schedule(k);
        }
      }
    }

    if (this.glitchT >= 0) {
      this.glitchT += dt;
      const u = this.glitchT / GLITCH_DUR;
      if (u >= 1) { this.glitchT = -1; fx.glitch = 0; }
      else { const s = Math.sin(Math.PI * u); fx.glitch = s * s * this.gStrength; }
    }
    if (this.revT >= 0) {
      this.revT += dt;
      const u = this.revT / REV_DUR;
      if (u >= 1) { this.revT = -1; fx.revDelta = 0; fx.revAmt = 0; }
      else { const s = Math.sin(Math.PI * u); fx.revDelta = -1.5 * s * s * this.gStrength; fx.revAmt = 0.22; }
    }
    if (this.convT >= 0) {
      this.convT += dt;
      const t = this.convT;
      if (t >= CONV_DUR) { this.convT = -1; fx.conv = 0; fx.speedBoost = 1; fx.dolly = 0; }
      else {
        const env = smooth(0, 2.4, t) * (1 - smooth(4.2, CONV_DUR, t));
        fx.conv = env * (this.reduced ? 0.5 : 1);
        fx.speedBoost = 1 + 0.9 * env;
        fx.dolly = this.reduced ? 0 : 9 * env;
      }
    }
  }
}
