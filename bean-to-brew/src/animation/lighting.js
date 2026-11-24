import * as THREE from 'three';
import { lerp } from './util';

// Light keyframes by absolute time. Linear blend between neighbours; keys that straddle a scene boundary are
// separated by <0.1s so the change is hidden inside the transition iris.
const L = (o) => o;
export const LIGHT_KEYS = [
  // PLANTATION: golden morning sun + soft green skylight
  [0, L({ key: [0xffd9a0, 3.4, [9, 12, 7]], rim: [0xfff1c8, 1.6, [-6, 6, -10]], hemi: [0xcfe8b0, 0x3b2a14, 0.9], gA: [0xffffff, 0, [0, 0, 4]], gB: [0xffffff, 0, [0, 0, 4]], env: 0.9, shadow: 14 })],
  [4.95, L({ key: [0xffd9a0, 3.4, [9, 12, 7]], rim: [0xfff1c8, 1.6, [-6, 6, -10]], hemi: [0xcfe8b0, 0x3b2a14, 0.9], gA: [0xffffff, 0, [0, 0, 4]], gB: [0xffffff, 0, [0, 0, 4]], env: 0.9, shadow: 14 })],
  // HARVEST
  [5.0, L({ key: [0xffd49a, 3.6, [8, 11, 8]], rim: [0xfff1c8, 1.8, [-6, 5, -9]], hemi: [0xc9e0a8, 0x3b2a14, 0.8], gA: [0xffffff, 0, [0, 0, 4]], gB: [0xffffff, 0, [0, 0, 4]], env: 0.95, shadow: 14 })],
  [7.6, L({ key: [0xffd49a, 3.6, [8, 11, 8]], rim: [0xfff1c8, 1.8, [-6, 5, -9]], hemi: [0xc9e0a8, 0x3b2a14, 0.8], gA: [0xffffff, 0, [0, 0, 4]], gB: [0xffffff, 0, [0, 0, 4]], env: 0.95, shadow: 14 })],
  [8.8, L({ key: [0xffc98a, 3.2, [6, 9, 8]], rim: [0xffb36a, 2.6, [-6, 3, -7]], hemi: [0x6a4a30, 0x1a0e06, 0.5], gA: [0xffffff, 0, [0, 0, 4]], gB: [0xffffff, 0, [0, 0, 4]], env: 0.8, shadow: 12 })],
  // PROCESSING: neutral warm daylight
  [9.95, L({ key: [0xffe3bf, 2.5, [7, 12, 8]], rim: [0xfff0d8, 1.3, [-7, 6, -8]], hemi: [0xf4e6d0, 0x6a5238, 0.75], gA: [0xffffff, 0, [0, 0, 4]], gB: [0xffffff, 0, [0, 0, 4]], env: 0.9, shadow: 16 })],
  [10.0, L({ key: [0xffe3bf, 2.5, [7, 12, 8]], rim: [0xfff0d8, 1.3, [-7, 6, -8]], hemi: [0xf4e6d0, 0x6a5238, 0.75], gA: [0xffffff, 0, [0, 0, 4]], gB: [0xffffff, 0, [0, 0, 4]], env: 0.65, shadow: 16 })],
  [15.0, L({ key: [0xffe0b0, 2.3, [6, 12, 8]], rim: [0xffedd0, 1.3, [-7, 6, -8]], hemi: [0xf3e5cd, 0x7a6040, 0.7], gA: [0xffffff, 0, [0, 0, 4]], gB: [0xffffff, 0, [0, 0, 4]], env: 0.62, shadow: 16 })],
  // GREEN BEAN / DRYING
  [19.95, L({ key: [0xffd79a, 2.4, [8, 14, 6]], rim: [0xfff0d0, 1.3, [-7, 5, -8]], hemi: [0xf3e0bf, 0x7a5a38, 0.7], gA: [0xffffff, 0, [0, 0, 4]], gB: [0xffffff, 0, [0, 0, 4]], env: 0.6, shadow: 20 })],
  // ROAST: dark, orange interior
  [20.0, L({ key: [0xffa050, 1.5, [4, 8, 10]], rim: [0xff8a3a, 1.4, [-8, 4, -4]], hemi: [0x3a2012, 0x0a0503, 0.35], gA: [0xff7a22, 55, [0, 0, 1.5]], gB: [0xff5a10, 30, [0, -3, 3]], env: 0.28, shadow: 14 })],
  [26.95, L({ key: [0xffa050, 1.5, [4, 8, 10]], rim: [0xff8a3a, 1.4, [-8, 4, -4]], hemi: [0x3a2012, 0x0a0503, 0.35], gA: [0xff7a22, 70, [0, 0, 1.5]], gB: [0xff5a10, 40, [0, -3, 3]], env: 0.28, shadow: 14 })],
  // TRANSFORMATION: dark warm studio
  [27.0, L({ key: [0xffb870, 3.0, [5, 7, 8]], rim: [0xff9a50, 4.0, [-6, 3, -6]], hemi: [0x4a2a14, 0x0c0603, 0.35], gA: [0xff8a30, 25, [-3, 1, 5]], gB: [0xffc080, 10, [3, -1, 4]], env: 0.45, shadow: 12 })],
  [31.95, L({ key: [0xffb870, 3.0, [5, 7, 8]], rim: [0xff9a50, 4.0, [-6, 3, -6]], hemi: [0x4a2a14, 0x0c0603, 0.35], gA: [0xff8a30, 25, [-3, 1, 5]], gB: [0xffc080, 10, [3, -1, 4]], env: 0.45, shadow: 12 })],
  // GRIND: dramatic directional
  [32.0, L({ key: [0xffcf9a, 3.4, [10, 14, 5]], rim: [0xffaa66, 2.6, [-9, 5, -7]], hemi: [0x3a2616, 0x0a0503, 0.22], gA: [0xffa860, 40, [3, 8, 6]], gB: [0xffffff, 0, [0, 0, 4]], env: 0.4, shadow: 16 })],
  [36.95, L({ key: [0xffcf9a, 3.4, [10, 14, 5]], rim: [0xffaa66, 2.6, [-9, 5, -7]], hemi: [0x3a2616, 0x0a0503, 0.22], gA: [0xffa860, 40, [3, 8, 6]], gB: [0xffffff, 0, [0, 0, 4]], env: 0.4, shadow: 16 })],
  // BREW: controlled studio, reflective metal
  [37.0, L({ key: [0xffe0b8, 3.0, [8, 10, 9]], rim: [0xffd0a0, 2.4, [-8, 6, -6]], hemi: [0x56402c, 0x120a05, 0.4], gA: [0xffb870, 22, [-4, 9, 7]], gB: [0xffc890, 10, [5, 4, 6]], env: 0.8, shadow: 16 })],
  [44.95, L({ key: [0xffe0b8, 3.0, [8, 10, 9]], rim: [0xffd0a0, 2.4, [-8, 6, -6]], hemi: [0x56402c, 0x120a05, 0.4], gA: [0xffb870, 22, [-4, 9, 7]], gB: [0xffc890, 10, [5, 4, 6]], env: 0.8, shadow: 16 })],
  // CUP: premium commercial light (warm key, soft rim)
  [45.0, L({ key: [0xffd8a8, 3.6, [7, 12, 8]], rim: [0xffe2bc, 3.4, [-8, 6, -8]], hemi: [0x6a4c34, 0x140a05, 0.45], gA: [0xffb870, 22, [-5, 9, 6]], gB: [0xffe0b8, 10, [6, 3, 8]], env: 0.7, shadow: 14 })],
  [57.9, L({ key: [0xffd8a8, 3.6, [7, 12, 8]], rim: [0xffe2bc, 3.4, [-8, 6, -8]], hemi: [0x6a4c34, 0x140a05, 0.45], gA: [0xffb870, 22, [-5, 9, 6]], gB: [0xffe0b8, 10, [6, 3, 8]], env: 0.7, shadow: 14 })],
  // CIRCLE → back to plantation
  [58.0, L({ key: [0xffd9a0, 3.4, [9, 12, 7]], rim: [0xfff1c8, 1.6, [-6, 6, -10]], hemi: [0xcfe8b0, 0x3b2a14, 0.9], gA: [0xffffff, 0, [0, 0, 4]], gB: [0xffffff, 0, [0, 0, 4]], env: 0.9, shadow: 14 })],
  [60, L({ key: [0xffd9a0, 3.4, [9, 12, 7]], rim: [0xfff1c8, 1.6, [-6, 6, -10]], hemi: [0xcfe8b0, 0x3b2a14, 0.9], gA: [0xffffff, 0, [0, 0, 4]], gB: [0xffffff, 0, [0, 0, 4]], env: 0.9, shadow: 14 })],
];

const c1 = new THREE.Color(), c2 = new THREE.Color();
const mixColor = (out, a, b, f) => { c1.set(a); c2.set(b); out.copy(c1).lerp(c2, f); };

export function createRig(scene) {
  const key = new THREE.DirectionalLight(0xffffff, 1);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.03; key.shadow.radius = 5;
  const rim = new THREE.DirectionalLight(0xffffff, 1);
  const hemi = new THREE.HemisphereLight(0xffffff, 0x222222, 1);
  const gA = new THREE.PointLight(0xffffff, 0, 0, 2);
  const gB = new THREE.PointLight(0xffffff, 0, 0, 2);
  scene.add(key, key.target, rim, hemi, gA, gB);
  return { key, rim, hemi, gA, gB };
}

export function applyLighting(rig, scene, t, quality = 'high') {
  let i = 0;
  while (i < LIGHT_KEYS.length - 2 && t >= LIGHT_KEYS[i + 1][0]) i++;
  const [t0, A] = LIGHT_KEYS[i], [t1, B] = LIGHT_KEYS[i + 1];
  const f = t1 > t0 ? Math.min(1, Math.max(0, (t - t0) / (t1 - t0))) : 0;
  const set = (light, a, b, tgt) => {
    mixColor(light.color, a[0], b[0], f);
    light.intensity = lerp(a[1], b[1], f);
    light.position.set(lerp(a[2][0], b[2][0], f), lerp(a[2][1], b[2][1], f), lerp(a[2][2], b[2][2], f));
  };
  set(rig.key, A.key, B.key); set(rig.rim, A.rim, B.rim); set(rig.gA, A.gA, B.gA); set(rig.gB, A.gB, B.gB);
  mixColor(rig.hemi.color, A.hemi[0], B.hemi[0], f); mixColor(rig.hemi.groundColor, A.hemi[1], B.hemi[1], f);
  rig.hemi.intensity = lerp(A.hemi[2], B.hemi[2], f);
  scene.environmentIntensity = lerp(A.env, B.env, f);
  const s = lerp(A.shadow, B.shadow, f);
  const cam = rig.key.shadow.camera;
  if (cam.right !== s) { cam.left = -s; cam.right = s; cam.top = s; cam.bottom = -s; cam.near = 1; cam.far = 90; cam.updateProjectionMatrix(); }
  rig.key.castShadow = quality !== 'low';
}
