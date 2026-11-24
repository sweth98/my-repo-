import React from 'react';
import * as THREE from 'three';
import { useAsset } from './useAsset';
import { mulberry32, noise3 } from '../animation/util';

function leafTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512;
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 256, 0);
  grd.addColorStop(0, '#2f5a24'); grd.addColorStop(0.5, '#3f7230'); grd.addColorStop(1, '#2f5a24');
  g.fillStyle = grd; g.fillRect(0, 0, 256, 512);
  const r = mulberry32(11);
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${40 + r() * 40},${90 + r() * 50},${30 + r() * 30},0.12)`; g.fillRect(r() * 256, r() * 512, 4 + r() * 10, 4 + r() * 10); }
  // veins
  g.strokeStyle = 'rgba(190,220,140,0.55)'; g.lineWidth = 5; g.beginPath(); g.moveTo(128, 512); g.lineTo(128, 0); g.stroke();
  g.lineWidth = 2;
  for (let i = 0; i < 16; i++) {
    const y = 500 - i * 31; const spread = 0.85 - i * 0.02;
    for (const sgn of [-1, 1]) {
      g.beginPath(); g.moveTo(128, y); g.quadraticCurveTo(128 + sgn * 60, y - 22, 128 + sgn * 112 * spread, y - 78); g.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}
function leafBump() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512; const g = c.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, 256, 512);
  g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.beginPath(); g.moveTo(128, 512); g.lineTo(128, 0); g.stroke(); g.lineWidth = 3;
  for (let i = 0; i < 16; i++) { const y = 500 - i * 31; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(128, y); g.quadraticCurveTo(128 + s * 60, y - 22, 128 + s * 95, y - 78); g.stroke(); } }
  const r = mulberry32(5); for (let i = 0; i < 1500; i++) { g.fillStyle = `rgba(${r() * 255 | 0},${r() * 255 | 0},${r() * 255 | 0},0.12)`; g.fillRect(r() * 256, r() * 512, 3, 3); }
  return new THREE.CanvasTexture(c);
}

export function buildLeafGeometry(len = 9, wid = 3.7, bend = 0.22) {
  const g = new THREE.PlaneGeometry(1, 1, 8, 16);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) + 0.5, s = p.getY(i) + 0.5;
    const half = wid * 0.5 * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.78)), 0.85) * (1 - 0.1 * s);
    const x = (u - 0.5) * 2 * half;
    const fold = Math.abs(u - 0.5) * 2 * half * 0.28;                 // V-shaped midrib
    const ripple = Math.sin(s * 26 + u * 2) * 0.05 * Math.abs(u - 0.5) * 2 * half * 0.4;
    const z = fold + ripple - bend * len * s * s;                       // tip droops
    p.setXYZ(i, x, s * len, z);
  }
  g.computeVertexNormals();
  return g;
}

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _s = new THREE.Vector3(), _p = new THREE.Vector3();

/** Instanced leaves with per-leaf sway; wind = pure function of time. */
export function createLeafField(leaves, { tex, bump } = {}) {
  const geo = buildLeafGeometry();
  const mat = new THREE.MeshPhysicalMaterial({
    map: tex, bumpMap: bump, bumpScale: 1.5, roughness: 0.42, side: THREE.DoubleSide,
    clearcoat: 0.35, clearcoatRoughness: 0.35, emissive: 0x1d3d12, emissiveIntensity: 0.55,
    sheen: 0.4, sheenColor: new THREE.Color(0xb6d070),
  });
  const mesh = new THREE.InstancedMesh(geo, mat, leaves.length);
  mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
  const col = new THREE.Color();
  leaves.forEach((l, i) => {
    col.setHSL(0.27 + (l.tone || 0) * 0.05, 0.45 + (l.tone || 0) * 0.15, 0.4 + (l.tone || 0) * 0.12); mesh.setColorAt(i, col);
  });
  const update = (t, wind = 1) => {
    leaves.forEach((l, i) => {
      const sw = Math.sin(t * l.f + l.ph) * 0.05 * wind + Math.sin(t * l.f * 2.3 + l.ph * 1.7) * 0.02 * wind;
      _e.set(l.rx + sw, l.ry + sw * 0.6, l.rz + sw * 0.4, 'YXZ');
      _q.setFromEuler(_e); _p.set(l.x, l.y, l.z); _s.setScalar(l.s);
      _m.compose(_p, _q, _s); mesh.setMatrixAt(i, _m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  };
  update(0);
  return { mesh, update, dispose: () => { geo.dispose(); mat.dispose(); mesh.dispose(); } };
}

/**
 * Coffee branch: arching woody stem with opposite leaf pairs at each node + helper node positions
 * for attaching flowers / cherry clusters.
 */
export function createBranch({ seed = 1, nodes = 5, spacing = 4.2, leafScale = 1 } = {}) {
  const r = mulberry32(seed);
  const pts = [];
  for (let i = 0; i <= nodes; i++) pts.push(new THREE.Vector3(i * spacing - (nodes * spacing) / 2, Math.sin(i * 0.9) * 0.6 - i * 0.25, Math.cos(i * 1.3) * 0.8));
  const curve = new THREE.CatmullRomCurve3(pts);
  const stemGeo = new THREE.TubeGeometry(curve, 60, 0.2, 10, false);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.8 });
  const stem = new THREE.Mesh(stemGeo, stemMat); stem.castShadow = true;
  const tex = leafTexture(), bump = leafBump();
  const leaves = [], nodePos = [];
  for (let i = 0; i <= nodes; i++) {
    const p = curve.getPoint(i / nodes); nodePos.push(p.clone());
    if (i === 0) continue;
    for (const side of [-1, 1]) {
      leaves.push({
        x: p.x + 0.1, y: p.y, z: p.z, s: leafScale * (0.85 + r() * 0.3),
        rx: -Math.PI / 2 + 0.25 + (r() - 0.5) * 0.3,            // leaf lies roughly horizontal, tip pointing sideways
        ry: 0, rz: side * (Math.PI / 2) + (r() - 0.5) * 0.5 + (side > 0 ? 0.15 : -0.15),
        f: 0.9 + r() * 0.8, ph: r() * 6.28, tone: r(),
      });
    }
  }
  // leaf geometry runs along +y; rx swings it toward ±z (toward / away from camera), ry sweeps it along the branch
  // leaf geometry runs along +y; rx tips it away from the camera (up + back), ry sweeps it along the branch
  leaves.forEach((l, i) => { const side = i % 2 ? 1 : -1; l.rx = -(0.45 + r() * 0.55); l.ry = side * (0.55 + r() * 0.7); l.rz = (r() - 0.5) * 0.5; l.y += 0.1; });
  const field = createLeafField(leaves, { tex, bump });
  const object = new THREE.Group(); object.add(stem, field.mesh);
  return {
    object, nodePos, curve,
    update: (t, wind) => field.update(t, wind),
    dispose: () => { field.dispose(); stemGeo.dispose(); stemMat.dispose(); tex.dispose(); bump.dispose(); },
  };
}

/** Out-of-focus plantation layers: many leaves scattered at depth for natural bokeh. */
export function createLeafLayer({ count = 40, seed = 3, box = [30, 14, 14], center = [0, 0, -14], scale = 1.6, avoid = [0, 0] } = {}) {
  const r = mulberry32(seed); const leaves = [];
  for (let i = 0; i < count; i++) {
    let x = 0, y = 0, tries = 0;
    do { x = center[0] + (r() - 0.5) * box[0]; y = center[1] + (r() - 0.5) * box[1]; tries++; } while (tries < 12 && Math.abs(x) < avoid[0] && Math.abs(y - center[1]) < avoid[1]);
    leaves.push({
      x, y, z: center[2] - r() * box[2],
      s: scale * (0.7 + r() * 0.9), rx: -0.9 + r() * 1.8, ry: (r() - 0.5) * 3, rz: (r() - 0.5) * 6.3,
      f: 0.5 + r() * 0.6, ph: r() * 6.28, tone: r(),
    });
  }
  const tex = leafTexture(), bump = leafBump();
  const f = createLeafField(leaves, { tex, bump });
  return { object: f.mesh, update: f.update, dispose: () => { f.dispose(); tex.dispose(); bump.dispose(); } };
}

export function createPlant({ seed = 2 } = {}) {
  const object = new THREE.Group();
  const branch = createBranch({ seed, nodes: 5, spacing: 4.4, leafScale: 0.62 });
  const back = createLeafLayer({ count: 15, seed: seed + 4, box: [38, 16, 10], center: [0, 1, -7], scale: 1.0 });
  const front = createLeafLayer({ count: 3, seed: seed + 8, box: [24, 3, 1.5], center: [0, 5.2, 2.2], scale: 0.7, avoid: [5, 3] });
  object.add(branch.object, back.object, front.object);
  return {
    object, branch, nodePos: branch.nodePos,
    update: (t, wind = 1) => { branch.update(t, wind); back.update(t, wind); front.update(t, wind); },
    dispose: () => { branch.dispose(); back.dispose(); front.dispose(); },
  };
}

export default function CoffeePlant({ apiRef, ...props }) {
  const a = useAsset(createPlant);
  if (apiRef) apiRef.current = a;
  return <primitive object={a.object} {...props} />;
}
