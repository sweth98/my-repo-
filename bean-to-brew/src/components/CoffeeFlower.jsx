import React from 'react';
import * as THREE from 'three';
import { useAsset } from './useAsset';
import { clamp, easeInOut, mulberry32 } from '../animation/util';

function petalGeometry() {
  const g = new THREE.PlaneGeometry(1, 1, 8, 14);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) + 0.5; // 0..1 across
    const s = p.getY(i) + 0.5; // 0..1 along
    const wmax = 0.23 * Math.pow(Math.sin(Math.PI * Math.pow(s, 0.72)), 0.8) * (1 + 0.25 * s);
    const x = (u - 0.5) * 2 * wmax;
    const y = s * 1.55;
    const z = (Math.abs(u - 0.5) * 2) ** 2 * 0.12 * (1 - s * 0.4) + s * s * 0.18; // cupped, tip curls
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
  return g;
}

/** Jasmine-like white coffee flower: 5 petals, stamens, calyx. Hero is oriented toward +z. */
export function createFlower({ seed = 1 } = {}) {
  const res = [];
  const object = new THREE.Group();
  const rand = mulberry32(seed);
  const pg = petalGeometry(); res.push(pg);
  const pm = new THREE.MeshPhysicalMaterial({
    color: 0xfffaf0, roughness: 0.55, side: THREE.DoubleSide, sheen: 1, sheenColor: new THREE.Color(0xffffff),
    emissive: 0xf4e6c8, emissiveIntensity: 0.16, transmission: 0, clearcoat: 0.15,
  }); res.push(pm);
  const petals = [];
  const petalRoot = new THREE.Group(); object.add(petalRoot);
  for (let i = 0; i < 5; i++) {
    const holder = new THREE.Group();
    holder.rotation.z = (i / 5) * Math.PI * 2 + 0.2;
    const hinge = new THREE.Group();
    const m = new THREE.Mesh(pg, pm); m.castShadow = true; m.receiveShadow = true;
    hinge.add(m);
    holder.add(hinge);
    petalRoot.add(holder);
    petals.push({ holder, hinge, mesh: m, jitter: rand() });
  }
  // tube + calyx
  const tubeM = new THREE.MeshStandardMaterial({ color: 0xe9f0d0, roughness: 0.6 }); res.push(tubeM);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.08, 0.5, 14), tubeM);
  tube.rotation.x = Math.PI / 2; tube.position.z = -0.2; res.push(tube.geometry);
  const calM = new THREE.MeshStandardMaterial({ color: 0x4f7a2c, roughness: 0.55 }); res.push(calM);
  const calyx = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), calM);
  calyx.scale.set(1, 1, 0.8); calyx.position.z = -0.42; res.push(calyx.geometry);
  // stamens
  const am = new THREE.MeshStandardMaterial({ color: 0xe8d37a, roughness: 0.5 }); res.push(am);
  const fm = new THREE.MeshStandardMaterial({ color: 0xf7f1dc, roughness: 0.5 }); res.push(fm);
  const ag = new THREE.CapsuleGeometry(0.05, 0.14, 4, 8); res.push(ag);
  const fg = new THREE.CylinderGeometry(0.012, 0.015, 0.5, 6); res.push(fg);
  const stamens = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.55 + rand() * 0.2;
    const h = new THREE.Group(); h.rotation.z = a;
    const f = new THREE.Mesh(fg, fm); f.position.set(0.14, 0, 0.22); f.rotation.set(0, Math.PI * 0.0, -0.35); f.rotation.x = Math.PI / 2;
    const an = new THREE.Mesh(ag, am); an.position.set(0.2, 0, 0.52); an.rotation.x = Math.PI / 2; an.rotation.y = 0.0;
    h.add(f, an); stamens.add(h);
  }
  const style = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.02, 0.8, 6), fm); style.rotation.x = Math.PI / 2; style.position.z = 0.35; res.push(style.geometry);
  object.add(tube, calyx, stamens, style);

  /** open: 0 bud → 1 full bloom. fall: 0 attached → 1 petals dropped (wilt then drift away). */
  function update({ open = 1, fall = 0 } = {}) {
    const o = easeInOut(clamp(open));
    petals.forEach((p, i) => {
      const wilt = clamp(fall * 1.3 - p.jitter * 0.3);
      p.hinge.rotation.x = 0.14 + (1 - o) * 1.38 - wilt * 0.9 + Math.sin(i * 1.7) * 0.05 * o;
      p.holder.rotation.z = (i / 5) * Math.PI * 2 + 0.2 + (1 - o) * 0.5;
      const fallT = clamp(fall * 1.5 - p.jitter * 0.5);
      p.holder.position.set(0, -fallT * fallT * 5.5, fallT * -0.8);
      p.holder.rotation.y = fallT * (p.jitter - 0.5) * 3;
      const sc = (0.38 + 0.62 * o) * (1 - clamp((fall - 0.7) * 3.3) * 0.0);
      p.holder.scale.setScalar(sc);
      p.mesh.visible = fallT < 0.98;
      pm.emissiveIntensity = 0.16 - fall * 0.1;
    });
    stamens.scale.setScalar(clamp(o * 1.4 - 0.2) * (1 - clamp(fall * 2 - 0.4)));
    style.scale.setScalar(clamp(o * 1.4 - 0.2) * (1 - clamp(fall * 2)));
    stamens.visible = style.visible = stamens.scale.x > 0.01;
  }
  update({ open: 1 });
  return { object, update, calyx, dispose: () => res.forEach((x) => x.dispose && x.dispose()) };
}

export default function CoffeeFlower({ apiRef, ...props }) {
  const a = useAsset(createFlower);
  if (apiRef) apiRef.current = a;
  return <primitive object={a.object} {...props} />;
}
