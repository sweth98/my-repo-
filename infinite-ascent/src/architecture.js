// The architecture of THE INFINITE ASCENT.
//
// Everything is generated from one dimensional system (config.U) by a handful of
// reusable builders (steps, straight flights, curved/spiral flights, landings,
// beams, columns, portal frames). The builders only *describe* parts; the master
// timeline (timeline.js) turns that description into time-based transforms.
//
// Layout (metres; +Y up, the film starts looking down +Z):
//   F0  final connecting flight   (6 steps, climbs into the first tread)  <- built last
//   F1  first flight              (10 steps, the opening of the film)
//   C1  quarter-turn winder       (8 wedge steps, curves right)
//   L1  first major landing       (3 hinged slabs) — the stair divides here
//   P   spiral branch             (40 wedge steps, loops round a central void)
//   L2  summit landing + R flight (12 steps vanishing into the dark)
//   Q   horizontal branch         (bridge) -> portal frame A1
//   B1  portal frame at the foot of F0. A1 -> B1 is the "impossible connection":
//       a walker leaving A1 heading +X steps out of B1 heading +Z, just below
//       the first tread, so the staircase feeds back into its own first step.
import * as THREE from 'three';
import { U } from './config.js';
import { rng } from './easing.js';
import {
  travel, risePlace, dropPlace, slideBeam, rotateAbout, extendY, chain, shardMotion,
} from './animations.js';

const Y = new THREE.Vector3(0, 1, 0);
const X = new THREE.Vector3(1, 0, 0);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const qY = (a) => new THREE.Quaternion().setFromAxisAngle(Y, a);
const qYP = (yaw, pitch) => qY(yaw).multiply(new THREE.Quaternion().setFromAxisAngle(X, pitch));
const heading = (yaw) => V(Math.sin(yaw), 0, Math.cos(yaw));
const rotY = (v, a) => V(v.x * Math.cos(a) + v.z * Math.sin(a), v.y, -v.x * Math.sin(a) + v.z * Math.cos(a));

export const TREAD = { type: 'box', w: U.W, h: U.T, d: U.D, r: U.BEVEL };
export const RISER = { type: 'box', w: U.W - 0.2, h: U.R - U.T / 2, d: U.RISER_T, r: 0.02 };

export function buildArchitecture() {
  const parts = [];
  const bursts = [];
  const cues = [];
  const rand = rng(1013);

  const add = (p) => {
    const part = {
      mat: 'concrete',
      ease: 'heavy',
      scale: V(1, 1, 1),
      quat: new THREE.Quaternion(),
      settle: { amp: 0.045, dur: 0.7 },
      persist: false,
      ...p,
    };
    part.id = parts.length;
    parts.push(part);
    return part;
  };
  const dust = (t, pos, n = 5, spread = 1.4, power = 1) => bursts.push({ t, pos: pos.clone(), n, spread, power });
  const cue = (t, kind, pos, w = 1) => cues.push({ t, kind, pos: pos.clone ? pos.clone() : pos, w });

  // ---------------------------------------------------------------- steps
  // `edge` is the centre of the leading edge of the tread, at tread-top height.
  function addTread({ name, group, top, yaw, t0, dur, motion, ease = 'massive', first = false, dustN = 5, tone }) {
    const pos = top.clone();
    pos.y -= U.T / 2;
    const p = add({
      name, group, geo: TREAD, pos, quat: qY(yaw), t0, t1: t0 + dur, motion, ease,
    });
    const foot = V(top.x, top.y - U.T, top.z).addScaledVector(heading(yaw), -U.D / 2);
    if (dustN) dust(p.t1, foot, dustN, 1.6);
    cue(p.t1, 'stone', top, first ? 1.2 : 0.8);
    return p;
  }

  function addRiser({ name, group, edge, yaw, treadT1, t0, dur = 0.75 }) {
    // Riser tucked under the leading edge of the tread, recessed for a shadow reveal.
    const h = heading(yaw);
    const pos = edge.clone().addScaledVector(h, 0.05 + U.RISER_T / 2);
    pos.y = edge.y - U.R + RISER.h / 2;
    const start = t0 ?? treadT1 - 0.35;
    const p = add({
      name, group, geo: RISER, pos, quat: qY(yaw), t0: start, t1: start + dur,
      motion: risePlace(1.6, 0), ease: 'heavy', settle: { amp: 0.02, dur: 0.5 },
    });
    cue(p.t1, 'click', pos, 0.6);
    return p;
  }

  // ------------------------------------------------------- straight flight
  // cursor = { edge: Vector3 (leading edge centre, y = top of first tread), yaw }
  function straightFlight({ group, edge, yaw, n, i0 = 0, stepT, motionFor, riserFrom = 0, dustN = 5 }) {
    const h = heading(yaw);
    const steps = [];
    for (let k = 0; k < n; k++) {
      const topC = edge.clone().addScaledVector(h, U.D * (k + 0.5));
      topC.y += U.R * k;
      const e = edge.clone().addScaledVector(h, U.D * k);
      e.y += U.R * k;
      const { t0, dur } = stepT(k + i0);
      const tread = addTread({
        name: `${group}.tread${k + i0}`, group, top: topC, yaw, t0, dur, motion: motionFor(k + i0), first: k + i0 === 0, dustN,
      });
      let riser = null;
      if (k + i0 >= riserFrom) riser = addRiser({ name: `${group}.riser${k + i0}`, group, edge: e, yaw, treadT1: tread.t1 });
      steps.push({ tread, riser, top: topC, edge: e });
    }
    const next = edge.clone().addScaledVector(h, U.D * n);
    next.y += U.R * n;
    return { steps, next };
  }

  // Sloped graphite spine running under a straight flight.
  function addSpine({ name, group, edge, yaw, k0, k1, t0, t1, from = 'low' }) {
    const h = heading(yaw);
    const alpha = Math.atan2(U.R, U.D);
    const norm = V(-h.x * Math.sin(alpha), Math.cos(alpha), -h.z * Math.sin(alpha)); // up-ish normal
    const slopeDir = V(h.x * Math.cos(alpha), Math.sin(alpha), h.z * Math.cos(alpha));
    // line through rear-bottom corners of the treads, raised 0.1 so the spine bears into them
    const pt = (k) => edge.clone().addScaledVector(h, U.D * (k + 1)).add(V(0, U.R * k - U.T + 0.1, 0));
    const a = pt(k0 - 0.5);
    const b = pt(k1 + 0.5);
    const len = a.distanceTo(b);
    const th = 0.55;
    const centre = a.clone().add(b).multiplyScalar(0.5).addScaledVector(norm, -th / 2);
    const q = qYP(yaw, -alpha);
    const dir = from === 'low' ? slopeDir.clone().multiplyScalar(-1) : slopeDir.clone();
    const p = add({
      name, group, mat: 'graphite',
      geo: { type: 'box', w: 0.95, h: th, d: len, r: 0.05 },
      pos: centre, quat: q, t0, t1, ease: 'massive', motion: slideBeam(dir.toArray(), Math.min(len, 13)),
      settle: { amp: 0.02, dur: 0.9 },
    });
    cue(t0 + 0.2, 'slide', centre, 0.7);
    cue(t1, 'clunk', centre, 0.7);
    return p;
  }

  // ------------------------------------------------------- curved flight
  // Wedge treads whose origin is the centre of curvature (pivot-friendly).
  function curvedFlight({ group, edge, yaw, n, spanTotal, dir, i0 = 0, stepT, mkMotion, rm, dustN = 4, riserFrom = 0 }) {
    // dir = +1 right turn (yaw increases), -1 left turn.
    const h0 = heading(yaw);
    const left0 = V(-h0.z, 0, h0.x);
    const right0 = left0.clone().multiplyScalar(-1);
    const centre = edge.clone().addScaledVector(dir > 0 ? right0 : left0, rm);
    const u0 = centre.clone().sub(edge).multiplyScalar(-1).setY(0).normalize(); // centre -> edge
    const dphi = spanTotal / n;
    const sector = { type: 'sector', r0: rm - U.W / 2, r1: rm + U.W / 2, span: dphi - 0.006, h: U.T, r: U.BEVEL };
    const steps = [];
    for (let k = 0; k < n; k++) {
      const phiMid = dphi * (k + 0.5);
      const u = rotY(u0, dir * phiMid);
      const psi = Math.atan2(-u.z, u.x);
      const top = edge.y + U.R * k;
      const pos = V(centre.x, top - U.T / 2, centre.z);
      const { t0, dur } = stepT(k + i0);
      const p = add({
        name: `${group}.wedge${k + i0}`, group, geo: sector, pos, quat: qY(psi), t0, t1: t0 + dur,
        motion: mkMotion(k + i0, centre), ease: 'massive',
      });
      const mid = V(centre.x + u.x * rm, top, centre.z + u.z * rm);
      dust(p.t1, V(mid.x, top - U.T, mid.z), dustN, 1.5);
      cue(p.t1, 'stone', mid, 0.7);
      // riser at the leading radial edge
      let riser = null;
      if (k + i0 >= riserFrom) {
        const phiE = dphi * k;
        const ue = rotY(u0, dir * phiE);
        const hE = rotY(heading(yaw), dir * phiE);
        const psiE = Math.atan2(-ue.z, ue.x);
        const rp = V(centre.x + ue.x * rm, 0, centre.z + ue.z * rm).addScaledVector(hE, 0.05 + U.RISER_T / 2);
        rp.y = top - U.R + RISER.h / 2;
        const t0r = p.t1 - 0.35;
        riser = add({
          name: `${group}.riser${k + i0}`, group, geo: RISER, pos: rp, quat: qY(psiE),
          t0: t0r, t1: t0r + 0.75, motion: risePlace(1.6, 0), settle: { amp: 0.02, dur: 0.5 },
        });
      }
      steps.push({ tread: p, riser, mid, top });
    }
    const phiEnd = spanTotal;
    const uEnd = rotY(u0, dir * phiEnd);
    const nextEdge = V(centre.x + uEnd.x * rm, edge.y + U.R * n, centre.z + uEnd.z * rm);
    const nextYaw = yaw + dir * spanTotal;
    return { steps, next: nextEdge, nextYaw, centre };
  }

  // ------------------------------------------------------------- landings
  // A landing built from hinged slabs (world-aligned boxes). Heading is axis-aligned.
  function addLanding({ group, centre, size, axis, top, t0, stagger, dur, hingeAngles, name, dustN = 7 }) {
    // axis: 'x' or 'z' = direction slabs are laid out (and unfold) along. size = [lenAlong, width].
    const n = hingeAngles.length;
    const slabLen = size[0] / n;
    const slabs = [];
    for (let j = 0; j < n; j++) {
      const along = -size[0] / 2 + slabLen * (j + 0.5);
      const c = centre.clone();
      if (axis === 'x') c.x += along; else c.z += along;
      c.y = top - U.SLAB_T / 2;
      const geo = axis === 'x'
        ? { type: 'box', w: slabLen, h: U.SLAB_T, d: size[1], r: 0.05 }
        : { type: 'box', w: size[1], h: U.SLAB_T, d: slabLen, r: 0.05 };
      // hinge on the trailing edge (the edge toward the previous slab), at the top surface
      const hinge = c.clone();
      if (axis === 'x') hinge.x -= slabLen / 2; else hinge.z -= slabLen / 2;
      hinge.y = top;
      // Rotating +X about +Z lifts the slab; rotating +Z about -X lifts it (right-hand rule).
      const ax = axis === 'x' ? [0, 0, 1] : [-1, 0, 0];
      const s = add({
        name: `${name}.slab${j}`, group, geo, pos: c, t0: t0 + stagger * j, t1: t0 + stagger * j + dur,
        motion: rotateAbout({ pivot: hinge.toArray(), axis: ax, angle: hingeAngles[j] }),
        ease: 'massive', settle: { amp: 0.03, dur: 0.8 },
      });
      cue(s.t1, 'slab', c, 1);
      dust(s.t1, V(c.x, top - U.SLAB_T, c.z), dustN, 2.4, 1.3);
      slabs.push(s);
    }
    return slabs;
  }

  function addBeam({ name, group, geo, pos, quat, t0, t1, dir, dist, mat = 'graphite' }) {
    const p = add({
      name, group, geo, mat, pos, quat: quat ?? new THREE.Quaternion(), t0, t1, ease: 'massive',
      motion: slideBeam(dir, dist), settle: { amp: 0.02, dur: 0.9 },
    });
    cue(t0 + 0.25, 'slide', pos, 0.6);
    cue(t1, 'clunk', pos, 0.7);
    return p;
  }

  function addColumn({ name, group, x, z, top, bottom, size = 1.4, t0, t1, mat = 'concrete', round = false }) {
    const height = top - bottom;
    const geo = round ? { type: 'cyl', rad: size / 2, h: height } : { type: 'box', w: size, h: height, d: size, r: 0.06 };
    const p = add({
      name, group, mat, geo, pos: V(x, (top + bottom) / 2, z), t0, t1, ease: 'massive',
      motion: extendY({ height, anchor: 'top' }), settle: { amp: 0.0, dur: 0.1 },
    });
    cue(t1, 'low', V(x, top, z), 1.2);
    dust(t1, V(x, top - 0.6, z), 5, 1.2, 0.8);
    return p;
  }

  // ====================================================================
  //  SEQUENCE ONE — THE FIRST STEP (0–7 s)
  // ====================================================================
  const F1_EDGE = V(0, 0, -U.D / 2); // leading edge of the very first tread
  const f1Times = (i) => {
    const T = [
      [0.75, 1.3], // 0: first tread shifts into place (it already floats at t=0)
      [1.35, 1.35], // 1: rises from below
      [2.2, 1.4], // 2: fragments -> tread (special)
      [3.7, 1.25], [4.35, 1.2], [4.95, 1.2], [5.5, 1.15], // 3..6 -> recognisable stair by 7 s
      [7.05, 1.1], [7.4, 1.1], [7.75, 1.1], // 7..9 (sequence two begins, faster)
    ];
    return { t0: T[i][0], dur: T[i][1] };
  };
  const f1Motions = [
    // first tread: already present at t=0, shifts a little into its true pose
    travel({ offset: [0.3, 0.25, -0.55], yaw: -0.16, roll: 0.1, pitch: 0.06 }),
    risePlace(5.5, 0.35, [0.0, 0, -0.6]),
    null, // set below (fragments)
    travel({ offset: [-4.8, 0.6, -1.4], yaw: 0.55 }),
    dropPlace(6.5, -0.32),
    travel({ offset: [5.0, -0.8, -2.2], yaw: -0.5 }),
    risePlace(6.5, 0.3, [0.4, 0, 0]),
    travel({ offset: [-5.5, 0.8, -1.8], yaw: 0.45 }),
    dropPlace(7.5, -0.3),
    travel({ offset: [5.5, -0.6, -2.0], yaw: -0.45 }),
  ];
  // step 2 emerges from a cluster of shards: the tread itself scales up from the cluster
  f1Motions[2] = (p, st, fin) => {
    const e = Math.min(1, Math.max(0, (p - 0.18) / 0.82));
    const s = 0.04 + 0.96 * (1 - Math.pow(1 - e, 3));
    st.scale.set(s, Math.max(0.04, s), s);
    st.pos.y += (1 - e) * 0.4;
  };

  const f1 = straightFlight({
    group: 'F1', edge: F1_EDGE, yaw: 0, n: 10, stepT: f1Times, motionFor: (i) => f1Motions[i], riserFrom: 1, dustN: 5,
  });
  // Treads 0 persists (it exists in the opening/closing frame).
  f1.steps[0].tread.persist = true;
  f1.steps[0].tread.settle = { amp: 0.04, dur: 0.8 };
  // dust for the first tread should not fire at t≈0 → keep as authored (t1 = 2.05)

  // Fragments that become step 2
  {
    const tr = f1.steps[2].tread;
    const centre = tr.pos.clone();
    const frag = { type: 'box', w: 0.34, h: 0.2, d: 0.26, r: 0.025 };
    const fragSmall = { type: 'box', w: 0.2, h: 0.14, d: 0.18, r: 0.02 };
    for (let k = 0; k < 22; k++) {
      const ang = rand() * Math.PI * 2;
      const rad = 2.2 + rand() * 3.2;
      const from = [centre.x + Math.cos(ang) * rad, centre.y - 1.5 + rand() * 4, centre.z + Math.sin(ang) * rad - 1];
      const via = [centre.x + (rand() - 0.5) * 2.4, centre.y + (rand() - 0.5) * 0.9, centre.z + (rand() - 0.5) * 0.9];
      const to = [centre.x + (rand() - 0.5) * 1.2, centre.y, centre.z + (rand() - 0.5) * 0.5];
      const t0 = 1.9 + rand() * 0.25;
      add({
        name: `shard${k}`, group: 'shards', ephemeral: true, geo: k % 3 === 0 ? frag : fragSmall,
        pos: V(...to), t0, t1: t0 + 1.6 + rand() * 0.2, ease: 'soft', settle: { amp: 0, dur: 0.1 },
        motion: shardMotion({ from, via, to, spin: [(rand() - 0.5) * 6, (rand() - 0.5) * 6] }),
      });
    }
    cue(2.0, 'shards', centre, 0.8);
  }

  // ====================================================================
  //  SEQUENCE TWO — THE STAIRCASE BUILDS ITSELF (7–16 s)
  // ====================================================================
  // Spine under F1 arrives while treads 7-9 are still landing.
  addSpine({ name: 'F1.spine', group: 'F1', edge: F1_EDGE, yaw: 0, k0: 0, k1: 9, t0: 6.9, t1: 9.7 });

  // C1: quarter-turn winder curving right, wedge steps swing in about the centre of curvature.
  const C1_RM = U.D / (Math.PI / 2 / 8);
  const c1 = curvedFlight({
    group: 'C1', edge: f1.next, yaw: 0, n: 8, spanTotal: Math.PI / 2, dir: +1, rm: C1_RM,
    stepT: (i) => ({ t0: 10.4 + 0.36 * (i - 0), dur: 1.35 }),
    mkMotion: (i, centre) => rotateAbout({ pivot: centre.toArray(), axis: [0, 1, 0], angle: 0.95 + 0.04 * i, lift: -2.6 }),
    riserFrom: 0,
  });
  // L1 landing: first major landing (3 hinged slabs unfolding)
  const L1_TOP = c1.next.y; // = top of the step after the winder
  const L1_X0 = c1.next.x;
  const L1_ZC = c1.next.z;
  const L1_LEN = 7.2;
  const L1_CENTRE = V(L1_X0 + L1_LEN / 2, 0, L1_ZC);
  addLanding({
    group: 'L1', name: 'L1', centre: L1_CENTRE, size: [L1_LEN, 7.2], axis: 'x', top: L1_TOP,
    t0: 14.0, stagger: 0.62, dur: 1.5, hingeAngles: [1.5, 2.9, 2.9],
  });
  // Support beams slide in shortly before the slabs need them
  for (const s of [-1, 1]) {
    addBeam({
      name: `L1.beam${s}`, group: 'L1', geo: { type: 'box', w: L1_LEN, h: 0.5, d: 0.62, r: 0.04 },
      pos: V(L1_CENTRE.x, L1_TOP - U.SLAB_T - 0.25, L1_ZC + s * 2.5), t0: 12.9, t1: 14.9, dir: [1, 0, 0], dist: 13,
    });
  }
  // Column extends downward from the landing and locks into alignment
  addColumn({ name: 'L1.column', group: 'L1', x: L1_X0 + 4.6, z: L1_ZC, top: L1_TOP - U.SLAB_T - 0.5, bottom: -12, t0: 12.4, t1: 15.0 });

  // ====================================================================
  //  SEQUENCE THREE — IMPOSSIBLE GEOMETRY (16–27 s)
  // ====================================================================
  // --- P: spiral branch looping round a central void
  const P_N = 40;
  const P_RM = U.D / ((Math.PI * 2) / P_N);
  const pEdge = V(L1_X0 + 4.6 + 0.0, L1_TOP + U.R, L1_ZC + 3.6); // far (+Z) edge of L1
  const pStart = pEdge.clone();
  const p = curvedFlight({
    group: 'P', edge: pStart, yaw: 0, n: P_N, spanTotal: Math.PI * 2, dir: -1, rm: P_RM, dustN: 3,
    stepT: (i) => ({ t0: 16.0 + 0.122 * i, dur: 1.15 }),
    mkMotion: (i, centre) => rotateAbout({ pivot: centre.toArray(), axis: [0, 1, 0], angle: -0.85, lift: -3.2 }),
    riserFrom: 0,
  });
  // radial graphite supports under every sixth spiral tread
  {
    const centre = p.centre;
    const edgeToCentre = centre.clone().sub(pStart).setY(0).normalize();
    const uStart = edgeToCentre.clone().multiplyScalar(-1);
    const dphi = (Math.PI * 2) / P_N;
    for (let k = 3; k < P_N; k += 6) {
      const phiMid = dphi * (k + 0.5);
      const u = rotY(uStart, -phiMid);
      const topY = pStart.y + U.R * k;
      const pos = V(centre.x + u.x * P_RM, topY - U.T - 0.22 + 0.02, centre.z + u.z * P_RM);
      const psi = Math.atan2(-u.z, u.x);
      const tread = p.steps[k].tread;
      addBeam({
        name: `P.rib${k}`, group: 'P', geo: { type: 'box', w: 2.6, h: 0.44, d: 0.55, r: 0.04 }, pos, quat: qY(psi),
        t0: tread.t0 - 0.2, t1: tread.t1 + 0.15, dir: [-u.x, 0, -u.z], dist: 5,
      });
    }
  }
  // L2 summit landing (three slabs along +Z) and the R flight vanishing into darkness
  const L2_TOP = p.next.y; // = P edge height after 40 steps
  const L2_X = pEdge.x;
  const L2_Z0 = p.next.z;
  addLanding({
    group: 'L2', name: 'L2', centre: V(L2_X, 0, L2_Z0 + 3.6), size: [7.2, 7.2], axis: 'z', top: L2_TOP,
    t0: 20.9, stagger: 0.55, dur: 1.4, hingeAngles: [1.5, 2.9, 2.9],
  });
  addColumn({ name: 'L2.column', group: 'L2', x: L2_X + 1.6, z: L2_Z0 + 6.6, top: L2_TOP - U.SLAB_T - 0.5, bottom: -14, size: 1.5, t0: 19.8, t1: 22.4 });
  for (const s of [-1, 1]) {
    addBeam({
      name: `L2.beam${s}`, group: 'L2', geo: { type: 'box', w: 0.62, h: 0.5, d: 7.2, r: 0.04 },
      pos: V(L2_X + s * 2.5, L2_TOP - U.SLAB_T - 0.25, L2_Z0 + 3.6), t0: 19.8, t1: 21.6, dir: [0, 0, 1], dist: 12,
    });
  }
  const rEdge = V(L2_X, L2_TOP + U.R, L2_Z0 + 7.2);
  const rFlight = straightFlight({
    group: 'R', edge: rEdge, yaw: 0, n: 12, riserFrom: 0, dustN: 3,
    stepT: (i) => ({ t0: 22.5 + 0.17 * i, dur: 1.2 }),
    motionFor: (i) => (i % 2 ? risePlace(5, 0.3) : dropPlace(5, -0.3)),
  });
  addSpine({ name: 'R.spine', group: 'R', edge: rEdge, yaw: 0, k0: 0, k1: 11, t0: 22.3, t1: 24.6 });

  // --- Q: horizontal branch (bridge) leading to the portal frame A1
  const Q_Y = L1_TOP;
  const Q_X0 = L1_X0 + L1_LEN;
  const Q_SLAB = 3.6;
  for (let j = 0; j < 3; j++) {
    const c = V(Q_X0 + Q_SLAB * (j + 0.5), Q_Y - U.SLAB_T / 2, L1_ZC);
    const t0 = 16.3 + 0.55 * j;
    const s = add({
      name: `Q.slab${j}`, group: 'Q', geo: { type: 'box', w: Q_SLAB, h: U.SLAB_T, d: U.W, r: 0.05 },
      pos: c, t0, t1: t0 + 1.5, ease: 'massive', motion: slideBeam([1, 0, 0], 13 - j * 2), settle: { amp: 0.03, dur: 0.8 },
    });
    cue(s.t1, 'slab', c, 0.9);
    dust(s.t1, V(c.x, Q_Y - U.SLAB_T, c.z), 6, 2.0);
  }
  const A_PLANE_X = Q_X0 + Q_SLAB * 3 + 1.2;
  addBeam({
    name: 'Q.spine', group: 'Q', geo: { type: 'box', w: A_PLANE_X + 1.4 - Q_X0, h: 0.55, d: 1.0, r: 0.05 },
    pos: V((Q_X0 + A_PLANE_X + 1.4) / 2, Q_Y - U.SLAB_T - 0.275, L1_ZC), t0: 16.1, t1: 18.2, dir: [1, 0, 0], dist: 14,
  });
  addColumn({ name: 'Q.pier', group: 'Q', x: Q_X0 + 6.6, z: L1_ZC, top: Q_Y - U.SLAB_T - 0.55, bottom: -10, size: 1.2, t0: 16.8, t1: 18.9 });

  // --- Portal frames: monumental openings
  const OPEN_W = 6.6;
  const OPEN_H = 10.5;
  const FRAME_T = 1.5;  // member width
  const FRAME_D = 1.7;  // depth through the opening
  function addFrame({ name, group, plane, yaw, floorY, t0, sillLen = 2.4 }) {
    // plane = centre of the opening's floor on the portal plane. yaw = direction of travel through it.
    const h = heading(yaw);
    const lat = V(h.z, 0, -h.x); // lateral axis (right of travel)
    const q = qY(yaw);
    const postH = OPEN_H + U.SLAB_T;
    const out = {};
    const at = (lateral, y) => plane.clone().addScaledVector(lat, lateral).setY(y);
    for (const s of [-1, 1]) {
      const c = at(s * (OPEN_W / 2 + FRAME_T / 2), floorY - U.SLAB_T + postH / 2);
      const post = add({
        name: `${name}.post${s}`, group, mat: 'frame',
        geo: { type: 'box', w: FRAME_T, h: postH, d: FRAME_D, r: 0.06 }, pos: c, quat: q,
        t0: t0 + (s > 0 ? 0.15 : 0), t1: t0 + 1.6 + (s > 0 ? 0.15 : 0), ease: 'massive',
        motion: extendY({ height: postH, anchor: 'bottom' }), settle: { amp: 0, dur: 0.1 },
      });
      cue(post.t1, 'low', c, 1.3);
      dust(post.t1, at(s * (OPEN_W / 2 + FRAME_T / 2), floorY - U.SLAB_T), 7, 2.4, 1.3);
    }
    const lintelC = at(0, floorY + OPEN_H + FRAME_T / 2);
    const lintel = add({
      name: `${name}.lintel`, group, mat: 'frame',
      geo: { type: 'box', w: OPEN_W + 2 * FRAME_T, h: FRAME_T, d: FRAME_D, r: 0.06 }, pos: lintelC, quat: q,
      t0: t0 + 1.1, t1: t0 + 2.4, ease: 'massive', motion: dropPlace(7, 0), settle: { amp: 0.04, dur: 0.9 },
    });
    cue(lintel.t1, 'slab', lintelC, 1.4);
    dust(lintel.t1, at(0, floorY + OPEN_H), 10, 3.4, 1.4);
    // threshold slab
    const sillC = plane.clone().setY(floorY - U.SLAB_T / 2);
    add({
      name: `${name}.sill`, group, mat: 'frame',
      geo: { type: 'box', w: U.W, h: U.SLAB_T, d: sillLen, r: 0.05 }, pos: sillC, quat: q,
      t0: t0 + 0.2, t1: t0 + 1.6, ease: 'massive', motion: risePlace(4, 0.1), settle: { amp: 0.03, dur: 0.7 },
    });
    // cyan reveal strips (thin, emissive once the portal is live)
    const rv = 0.07;
    const revealParts = [];
    for (const s of [-1, 1]) {
      revealParts.push(add({
        name: `${name}.reveal${s}`, group, mat: 'reveal',
        geo: { type: 'box', w: rv, h: OPEN_H, d: FRAME_D * 0.55, r: 0.01 },
        pos: at(s * (OPEN_W / 2 - rv / 2), floorY + OPEN_H / 2), quat: q,
        t0: t0 + 2.0, t1: t0 + 2.8, ease: 'soft', motion: (pp, st) => st.scale.set(1, Math.max(0.001, pp), 1), settle: { amp: 0, dur: 0.1 },
      }));
    }
    revealParts.push(add({
      name: `${name}.revealTop`, group, mat: 'reveal',
      geo: { type: 'box', w: OPEN_W, h: rv, d: FRAME_D * 0.55, r: 0.01 },
      pos: at(0, floorY + OPEN_H - rv / 2), quat: q,
      t0: t0 + 2.0, t1: t0 + 2.8, ease: 'soft', motion: (pp, st) => st.scale.set(Math.max(0.001, pp), 1, 1), settle: { amp: 0, dur: 0.1 },
    }));
    out.center = plane.clone().setY(floorY + OPEN_H / 2);
    return out;
  }

  const A_FLOOR = Q_Y;
  const aPlane = V(A_PLANE_X, A_FLOOR, L1_ZC);
  addFrame({ name: 'A1', group: 'A1', plane: aPlane, yaw: Math.PI / 2, floorY: A_FLOOR, t0: 15.4 });

  // ====================================================================
  //  SEQUENCE FOUR — THE INFINITE ASCENT (26–35 s)
  // ====================================================================
  // B1 frame stands before F0, directly "below and behind" the first tread.
  const F0_N = 6;
  const f0Edge = V(0, -U.R * F0_N, -U.D * F0_N - U.D / 2); // leading edge of the first F0 tread
  const B_PLANE_Z = f0Edge.z - 1.2;
  const bPlane = V(0, f0Edge.y, B_PLANE_Z);
  addFrame({ name: 'B1', group: 'B1', plane: bPlane, yaw: 0, floorY: f0Edge.y, t0: 15.9 });

  const f0 = straightFlight({
    group: 'F0', edge: f0Edge, yaw: 0, n: F0_N, riserFrom: 1, dustN: 5,
    stepT: (i) => ({ t0: 26.3 + 0.36 * i, dur: 1.15 }),
    motionFor: (i) => [
      risePlace(6, 0.3), travel({ offset: [-5, 0.5, -1.6], yaw: 0.5 }), dropPlace(6, -0.3),
      travel({ offset: [5, -0.5, -1.6], yaw: -0.5 }), risePlace(6, 0.3), dropPlace(6, -0.3),
    ][i],
  });
  addSpine({ name: 'F0.spine', group: 'F0', edge: f0Edge, yaw: 0, k0: 0, k1: F0_N - 1, t0: 25.9, t1: 28.1 });
  // the first tread (S) gets its own riser as the loop closes
  addRiser({ name: 'F1.riser0', group: 'F1', edge: V(0, 0, -U.D / 2), yaw: 0, treadT1: 0, t0: 28.0, dur: 0.9 });
  // …and a riser for F0's first tread against the sill is omitted (flush with the threshold)

  // ====================================================================
  //  EXIT SCHEDULE — the film is one continuous construction cycle:
  //  the structure retracts in reverse build order, returning to the single tread.
  // ====================================================================
  const movers = parts.filter((q) => !q.persist && !q.ephemeral);
  let tmin = Infinity;
  let tmax = -Infinity;
  for (const q of movers) { tmin = Math.min(tmin, q.t0); tmax = Math.max(tmax, q.t0); }
  const EXIT0 = 30.9;
  const EXIT_SPAN = 2.25;
  for (const q of movers) {
    const r = (tmax - q.t0) / (tmax - tmin);
    const e0 = EXIT0 + EXIT_SPAN * r;
    q.exit = { t0: e0, t1: e0 + 1.0 };
  }
  // First tread returns to its opening pose (identical to t = 0).
  const S = f1.steps[0].tread;
  S.exit = { t0: 33.45, t1: 34.85 };

  return {
    parts, bursts, cues,
    portals: {
      width: OPEN_W, height: OPEN_H,
      A: { plane: aPlane.clone(), yaw: Math.PI / 2, floorY: A_FLOOR },
      B: { plane: bPlane.clone(), yaw: 0, floorY: f0Edge.y },
    },
    meta: {
      L1: { top: L1_TOP, centre: L1_CENTRE.clone() },
      L2: { top: L2_TOP },
      pCentre: p.centre.clone(),
      f1Next: f1.next.clone(),
      first: f1.steps[0].top.clone(),
      A_PLANE_X, B_PLANE_Z, L1_ZC,
    },
  };
}
