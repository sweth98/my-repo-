/* Skeletal rig: fixed bone lengths, forward kinematics in a yaw-able
 * pseudo-3D body frame, plus 2-bone leg IK for planted feet.
 *
 * Local body frame:  X = forward, Y = up, Z = toward camera.
 * All limbs bend in the body's sagittal plane; `yaw` spins the body about
 * the vertical axis so a spinning kick foreshortens and reveals correctly.
 * Angles are degrees measured from "straight down", positive = forward.
 */
(function (g) {
  const D2R = Math.PI / 180;

  // World units. Every character uses these exact lengths in every frame.
  const RIG = {
    headR: 11, neck: 7, torso: 48,
    upperArm: 27, foreArm: 25, hand: 8, fistR: 3.4,
    thigh: 39, shin: 39, foot: 13,
    shoulderHalf: 8, hipHalf: 5.5,
    stroke: 2.7,
  };

  // Every animatable channel and its default.
  const DEFAULTS = {
    x: 0, air: 0, rot: 0, yaw: 0, twist: 0,
    spine: 2, sqz: 0, neck: 0, hipH: 76,
    shN: 5, elN: 12, wrN: 0, shF: -5, elF: 12, wrF: 0,
    hpN: 0, knN: 0, anN: 0, hpF: 0, knF: 0, anF: 0,
    fxN: 0, fyN: 0, tdN: 0, pN: 0,
    fxF: 0, fyF: 0, tdF: 0, pF: 0,
    life: 0, bnc: 0,
  };

  const up = (deg) => [Math.sin(deg * D2R), Math.cos(deg * D2R)];
  const dn = (deg) => [Math.sin(deg * D2R), -Math.cos(deg * D2R)];
  const lerp = (a, b, t) => a + (b - a) * t;

  // Two-bone IK in the sagittal plane. Target is relative to the hip.
  // Returns [thighAngle, kneeRelative] in degrees (knee bends forward).
  function ik2(tx, ty, a, b) {
    const d = Math.hypot(tx, ty);
    const dc = Math.min(a + b - 0.02, Math.max(Math.abs(a - b) + 0.5, d));
    const base = Math.atan2(tx, -ty);
    const cosA = (a * a + dc * dc - b * b) / (2 * a * dc);
    const alpha = Math.acos(Math.max(-1, Math.min(1, cosA)));
    const th = base + alpha;
    const kx = a * Math.sin(th), ky = -a * Math.cos(th);
    const ax = dc * Math.sin(base), ay = -dc * Math.cos(base);
    const sh = Math.atan2(ax - kx, -(ay - ky));
    return [th / D2R, (sh - th) / D2R];
  }

  /* Solve a pose into world-space joints.
   * P      : channel values (see DEFAULTS)
   * facing : +1 faces screen-right, -1 faces screen-left
   * Returns { pts, bones, head } where pts[name] = {x, y, z}; y is up. */
  function solve(P, facing) {
    const yP = P.yaw * D2R, yS = (P.yaw + P.twist) * D2R;
    const cP = Math.cos(yP), sP = Math.sin(yP), cS = Math.cos(yS), sS = Math.sin(yS);
    const inP = (X, Y, Z) => [X * cP + Z * sP, Y, -X * sP + Z * cP];
    const inS = (X, Y, Z) => [X * cS + Z * sS, Y, -X * sS + Z * cS];
    const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

    const L = {};
    L.hip = [0, 0, 0];

    // spine / neck / head
    const sLen = RIG.torso * (1 + P.sqz);
    const sp = up(P.spine);
    L.neckBase = inP(sp[0] * sLen, sp[1] * sLen, 0);
    const nd = up(P.spine + P.neck);
    L.neckTop = add(L.neckBase, inS(nd[0] * RIG.neck, nd[1] * RIG.neck, 0));
    L.head = add(L.neckBase, inS(nd[0] * (RIG.neck + RIG.headR), nd[1] * (RIG.neck + RIG.headR), 0));

    // pelvis & shoulders
    L.hipN = inP(0, 0, RIG.hipHalf);
    L.hipF = inP(0, 0, -RIG.hipHalf);
    L.shN = add(L.neckBase, inS(0, 0, RIG.shoulderHalf));
    L.shF = add(L.neckBase, inS(0, 0, -RIG.shoulderHalf));

    // arms (shoulder plane follows chest yaw)
    for (const s of ['N', 'F']) {
      const S = L['sh' + s];
      const a = P['sh' + s], e = a + P['el' + s], w = e + P['wr' + s];
      const d1 = dn(a), d2 = dn(e), d3 = dn(w);
      L['elbow' + s] = add(S, inS(d1[0] * RIG.upperArm, d1[1] * RIG.upperArm, 0));
      L['wrist' + s] = add(L['elbow' + s], inS(d2[0] * RIG.foreArm, d2[1] * RIG.foreArm, 0));
      L['fist' + s] = add(L['wrist' + s], inS(d3[0] * RIG.hand, d3[1] * RIG.hand, 0));
    }

    // legs: FK, optionally blended toward IK for planted feet
    for (const s of ['N', 'F']) {
      const p = P['p' + s];
      let hp = P['hp' + s], kn = P['kn' + s];
      let ikAng = null;
      if (p > 0.001) {
        const tx = (P['fx' + s] - P.x) * facing;
        const ty = P['fy' + s] - P.hipH;
        ikAng = ik2(tx, ty, RIG.thigh, RIG.shin);
        hp = lerp(hp, ikAng[0], p);
        kn = lerp(kn, ikAng[1], p);
      }
      const shinAbs = hp + kn;
      let an = P['an' + s];
      if (ikAng) an = lerp(an, -P['td' + s] - shinAbs, p); // flat foot, minus toe-down
      const H = L['hip' + s];
      const d1 = dn(hp), d2 = dn(shinAbs), d3 = dn(shinAbs + 90 + an);
      L['knee' + s] = add(H, inP(d1[0] * RIG.thigh, d1[1] * RIG.thigh, 0));
      L['ankle' + s] = add(L['knee' + s], inP(d2[0] * RIG.shin, d2[1] * RIG.shin, 0));
      L['toe' + s] = add(L['ankle' + s], inP(d3[0] * RIG.foot, d3[1] * RIG.foot, 0));
    }

    // whole-body roll in the screen plane (falls, kick lean), about the hips
    const ph = P.rot * D2R, cr = Math.cos(ph), sr = Math.sin(ph);
    const radius = (n) => (n === 'head' ? RIG.headR : n.startsWith('fist') ? RIG.fistR : RIG.stroke / 2);
    let minY = Infinity;
    const out = {};
    for (const n in L) {
      const [x, y, z] = L[n];
      const rx = x * cr + y * sr, ry = -x * sr + y * cr;
      out[n] = { x: rx, y: ry, z };
      minY = Math.min(minY, ry - radius(n));
    }
    // ground clamp keeps contact honest; `air` lifts the lowest point off the floor
    const shift = P.air - minY;
    for (const n in out) {
      const o = out[n];
      o.x = P.x + facing * o.x;
      o.y = o.y + shift;
    }
    return { pts: out, headR: RIG.headR, groundShift: shift };
  }

  // Draw list: [from, to, widthMul]
  const BONES = [
    ['hip', 'neckBase', 1.35],
    ['hipN', 'hipF', 1.0],
    ['shN', 'shF', 1.0],
    ['neckBase', 'neckTop', 1.0],
    ['shN', 'elbowN', 1.12], ['elbowN', 'wristN', 1.0], ['wristN', 'fistN', 0.9],
    ['shF', 'elbowF', 1.12], ['elbowF', 'wristF', 1.0], ['wristF', 'fistF', 0.9],
    ['hipN', 'kneeN', 1.12], ['kneeN', 'ankleN', 1.0], ['ankleN', 'toeN', 0.95],
    ['hipF', 'kneeF', 1.12], ['kneeF', 'ankleF', 1.0], ['ankleF', 'toeF', 0.95],
  ];

  g.Rig = { RIG, DEFAULTS, solve, ik2, BONES, D2R };
})(typeof window !== 'undefined' ? window : globalThis);
