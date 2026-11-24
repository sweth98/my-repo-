import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useSceneGroup } from '../animation/director';
import { useAsset } from '../components/useAsset';
import { createCup } from '../components/CoffeeCup';
import { createEspressoStream } from '../components/EspressoLiquid';
import { createSteam } from '../components/SteamSystem';
import { createDust } from '../animation/particleAnimation';
import { createBeanField } from '../animation/beanTransformation';
import { registerCamera } from '../animation/cameraChoreography';
import { EX, fillLevel, cremaAmount, artAmount, liquidY, streamState } from '../animation/liquidAnimation';
import { patchMaterial } from '../shaders/chunks';
import { easeOut, easeInOut, remap, smoothstep, mulberry32 } from '../animation/util';

const TOP_Y = 9.3 - 2.62; // same stream geometry as the brew scene, relative to the cup

registerCamera(45, 58, [
  { t: 45.0, p: [2.2, 8.2, 5.0], l: [0, 3.2, 0], fov: 28, ap: 0.022 },
  { t: 46.6, p: [4.2, 7.8, 7.0], l: [0, 2.8, 0], fov: 28, ap: 0.022 },
  { t: 48.6, p: [6.0, 8.6, 8.4], l: [0, 2.8, 0], fov: 28, ap: 0.02 },
  { t: 50.6, p: [5.0, 11.0, 7.5], l: [0, 3.3, 0], fov: 27, ap: 0.018 },
  { t: 52.4, p: [1.0, 13.0, 5.5], l: [0, 3.4, 0], fov: 26, ap: 0.018 },
  { t: 53.8, p: [-7.6, 8.5, 11.0], l: [0, 2.6, 0], fov: 28, ap: 0.016 },
  { t: 55.2, p: [-2.4, 6.2, 20.0], l: [2.0, 1.6, 0.5], fov: 28, ap: 0.014 },
  { t: 56.4, p: [2.4, 4.6, 15.5], l: [5.0, 1.0, 2.0], fov: 28, ap: 0.015 },
  { t: 57.4, p: [6.4, 2.6, 8.8], l: [7.7, 0.55, 3.3], fov: 26, ap: 0.02 },
  { t: 58.0, p: [7.7, 1.3, 5.9], l: [7.7, 0.6, 3.3], fov: 26, ap: 0.02 },
], 0.9);

export function createTable() {
  const g = new THREE.CircleGeometry(80, 64); g.rotateX(-Math.PI / 2);
  const m = new THREE.MeshPhysicalMaterial({ color: 0x2a170c, roughness: 0.34, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.35, envMapIntensity: 0.6 });
  patchMaterial(m, { key: 'table', srgb: false, fragColor: 'diffuseColor.rgb *= .8 + .4*fbm2(vec2(vObj.x*.35, vObj.z*6.)+fbm2(vObj.xz*.4)*2.);' , fragRough: 'roughnessFactor += .15*fbm2(vObj.xz*.9);' });
  const mesh = new THREE.Mesh(g, m); mesh.receiveShadow = true; mesh.position.y = -0.02;
  return { object: mesh, dispose: () => { g.dispose(); m.dispose(); } };
}

export default function Scene09_Cup() {
  const cup = useAsset(createCup);
  const stream = useAsset(createEspressoStream);
  const steam = useAsset(createSteam, { count: 4, height: 8.5, width: 3.8, spread: 2.0 });
  const table = useAsset(createTable);
  const dust = useAsset(createDust, { count: 240, box: [28, 12, 22], center: [0, 6, 0], size: 0.07, color: 0xffd6a0, opacity: 0.5 });
  const scatter = useAsset(createBeanField, 7, { res: 'mid', seed: 9, roast: 1 });
  useMemo(() => {
    scatter.material.userData.setRoast(1); scatter.material.userData.uniforms.uCrack.value = 1;
    const r = mulberry32(3);
    const P = [[-7.6, 3.2], [-9.2, 5.4], [-6.4, 6.6], [8.4, -4.4], [10.6, -1.6], [-9.6, -3.4], [3.8, 8.2]];
    P.forEach((p, i) => scatter.set(i, p[0], 0.3, p[1], -1.5708 + (r() - 0.5) * 0.3, r() * 6.28, 0, 0.62, 1));
    scatter.commit();
  }, [scatter]);

  const ref = useSceneGroup([45, 58], (t, _s, _w, ctx) => {
    const settle = 0.22 * (1 - easeOut(remap(t, 45.0, 45.55)));
    cup.object.position.set(0, settle, 0);
    const level = fillLevel(t);
    const surfY = settle + liquidY(level);
    const st = streamState(t, TOP_Y, surfY);
    stream.update({ time: t, top: st.top, bottom: st.bottom, r0: st.r0, on: st.on, flow: st.flow, surf: surfY });
    cup.update({ level, crema: cremaAmount(t), art: artAmount(t), impact: st.flow * Math.min(1, st.r0 * 5), time: t, tilt: 0 });
    steam.object.position.set(0, surfY + 0.1, 0);
    steam.update(t, smoothstep(46.5, 50, t) * 0.95 * (1 - smoothstep(56.5, 58, t) * 0.4), ctx && ctx.camera);
    dust.update(t);
  });
  return (
    <group ref={ref}>
      <primitive object={table.object} />
      <primitive object={cup.object} />
      <primitive object={stream.object} />
      <primitive object={steam.object} />
      <primitive object={scatter.object} />
      <primitive object={dust.object} />
    </group>
  );
}
