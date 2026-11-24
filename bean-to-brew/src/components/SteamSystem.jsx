import React from 'react';
import * as THREE from 'three';
import { createSteamMaterial } from '../shaders/steamShader';
import { useAsset } from './useAsset';

/** Soft rising steam ribbons: camera-facing planes with advected noise (shader-only motion). */
export function createSteam({ count = 4, height = 9, width = 3.6, spread = 1.4 } = {}) {
  const geo = new THREE.PlaneGeometry(width, height, 1, 1); geo.translate(0, height / 2, 0);
  const mats = [], meshes = [];
  const object = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const m = createSteamMaterial(); mats.push(m);
    const mesh = new THREE.Mesh(geo, m);
    const a = (i / count) * Math.PI * 2;
    mesh.position.set(Math.cos(a) * spread * 0.5, 0, Math.sin(a) * spread * 0.5);
    mesh.renderOrder = 5; mesh.userData.noDepth = true; mesh.userData.phase = i * 3.7;
    meshes.push(mesh); object.add(mesh);
  }
  const v = new THREE.Vector3();
  return {
    object,
    update: (time, amount, camera) => {
      meshes.forEach((m, i) => {
        m.material.uniforms.uTime.value = time + m.userData.phase; m.material.uniforms.uAmount.value = amount * (0.7 + 0.3 * Math.sin(i * 2.1));
        if (camera) { m.getWorldPosition(v); m.rotation.y = Math.atan2(camera.position.x - v.x, camera.position.z - v.z); }
      });
      object.visible = amount > 0.01;
    },
    dispose: () => { geo.dispose(); mats.forEach((m) => m.dispose()); },
  };
}

export default function SteamSystem({ apiRef, ...props }) {
  const a = useAsset(createSteam);
  if (apiRef) apiRef.current = a;
  return <primitive object={a.object} {...props} />;
}
