// Camera choreography: one smooth, cyclic spline path (position, look-target, FOV).
//
// * The path is C1-continuous and *cyclic* — the last key equals the first, and tangents
//   wrap — so frame 35.0 flows straight into frame 0.0 with no velocity jump.
// * One section of the path is authored in "A-space": the camera flies straight through
//   the monumental opening A. At the instant it crosses the doorway plane the real camera
//   is carried through the portal transform M (A-space -> B-space). The image is identical
//   on both sides of the crossing, so the viewer experiences one uninterrupted shot.
import * as THREE from 'three';
import { DURATION } from './config.js';

const DIM = 7; // px py pz  lx ly lz  fov

function makeTrack(keys) {
  // keys: [{t, v:[7]}] sorted by t. Non-uniform Catmull-Rom tangents.
  const n = keys.length;
  const m = keys.map(() => new Array(DIM).fill(0));
  for (let i = 0; i < n; i++) {
    const a = keys[Math.max(0, i - 1)];
    const b = keys[Math.min(n - 1, i + 1)];
    const dt = b.t - a.t || 1;
    for (let d = 0; d < DIM; d++) m[i][d] = (b.v[d] - a.v[d]) / dt;
  }
  return {
    keys,
    eval(t, out = new Array(DIM)) {
      let i = 0;
      while (i < n - 2 && t > keys[i + 1].t) i++;
      const k0 = keys[i];
      const k1 = keys[i + 1];
      const h = k1.t - k0.t;
      const u = Math.min(1, Math.max(0, (t - k0.t) / h));
      const u2 = u * u;
      const u3 = u2 * u;
      const h00 = 2 * u3 - 3 * u2 + 1;
      const h10 = u3 - 2 * u2 + u;
      const h01 = -2 * u3 + 3 * u2;
      const h11 = u3 - u2;
      for (let d = 0; d < DIM; d++) {
        out[d] = h00 * k0.v[d] + h10 * h * m[i][d] + h01 * k1.v[d] + h11 * h * m[i + 1][d];
      }
      return out;
    },
  };
}

const deg = Math.PI / 180;

/** Orbit generator: dense cartesian keys sampled from a smooth cylindrical description. */
export function orbitKeys({ centre, t0, t1, step = 0.25, cyl, look, fov }) {
  // cyl(t) -> {theta(deg), r, h}; look(t)->[x,y,z]; fov(t)
  const out = [];
  for (let t = t0; t <= t1 + 1e-6; t += step) {
    const c = cyl(t);
    const th = c.theta * deg;
    const p = [centre[0] + Math.sin(th) * c.r, centre[1] + c.h, centre[2] - Math.cos(th) * c.r];
    out.push({ t: +t.toFixed(4), v: [...p, ...look(t), fov(t)] });
  }
  return out;
}

export class CameraRig {
  /**
   * @param keys   authored keys [{t, p, l, fov, space?}] (space 'A' = authored in A-space)
   * @param portal PortalPair
   */
  constructor(keys, portal) {
    this.portal = portal;
    const toV = (k) => ({ t: k.t, v: k.v ?? [...k.p, ...k.l, k.fov], space: k.space });
    const base = keys.map(toV);
    this.base = base;
    // cyclic extension for wrap-around tangents
    const first = base.slice(1, 3).map((k) => ({ ...k, t: k.t + DURATION }));
    const last = base.slice(-3, -1).map((k) => ({ ...k, t: k.t - DURATION }));
    const ext = [...last, ...base, ...first];
    this.trackU = makeTrack(ext);

    // B-space track: A-space keys (and the real key before them) carried through M
    const iA0 = base.findIndex((k) => k.space === 'A');
    const iA1 = base.length - 1 - [...base].reverse().findIndex((k) => k.space === 'A');
    this.hasPortal = iA0 >= 0;
    if (this.hasPortal) {
      const mapV = (v) => {
        const p = portal.toB(new THREE.Vector3(v[0], v[1], v[2]));
        const l = portal.toB(new THREE.Vector3(v[3], v[4], v[5]));
        return [p.x, p.y, p.z, l.x, l.y, l.z, v[6]];
      };
      const listR = [];
      listR.push({ t: base[iA0 - 1].t, v: mapV(base[iA0 - 1].v) });
      for (let i = iA0; i <= iA1; i++) listR.push({ t: base[i].t, v: mapV(base[i].v) });
      for (let i = iA1 + 1; i < base.length; i++) listR.push(base[i]);
      listR.push(...first);
      this.trackR = makeTrack(listR);
      // crossing instant: camera reaches the doorway plane inside track U
      const tmp = new Array(DIM);
      const p = new THREE.Vector3();
      this.tCross = base[iA1].t;
      for (let t = base[iA0].t - 1.5; t <= base[iA1].t; t += 1 / 1200) {
        this.trackU.eval(t, tmp);
        p.set(tmp[0], tmp[1], tmp[2]);
        if (portal.distFrontA(p) <= 0.12) { this.tCross = t; break; }
      }
    } else {
      this.tCross = Infinity;
    }
    this._tmp = new Array(DIM);
  }

  /** Writes position/target/fov for time t (t in [0, DURATION]). */
  sample(t, pos, look) {
    const tmp = this._tmp;
    const trk = this.hasPortal && t >= this.tCross ? this.trackR : this.trackU;
    trk.eval(t, tmp);
    pos.set(tmp[0], tmp[1], tmp[2]);
    look.set(tmp[3], tmp[4], tmp[5]);
    return tmp[6];
  }
}
