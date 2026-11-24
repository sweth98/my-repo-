import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useSceneGroup } from '../animation/director';
import { useAsset } from '../components/useAsset';
import { createGreenBean } from '../components/GreenCoffeeBean';
import { createBeanField } from '../animation/beanTransformation';
import { createDust } from '../animation/particleAnimation';
import { createMetal, patchMaterial } from '../shaders/chunks';
import { registerCamera, orbit } from '../animation/cameraChoreography';
import { seg, easeInOut, easeOut, remap, mulberry32, smoothstep } from '../animation/util';

const BS = 0.78;
const LAND = [17.4, 18.3];
const HOME = [0, 0.26, 0];

// 15–17.4: extreme-macro slow orbit around the floating bean; 17.4–20: rise & reveal the drying bed, then swoop to one bean
registerCamera(15, 20, [
  { t: 15.0, p: [0.0, 0.2, 2.55], l: [0, 1.2, 0], fov: 28, ap: 0.02 },
  { t: 16.0, p: [1.3, 1.6, 2.5], l: [0, 1.2, 0], fov: 24, ap: 0.026 },
  { t: 17.2, p: [2.4, 1.6, 0.9], l: [0, 1.15, 0], fov: 24, ap: 0.026 },
  { t: 18.2, p: [5.5, 5.5, 9.0], l: [0, 0.4, 0], fov: 30, ap: 0.014 },
  { t: 19.2, p: [2.2, 3.0, 6.0], l: [0, 0.3, 0], fov: 30, ap: 0.016 },
  { t: 20.0, p: [0.0, 1.15, 2.55], l: [0, 0.3, 0], fov: 28, ap: 0.02 },
]);

/** Raised wooden drying bed with fine mesh. */
function createBed() {
  const res = [];
  const g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x8a5e36, roughness: 0.75 }); res.push(wood);
  patchMaterial(wood, { key: 'wood', fragColor: 'diffuseColor.rgb *= .75 + .5*fbm2(vec2(vObj.x*2.2, vObj.z*30.+vObj.y*30.));' });
  const mk = (w, h, d, x, y, z) => { const geo = new THREE.BoxGeometry(w, h, d); res.push(geo); const m = new THREE.Mesh(geo, wood); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; g.add(m); };
  mk(30, 0.5, 0.6, 0, 0.0, 7.6); mk(30, 0.5, 0.6, 0, 0.0, -7.6); mk(0.6, 0.5, 16, 15, 0, 0); mk(0.6, 0.5, 16, -15, 0, 0);
  for (let i = -4; i <= 4; i++) mk(30, 0.18, 0.28, 0, -0.25, i * 1.8);
  const meshMat = new THREE.MeshStandardMaterial({ color: 0x2a1d14, roughness: 0.7, metalness: 0.2, side: THREE.DoubleSide }); res.push(meshMat);
  patchMaterial(meshMat, { key: 'bedmesh', fragColor: 'vec2 q = vObj.xz*3.2; vec2 f = abs(fract(q)-.5); float line = smoothstep(.44,.5,max(f.x,f.y)); diffuseColor.rgb = mix(vec3(.05,.035,.025), vec3(.4,.32,.24), line);' });
  const pg = new THREE.PlaneGeometry(30, 15.2); pg.rotateX(-Math.PI / 2); res.push(pg);
  const plane = new THREE.Mesh(pg, meshMat); plane.position.y = 0.0; plane.receiveShadow = true; g.add(plane);
  return { object: g, dispose: () => res.forEach((r) => r.dispose()) };
}

export default function Scene04_GreenBean() {
  const hero = useAsset(createGreenBean, { seed: 8, wet: 0.3 });
  const bed = useAsset(createBed);
  const N = 330;
  const field = useAsset(createBeanField, N, { res: 'lo', seed: 8, roast: 0.0, wet: 0.1 });
  const dust = useAsset(createDust, { count: 260, box: [24, 10, 14], center: [0, 3, 0], size: 0.09, color: 0xfff0cf });
  const beans = useMemo(() => {
    const r = mulberry32(44); const a = [];
    for (let ix = -10; ix <= 10; ix++) for (let iz = -6; iz <= 6; iz++) {
      const x = ix * 1.45 + (r() - 0.5) * 0.6, z = iz * 1.05 + (r() - 0.5) * 0.4;
      if (Math.hypot(x - HOME[0], z - HOME[2]) < 1.1) continue;
      a.push({ x, z, ry: r() * 6.28, tilt: (r() - 0.5) * 0.25, ph: r() * 6.28, y: 0.22 + r() * 0.14, d: Math.hypot(x, z), flip: r() > 0.5 ? Math.PI : 0, roast: r() * 0.04 });
    }
    return a.slice(0, N);
  }, []);

  const ref = useSceneGroup([15, 20], (t) => {
    // hero: floats and turns slowly, then settles onto the bed at the centre
    const land = easeInOut(remap(t, LAND[0], LAND[1]));
    const float = Math.sin(t * 1.3) * 0.05 * (1 - land);
    const y = 1.2 + (HOME[1] - 1.2) * land + float;
    hero.object.position.set(0, y, 0);
    hero.object.scale.setScalar(BS);
    const spin = t * 0.45 * (1 - land) + land * 0.0;
    hero.object.rotation.set(-0.5 * (1 - land) + land * -1.5708 * 0 , 0.6 + spin, 0.15 * (1 - land) + Math.sin(t * 0.8) * 0.03 * (1 - land));
    // lie on the flat back: bean thickness axis (z) → up when landed (groove up)
    hero.object.rotation.x = -0.5 * (1 - land) - land * 1.5708;
    hero.update({ roast: 0.02 + remap(t, 17.4, 20) * 0.05, wet: 0.3 * (1 - remap(t, 15, 19)) });
    // bed reveal: depth-based wave out from the hero
    const reveal = remap(t, 17.1, 19.0);
    bed.object.visible = reveal > 0.0;
    beans.forEach((b, i) => {
      const wave = smoothstep(b.d * 0.07, b.d * 0.07 + 0.25, reveal * 1.3);
      const air = Math.sin(t * 0.9 + b.ph) * 0.05 + Math.sin(t * 2.1 + b.ph * 2.0) * 0.012;
      field.set(i, b.x, b.y, b.z, -1.5708 + b.flip + b.tilt, b.ry + air, 0.0, BS * wave * 0.92, b.roast + remap(t, 17.5, 20) * 0.04);
    });
    field.commit();
    dust.update(t);
  });
  return (
    <group ref={ref}>
      <primitive object={bed.object} />
      <primitive object={field.object} />
      <primitive object={hero.object} />
      <primitive object={dust.object} />
    </group>
  );
}
