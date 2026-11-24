import React from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { createMetal, patchMaterial } from '../shaders/chunks';
import { useAsset } from './useAsset';

export const GRINDER = { hopperBottom: 8.9, burrY: 6.9, spout: [4.6, 3.7, 1.8], basketTop: 1.45 };

/** Premium burr grinder: brushed housing, glass grinding chamber with a visible conical burr, glass hopper, dosing chute. */
export function createGrinder() {
  const res = []; const object = new THREE.Group();
  const steel = createMetal({ color: 0xc4c0b8, rough: 0.3 }); res.push(steel);
  const dark = createMetal({ color: 0x24211e, rough: 0.4 }); res.push(dark);
  const copper = new THREE.MeshStandardMaterial({ color: 0xb6703a, metalness: 1, roughness: 0.28 }); res.push(copper);
  const add = (geo, mat, x = 0, y = 0, z = 0, parent = object) => { res.push(geo); const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };

  add(new RoundedBoxGeometry(15, 0.7, 10, 3, 0.15), dark, 1.5, 0.0, 0.8);                // base plate
  add(new RoundedBoxGeometry(8.2, 5.4, 7.4, 5, 0.5), steel, 0, 3.1, 0);                  // housing
  add(new RoundedBoxGeometry(5.6, 1.9, 0.3, 3, 0.1), dark, 0, 2.6, 3.7);                 // front plate
  add(new THREE.CylinderGeometry(0.62, 0.7, 0.45, 32).rotateX(Math.PI / 2), copper, -1.4, 2.6, 3.95);
  add(new THREE.CylinderGeometry(0.34, 0.38, 0.4, 24).rotateX(Math.PI / 2), steel, 1.2, 2.6, 3.95);
  add(new RoundedBoxGeometry(8.6, 0.5, 7.8, 3, 0.2), copper, 0, 5.95, 0);                // collar ring

  // glass chamber + hopper
  const glassM = new THREE.MeshPhysicalMaterial({ color: 0x4a3626, roughness: 0.05, transparent: true, opacity: 0.1, clearcoat: 0.4, side: THREE.DoubleSide, depthWrite: false, envMapIntensity: 0.6 }); res.push(glassM);
  const chamber = add(new THREE.CylinderGeometry(3.1, 3.1, 3.0, 56, 1, true), glassM, 0, 7.45, 0); chamber.castShadow = false; chamber.renderOrder = 3; chamber.userData.noDepth = true;
  const hopper = add(new THREE.CylinderGeometry(4.6, 3.1, 5.2, 56, 1, true), glassM, 0, 11.5, 0); hopper.castShadow = false; hopper.renderOrder = 3; hopper.userData.noDepth = true;
  add(new THREE.TorusGeometry(4.6, 0.14, 12, 64).rotateX(Math.PI / 2), steel, 0, 14.1, 0);
  add(new THREE.TorusGeometry(3.1, 0.14, 12, 64).rotateX(Math.PI / 2), steel, 0, 8.95, 0);

  // burr assembly: static outer ring + spinning conical burr with teeth
  add(new THREE.CylinderGeometry(3.0, 3.0, 0.8, 48, 1, true), dark, 0, 6.5, 0).material.side = THREE.DoubleSide;
  const burr = new THREE.Group(); burr.position.set(0, 6.5, 0); object.add(burr);
  const prof = []; for (let i = 0; i <= 14; i++) { const f = i / 14; prof.push(new THREE.Vector2(0.15 + f * 2.2, f * -1.3 + 1.7 - Math.pow(f, 3) * 0.2)); }
  const burrG = new THREE.LatheGeometry(prof, 72); res.push(burrG);
  const burrM = createMetal({ color: 0xb8b2a8, rough: 0.28 }); res.push(burrM);
  patchMaterial(burrM, { key: 'burr', fragNormal: `{ float a = atan(vObj.z, vObj.x); float h = pow(abs(sin(a*20.)), .35) ; normal = perturbH(-vViewPosition, normal, vec2(dFdx(h), dFdy(h))*.35, faceDirection); }` });
  const burrMesh = new THREE.Mesh(burrG, burrM); burrMesh.position.y = 0.1; burrMesh.castShadow = true; burr.add(burrMesh);
  add(new THREE.CylinderGeometry(0.28, 0.28, 3.4, 16), dark, 0, 7.3, 0, burr);

  // chute + spout
  const chuteCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(2.6, 5.0, 1.0), new THREE.Vector3(3.9, 4.6, 1.6), new THREE.Vector3(GRINDER.spout[0], GRINDER.spout[1] + 0.2, GRINDER.spout[2])]);
  const chuteG = new THREE.TubeGeometry(chuteCurve, 20, 0.5, 16, false); res.push(chuteG);
  const chute = new THREE.Mesh(chuteG, dark); chute.castShadow = true; object.add(chute);
  add(new THREE.TorusGeometry(0.55, 0.1, 10, 24).rotateX(Math.PI / 2), steel, GRINDER.spout[0], GRINDER.spout[1] - 0.05, GRINDER.spout[2]);
  // lid
  const lid = add(new THREE.CylinderGeometry(4.7, 4.7, 0.3, 56), copper, 0, 14.4, 0);
  lid.visible = false;
  // portafilter basket under spout
  const pf = new THREE.Group(); pf.position.set(GRINDER.spout[0], 0, GRINDER.spout[2]); object.add(pf);
  add(new THREE.CylinderGeometry(1.45, 1.25, 1.0, 40, 1, true), steel, 0, 0.95, 0, pf).material.side;
  add(new THREE.TorusGeometry(1.45, 0.08, 10, 40).rotateX(Math.PI / 2), steel, 0, 1.45, 0, pf);
  add(new THREE.CylinderGeometry(1.25, 1.25, 0.1, 40), dark, 0, 0.5, 0, pf);
  add(new THREE.CylinderGeometry(0.28, 0.34, 4.6, 20).rotateZ(Math.PI / 2), dark, 3.4, 0.95, 0.6, pf).rotation.y = -0.2;

  function update({ burrSpin = 0, shake = 0, t = 0 } = {}) {
    burr.rotation.y = burrSpin;
    object.position.x = Math.sin(t * 61.0) * 0.012 * shake; object.position.y = Math.sin(t * 47.0 + 1.0) * 0.01 * shake;
  }
  return { object, update, burr, pf, dispose: () => res.forEach((x) => x.dispose && x.dispose()) };
}

export default function CoffeeGrinder({ apiRef, ...props }) {
  const a = useAsset(createGrinder);
  if (apiRef) apiRef.current = a;
  return <primitive object={a.object} {...props} />;
}
