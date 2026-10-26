// Reusable, cached architectural geometry. Every distinct size is built once
// and shared by an InstancedMesh, so bevel radii stay true (no non-uniform scaling).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const cache = new Map();
const r3 = (n) => Math.round(n * 1000) / 1000;

export function geoKey(spec) {
  if (spec.type === 'box') return `box:${r3(spec.w)}:${r3(spec.h)}:${r3(spec.d)}:${r3(spec.r ?? 0.04)}`;
  if (spec.type === 'sector')
    return `sec:${r3(spec.r0)}:${r3(spec.r1)}:${r3(spec.span)}:${r3(spec.h)}:${r3(spec.r ?? 0.04)}`;
  if (spec.type === 'cyl') return `cyl:${r3(spec.rad)}:${r3(spec.h)}`;
  throw new Error('unknown geometry spec');
}

export function getGeometry(spec) {
  const key = geoKey(spec);
  let g = cache.get(key);
  if (g) return g;
  if (spec.type === 'box') {
    const r = Math.min(spec.r ?? 0.04, spec.w / 2 - 1e-3, spec.h / 2 - 1e-3, spec.d / 2 - 1e-3);
    g = new RoundedBoxGeometry(spec.w, spec.h, spec.d, 2, r);
  } else if (spec.type === 'sector') {
    g = makeSectorGeometry(spec);
  } else if (spec.type === 'cyl') {
    g = new THREE.CylinderGeometry(spec.rad, spec.rad, spec.h, 40, 1);
  }
  g.computeBoundingSphere();
  cache.set(key, g);
  return g;
}

// Annular sector (wedge tread) in the XZ plane, centred on the local +X axis,
// extruded along Y and centred vertically. Its origin is the centre of curvature,
// which makes pivot-based "rotate into position" motion trivial.
function makeSectorGeometry({ r0, r1, span, h, r = 0.04 }) {
  const a0 = -span / 2;
  const a1 = span / 2;
  const shape = new THREE.Shape();
  shape.moveTo(r0 * Math.cos(a0), r0 * Math.sin(a0));
  shape.lineTo(r1 * Math.cos(a0), r1 * Math.sin(a0));
  shape.absarc(0, 0, r1, a0, a1, false);
  shape.lineTo(r0 * Math.cos(a1), r0 * Math.sin(a1));
  shape.absarc(0, 0, r0, a1, a0, true);
  const bev = Math.min(r, h * 0.3);
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: h - 2 * bev,
    bevelEnabled: true,
    bevelThickness: bev,
    bevelSize: bev,
    bevelOffset: -bev,
    bevelSegments: 2,
    curveSegments: Math.max(4, Math.ceil(span / 0.04)),
  });
  g.rotateX(-Math.PI / 2); // shape(x,y) -> world(x,-z); extrusion z -> +y
  g.translate(0, bev - h / 2 + 0, 0);
  g.computeVertexNormals();
  return g;
}
