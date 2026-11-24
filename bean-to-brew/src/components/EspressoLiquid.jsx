import React from 'react';
import * as THREE from 'three';
import { createEspressoMaterial } from '../shaders/espressoShader';
import { createParticles } from '../animation/particleAnimation';
import { useAsset } from './useAsset';

/** Viscous espresso column (vertex-animated), leading droplets and impact splash. */
export function createEspressoStream() {
  const geo = new THREE.CylinderGeometry(1, 1, 1, 28, 96, true);
  // remap: y∈[0,1] along the stream (0=spout), x,z hold unit circle
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + 0.5);
  const mat = createEspressoMaterial();
  const mesh = new THREE.Mesh(geo, mat);
  mesh.frustumCulled = false; mesh.castShadow = true;
  const u = mat.userData.uniforms;
  // droplets
  const dropGeo = new THREE.SphereGeometry(1, 20, 14);
  const dropMat = mat.clone(); dropMat.onBeforeCompile = null; dropMat.customProgramCacheKey = undefined;
  const plain = new THREE.MeshPhysicalMaterial({ color: 0x2b1306, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.6, emissive: 0x2a1206, emissiveIntensity: 0.25 });
  const drops = [];
  const object = new THREE.Group(); object.add(mesh);
  for (let j = 0; j < 5; j++) { const d = new THREE.Mesh(dropGeo, plain); d.visible = false; d.castShadow = true; object.add(d); drops.push(d); }
  const splash = createParticles({
    count: 220, seed: 5, size: 0.022, mode: 'grain', color: 0x1a0a03, colorB: 0x4a2410,
    uniforms: { uSurf: { value: 0 }, uAmt: { value: 0 } },
    motion: `
      float ph = fract(aSeed.x + uTime*(1.3+aSeed.y));
      float a = aSeed.z*6.2831; float r = .25 + aSeed.w*.55;
      float h = sin(ph*3.14159)*(.15+.5*aSeed.y);
      pos = vec3(cos(a)*r*ph*1.8, uSurf + h*1.2, sin(a)*r*ph*1.8);
      alive = step(aSeed.y, uAmt);
      sz = .7+.8*aSeed.w;`,
  });
  object.add(splash.object);
  return {
    object, u, drops, splash,
    update: ({ time = 0, top = 1, bottom = 0, r0 = 0.1, on = 0, flow = 0, x = 0, z = 0, surf = 0 } = {}) => {
      u.uTime.value = time; u.uTop.value = top; u.uBottom.value = bottom; u.uR0.value = r0; u.uFlow.value = flow;
      mesh.visible = on > 0.5; mesh.position.set(x, 0, z);
      splash.object.position.set(x, 0, z); splash.uniforms.uSurf.value = surf; splash.uniforms.uAmt.value = flow * Math.min(1, r0 * 5); splash.update(time);
    },
    dispose: () => { geo.dispose(); dropGeo.dispose(); mat.dispose(); plain.dispose(); dropMat.dispose(); splash.dispose(); },
  };
}

export default function EspressoLiquid({ apiRef, ...props }) {
  const a = useAsset(createEspressoStream);
  if (apiRef) apiRef.current = a;
  return <primitive object={a.object} {...props} />;
}
