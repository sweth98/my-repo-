import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { createMetal, patchMaterial } from '../shaders/chunks';

/** Stainless washing channel with a rippling, slightly warm water surface. */
export function createTrough({ length = 70, width = 6.4, waterY = -1.4, floorY = -3.0 } = {}) {
  const res = [];
  const object = new THREE.Group();
  const metal = createMetal({ color: 0xc9c5bd, rough: 0.3 }); res.push(metal);
  const floorG = new RoundedBoxGeometry(length, 0.3, width + 0.8, 3, 0.1); res.push(floorG);
  const floor = new THREE.Mesh(floorG, metal); floor.position.set(0, floorY, 0); floor.receiveShadow = true;
  const backG = new RoundedBoxGeometry(length, 2.4, 0.3, 3, 0.1); res.push(backG);
  const back = new THREE.Mesh(backG, metal); back.position.set(0, floorY + 1.2, -width / 2 - 0.2);
  const lipG = new RoundedBoxGeometry(length, 0.22, 0.34, 3, 0.1); res.push(lipG);
  const lip = new THREE.Mesh(lipG, metal); lip.position.set(0, waterY - 0.25, width / 2 + 0.3);
  const lip2 = new THREE.Mesh(lipG, metal); lip2.position.set(0, floorY + 2.38, -width / 2 - 0.2);
  const waterG = new THREE.PlaneGeometry(length, width, 1, 1); waterG.rotateX(-Math.PI / 2); res.push(waterG);
  const wm = new THREE.MeshPhysicalMaterial({ color: 0x9c8750, roughness: 0.06, metalness: 0, transparent: true, opacity: 0.3, depthWrite: false, clearcoat: 0.6, clearcoatRoughness: 0.04, envMapIntensity: 0.7 });
  patchMaterial(wm, {
    key: 'water',
    uniforms: { uHit: { value: new THREE.Vector3(0, 0, 0) }, uHitT: { value: -10 }, uFlow: { value: 0 } },
    fragNormal: `
      { vec2 p = vObj.xz*1.15; p.x -= uFlow;
        float h = fbm2(p*1.6 + vec2(0., uTime*.0)) *1.0 + fbm2(p*4.5 + 3.)*.4;
        float d = length(vWorldP.xz - uHit.xz); float tt = uHitT;
        float ring = sin((d - tt*3.2)*9.) * exp(-d*.55) * smoothstep(0.,.08,tt) * exp(-tt*1.1) * step(0.,tt) * step(d, tt*3.4+.3);
        h += ring*.5;
        normal = perturbH(-vViewPosition, normal, vec2(dFdx(h), dFdy(h))*.06, faceDirection); }`,
    fragColor: `diffuseColor.a *= .85 + .15*fbm2(vObj.xz*.5);`,
  });
  // uTime is injected by patchMaterial only if declared; add it
  wm.userData.uniforms.uTime = { value: 0 };
  res.push(wm);
  const water = new THREE.Mesh(waterG, wm); water.position.y = waterY; water.userData.noDepth = true; water.renderOrder = 2;
  [floor, back, lip, lip2].forEach((m) => { m.castShadow = true; m.receiveShadow = true; });
  object.add(floor, back, lip, lip2, water);
  return {
    object, waterY, water,
    update: ({ flow = 0, hit = null, hitT = -10, time = 0 } = {}) => {
      const u = wm.userData.uniforms; u.uFlow.value = flow; u.uHitT.value = hitT; u.uTime.value = time;
      if (hit) u.uHit.value.set(hit[0], waterY, hit[1]);
    },
    dispose: () => res.forEach((x) => x.dispose()),
  };
}
