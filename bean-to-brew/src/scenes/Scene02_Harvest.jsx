import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useSceneGroup } from '../animation/director';
import { useAsset } from '../components/useAsset';
import { createPlant } from '../components/CoffeePlant';
import { createCherry } from '../components/CoffeeCherry';
import { createDust } from '../animation/particleAnimation';
import { registerCamera } from '../animation/cameraChoreography';
import { seg, easeInOut, easeIn, easeOut, remap, mulberry32 } from '../animation/util';
import { createShafts } from './Scene01_Origin';

const DETACH = 7.5, FALL_END = 9.2, OPEN_A = 9.0, OPEN_B = 9.9;
const FALL_Y = -4.6;
export const heroY = (t) => FALL_Y * easeInOut(remap(t, DETACH, FALL_END));

// camera: match-cut start → pull-back reveal of the cluster → macro approach → follow the fall → orbit the opened fruit
registerCamera(5, 10, [
  { t: 5.0, p: [0.0, 0.1, 5.4], l: [0, -0.1, -0.1], fov: 28, ap: 0.022 },
  { t: 6.3, p: [3.2, 0.9, 10.5], l: [0, -0.2, -0.3], fov: 28, ap: 0.02 },
  { t: 7.45, p: [-0.9, 0.0, 4.4], l: [0, -0.1, 0], fov: 28, ap: 0.02 },
  { t: 8.3, p: [-0.5, -1.9, 5.0], l: [0, -2.3, 0], fov: 28, ap: 0.02 },
  { t: 9.1, p: [1.8, -4.3, 5.0], l: [0, -4.5, 0], fov: 28, ap: 0.022 },
  { t: 10.0, p: [0.0, -4.55, 4.7], l: [0, -4.6, 0], fov: 28, ap: 0.022 },
]);

export default function Scene02_Harvest() {
  const plant = useAsset(createPlant, { seed: 5 });
  const hero = useAsset(createCherry, { ripe: 1, seed: 1, splittable: true });
  const shafts = useAsset(createShafts);
  const dust = useAsset(createDust, { count: 220, box: [18, 12, 12], center: [0, -1, -1], size: 0.09 });
  const cluster = useMemo(() => {
    const r = mulberry32(21);
    const offs = [[-0.12, 0.3, -0.5], [-0.07, 0.55, -1.3], [0.07, 0.25, -0.9], [0.12, 0.45, -0.3], [-0.17, 0.2, -1.6], [0.17, 0.6, -1.2], [0.02, 0.8, -1.9]];
    const list = offs.map((o, i) => ({ cherry: createCherry({ ripe: 0.92 + r() * 0.08, seed: 10 + i }), s: 0.5 + o[0], o }));
    return list;
  }, []);
  useMemo(() => {
    const p = plant.branch.curve.getPoint(0.5);
    plant.branch.object.position.set(0 - p.x, 2.15 - p.y, -0.2 - p.z);
    cluster.forEach((c) => {
      const q = plant.branch.curve.getPoint(c.s);
      c.cherry.object.position.set(q.x + plant.branch.object.position.x, q.y + plant.branch.object.position.y - 2.1 - c.o[1], c.o[2]);
      c.cherry.object.scale.setScalar(0.92);
    });
  }, [plant, cluster]);
  const group = useMemo(() => { const g = new THREE.Group(); cluster.forEach((c) => g.add(c.cherry.object)); g.add(hero.object); return g; }, [cluster, hero]);

  const ref = useSceneGroup([5, 10], (t) => {
    plant.update(t, 1.0);
    // pendulum + anticipation pull before release, then free fall with a lazy tumble
    const pre = remap(t, 6.9, DETACH);
    const sway = Math.sin(t * 2.1) * 0.03 * (1 - remap(t, DETACH, DETACH + 0.3));
    const pull = easeInOut(pre) * 0.14 * (1 - remap(t, DETACH, DETACH + 0.18));
    const fall = remap(t, DETACH, FALL_END);
    hero.object.position.set(0, heroY(t) - pull, 0);
    hero.object.rotation.set(fall * 0.5, fall * 3.6 * (1 - 0.3 * fall), sway + fall * 0.35);
    // settle to a clean frontal pose for the cut-away
    const settle = easeInOut(remap(t, 8.6, 9.2));
    hero.object.rotation.x *= 1 - settle; hero.object.rotation.z *= 1 - settle;
    hero.object.rotation.y = hero.object.rotation.y * (1 - settle) + settle * (Math.PI * 0.0 + 0.0);
    hero.object.rotation.y = fall * 3.6 * (1 - 0.3 * fall) * (1 - settle) + settle * Math.round((fall * 3.6 * (1 - 0.3 * fall)) / Math.PI / 2) * Math.PI * 2;
    hero.update({ open: easeInOut(remap(t, OPEN_A, OPEN_B)), peel: 0, scale: 1 });
    plant.object.visible = t < 9.0; cluster.forEach((c) => (c.cherry.object.visible = t < 9.0));
    cluster.forEach((c, i) => { c.cherry.object.rotation.z = Math.sin(t * 1.3 + i) * 0.04; });
    shafts.update(t, 1 - remap(t, 7.8, 8.8)); shafts.object.visible = t < 9;
    dust.update(t);
  });
  return (
    <group ref={ref}>
      <primitive object={plant.object} />
      <primitive object={group} />
      <primitive object={shafts.object} />
      <primitive object={dust.object} />
    </group>
  );
}
