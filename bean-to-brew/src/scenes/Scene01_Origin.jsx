import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useSceneGroup } from '../animation/director';
import { useAsset } from '../components/useAsset';
import { createPlant } from '../components/CoffeePlant';
import { createFlower } from '../components/CoffeeFlower';
import { createCherry } from '../components/CoffeeCherry';
import { createDust } from '../animation/particleAnimation';
import { registerCamera } from '../animation/cameraChoreography';
import { seg, easeInOut, easeOut, remap, smoothstep } from '../animation/util';

/** Light shafts: soft additive god-rays through the canopy. */
export function createShafts() {
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uTime: { value: 0 }, uAmt: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    fragmentShader: `varying vec2 vUv; uniform float uTime,uAmt;
      void main(){ float x = smoothstep(0.,.5,vUv.x)*smoothstep(1.,.5,vUv.x); float y = smoothstep(0.,.25,vUv.y)*smoothstep(1.,.6,vUv.y);
        float f = .75+.25*sin(vUv.y*9.+uTime*.2); gl_FragColor = vec4(vec3(1.,.82,.5)*x*y*f*.17*uAmt, 1.); }`,
  });
  const geo = new THREE.PlaneGeometry(1, 1);
  const g = new THREE.Group();
  [[-6, 4, -10, 0.45, 5, 40], [4, 5, -12, 0.5, 7, 42], [11, 3, -9, 0.4, 4, 38], [-13, 3, -13, 0.5, 6, 44]].forEach(([x, y, z, rot, w, l]) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(w, l, 1); m.rotation.z = -rot; m.userData.noDepth = true; g.add(m);
  });
  return { object: g, update: (t, amt = 1) => { mat.uniforms.uTime.value = t; mat.uniforms.uAmt.value = amt; }, dispose: () => { geo.dispose(); mat.dispose(); } };
}

// ---- camera: macro push-in, shallow DoF; hero cherry centred at t=5 (match cut) ----
registerCamera(0, 5, [
  { t: 0.0, p: [1.6, 0.9, 9.6], l: [0.2, 0.1, 0], fov: 28, ap: 0.024 },
  { t: 2.4, p: [0.7, 0.4, 6.3], l: [0, 0.05, 0], fov: 28, ap: 0.024 },
  { t: 5.0, p: [0.0, 0.1, 5.4], l: [0, -0.1, -0.1], fov: 28, ap: 0.022 },
]);
// final reprise (plantation return after the circle): flower bud offset right to leave negative space for the title
registerCamera(58, 60, [
  { t: 58.0, p: [-2.4, 0.3, 12.4], l: [-2.7, 0.1, 0], fov: 28, ap: 0.02 },
  { t: 60.0, p: [-2.3, 0.25, 11.2], l: [-2.6, 0.1, 0], fov: 28, ap: 0.02 },
]);

export function growthState(local) {
  // local: 0..5 seconds time-lapse
  return {
    open: seg(local, 0.0, 2.3),
    fall: remap(local, 2.9, 4.0),
    berry: seg(local, 2.8, 5.0, easeOut),
    ripe: seg(local, 3.7, 5.0),
  };
}

export default function Scene01_Origin() {
  const plant = useAsset(createPlant, 2);
  const flower = useAsset(createFlower, { seed: 4 });
  const berry = useAsset(createCherry, { ripe: 0, seed: 3, stem: false });
  const shafts = useAsset(createShafts);
  const dust = useAsset(createDust, { count: 300, box: [22, 10, 14], center: [0, 0, -1], size: 0.1 });
  const hero = useMemo(() => {
    const g = new THREE.Group();
    // pedicel from branch node to the flower
    g.add(flower.object, berry.object);
    return g;
  }, [flower, berry]);
  // place the branch so a node sits just behind the flower
  useMemo(() => {
    const p = plant.branch.curve.getPoint(0.55);
    plant.branch.object.position.set(0.3 - p.x, -0.8 - p.y, -1.6 - p.z);
  }, [plant]);

  const ref = useSceneGroup([[0, 5], [58, 60]], (t, start) => {
    // main window: time-lapse over 0–5s. Reprise window (58–60): slow, back at the budding stage.
    const local = start === 0 ? t : 1.5 + (t - 58) * 0.45;
    const gs = growthState(local);
    const wind = start === 0 ? 1.0 + gs.open * 2.2 : 1.2;
    plant.update(t * (start === 0 ? 1.6 : 1.0), wind);
    flower.update({ open: gs.open, fall: gs.fall });
    flower.object.visible = gs.fall < 0.995;
    hero.rotation.set(-0.12, -0.25, 0.1 + Math.sin(t * 0.7) * 0.01);
    const bs = 0.08 + gs.berry * 0.92;
    berry.object.scale.setScalar(bs);
    berry.object.position.set(0, -0.02 * (1 - gs.berry), -0.3 - gs.berry * 0.1);
    berry.update({ ripe: gs.ripe * 0.98 + 0.02 });
    berry.object.visible = gs.berry > 0.02;
    shafts.update(t, 1);
    dust.update(t);
  });
  return (
    <group ref={ref}>
      <primitive object={plant.object} />
      <primitive object={hero} />
      <primitive object={shafts.object} />
      <primitive object={dust.object} />
    </group>
  );
}
