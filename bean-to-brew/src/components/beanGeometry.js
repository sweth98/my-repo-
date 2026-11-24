import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { noise3 } from '../animation/util';

/**
 * Procedural coffee bean. Bean space: length ±1 along x, width ±0.68 (y), thickness ±0.5 (z).
 * The flat face (+z) carries the characteristic S-curved central groove.
 */
export function buildBeanGeometry({ seed = 1, w = 64, h = 44 } = {}) {
  let g = new THREE.SphereGeometry(1, w, h);
  g.rotateZ(Math.PI / 2);
  g.deleteAttribute('uv');
  g.deleteAttribute('normal');
  g = mergeVertices(g, 1e-4);
  const pos = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const px = v.x, py = v.y, pz = v.z;
    let x = px, y = py * 0.63, z = pz * 0.48;
    const taper = 1 - 0.16 * px * px;
    y *= taper; z *= taper;
    if (z > 0) z *= 0.52; // flat belly
    const cy = Math.sin(x * Math.PI) * 0.06;
    const gauss = Math.exp(-Math.pow(y - cy, 2) / (2 * 0.045 * 0.045));
    if (z > -0.02) z -= 0.15 * gauss * Math.pow(Math.max(0, 1 - x * x), 0.6) * Math.min(1, z * 8 + 0.6);
    // irregularity
    const n = noise3(px * 2.2 + seed * 3.1, py * 2.2 + seed, pz * 2.2) - 0.5;
    const n2 = noise3(px * 6 + seed, py * 6, pz * 6 + seed * 2.3) - 0.5;
    const k = 1 + n * 0.12 + n2 * 0.035;
    x *= k; y *= k; z *= k;
    // slight asymmetry
    y += x * 0.03 * Math.sin(seed * 4.0);
    pos.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  g.computeBoundingSphere();
  return g;
}
