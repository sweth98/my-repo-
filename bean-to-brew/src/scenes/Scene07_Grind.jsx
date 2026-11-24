import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useSceneGroup } from '../animation/director';
import { useAsset } from '../components/useAsset';
import { createGrinder, GRINDER } from '../components/CoffeeGrinder';
import { createRoastedBean } from '../components/RoastedCoffeeBean';
import { createGroundsMound } from '../components/CoffeeGrounds';
import { createGroundsStream, createParticles } from '../animation/particleAnimation';
import { createBeanField } from '../animation/beanTransformation';
import { registerCamera } from '../animation/cameraChoreography';
import { easeInOut, easeOut, easeIn, remap, mulberry32, smoothstep, lerp, clamp } from '../animation/util';

const N = 64, BS = 0.62, HOP_TOP = 13.1;
const [SX, SY, SZ] = GRINDER.spout;
export const STREAM_ON = 34.0, MOUND0 = 34.3, MOUND1 = 36.8;

registerCamera(32, 37, [
  { t: 32.0, p: [0.35, 13.9, 1.5], l: [0.0, 12.9, 0.0], fov: 26, ap: 0.026 },
  { t: 33.0, p: [2.4, 12.6, 6.8], l: [0, 11.0, 0], fov: 28, ap: 0.02 },
  { t: 34.0, p: [1.8, 8.4, 7.6], l: [0, 7.1, 0], fov: 28, ap: 0.024 },
  { t: 35.0, p: [7.4, 4.6, 6.0], l: [4.6, 3.1, 1.8], fov: 28, ap: 0.024 },
  { t: 36.1, p: [7.9, 2.6, 5.6], l: [4.7, 1.9, 1.8], fov: 26, ap: 0.026 },
  { t: 37.0, p: [6.6, 3.0, 4.4], l: [4.7, 1.45, 1.8], fov: 26, ap: 0.024 },
]);

export default function Scene07_Grind() {
  const grinder = useAsset(createGrinder);
  const hero = useAsset(createRoastedBean, { res: 'hi' });
  const field = useAsset(createBeanField, N, { res: 'mid', seed: 7, roast: 1 });
  const mound = useAsset(createGroundsMound, { radius: 1.2 });
  const stream = useAsset(createGroundsStream, { count: 16000, size: 0.026 });
  const chunks = useAsset(createGroundsStream, { count: 2600, seed: 14, size: 0.04 });
  const beans = useMemo(() => {
    const r = mulberry32(8);
    return Array.from({ length: N }, (_, i) => {
      const a = r() * 6.283, rr = Math.sqrt(r()) * 3.4;
      const yh = HOP_TOP - 0.5 - (rr / 3.4) * 0.9 - r() * 0.7;
      return { x: Math.cos(a) * rr, z: Math.sin(a) * rr, y: yh, rank: yh, rot: [r() * 6, r() * 6, r() * 6], sp: 0.4 + r() * 0.8, delay: 0 };
    }).sort((a, b) => b.rank - a.rank).map((b, i) => ({ ...b, rel: 32.5 + i * 0.047 }));
  }, []);
  useMemo(() => {
    stream.uniforms.uOrigin.value.set(SX, SY, SZ); stream.uniforms.uFloor.value = GRINDER.basketTop; stream.uniforms.uSpread.value = 0.07; stream.uniforms.uStart.value = STREAM_ON; stream.uniforms.uG.value = 16; stream.uniforms.uRate.value = 1.3; stream.uniforms.uColA.value.set(0x1a0c05); stream.uniforms.uColB.value.set(0x4e2a13);
    chunks.uniforms.uOrigin.value.set(0, 7.3, 0.2); chunks.uniforms.uFloor.value = 6.1; chunks.uniforms.uSpread.value = 1.5; chunks.uniforms.uStart.value = 33.3; chunks.uniforms.uRate.value = 1.9; chunks.uniforms.uG.value = 9;
    chunks.uniforms.uColA.value.set(0x1c0d06); chunks.uniforms.uColB.value.set(0x5a2e14);
  }, [stream, chunks]);
  const pfPos = useMemo(() => { mound.object.position.set(SX, 0.95, SZ); return 1; }, [mound]);

  const ref = useSceneGroup([32, 37], (t) => {
    const run = smoothstep(32.6, 33.4, t) * (1 - smoothstep(36.6, 37.0, t));
    grinder.update({ burrSpin: t * 9, shake: run, t });
    // hero bean (match from the transformation) sits at the top of the heap, then is pulled down with the others
    const heroRel = 32.2;
    const hr = easeIn(remap(t, heroRel, heroRel + 1.5));
    hero.object.visible = hr < 1;
    hero.object.scale.setScalar(BS * 1.0);
    hero.object.position.set(0.1 + hr * -0.1, HOP_TOP - 0.15 - hr * 5.2, 0.15);
    hero.object.rotation.set(0.5 + t * 0.4, 0.8 + t * 0.7 * hr + 0.3, 0.2);
    hero.update({});
    // hopper beans slide toward the burr one by one and are consumed
    beans.forEach((b, i) => {
      const tau = Math.max(0, t - b.rel);
      const a = 5.5;
      const yDrop = 0.5 * a * tau * tau;
      const y = b.y - yDrop;
      const f = clamp(1 - (y - 8.2) / (b.y - 8.2 + 1e-3));
      const pull = easeIn(clamp((b.y - y) / Math.max(0.5, b.y - 8.4)));
      const x = lerp(b.x, 0, pull * 0.9), z = lerp(b.z, 0, pull * 0.9);
      const crushed = smoothstep(8.4, 7.4, y);
      const s = BS * (1 - crushed) * (y > 6.9 ? 1 : 0);
      field.set(i, x, Math.max(y, 6.9), z, b.rot[0] + tau * b.sp, b.rot[1] + tau * b.sp * 1.3, b.rot[2], s, 0);
    });
    field.commit();
    const flow = smoothstep(STREAM_ON, STREAM_ON + 0.5, t) * (1 - smoothstep(36.7, 37.0, t) * 0.6);
    stream.uniforms.uFlow.value = flow; stream.update(t);
    const cf = smoothstep(33.3, 33.9, t); chunks.uniforms.uFlow.value = cf * 0.9; chunks.update(t);
    mound.update({ grow: easeOut(remap(t, MOUND0, MOUND1)), flat: 0, r: 1.15 });
  });
  return (
    <group ref={ref}>
      <primitive object={grinder.object} />
      <primitive object={hero.object} />
      <primitive object={field.object} />
      <primitive object={mound.object} />
      <primitive object={stream.object} />
      <primitive object={chunks.object} />
    </group>
  );
}
