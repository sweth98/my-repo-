/* Keyframe engine: per-channel tracks, easing, spring-based secondary
 * motion, baking to a dense sample grid, and a speed-ramp time remap.
 *
 * A key is [frame, {channel: value | [value, ease]}, defaultEase].
 * The ease on a key describes how the channel ARRIVES at that key.
 */
(function (g) {
  const { DEFAULTS } = g.Rig;
  const FPS = 30;   // authoring / display frame rate
  const SUB = 4;    // baked samples per frame (120 Hz)

  const c1 = 1.5, c3 = c1 + 1;
  const EASE = {
    lin: (u) => u,
    io: (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
    in: (u) => u * u * u,
    out: (u) => 1 - Math.pow(1 - u, 3),
    iq: (u) => u * u,                      // gravity fall
    oq: (u) => 1 - (1 - u) * (1 - u),      // friction slide
    snap: (u) => 1 - Math.pow(1 - u, 5),   // fast strike, long settle
    back: (u) => 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2), // overshoot
    anti: (u) => c3 * u * u * u - c1 * u * u,                           // anticipation dip
    hold: (u) => (u < 1 ? 0 : 1),
    spline: (u) => u,                      // handled specially (Catmull-Rom)
  };

  function buildTracks(keys) {
    const tracks = {};
    for (const [f, props, de] of keys) {
      for (const ch in props) {
        let v = props[ch], e = de || 'io';
        if (Array.isArray(v)) { e = v[1] || e; v = v[0]; }
        (tracks[ch] = tracks[ch] || []).push({ f, v, e });
      }
    }
    for (const ch in tracks) tracks[ch].sort((a, b) => a.f - b.f);
    return tracks;
  }

  function evalTrack(tr, f, dflt) {
    if (!tr || !tr.length) return dflt;
    if (f <= tr[0].f) return tr[0].v;
    const last = tr.length - 1;
    if (f >= tr[last].f) return tr[last].v;
    let lo = 0, hi = last;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (tr[m].f <= f) lo = m; else hi = m; }
    const a = tr[lo], b = tr[hi];
    const u = (f - a.f) / (b.f - a.f);
    if (b.e === 'spline') {
      const p0 = (tr[lo - 1] || a).v, p3 = (tr[hi + 1] || b).v;
      const t2 = u * u, t3 = t2 * u;
      return 0.5 * ((2 * a.v) + (-p0 + b.v) * u + (2 * p0 - 5 * a.v + 4 * b.v - p3) * t2 + (-p0 + 3 * a.v - 3 * b.v + p3) * t3);
    }
    return a.v + (b.v - a.v) * (EASE[b.e] || EASE.io)(u);
  }

  // Damped spring that chases the authored curve: gives lag, overshoot and
  // follow-through to the loose parts without touching the planted feet.
  function springFilter(arr, freq, zeta) {
    const w = 2 * Math.PI * freq, dt = 1 / (FPS * SUB);
    let x = arr[0], v = 0;
    const out = new Float32Array(arr.length);
    for (let i = 0; i < arr.length; i++) {
      const acc = w * w * (arr[i] - x) - 2 * zeta * w * v;
      v += acc * dt; x += v * dt;
      out[i] = x;
    }
    return out;
  }

  const SPRINGS = {
    neck: [5.5, 0.38], spine: [8, 0.6], twist: [7, 0.55], sqz: [10, 0.5],
    shN: [8.5, 0.5], shF: [8.5, 0.5], elN: [7.5, 0.42], elF: [7.5, 0.42],
    wrN: [5, 0.28], wrF: [5, 0.28],
  };

  function bake(keys, totalFrames, springs) {
    const tracks = buildTracks(keys);
    const n = Math.ceil(totalFrames * SUB) + 1;
    const data = {};
    for (const ch in DEFAULTS) {
      let arr = new Float32Array(n);
      const tr = tracks[ch];
      for (let i = 0; i < n; i++) arr[i] = evalTrack(tr, i / SUB, DEFAULTS[ch]);
      if (springs && springs[ch]) arr = springFilter(arr, springs[ch][0], springs[ch][1]);
      data[ch] = arr;
    }
    return { data, n, tracks, keys };
  }

  const scratch = new WeakMap();
  // Sample a baked clip at animation-frame `a`, with procedural life layered on.
  function poseAt(clip, a, fresh) {
    let P = fresh ? {} : scratch.get(clip);
    if (!P) { P = {}; scratch.set(clip, P); }
    const x = Math.min(Math.max(a, 0) * SUB, clip.n - 1.001);
    const i = Math.floor(x), t = x - i;
    for (const ch in clip.data) {
      const d = clip.data[ch];
      P[ch] = d[i] + (d[i + 1] - d[i]) * t;
    }
    // breathing / idle sway
    const s = a / FPS;
    if (P.life) {
      P.spine += P.life * 1.1 * Math.sin(s * 2.1);
      P.shN += P.life * 1.8 * Math.sin(s * 2.1 + 0.6);
      P.shF += P.life * 1.8 * Math.sin(s * 2.1 + 0.9);
      P.neck -= P.life * 0.8 * Math.sin(s * 2.1 + 0.3);
      P.hipH += P.life * 0.35 * Math.sin(s * 2.1);
    }
    // guard bounce
    if (P.bnc) {
      const ph = a * 2 * Math.PI / 12;
      P.hipH += P.bnc * 1.6 * Math.sin(ph);
      P.spine += P.bnc * 0.9 * Math.sin(ph + 0.8);
      P.shN += P.bnc * 2.5 * Math.sin(ph + 1.4);
      P.shF += P.bnc * 2.5 * Math.sin(ph + 1.9);
    }
    return P;
  }

  // Speed ramps: display time -> animation time (slow-mo / hit-stop).
  function buildRemap(speedKeys, totalAnim) {
    const tr = buildTracks(speedKeys).spd;
    const n = Math.ceil(totalAnim * SUB) + 1;
    const disp = new Float32Array(n);
    for (let i = 1; i < n; i++) {
      const sp = Math.max(0.04, evalTrack(tr, (i - 0.5) / SUB, 1));
      disp[i] = disp[i - 1] + 1 / SUB / sp;
    }
    const total = disp[n - 1];
    const toAnim = (d) => {
      if (d <= 0) return 0;
      if (d >= total) return (n - 1) / SUB;
      let lo = 0, hi = n - 1;
      while (hi - lo > 1) { const m = (lo + hi) >> 1; if (disp[m] <= d) lo = m; else hi = m; }
      return (lo + (d - disp[lo]) / (disp[hi] - disp[lo])) / SUB;
    };
    const toDisp = (a) => {
      const x = Math.min(Math.max(a * SUB, 0), n - 1.001), i = Math.floor(x);
      return disp[i] + (disp[i + 1] - disp[i]) * (x - i);
    };
    return { toAnim, toDisp, total };
  }

  g.Anim = { FPS, SUB, EASE, buildTracks, evalTrack, bake, poseAt, buildRemap, SPRINGS };
})(typeof window !== 'undefined' ? window : globalThis);
