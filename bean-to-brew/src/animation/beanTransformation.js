// Instanced bean fields (shared by drying bed, roaster, hopper, burst…) + the green→roasted material timeline.
import * as THREE from 'three';
import { buildBeanGeometry } from '../components/beanGeometry';
import { createBeanMaterial } from '../shaders/roastedBeanShader';
import { smoothstep, remap } from './util';

const dummy = new THREE.Object3D();

export function createBeanField(count, { res = 'lo', seed = 2, roast = 0, wet = 0 } = {}) {
  const geo = buildBeanGeometry({ seed, w: res === 'lo' ? 22 : 36, h: res === 'lo' ? 14 : 24 });
  const aRoast = new THREE.InstancedBufferAttribute(new Float32Array(count), 1);
  geo.setAttribute('aRoast', aRoast);
  const material = createBeanMaterial({ roast });
  material.userData.uniforms.uWet.value = wet;
  const mesh = new THREE.InstancedMesh(geo, material, count);
  mesh.castShadow = true; mesh.receiveShadow = true; mesh.frustumCulled = false;
  mesh.count = count;
  return {
    object: mesh, material, count,
    set(i, x, y, z, rx, ry, rz, s, r = 0) {
      dummy.position.set(x, y, z); dummy.rotation.set(rx, ry, rz); dummy.scale.setScalar(Math.max(1e-4, s));
      dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); aRoast.array[i] = r;
    },
    commit() { mesh.instanceMatrix.needsUpdate = true; aRoast.needsUpdate = true; },
    dispose() { geo.dispose(); material.dispose(); mesh.dispose(); },
  };
}

/**
 * Roast progression for a bean: 0 green → 1 dark. Includes the "first crack" event.
 * `start`,`end` absolute seconds. Returns roast level, crack intensity, surface expansion pulse.
 */
export function beanRoast(t, start, end, firstCrack = 0.58) {
  const p = remap(t, start, end);
  // slow drying, accelerating Maillard browning, then development
  const roast = p < 0.5 ? 0.5 * Math.pow(p / 0.5, 1.5) : 0.5 + 0.5 * (1 - Math.pow(1 - (p - 0.5) / 0.5, 1.6));
  const pop = Math.exp(-Math.pow((p - firstCrack) / 0.035, 2));
  return { roast, crack: smoothstep(firstCrack - 0.02, firstCrack + 0.1, p), pop, p };
}
