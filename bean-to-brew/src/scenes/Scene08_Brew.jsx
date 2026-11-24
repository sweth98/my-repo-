import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useSceneGroup } from '../animation/director';
import { useAsset } from '../components/useAsset';
import { createEspressoMachine, MACHINE } from '../components/EspressoMachine';
import { createEspressoStream } from '../components/EspressoLiquid';
import { createCup } from '../components/CoffeeCup';
import { createSteam } from '../components/SteamSystem';
import { createDust } from '../animation/particleAnimation';
import { registerCamera } from '../animation/cameraChoreography';
import { EX, fillLevel, cremaAmount, liquidY, streamState, dropState } from '../animation/liquidAnimation';
import { easeInOut, easeOut, remap, smoothstep, lerp } from '../animation/util';

export const CUP_Y = MACHINE.trayTop; // cup sits on the drip tray
export const TOP_Y = MACHINE.spoutY;

registerCamera(37, 45, [
  { t: 37.0, p: [4.6, 11.4, 7.2], l: [0, 9.3, 3.1], fov: 26, ap: 0.02 },
  { t: 38.3, p: [3.8, 11.0, 8.0], l: [0, 9.6, 2.0], fov: 26, ap: 0.02 },
  { t: 39.0, p: [9.5, 11.2, 9.8], l: [0, 10.0, 0.8], fov: 28, ap: 0.018 },
  { t: 39.9, p: [4.8, 9.6, 6.4], l: [0, 9.0, 0], fov: 26, ap: 0.022 },
  { t: 40.7, p: [1.6, 8.7, 3.4], l: [0, 8.3, 0], fov: 22, ap: 0.03, focus: 3.4 },
  { t: 41.8, p: [3.6, 8.2, 5.6], l: [0, 7.8, 0], fov: 24, ap: 0.028, focus: 5.6 },
  { t: 43.0, p: [2.8, 10.2, 4.8], l: [0, 6.4, 0], fov: 26, ap: 0.024 },
  { t: 45.0, p: [2.2, 10.8, 5.0], l: [0, 5.8, 0], fov: 28, ap: 0.022 },
]);

export default function Scene08_Brew() {
  const machine = useAsset(createEspressoMachine);
  const stream = useAsset(createEspressoStream);
  const cup = useAsset(createCup);
  const steam = useAsset(createSteam, { count: 3, height: 5, width: 2.6, spread: 0.6 });
  const dust = useAsset(createDust, { count: 140, box: [26, 14, 14], center: [0, 8, 0], size: 0.06, color: 0xffd9a0, opacity: 0.45 });
  useMemo(() => { cup.object.position.set(0, CUP_Y, 0); stream.object.position.y = 0; }, [cup, stream]);

  const ref = useSceneGroup([37, 45], (t, _s, _w, ctx) => {
    // tamp → lock-in → pump on
    const tampT = easeInOut(remap(t, 37.4, 37.95)) - easeInOut(remap(t, 38.15, 38.6));
    const lift = easeInOut(remap(t, 38.55, 39.45));
    const lock = easeInOut(remap(t, 38.9, 39.5));
    const flat = easeInOut(remap(t, 37.8, 38.2));
    const pfPos = [0, lerp(-0.9, 0.0, lift), lerp(3.2, 0, lift)];
    const bar = 9 * easeOut(remap(t, EX.pumpOn, EX.pumpOn + 1.2)) * (1 - 0.0);
    machine.update({ lock: t < 38.9 ? 0 : lock, pfPos, tamp: t < 38.7 ? 1.0 + 2.6 * (1 - tampT) : null, bar, flat, shake: smoothstep(EX.pumpOn, EX.pumpOn + 0.4, t), t });
    // tamper rides on the basket: y relative to pf (basket top ≈ +0.8)
    const level = fillLevel(t);
    const surfY = CUP_Y + liquidY(level);
    const st = streamState(t, TOP_Y, surfY);
    stream.update({ time: t, top: st.top, bottom: st.bottom, r0: st.r0, on: st.on, flow: st.flow, surf: surfY });
    stream.drops.forEach((d, j) => {
      const ds = dropState(t, j, TOP_Y, surfY);
      d.visible = ds.visible;
      if (ds.visible) { d.position.set(0, ds.y, 0); d.scale.set(ds.sx, ds.sy, ds.sx); }
    });
    cup.update({ level, crema: cremaAmount(t), art: 0, impact: st.flow * Math.min(1, st.r0 * 5), time: t });
    steam.update(t, smoothstep(EX.pumpOn, EX.pumpOn + 1.0, t) * 0.35, ctx && ctx.camera);
    steam.object.position.set(0, surfY + 0.1, 0);
    dust.update(t);
  });
  return (
    <group ref={ref}>
      <primitive object={machine.object} />
      <primitive object={cup.object} />
      <primitive object={stream.object} />
      <primitive object={steam.object} />
      <primitive object={dust.object} />
    </group>
  );
}
