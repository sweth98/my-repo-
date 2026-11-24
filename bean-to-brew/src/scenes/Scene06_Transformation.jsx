import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useSceneGroup } from '../animation/director';
import { useAsset } from '../components/useAsset';
import { createRoastedBean } from '../components/RoastedCoffeeBean';
import { createBeanField } from '../animation/beanTransformation';
import { createBurst, createDust } from '../animation/particleAnimation';
import { registerCamera } from '../animation/cameraChoreography';
import { easeInOut, easeOut, easeIn, remap, mulberry32, smoothstep, lerp } from '../animation/util';

const T_SPLIT = 28.5, T_FLY = 30.7, T_END = 32.0;
const N = 120;
registerCamera(27, 32, [
  { t: 27.0, p: [0.6, 0.4, 6.4], l: [0, 0, 0], fov: 26, ap: 0.02 },
  { t: 28.4, p: [-0.5, 0.3, 4.0], l: [0, 0, 0], fov: 24, ap: 0.026 },
  { t: 29.6, p: [0.3, 0.3, 5.6], l: [0, 0, -0.5], fov: 28, ap: 0.026 },
  { t: 31.0, p: [0.0, 0.1, 6.4], l: [0, 0, -0.5], fov: 28, ap: 0.024, focus: 6.4 },
  { t: 31.5, p: [0.0, 0.05, 6.4], l: [0, 0, 0], fov: 28, ap: 0.024, focus: 4.6 },
  { t: 32.0, p: [0.0, 0.0, 6.4], l: [0, 0, 0], fov: 28, ap: 0.02, focus: 2.8 },
]);

export default function Scene06_Transformation() {
  const hero = useAsset(createRoastedBean, { res: 'hi' });
  const field = useAsset(createBeanField, N, { res: 'mid', seed: 5, roast: 1 });
  const burst = useAsset(createBurst, { count: 1100, seed: 41, size: 0.028 });
  const dust = useAsset(createDust, { count: 260, box: [20, 10, 16], center: [0, 0, -2], size: 0.07, color: 0xffc27a, opacity: 0.6 });
  const beans = useMemo(() => {
    const r = mulberry32(77);
    return Array.from({ length: N }, (_, i) => {
      const a = r() * 6.283, el = (r() - 0.5) * 1.6;
      return { d: [Math.cos(a) * Math.cos(el), Math.sin(el) * 0.9, Math.sin(a) * Math.cos(el) * 1.2 - 0.3], dist: 1.6 + r() * 9, delay: r() * 0.35, rot: [r() * 6, r() * 6, r() * 6], sp: [(r() - 0.5) * 0.8, (r() - 0.5) * 0.8, (r() - 0.5) * 0.5], s: 0.55 + r() * 0.4, drift: [(r() - 0.5) * 0.25, (r() - 0.5) * 0.18] };
    });
  }, []);
  useMemo(() => { field.material.userData.setRoast(1); field.material.userData.uniforms.uCrack.value = 1; burst.uniforms.uT0.value = T_SPLIT; burst.uniforms.uPower.value = 7; burst.uniforms.uLife.value = 3.4; }, [field, burst]);

  const ref = useSceneGroup([27, 32], (t) => {
    // hero rotates slowly in a dark warm void, then splits into many beans (slow motion)
    const split = remap(t, T_SPLIT, T_SPLIT + 0.9);
    const fly = easeInOut(remap(t, T_FLY, T_END));
    hero.object.position.set(0, 0, 0);
    const sc = lerp(1.25, 0.9, easeOut(split));
    hero.object.scale.setScalar(sc);
    hero.object.rotation.set(0.3 + t * 0.12, t * 0.38, 0.1 + Math.sin(t * 0.5) * 0.1);
    hero.update({});
    // the hero is the one that comes to camera
    hero.object.position.set(0, 0, fly * 3.6 + split * (1 - fly) * 0.0);
    hero.object.scale.setScalar(lerp(sc, 1.9, fly));
    hero.object.rotation.set(0.3 + t * 0.12 * (1 - fly), t * 0.38 * (1 - fly * 0.8) + fly * 0.4, 0.1 * (1 - fly));
    beans.forEach((b, i) => {
      const k = easeOut(remap(t, T_SPLIT + b.delay, T_SPLIT + 2.6 + b.delay));
      const slow = (t - T_SPLIT) * 0.12;
      const x = b.d[0] * b.dist * k + b.drift[0] * slow, y = b.d[1] * b.dist * k * 0.8 + b.drift[1] * slow, z = b.d[2] * b.dist * k;
      const cam = 6.4;
      const vis = t > T_SPLIT + b.delay ? 1 : 0;
      const r = (t - T_SPLIT) ;
      field.set(i, x, y, Math.min(z, cam - 2.2), b.rot[0] + b.sp[0] * r, b.rot[1] + b.sp[1] * r, b.rot[2] + b.sp[2] * r, 0.62 * b.s * vis * smoothstep(0, 0.4, remap(t, T_SPLIT + b.delay, T_SPLIT + 1.2 + b.delay)) * (1 - fly * 0.5), 0);
    });
    field.commit();
    burst.update(t); dust.update(t);
  });
  return (
    <group ref={ref}>
      <primitive object={hero.object} />
      <primitive object={field.object} />
      <primitive object={burst.object} />
      <primitive object={dust.object} />
    </group>
  );
}
