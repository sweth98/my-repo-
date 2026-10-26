// Reusable procedural motion factories. Every motion is a pure function of the
// eased progress p (0 = start pose, 1 = final pose), so the whole film is a
// deterministic function of time — no accumulated per-frame state.
//
//   motion(p, st, fin)  mutates st = { pos, quat, scale } (pre-filled with `fin`).
import * as THREE from 'three';

const _q = new THREE.Quaternion();
const _q2 = new THREE.Quaternion();
const _v = new THREE.Vector3();
const _e = new THREE.Euler();
const Y = new THREE.Vector3(0, 1, 0);
const X = new THREE.Vector3(1, 0, 0);

/** Generic heavy travel: offset + small rotation + optional arc, relaxing to the final pose. */
export function travel({ offset = [0, 0, 0], yaw = 0, pitch = 0, roll = 0, arc = [0, 0, 0] } = {}) {
  return (p, st) => {
    const k = 1 - p;
    st.pos.x += offset[0] * k;
    st.pos.y += offset[1] * k;
    st.pos.z += offset[2] * k;
    const bump = Math.sin(Math.PI * p) * (1 - p * 0.0);
    st.pos.x += arc[0] * bump;
    st.pos.y += arc[1] * bump;
    st.pos.z += arc[2] * bump;
    if (yaw || pitch || roll) {
      _e.set(pitch * k, yaw * k, roll * k, 'YXZ');
      _q.setFromEuler(_e);
      st.quat.premultiply(_q);
    }
  };
}

/** Step rising up from below into place. */
export const risePlace = (dist = 6, yaw = 0.2, drift = [0, 0, 0]) =>
  travel({ offset: [drift[0], -dist, drift[2]], yaw });

/** Step dropping in from above. */
export const dropPlace = (dist = 6, yaw = -0.2, drift = [0, 0, 0]) =>
  travel({ offset: [drift[0], dist, drift[2]], yaw });

/** Beam sliding along a direction into position. */
export const slideBeam = (dir, dist) =>
  travel({ offset: [dir[0] * dist, dir[1] * dist, dir[2] * dist] });

/**
 * Rotate about an arbitrary pivot axis (landing panels unfolding on a hinge,
 * curved stair segments swinging into alignment about their centre of curvature).
 * `angle` is the start angle; it relaxes to 0 at p = 1.
 */
export function rotateAbout({ pivot, axis = [0, 1, 0], angle, lift = 0, extra = null }) {
  const ax = new THREE.Vector3(...axis).normalize();
  const pv = new THREE.Vector3(...pivot);
  return (p, st) => {
    const a = angle * (1 - p);
    _q.setFromAxisAngle(ax, a);
    _v.copy(st.pos).sub(pv).applyQuaternion(_q).add(pv);
    st.pos.copy(_v);
    st.pos.y += lift * (1 - p);
    st.quat.premultiply(_q);
    if (extra) extra(p, st);
  };
}

/**
 * Column extension: scales the member along world Y while pinning the top
 * (or bottom) end. Works for vertical members only, which is all we need.
 */
export function extendY({ height, anchor = 'top' }) {
  return (p, st, fin) => {
    const s = Math.max(0.002, p);
    st.scale.y = fin.scale.y * s;
    const sign = anchor === 'top' ? 1 : -1; // pinned end is above (top) or below (bottom) centre
    st.pos.y = fin.pos.y + sign * (height / 2) * (1 - s);
  };
}

/** Chain several motions; each mutates the shared state in order. */
export const chain = (...ms) => (p, st, fin) => {
  for (const m of ms) m(p, st, fin);
};

/** A motion that uses a sub-range of progress (for staggered sub-parts). */
export const subRange = (a, b, m) => (p, st, fin) => {
  const q = Math.min(1, Math.max(0, (p - a) / (b - a)));
  m(q, st, fin);
};

/** Fragment cluster pose: scattered shards converging on a point then vanishing. */
export function shardMotion({ from, via, to, spin }) {
  return (p, st) => {
    // p in [0,1]: scatter -> cluster -> into the tread volume
    const a = Math.min(1, p / 0.7);
    const b = Math.max(0, (p - 0.7) / 0.3);
    const ea = 1 - Math.pow(1 - a, 3);
    st.pos.set(
      from[0] + (via[0] - from[0]) * ea + (to[0] - via[0]) * b * b,
      from[1] + (via[1] - from[1]) * ea + (to[1] - via[1]) * b * b,
      from[2] + (via[2] - from[2]) * ea + (to[2] - via[2]) * b * b
    );
    _q.setFromAxisAngle(Y, spin[0] * (1 - p));
    _q2.setFromAxisAngle(X, spin[1] * (1 - p));
    st.quat.copy(_q).multiply(_q2);
    // shrink to nothing as they merge into the tread
    const s = 1 - Math.pow(b, 1.5);
    st.scale.multiplyScalar(Math.max(0.0001, s));
  };
}
