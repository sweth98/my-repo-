import React from 'react';
import * as THREE from 'three';
import { patchMaterial } from '../shaders/chunks';
import { createGroundsStream } from '../animation/particleAnimation';
import { noise3 } from '../animation/util';
import { useAsset } from './useAsset';

export { createGroundsStream };

/** Powdery heap of grounds (displaced dome with fine granular bump + glints). `grow` 0..1, `flat` compacts it. */
export function createGroundsMound({ radius = 1.25, seed = 3 } = {}) {
  const geo = new THREE.SphereGeometry(1, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = noise3(x * 6 + seed, y * 6, z * 6) - 0.5, n2 = noise3(x * 14, y * 14 + seed, z * 14) - 0.5;
    p.setXYZ(i, x * (1 + n2 * 0.06), y * (1 + n * 0.5 + n2 * 0.25), z * (1 + n2 * 0.06));
  }
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0 });
  patchMaterial(mat, {
    key: 'grounds', srgb: true,
    fragColor: `
      float g1 = vnoise(vObj*38.), g2 = vnoise(vObj*95.), g3 = fbm3(vObj*8.);
      float clump = smoothstep(.45,.7, vnoise(vObj*22.));
      vec3 c = mix(vec3(.10,.05,.025), vec3(.30,.16,.075), g1*.6+g2*.4);
      c *= .6 + .7*g3; c *= 1. - clump*.35;
      c += vec3(.18,.1,.05) * step(.93, g2) ;       // bright granule glints
      diffuseColor.rgb = c;`,
    fragNormal: `{ float h = vnoise(vObj*38.)*.55 + vnoise(vObj*95.)*.35 + vnoise(vObj*22.)*.5; normal = perturbH(-vViewPosition, normal, vec2(dFdx(h), dFdy(h))*.05, faceDirection); }`,
  });
  const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true; mesh.receiveShadow = true;
  const object = new THREE.Group(); object.add(mesh);
  return {
    object,
    update: ({ grow = 1, flat = 0, r = radius } = {}) => { mesh.scale.set(r * (1 + flat * 0.08), Math.max(0.001, grow * 0.7 * (1 - flat * 0.82)), r * (1 + flat * 0.08)); object.visible = grow > 0.01; },
    dispose: () => { geo.dispose(); mat.dispose(); },
  };
}

export default function CoffeeGrounds({ apiRef, ...props }) {
  const a = useAsset(createGroundsMound);
  if (apiRef) apiRef.current = a;
  return <primitive object={a.object} {...props} />;
}
