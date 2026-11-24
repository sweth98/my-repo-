import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useSceneGroup } from '../animation/director';
import { useAsset } from '../components/useAsset';
import { createRoaster, ROASTER } from '../components/CoffeeRoaster';
import { createGreenBean } from '../components/GreenCoffeeBean';
import { createBeanField, beanRoast } from '../animation/beanTransformation';
import { createEmbers, createDust } from '../animation/particleAnimation';
import { registerCamera } from '../animation/cameraChoreography';
import { seg, easeInOut, easeOut, remap, mulberry32, smoothstep, clamp } from '../animation/util';

const N = 118, BS = 0.6;
const POUR0 = 20.9, POUR1 = 21.9, SPIN0 = 21.9, ROAST0 = 22.2, ROAST1 = 26.4;
const OMEGA = 2.0, G = 20, FLIGHT_IN = 0.8;
const { R, cy } = ROASTER;

/** Smooth drum drive-time: spins up from rest at SPIN0 (pure function of t). */
export const driveTime = (t) => { const x = t - SPIN0; if (x <= 0) return 0; const ramp = 1.4; return x < ramp ? (x * x) / (2 * ramp) : ramp / 2 + (x - ramp); };

registerCamera(20, 27, [
  { t: 20.0, p: [0.5, 10.7, 0.5], l: [0.1, 9.55, -2.0], fov: 28, ap: 0.024 },
  { t: 20.9, p: [2.6, 10.5, 9.0], l: [0, 6.2, -1.5], fov: 28, ap: 0.02 },
  { t: 21.9, p: [2.2, 3.5, 22.0], l: [0, 1.6, -2.0], fov: 28, ap: 0.014 },
  { t: 23.4, p: [0.8, 0.0, 12.5], l: [0, -0.4, -2.5], fov: 28, ap: 0.022 },
  { t: 25.0, p: [-3.8, -1.4, 7.6], l: [-0.6, -2.0, -2.6], fov: 28, ap: 0.026 },
  { t: 27.0, p: [-1.6, -2.4, 5.2], l: [-1.6, -2.9, -2.6], fov: 26, ap: 0.026 },
]);

export default function Scene05_Roast() {
  const roaster = useAsset(createRoaster);
  const field = useAsset(createBeanField, N, { res: 'mid', seed: 6, roast: 0 });
  const hopperBeans = useAsset(createBeanField, 46, { res: 'mid', seed: 3, roast: 0 });
  const hero = useAsset(createGreenBean, { seed: 8, wet: 0 });
  const embers = useAsset(createEmbers, { count: 180 });
  const dust = useAsset(createDust, { count: 160, box: [30, 14, 18], center: [0, 2, 4], size: 0.07, color: 0xffb060, opacity: 0.4 });
  const beans = useMemo(() => {
    const r = mulberry32(61);
    return Array.from({ length: N }, (_, i) => ({
      delay: r() * 1.8, th0: -Math.PI / 2 + (r() - 0.5) * 1.0, thR: 0.55 + r() * 0.35, rj: r() * 1.3, z: -1.2 - r() * 3.7,
      xc: (r() - 0.5) * 1.4, tIn: POUR0 + (i / N) * (POUR1 - POUR0), rot: [r() * 6.28, r() * 6.28, r() * 6.28], sp: 0.8 + r() * 1.6, ra: 0.5 + r() * 0.3, d: r(),
    }));
  }, []);
  const hop = useMemo(() => { const r = mulberry32(5); return Array.from({ length: 46 }, () => ({ x: (r() - 0.5) * 3.6, z: (r() - 0.5) * 3.6, y: r(), rot: [r() * 6, r() * 6, r() * 6] })); }, []);
  useMemo(() => {
    embers.uniforms.uOrigin.value.set(0, -2.5, -3); embers.uniforms.uRadius.value = 3.2;
  }, [embers]);

  const ref = useSceneGroup([20, 27], (t) => {
    const te = driveTime(t);
    const heat = smoothstep(21.2, 23.5, t) * (0.8 + 0.2 * Math.sin(t * 7.0));
    roaster.update({ drumAngle: te * OMEGA, lid: 0.5 + 0.5 * easeInOut(remap(t, 20.0, 20.85)), heat });
    // hopper beans: a heap that empties as beans pour out
    const drain = remap(t, POUR0, POUR1);
    hopperBeans.object.visible = drain < 1;
    hop.forEach((h, i) => {
      const rr = Math.hypot(h.x, h.z), a = Math.atan2(h.z, h.x);
      const inside = rr < 2.0 + h.y * 0.2 ? 1 : 0;
      const sc = BS * (1 - clamp(drain * 1.4 - h.y * 0.4)) * inside;
      hopperBeans.set(i, h.x * 0.7 * (1 - drain * 0.6), ROASTER.hopper[1] + 1.1 - rr * 0.18 - h.y * 0.25 - drain * 2.0, ROASTER.hopper[2] + h.z * 0.7, h.rot[0], h.rot[1], h.rot[2], sc, 0);
    });
    hopperBeans.commit();
    // hero green bean rests on top of the heap at the opening shot, then is swept along with the pour
    const heroDrop = easeInOut(remap(t, 20.6, 21.5));
    hero.object.visible = t < 22.0;
    hero.object.scale.setScalar(BS * 1.0);
    hero.object.position.set(0.1 + heroDrop * 0.3, ROASTER.hopper[1] + 1.3 - heroDrop * 6.2, ROASTER.hopper[2] + 0.2 + heroDrop * 1.6);
    hero.object.rotation.set(0.5 + t * 0.5, 0.7 + heroDrop * 3, 0.2);
    hero.update({ roast: 0, wet: 0 });

    // drum beans: pour → tumble (cascade along the wall) while each bean roasts on its own schedule
    let crackAvg = 0;
    beans.forEach((b, i) => {
      const [sx, sy] = [0, 0];
      const rb = R - 0.7 - b.rj * 0.55;
      const x0 = rb * Math.cos(b.th0), y0 = cy + rb * Math.sin(b.th0);
      let x, y, z = b.z, spin = 0;
      const ch = ROASTER.chute;
      const tau = t - b.tIn;
      if (tau < 0) { x = ch[0] + b.xc; y = ch[1] + 0.9; z = ch[2] - 0.6; field.set(i, x, y, z, 0, 0, 0, 0, 0); return; }
      const dT = Math.max(0, te - b.delay);
      if (tau < FLIGHT_IN && dT <= 0) {
        // flight from chute into the drum
        const f = tau / FLIGHT_IN, xs = ch[0] + b.xc;
        const vy = (y0 - ch[1] + 0.5 * G * FLIGHT_IN * FLIGHT_IN) / FLIGHT_IN;
        x = xs + (x0 - xs) * f; y = ch[1] + vy * tau - 0.5 * G * tau * tau; z = ch[2] + (b.z - ch[2]) * f; spin = tau * b.sp * 5;
      } else if (dT <= 0) { x = x0; y = y0; spin = 0.0; }
      else {
        // cascade cycle
        const ride = (b.thR - b.th0) / OMEGA, vr = OMEGA * rb;
        const xr = rb * Math.cos(b.thR), yr = cy + rb * Math.sin(b.thR);
        const fly = 1.15, roll = 0.55, T = ride + fly + roll;
        const s = dT % T;
        const clampWall = (px, py) => { const dx = px, dy = py - cy, d = Math.hypot(dx, dy); if (d > rb) { return [dx / d * rb, cy + dy / d * rb]; } return [px, py]; };
        if (s < ride) { const th = b.th0 + OMEGA * s; x = rb * Math.cos(th); y = cy + rb * Math.sin(th); spin = th * 1.2; }
        else if (s < ride + fly) {
          const q = s - ride;
          const vx = -Math.sin(b.thR) * vr, vy = Math.cos(b.thR) * vr;
          [x, y] = clampWall(xr + vx * q, yr + vy * q - 0.5 * G * q * q); spin = q * b.sp * 4 + b.thR;
        } else {
          const q = s - ride - fly, vx = -Math.sin(b.thR) * vr, vy = Math.cos(b.thR) * vr;
          const [lx, ly] = clampWall(xr + vx * fly, yr + vy * fly - 0.5 * G * fly * fly);
          const la = Math.atan2(ly - cy, lx), k = easeInOut(clamp(q / roll));
          const th = la + (b.th0 - la) * k; x = rb * Math.cos(th); y = cy + rb * Math.sin(th); spin = q * 2 + b.sp * 6;
        }
      }
      const rs = beanRoast(t, ROAST0 + b.d * 0.8, ROAST1 - (1 - b.d) * 0.5);
      crackAvg += rs.crack;
      const sc = BS * (1 + 0.11 * smoothstep(0.55, 0.7, rs.p) + 0.08 * rs.pop);
      field.set(i, x, y, z, b.rot[0] + spin * 0.6, b.rot[1] + spin, b.rot[2], sc, rs.roast);
    });
    field.commit();
    field.material.userData.uniforms.uCrack.value = smoothstep(0.55, 0.9, remap(t, ROAST0 + 0.8, ROAST1));
    field.material.userData.setRoast(0);
    embers.uniforms.uAmt.value = smoothstep(22.6, 24.6, t) * 0.9;
    embers.update(t); dust.update(t);
  });
  return (
    <group ref={ref}>
      <primitive object={roaster.object} />
      <primitive object={field.object} />
      <primitive object={hopperBeans.object} />
      <primitive object={hero.object} />
      <primitive object={embers.object} />
      <primitive object={dust.object} />
    </group>
  );
}
