import React from 'react';
import * as THREE from 'three';
import { buildBeanGeometry } from './beanGeometry';
import { createBeanMaterial } from '../shaders/roastedBeanShader';
import { useAsset } from './useAsset';

/** Pale green-beige matte bean (roast = 0). */
export function createGreenBean({ seed = 3, wet = 0, res = 'hi' } = {}) {
  const geo = buildBeanGeometry({ seed, w: res === 'hi' ? 96 : 28, h: res === 'hi' ? 64 : 18 });
  const material = createBeanMaterial({ roast: 0 });
  material.userData.uniforms.uWet.value = wet;
  const mesh = new THREE.Mesh(geo, material);
  mesh.castShadow = true; mesh.receiveShadow = true;
  const object = new THREE.Group();
  object.add(mesh);
  return {
    object, mesh, material,
    update: ({ roast = 0, wet: w = wet, crack = 0 } = {}) => {
      material.userData.setRoast(roast);
      material.userData.uniforms.uWet.value = w;
      material.userData.uniforms.uCrack.value = crack;
    },
    dispose: () => { geo.dispose(); material.dispose(); },
  };
}

export default function GreenCoffeeBean({ apiRef, ...props }) {
  const a = useAsset(createGreenBean);
  if (apiRef) apiRef.current = a;
  return <primitive object={a.object} {...props} />;
}
