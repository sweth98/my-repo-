import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useSceneGroup } from '../animation/director';
import { useAsset } from '../components/useAsset';
import { createCherry } from '../components/CoffeeCherry';
import { createGreenBean } from '../components/GreenCoffeeBean';
import { createTrough } from '../components/WaterTrough';
import { createBeanField } from '../animation/beanTransformation';
import { createBurst, createDust } from '../animation/particleAnimation';
import { registerCamera } from '../animation/cameraChoreography';
import { seg, easeInOut, easeIn, remap, mulberry32 } from '../animation/util';

const CY = 3.0, WATER = -1.4, LAND = 12.45, V = 2.6, BS = 0.78;
export const heroX3 = (t) => V * Math.max(0, t - LAND);
const hx = heroX3;

registerCamera(10, 15, [
  { t: 10.0, p: [0.0, CY - 0.05, 4.7], l: [0, CY - 0.05, 0], fov: 28, ap: 0.022 },
  { t: 11.2, p: [0.5, CY + 0.1, 4.1], l: [0, CY - 0.1, 0], fov: 28, ap: 0.022 },
  { t: 12.0, p: [2.0, 1.2, 6.3], l: [0.3, 0.2, 0], fov: 28, ap: 0.02 },
  { t: 12.7, p: [2.2, -0.3, 5.0], l: [0.9, -1.1, 0], fov: 28, ap: 0.02 },
  { t: 13.6, p: [hx(13.6) - 1.9, -0.45, 3.4], l: [hx(13.6) + 0.3, -1.2, 0], fov: 28, ap: 0.022 },
  { t: 14.3, p: [hx(14.3) - 0.9, -0.5, 3.1], l: [hx(14.3) + 0.1, -1.25, 0], fov: 28, ap: 0.022 },
  { t: 15.0, p: [hx(15.0), -0.9, 2.55], l: [hx(15.0), -1.2, 0], fov: 28, ap: 0.02 },
]);

export default function Scene03_Processing() {
  const core = useAsset(createCherry, { ripe: 1, seed: 1, splittable: true, stem: true });
  const trough = useAsset(createTrough);
  const field = useAsset(createBeanField, 170, { res: 'lo', seed: 4, roast: 0, wet: 1 });
  const hb = useAsset(createGreenBean, { seed: 8, wet: 1 });
  const burst = useAsset(createBurst, { count: 520, seed: 31, size: 0.03 });
  const dust = useAsset(createDust, { count: 120, box: [20, 8, 10], center: [3, 0, 0], size: 0.07 });
  const beans = useMemo(() => {
    const r = mulberry32(17);
    return Array.from({ length: 170 }, () => ({ x: -14 + r() * 62, z: (r() - 0.5) * 5.4, ph: r() * 6.28, ry: r() * 6.28, sp: 0.2 + r() * 0.5, v: V * (0.9 + r() * 0.2), tilt: (r() - 0.5) * 0.4 }));
  }, []);
  useMemo(() => {
    burst.uniforms.uColA.value.set(0xa8473a); burst.uniforms.uColB.value.set(0xe3a58c);
    burst.uniforms.uOrigin.value.set(0, CY, 0.3); burst.uniforms.uT0.value = 10.15; burst.uniforms.uPower.value = 4.2; burst.uniforms.uLife.value = 2.4;
  }, [burst]);

  const ref = useSceneGroup([10, 15], (t) => {
    core.object.position.set(0, CY, 0);
    const slide = easeInOut(remap(t, 9.9, 11.2));
    core.update({ open: 1 + slide * 1.8, peel: easeInOut(remap(t, 10.05, 10.95)), parchPeel: easeInOut(remap(t, 10.8, 11.7)), split: easeInOut(remap(t, 11.4, 12.0)), scale: 1 });
    core.halfA.visible = core.halfB.visible = t < 11.6;
    core.core.visible = t < LAND;
    // pair falls into the channel (tumble + gravity), then hand over to the hero bean
    const fall = Math.max(0, t - 11.55), drop = Math.min(CY - WATER - 0.1, 0.5 * 9.5 * fall * fall);
    core.pair.position.set(0, -drop, 0); core.pair.rotation.z = easeIn(remap(t, 11.55, LAND)) * 0.6;
    const sub = t >= LAND;
    hb.object.visible = sub;
    hb.object.scale.setScalar(BS);
    const bob = Math.sin(t * 2.1) * 0.035;
    hb.object.position.set(hx(t), WATER + 0.34 + bob - Math.max(0, 1 - (t - LAND) * 2.2) * 0.5, 0);
    hb.object.rotation.set(0.1 + Math.sin(t * 1.1) * 0.08, 0.3 + t * 0.18, Math.sin(t * 0.7) * 0.05);
    hb.update({ roast: 0.0, wet: 1 - remap(t, 13.5, 15) * 0.0 });
    trough.update({ flow: t * V, hit: [0, 0], hitT: t - LAND, time: t });
    // channel beans carried by the current (positions are analytic in t)
    beans.forEach((b, i) => {
      const x = ((b.x + b.v * (t - 10) + 14) % 62) - 14;
      const near = Math.abs(x - hx(t)) < 1.4 && Math.abs(b.z) < 0.9 && t > LAND ? 1.3 : 0; // keep the hero lane clear
      const z = b.z + (near ? Math.sign(b.z || 1) * near : 0);
      field.set(i, x, WATER + 0.3 + Math.sin(t * 1.7 + b.ph) * 0.03, z, b.tilt, b.ry + t * b.sp * 0.3, 0.0, BS, 0);
    });
    field.commit();
    field.object.visible = t > 11.4;
    // beans visible only once the water scene has been revealed (hide the channel during the tight macro opening)
    trough.object.visible = t > 11.3;
    burst.update(t); dust.update(t);
  });
  return (
    <group ref={ref}>
      <primitive object={core.object} />
      <primitive object={trough.object} />
      <primitive object={field.object} />
      <primitive object={hb.object} />
      <primitive object={burst.object} />
      <primitive object={dust.object} />
    </group>
  );
}
