// Cinematic camera choreography: per-segment keyframes evaluated with smooth Hermite (Catmull-Rom style)
// interpolation on absolute time. Hard cuts only happen inside transition irises.
import * as THREE from 'three';
import { lerp } from './util';

/** helper to build an orbit as keyframes. angles in radians, camera at center + r*(sin a, h, cos a). */
export function orbit({ center = [0, 0, 0], r0, r1 = r0, a0, a1, h0 = 0, h1 = h0, t0, t1, n = 6, look = null, fov = 30, fov1 = fov, focus, ap }) {
  const keys = [];
  for (let i = 0; i <= n; i++) {
    const f = i / n, a = lerp(a0, a1, f), r = lerp(r0, r1, f), h = lerp(h0, h1, f);
    const k = {
      t: lerp(t0, t1, f),
      p: [center[0] + Math.sin(a) * r, center[1] + h, center[2] + Math.cos(a) * r],
      l: look || center, fov: lerp(fov, fov1, f),
    };
    if (focus !== undefined) k.focus = focus;
    if (ap !== undefined) k.ap = ap;
    keys.push(k);
  }
  return keys;
}

export const CAMERA_SEGMENTS = []; // filled by registerCamera()
export function registerCamera(start, end, keys, flow = 0.7) {
  CAMERA_SEGMENTS.push({ start, end, keys: keys.sort((a, b) => a.t - b.t), flow });
}

const v = (a) => new THREE.Vector3(a[0], a[1], a[2]);
function hermite(p0, p1, m0, m1, f) {
  const f2 = f * f, f3 = f2 * f;
  return (2 * f3 - 3 * f2 + 1) * p0 + (f3 - 2 * f2 + f) * m0 + (-2 * f3 + 3 * f2) * p1 + (f3 - f2) * m1;
}
function sample(seg, t, get) {
  const ks = seg.keys;
  if (t <= ks[0].t) return get(ks[0]);
  if (t >= ks[ks.length - 1].t) return get(ks[ks.length - 1]);
  let i = 0;
  while (t > ks[i + 1].t) i++;
  const a = ks[i], b = ks[i + 1], dt = b.t - a.t, f = (t - a.t) / dt;
  const A = get(a), B = get(b);
  const tan = (idx, side) => {
    // finite-difference tangent through neighbouring keys (per-unit-time), end tangents follow `flow`
    const prev = ks[idx - 1], next = ks[idx + 1];
    const k = ks[idx];
    let d;
    if (prev && next) d = (get(next) - get(prev)) / (next.t - prev.t);
    else if (next) d = ((get(next) - get(k)) / (next.t - k.t)) * seg.flow * (idx === 0 ? 0.5 : 1);
    else d = ((get(k) - get(prev)) / (k.t - prev.t)) * seg.flow * 0.5;
    return d;
  };
  return hermite(A, B, tan(i) * dt, tan(i + 1) * dt, f);
}

const out = { pos: new THREE.Vector3(), look: new THREE.Vector3(), fov: 30, focus: 5, ap: 0.02 };
export function evalCamera(t) {
  let seg = CAMERA_SEGMENTS.find((s) => t >= s.start && t < s.end) || CAMERA_SEGMENTS[CAMERA_SEGMENTS.length - 1];
  if (!seg) return out;
  out.pos.set(sample(seg, t, (k) => k.p[0]), sample(seg, t, (k) => k.p[1]), sample(seg, t, (k) => k.p[2]));
  out.look.set(sample(seg, t, (k) => k.l[0]), sample(seg, t, (k) => k.l[1]), sample(seg, t, (k) => k.l[2]));
  out.fov = sample(seg, t, (k) => k.fov ?? 30);
  out.ap = sample(seg, t, (k) => k.ap ?? 0.02);
  const dist = out.pos.distanceTo(out.look);
  out.focus = sample(seg, t, (k) => k.focus ?? -1);
  if (out.focus < 0) out.focus = dist;
  return out;
}
