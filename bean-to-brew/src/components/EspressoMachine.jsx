import React from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { createMetal } from '../shaders/chunks';
import { createGroundsMound } from './CoffeeGrounds';
import { useAsset } from './useAsset';

export const MACHINE = { headY: 11.6, pfY: 9.95, trayTop: 2.62, spoutY: 9.3 };

function gaugeTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#f2e8d4'; g.beginPath(); g.arc(128, 128, 124, 0, Math.PI * 2); g.fill();
  g.strokeStyle = '#2b1309'; g.fillStyle = '#2b1309'; g.lineWidth = 3;
  for (let i = 0; i <= 12; i++) {
    const a = Math.PI * 0.75 + (i / 12) * Math.PI * 1.5; const r0 = i % 3 === 0 ? 88 : 100;
    g.beginPath(); g.moveTo(128 + Math.cos(a) * r0, 128 + Math.sin(a) * r0); g.lineTo(128 + Math.cos(a) * 112, 128 + Math.sin(a) * 112); g.stroke();
  }
  g.strokeStyle = '#a3321c'; g.lineWidth = 8; g.beginPath(); g.arc(128, 128, 104, Math.PI * 0.75 + 1.5 * Math.PI * 0.62, Math.PI * 0.75 + 1.5 * Math.PI * 0.85); g.stroke();
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

/**
 * Espresso machine with brushed body, group head, bottomless portafilter (animatable twist-lock),
 * tamper, pressure gauge, steam wand and a grilled cup tray.
 */
export function createEspressoMachine() {
  const res = []; const object = new THREE.Group();
  const steel = createMetal({ color: 0xc9c5bd, rough: 0.3 }); res.push(steel);
  const dark = createMetal({ color: 0x24201c, rough: 0.42 }); res.push(dark);
  const chrome = new THREE.MeshStandardMaterial({ color: 0xf2efe8, metalness: 1, roughness: 0.12 }); res.push(chrome);
  const copper = new THREE.MeshStandardMaterial({ color: 0xb6703a, metalness: 1, roughness: 0.26 }); res.push(copper);
  const wood = new THREE.MeshStandardMaterial({ color: 0x4a2a16, roughness: 0.55 }); res.push(wood);
  const add = (geo, mat, x = 0, y = 0, z = 0, parent = object) => { res.push(geo); const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };

  // cabinet
  add(new RoundedBoxGeometry(23, 17.6, 9.2, 5, 0.6), steel, 0, 8.8, -6.6);
  add(new RoundedBoxGeometry(23.6, 0.9, 9.8, 3, 0.3), dark, 0, 17.4, -6.6);               // top plate
  add(new RoundedBoxGeometry(23.2, 1.2, 0.5, 3, 0.2), copper, 0, 13.4, -1.95);            // copper trim
  add(new RoundedBoxGeometry(23.2, 3.4, 0.4, 3, 0.15), dark, 0, 15.6, -1.9);              // control strip
  // gauge
  const gt = gaugeTexture(); res.push(gt);
  const face = new THREE.Mesh(new THREE.CircleGeometry(1.35, 48), new THREE.MeshStandardMaterial({ map: gt, roughness: 0.4 })); res.push(face.geometry, face.material);
  face.position.set(-6.2, 15.6, -1.66); object.add(face);
  add(new THREE.TorusGeometry(1.4, 0.12, 12, 48), chrome, -6.2, 15.6, -1.66);
  const needleP = new THREE.Group(); needleP.position.set(-6.2, 15.6, -1.6); object.add(needleP);
  const needle = add(new THREE.BoxGeometry(0.07, 1.1, 0.04), dark, 0, 0.45, 0, needleP);
  add(new THREE.CylinderGeometry(0.16, 0.16, 0.1, 16).rotateX(Math.PI / 2), chrome, 0, 0, 0.02, needleP);
  // buttons
  [3.2, 5.4, 7.6].forEach((x, i) => add(new THREE.CylinderGeometry(0.55, 0.55, 0.3, 32).rotateX(Math.PI / 2), i === 1 ? copper : chrome, x, 15.6, -1.6));
  add(new THREE.SphereGeometry(0.16, 12, 10), new THREE.MeshStandardMaterial({ color: 0xffa23a, emissive: 0xff7a10, emissiveIntensity: 1.5 }), 9.6, 15.6, -1.6);

  // group head
  add(new THREE.CylinderGeometry(3.0, 3.2, 2.4, 56), chrome, 0, MACHINE.headY, -0.2);
  add(new THREE.CylinderGeometry(2.55, 2.55, 0.25, 56), dark, 0, MACHINE.headY - 1.25, -0.2);
  add(new THREE.TorusGeometry(2.65, 0.14, 12, 56).rotateX(Math.PI / 2), steel, 0, MACHINE.headY - 1.3, -0.2);

  // portafilter assembly (pivot at basket centre)
  const pf = new THREE.Group(); pf.position.set(0, MACHINE.pfY, -0.2); object.add(pf);
  add(new THREE.CylinderGeometry(2.45, 2.0, 1.6, 56, 1, true), steel, 0, 0, 0, pf).material = (() => { const m = steel.clone(); m.side = THREE.DoubleSide; res.push(m); return m; })();
  add(new THREE.TorusGeometry(2.45, 0.12, 12, 56).rotateX(Math.PI / 2), chrome, 0, 0.8, 0, pf);
  add(new THREE.TorusGeometry(2.0, 0.17, 12, 56).rotateX(Math.PI / 2), chrome, 0, -0.8, 0, pf);   // bottomless: open ring
  add(new THREE.BoxGeometry(1.0, 0.45, 1.0), dark, 0, 0.1, 2.6, pf).visible = false;
  const handle = new THREE.Group(); pf.add(handle);
  add(new THREE.CylinderGeometry(0.42, 0.55, 3.6, 24).rotateX(Math.PI / 2), steel, 0, 0.55, 3.5, handle);
  add(new THREE.CylinderGeometry(0.7, 0.62, 4.0, 28).rotateX(Math.PI / 2), wood, 0, 0.55, 6.9, handle);
  add(new THREE.SphereGeometry(0.7, 20, 14), wood, 0, 0.55, 8.9, handle);
  // grounds in the basket
  const mound = createGroundsMound({ radius: 1.95 }); res.push(mound); pf.add(mound.object); mound.object.position.y = 0.2;

  // tamper
  const tamper = new THREE.Group(); object.add(tamper);
  add(new THREE.CylinderGeometry(1.92, 1.92, 0.5, 48), chrome, 0, 0, 0, tamper);
  add(new THREE.CylinderGeometry(0.5, 0.7, 2.2, 24), wood, 0, 1.5, 0, tamper);
  add(new THREE.SphereGeometry(1.15, 24, 16), wood, 0, 3.0, 0, tamper).scale.y = 0.85;

  // drip tray with grill
  add(new RoundedBoxGeometry(15, 0.8, 8.4, 3, 0.2), dark, 0, MACHINE.trayTop - 0.7, 1.9);
  for (let i = -6; i <= 6; i++) add(new THREE.BoxGeometry(0.28, 0.22, 7.6), steel, i * 1.05, MACHINE.trayTop - 0.2, 1.9);
  add(new THREE.BoxGeometry(15, 0.22, 0.28), steel, 0, MACHINE.trayTop - 0.2, 1.9 - 3.7); add(new THREE.BoxGeometry(15, 0.22, 0.28), steel, 0, MACHINE.trayTop - 0.2, 1.9 + 3.7);
  // steam wand
  const wc = new THREE.CatmullRomCurve3([new THREE.Vector3(9.6, 12.5, -1.2), new THREE.Vector3(9.8, 9.0, 0.5), new THREE.Vector3(9.4, 6.5, 2.2), new THREE.Vector3(9.0, 5.0, 3.0)]);
  const wg = new THREE.TubeGeometry(wc, 24, 0.2, 12, false); res.push(wg); const wand = new THREE.Mesh(wg, chrome); wand.castShadow = true; object.add(wand);
  add(new THREE.CylinderGeometry(0.34, 0.34, 0.9, 16), dark, 9.6, 12.4, -1.2);

  function update({ lock = 1, pfLift = 0, pfPos = null, tamp = null, bar = 0, mound: m = 1, flat = 0, shake = 0, t = 0 } = {}) {
    // lock: 0 = handle swung out to the left, 1 = locked straight forward
    handle.rotation.y = (1 - lock) * -1.15;
    pf.position.set(0, MACHINE.pfY + (pfPos ? pfPos[1] : 0), -0.2 + (pfPos ? pfPos[2] : 0));
    if (pfPos) pf.position.x = pfPos[0];
    needleP.rotation.z = -(Math.PI * 0.75) + (-bar / 12) * Math.PI * 1.5 * -1 - 0; needleP.rotation.z = Math.PI * 0.75 - (bar / 12) * Math.PI * 1.5;
    mound.update({ grow: m, flat, r: 1.9 });
    if (tamp === null) tamper.visible = false; else { tamper.visible = true; tamper.position.set(pf.position.x, pf.position.y + tamp, pf.position.z); }
    object.position.x = Math.sin(t * 58) * 0.01 * shake;
  }
  return { object, pf, update, dispose: () => res.forEach((x) => x.dispose && x.dispose()) };
}

export default function EspressoMachine({ apiRef, ...props }) {
  const a = useAsset(createEspressoMachine);
  if (apiRef) apiRef.current = a;
  return <primitive object={a.object} {...props} />;
}
