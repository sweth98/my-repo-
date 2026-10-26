// Studio lighting rig: large soft cream key from above, icy-cyan rim from behind,
// deep-navy hemisphere fill, and a falloff "pool" that reveals the structure as it grows.
import * as THREE from 'three';
import { DURATION, PALETTE } from './config.js';

// Smooth keyframed scalar curves. First and last key MUST match so the film loops.
export function curve(keys) {
  return (t) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 0; i < keys.length - 1; i++) {
      const [t0, v0] = keys[i];
      const [t1, v1] = keys[i + 1];
      if (t <= t1) {
        const u = (t - t0) / (t1 - t0);
        const s = u * u * (3 - 2 * u);
        return v0 + (v1 - v0) * s;
      }
    }
    return keys[keys.length - 1][1];
  };
}

const L = DURATION;
export const CURVES = {
  key:   curve([[0, 0.55], [1.6, 0.95], [4, 1.5], [8, 1.8], [12, 2.3], [16, 2.5], [22, 2.5], [29, 2.6], [31.5, 2.4], [33.3, 1.5], [L, 0.55]]),
  hemi:  curve([[0, 0.18], [2, 0.26], [8, 0.4], [16, 0.55], [29, 0.7], [31.5, 0.62], [33.3, 0.35], [L, 0.18]]),
  rim:   curve([[0, 0.0], [2, 0.15], [6, 0.5], [12, 1.1], [18, 1.0], [29, 1.4], [31.5, 1.2], [33.3, 0.5], [L, 0.0]]),
  spot:  curve([[0, 1.0], [2, 1.15], [6, 0.9], [10, 0.55], [16, 0.3], [24, 0.25], [29, 0.3], [31.5, 0.4], [33.3, 0.8], [L, 1.0]]),
  fog:   curve([[0, 0.034], [4, 0.03], [8, 0.024], [14, 0.016], [20, 0.01], [26, 0.0055], [30, 0.0052], [32, 0.008], [33.5, 0.022], [L, 0.034]]),
  motes: curve([[0, 1.0], [8, 0.8], [20, 0.6], [30, 0.7], [L, 1.0]]),
  bloom: curve([[0, 0.25], [10, 0.3], [20, 0.4], [29, 0.4], [32, 0.35], [L, 0.25]]),
};

export function createLighting(scene, { shadowSize = 4096 } = {}) {
  const hemi = new THREE.HemisphereLight(0x3a4d72, 0x2a2420, 0.2);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(PALETTE.cream, 1);
  key.castShadow = true;
  key.shadow.mapSize.set(shadowSize, shadowSize);
  const cam = key.shadow.camera;
  const E = 44;
  cam.left = -E; cam.right = E; cam.top = E; cam.bottom = -E; cam.near = 5; cam.far = 220;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.035;
  key.shadow.radius = 3.5;
  key.shadow.blurSamples = 12;
  const centre = new THREE.Vector3(9, 14, 16);
  key.position.copy(centre).add(new THREE.Vector3(-34, 82, -38));
  key.target.position.copy(centre);
  scene.add(key, key.target);

  const rim = new THREE.DirectionalLight(PALETTE.cyan, 1);
  rim.position.copy(centre).add(new THREE.Vector3(26, 34, 70));
  rim.target.position.copy(centre);
  scene.add(rim, rim.target);

  const spot = new THREE.SpotLight(PALETTE.cream, 2.6, 0, 0.62, 1.0, 0) // decay 0: no inverse-square blow-up near the light;
  spot.castShadow = false;
  scene.add(spot, spot.target);

  const fog = new THREE.FogExp2(PALETTE.navyScene, 0.03);
  scene.fog = fog;

  const spotOffset = new THREE.Vector3(-3.5, 13, -6);

  return {
    key, rim, hemi, spot, fog,
    update(t, focus) {
      key.intensity = CURVES.key(t);
      hemi.intensity = CURVES.hemi(t);
      rim.intensity = CURVES.rim(t);
      spot.intensity = 2.2 * CURVES.spot(t);
      fog.density = CURVES.fog(t);
      spot.position.copy(focus).add(spotOffset);
      spot.target.position.copy(focus);
    },
  };
}
