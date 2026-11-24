import React from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { createMetal, patchMaterial } from '../shaders/chunks';
import { useAsset } from './useAsset';

export const ROASTER = { R: 4.1, cy: 0.3, zFront: -0.5, zBack: -5.4, hole: 4.85, chute: [0, 5.1, 1.1], hopper: [0, 8.2, -2.2] };

/**
 * Premium drum roaster: brushed steel face with a round viewing aperture, perforated rotating drum with vanes,
 * glowing heating ring, hopper with hinged lid and a loading chute.
 */
export function createRoaster() {
  const res = []; const object = new THREE.Group();
  const steel = createMetal({ color: 0xc4c0b8, rough: 0.32 }); res.push(steel);
  const dark = createMetal({ color: 0x2b2824, rough: 0.45 }); res.push(dark);
  const copper = new THREE.MeshStandardMaterial({ color: 0xb6703a, metalness: 1, roughness: 0.3 }); res.push(copper);
  const add = (geo, mat, x = 0, y = 0, z = 0, cast = true) => { res.push(geo); const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; object.add(m); return m; };

  // body block + face plate with round aperture (Shape with hole)
  // hollow cabinet (rear block + side/top/bottom panels) so the drum is visible through the aperture
  add(new RoundedBoxGeometry(17, 13, 3.6, 4, 0.3), dark, 0, 0.5, -8.0);
  add(new THREE.BoxGeometry(0.4, 13, 8.6), dark, -8.4, 0.5, -5.0);
  add(new THREE.BoxGeometry(0.4, 13, 8.6), dark, 8.4, 0.5, -5.0);
  add(new THREE.BoxGeometry(17, 0.4, 8.6), dark, 0, 6.8, -5.0);
  add(new THREE.BoxGeometry(17, 0.4, 8.6), dark, 0, -5.8, -5.0);
  const shape = new THREE.Shape(); shape.moveTo(-8.5, -6); shape.lineTo(8.5, -6); shape.lineTo(8.5, 7); shape.lineTo(-8.5, 7); shape.lineTo(-8.5, -6);
  const hole = new THREE.Path(); hole.absarc(0, ROASTER.cy, ROASTER.hole, 0, Math.PI * 2, true); shape.holes.push(hole);
  const faceGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.5, bevelEnabled: true, bevelSize: 0.12, bevelThickness: 0.12, bevelSegments: 3, curveSegments: 64 });
  add(faceGeo, steel, 0, 0, -0.5);
  add(new THREE.TorusGeometry(ROASTER.hole + 0.1, 0.2, 16, 96), new THREE.MeshStandardMaterial({ color: 0xf0ede6, metalness: 1, roughness: 0.15 }), 0, ROASTER.cy, 0.05);
  // lower control strip + dials
  add(new RoundedBoxGeometry(14, 1.1, 0.3, 3, 0.1), dark, 0, -5.0, 0.0);
  [-4.5, -1.5, 1.5, 4.5].forEach((x, i) => {
    add(new THREE.CylinderGeometry(0.42, 0.46, 0.4, 28).rotateX(Math.PI / 2), i === 3 ? copper : steel, x, -5.0, 0.35);
    const notch = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.3, 0.05), dark); notch.position.set(x, -4.9, 0.58); notch.rotation.z = 0.5 + i; object.add(notch); res.push(notch.geometry);
  });

  // ---- rotating drum ----
  const drum = new THREE.Group(); drum.position.z = 0; object.add(drum);
  const len = ROASTER.zFront - ROASTER.zBack;
  const wallG = new THREE.CylinderGeometry(ROASTER.R, ROASTER.R, len, 72, 1, true); wallG.rotateX(Math.PI / 2); res.push(wallG);
  const wallM = new THREE.MeshStandardMaterial({ color: 0x9a968e, metalness: 0.55, roughness: 0.42, side: THREE.DoubleSide }); res.push(wallM);
  patchMaterial(wallM, {
    key: 'drumwall',
    fragColor: `{ float a = atan(vObj.y, vObj.x); vec2 q = vec2(a*7.5, vObj.z*1.6); vec2 f = fract(q)-.5; float hole = smoothstep(.28,.2,length(f)); diffuseColor.rgb *= 1.-hole*.9; }`,
  });
  const wall = new THREE.Mesh(wallG, wallM); wall.position.set(0, ROASTER.cy, (ROASTER.zFront + ROASTER.zBack) / 2); wall.receiveShadow = true; drum.add(wall);
  // vanes
  const vaneG = new THREE.BoxGeometry(0.25, 1.15, len - 0.6); res.push(vaneG);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2; const v = new THREE.Mesh(vaneG, steel);
    v.position.set(Math.cos(a) * (ROASTER.R - 0.55), ROASTER.cy + Math.sin(a) * (ROASTER.R - 0.55), (ROASTER.zFront + ROASTER.zBack) / 2); v.rotation.z = a - Math.PI / 2 + 0.0; v.rotation.z = a + Math.PI / 2 + 0.25;
    v.castShadow = true; drum.add(v);
  }
  // back wall with glowing heater coils
  const backG = new THREE.CircleGeometry(ROASTER.R, 64); res.push(backG);
  const backM = new THREE.MeshStandardMaterial({ color: 0x3a2a20, metalness: 0.8, roughness: 0.5, emissive: 0xff5a10, emissiveIntensity: 1 }); res.push(backM);
  patchMaterial(backM, {
    key: 'roastback', uniforms: { uHeat: { value: 0 } },
    fragEmissive: `{ float r = length(vObj.xy); float ring = smoothstep(.12,.0, abs(fract(r*1.9)-.5)-.36) ; float core = smoothstep(ROASTER_R, .0, r);
      totalEmissiveRadiance = vec3(1.,.3,.05) * (core*.22 + ring*.38) * uHeat; }`.replace('ROASTER_R', ROASTER.R.toFixed(2)),
  });
  const back = new THREE.Mesh(backG, backM); back.position.set(0, ROASTER.cy, ROASTER.zBack + 0.02); back.rotation.y = 0; back.receiveShadow = true; drum.add(back);
  // spinning hub on the back wall
  add(new THREE.CylinderGeometry(0.9, 1.1, 0.5, 32).rotateX(Math.PI / 2), steel, 0, ROASTER.cy, ROASTER.zBack + 0.3, false).parent.remove(object.children[object.children.length - 1]);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.5, 32).rotateX(Math.PI / 2), steel); res.push(hub.geometry);
  hub.position.set(0, ROASTER.cy, ROASTER.zBack + 0.3); drum.add(hub);

  // ---- hopper + lid + chute ----
  const [hx, hy, hz] = ROASTER.hopper;
  const hopG = new THREE.CylinderGeometry(2.6, 1.0, 3.2, 40, 1, true); res.push(hopG);
  const hopM = steel.clone(); hopM.side = THREE.DoubleSide; res.push(hopM);
  const hopper = new THREE.Mesh(hopG, hopM); hopper.position.set(hx, hy, hz); hopper.castShadow = true; object.add(hopper);
  const rimG = new THREE.TorusGeometry(2.6, 0.12, 12, 48); res.push(rimG);
  const rim = new THREE.Mesh(rimG, steel); rim.rotation.x = Math.PI / 2; rim.position.set(hx, hy + 1.6, hz); object.add(rim);
  const lidPivot = new THREE.Group(); lidPivot.position.set(hx, hy + 1.65, hz - 2.6); object.add(lidPivot);
  const lidG = new THREE.CylinderGeometry(2.7, 2.7, 0.18, 48); res.push(lidG);
  const lid = new THREE.Mesh(lidG, copper); lid.position.set(0, 0.0, 2.6); lid.castShadow = true; lidPivot.add(lid);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), dark); knob.position.set(0, 0.25, 2.6); lidPivot.add(knob); res.push(knob.geometry);
  const chuteG = new THREE.CylinderGeometry(0.75, 0.75, 4.4, 24, 1, true); res.push(chuteG);
  const chuteM = steel.clone(); chuteM.side = THREE.DoubleSide; res.push(chuteM);
  const chute = new THREE.Mesh(chuteG, chuteM);
  chute.position.set(0, 6.0, -0.55); chute.rotation.x = -1.0; chute.castShadow = true; object.add(chute);
  // exhaust stack on the back
  add(new THREE.CylinderGeometry(0.8, 0.9, 5, 24), steel, 6.2, 9.0, -6.6);

  const spinParts = [wall, hub];
  function update({ drumAngle = 0, lid: l = 0, heat = 0 } = {}) {
    drum.rotation.z = drumAngle;
    lidPivot.rotation.x = -l * 1.9;
    backM.userData.uniforms.uHeat.value = heat;
  }
  return { object, drum, update, dispose: () => res.forEach((x) => x.dispose && x.dispose()) };
}

export default function CoffeeRoaster({ apiRef, ...props }) {
  const a = useAsset(createRoaster);
  if (apiRef) apiRef.current = a;
  return <primitive object={a.object} {...props} />;
}
