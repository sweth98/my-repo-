import * as THREE from 'three';
import { evalCamera } from '../animation/cameraChoreography';

/** Free-look offsets (additive orbit around the choreographed look-at) for the camera-control mode. */
export const freeCam = { yaw: 0, pitch: 0, dolly: 1 };
const off = new THREE.Vector3(), sph = new THREE.Spherical();

/** Applies the choreographed camera (plus optional free-look) to a THREE camera. Returns the lens data. */
export function applyCinematicCamera(camera, t, aspect, mode) {
  const c = evalCamera(t);
  if (typeof window !== 'undefined' && window.__debugCam) { const d = window.__debugCam; c.pos.set(d[0], d[1], d[2]); c.look.set(d[3], d[4], d[5]); c.fov = d[6] ?? 30; if (d[7] !== undefined) c.ap = d[7]; }
  camera.position.copy(c.pos);
  if (mode === 'free') {
    off.copy(c.pos).sub(c.look);
    sph.setFromVector3(off);
    sph.theta += freeCam.yaw; sph.phi = Math.min(Math.PI - 0.1, Math.max(0.1, sph.phi + freeCam.pitch)); sph.radius *= freeCam.dolly;
    off.setFromSpherical(sph);
    camera.position.copy(c.look).add(off);
  }
  camera.lookAt(c.look);
  // keep the horizontal framing sensible for 9:16 and 1:1 previews
  let fov = c.fov;
  const base = 16 / 9;
  if (aspect < base) fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(fov) / 2) * Math.pow(base / aspect, 0.62)));
  camera.fov = fov;
  camera.aspect = aspect;
  camera.updateProjectionMatrix();
  return c;
}
