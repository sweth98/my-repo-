// Master timeline: turns the part descriptions from architecture.js into
// InstancedMeshes and evaluates every transform as a pure function of time.
// No accumulated state: update(t) always produces exactly the same pose for the same t.
import * as THREE from 'three';
import { DURATION } from './config.js';
import { ease, settleCurve, clamp01, rng } from './easing.js';
import { getGeometry, geoKey } from './geometry.js';

const _pos = new THREE.Vector3();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _hidden = new THREE.Matrix4().makeScale(0, 0, 0);
const _st = { pos: _pos, quat: _quat, scale: _scale };
const _col = new THREE.Color();

/**
 * Compute a part's pose at time t. Returns false when the part is not present.
 * Phases: waiting -> moving (eased, along its trajectory) -> settling -> resting -> retracting.
 */
export function evaluatePart(part, t, out = _st) {
  let p;
  let settle = 0;
  if (part.exit && t >= part.exit.t0) {
    if (t >= part.exit.t1) {
      if (!part.persist) return false;
      p = 0;
    } else {
      const u = (t - part.exit.t0) / (part.exit.t1 - part.exit.t0);
      p = ease(part.ease, 1 - u); // the build, played backwards
    }
  } else if (t < part.t0) {
    if (!part.persist) return false;
    p = 0;
  } else if (t < part.t1) {
    p = ease(part.ease, (t - part.t0) / (part.t1 - part.t0));
  } else {
    if (part.ephemeral) return false;
    p = 1;
    if (part.settle && part.settle.amp > 0) {
      settle = settleCurve((t - part.t1) / part.settle.dur);
    }
  }
  out.pos.copy(part.pos);
  out.quat.copy(part.quat);
  out.scale.copy(part.scale);
  if (part.motion && p < 1) part.motion(p, out, part);
  if (settle) out.pos.y -= part.settle.amp * settle;
  return true;
}

export class Structure {
  constructor(arch, materials) {
    this.arch = arch;
    this.group = new THREE.Group();
    this.group.name = 'Architecture';
    this.meshes = [];
    const buckets = new Map();
    for (const part of arch.parts) {
      const key = `${geoKey(part.geo)}|${part.mat}`;
      let b = buckets.get(key);
      if (!b) buckets.set(key, (b = { geo: part.geo, mat: part.mat, parts: [] }));
      b.parts.push(part);
    }
    const r = rng(77);
    for (const [key, b] of buckets) {
      const geometry = getGeometry(b.geo).clone();
      const seed = new Float32Array(b.parts.length);
      b.parts.forEach((_, i) => (seed[i] = r() * 50));
      geometry.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 1));
      const mesh = new THREE.InstancedMesh(geometry, materials[b.mat], b.parts.length);
      mesh.name = key;
      mesh.frustumCulled = false;
      mesh.castShadow = b.mat !== 'reveal';
      mesh.receiveShadow = b.mat !== 'reveal';
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      b.parts.forEach((part, i) => {
        const v = 0.93 + r() * 0.12;
        mesh.setColorAt(i, _col.setRGB(v, v * (0.99 + r() * 0.02), v * (0.98 + r() * 0.03)));
        part._mesh = mesh;
        part._index = i;
      });
      mesh.instanceColor.needsUpdate = true;
      this.group.add(mesh);
      this.meshes.push(mesh);
    }
    this.parts = arch.parts;
  }

  /** Pose every part for time t (seconds on the 0..35 master timeline). */
  update(t) {
    for (const part of this.parts) {
      const mesh = part._mesh;
      if (evaluatePart(part, t, _st)) {
        _m.compose(_pos, _quat, _scale);
        mesh.setMatrixAt(part._index, _m);
      } else {
        mesh.setMatrixAt(part._index, _hidden);
      }
    }
    for (const m of this.meshes) m.instanceMatrix.needsUpdate = true;
  }

  /** Stable snapshot of every pose (for loop validation). */
  snapshot(t) {
    const out = [];
    for (const part of this.parts) {
      if (evaluatePart(part, t, _st)) out.push([part.id, ..._pos.toArray(), ..._quat.toArray(), ..._scale.toArray()]);
      else out.push([part.id, null]);
    }
    return out;
  }
}

/** Portal activation 0..1 (the iris that opens the impossible connection). */
export function portalOpen(t) {
  const on = clamp01((t - 18.3) / 0.9);
  const off = 1 - clamp01((t - 31.0) / 0.8);
  const f = (x) => x * x * (3 - 2 * x);
  return f(on) * f(off);
}

export { DURATION };
