// Dust (deterministic bursts when a component settles) and ambient haze motes
// (periodic with the loop, so the first and last frames are identical).
import * as THREE from 'three';
import { DURATION, PALETTE } from './config.js';
import { rng } from './easing.js';

const VERT = /* glsl */ `
#include <common>
#include <fog_pars_vertex>
#include <clipping_planes_pars_vertex>
uniform float uTime;
uniform float uScale;
attribute vec3 aVel;
attribute vec4 aInfo; // start, life, size, seed
varying float vA;
void main(){
  float age = uTime - aInfo.x;
  float life = aInfo.y;
  float k = clamp(age / life, 0.0, 1.0);
  bool alive = age >= 0.0 && age <= life;
  float drag = (1.0 - exp(-2.4 * max(age, 0.0))) / 2.4;
  vec3 p = position + aVel * drag;
  p.y += 0.28 * sqrt(k) + 0.1 * k * k;
  vA = alive ? smoothstep(0.0, 0.06, k) * (1.0 - smoothstep(0.25, 1.0, k)) * 0.5 : 0.0;
  vA *= smoothstep(2.0, 7.0, -(modelViewMatrix * vec4(p, 1.0)).z);
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  gl_PointSize = alive ? min(aInfo.z * (0.55 + 1.3 * k) * uScale / max(0.1, -mvPosition.z), uScale * 0.012) : 0.0;
  gl_Position = projectionMatrix * mvPosition;
  #include <clipping_planes_vertex>
  #include <fog_vertex>
}`;

const FRAG = /* glsl */ `
#include <common>
#include <fog_pars_fragment>
#include <clipping_planes_pars_fragment>
uniform vec3 uColor;
varying float vA;
void main(){
  #include <clipping_planes_fragment>
  float d = length(gl_PointCoord - 0.5);
  float a = smoothstep(0.5, 0.05, d) * vA;
  if (a < 0.003) discard;
  gl_FragColor = vec4(uColor, a);
  #include <fog_fragment>
}`;

export class Dust {
  constructor(bursts) {
    const r = rng(4242);
    let count = 0;
    for (const b of bursts) count += Math.max(10, Math.round(b.n * 3 * b.power));
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);
    const info = new Float32Array(count * 4);
    let o = 0;
    for (const b of bursts) {
      const n = Math.max(10, Math.round(b.n * 3 * b.power));
      for (let i = 0; i < n; i++, o++) {
        const a = r() * Math.PI * 2;
        const rad = r() * b.spread * 0.5;
        pos[o * 3] = b.pos.x + Math.cos(a) * rad * 0.6;
        pos[o * 3 + 1] = b.pos.y + r() * 0.1;
        pos[o * 3 + 2] = b.pos.z + Math.sin(a) * rad * 0.6;
        const sp = (0.5 + r() * 1.3) * (0.7 + 0.3 * b.power);
        vel[o * 3] = Math.cos(a) * sp;
        vel[o * 3 + 1] = 0.15 + r() * 0.5;
        vel[o * 3 + 2] = Math.sin(a) * sp;
        info[o * 4] = b.t + r() * 0.06;
        info[o * 4 + 1] = 1.1 + r() * 0.9;
        info[o * 4 + 2] = 0.08 + r() * 0.16;
        info[o * 4 + 3] = r();
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aVel', new THREE.BufferAttribute(vel, 3));
    g.setAttribute('aInfo', new THREE.BufferAttribute(info, 4));
    this.material = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, clipping: true, fog: true,
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
        uTime: { value: 0 }, uScale: { value: 800 }, uColor: { value: new THREE.Color(0xd9cfbd) },
      }]),
    });
    this.points = new THREE.Points(g, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 5;
    this.points.name = 'Dust';
    this.count = count;
  }
  update(t, scale) {
    this.material.uniforms.uTime.value = t;
    this.material.uniforms.uScale.value = scale;
  }
}

const MVERT = /* glsl */ `
#include <common>
#include <fog_pars_vertex>
#include <clipping_planes_pars_vertex>
uniform float uTime;
uniform float uScale;
uniform float uLoop;
uniform float uLight;
attribute vec3 aMotion; // freq multipliers (integers => loops exactly)
attribute vec4 aInfo;   // phase, amp, size, alpha
varying float vA;
void main(){
  float w = 6.28318530718 / uLoop;
  float ph = aInfo.x * 6.28318530718;
  vec3 p = position + aInfo.y * vec3(sin(w * aMotion.x * uTime + ph), sin(w * aMotion.y * uTime + ph * 1.7), sin(w * aMotion.z * uTime + ph * 2.3));
  vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
  float tw = 0.65 + 0.35 * sin(w * aMotion.x * 2.0 * uTime + ph * 3.1);
  vA = aInfo.w * tw * uLight * smoothstep(1.5, 6.0, -mvPosition.z);
  gl_PointSize = min(aInfo.z * uScale / max(0.1, -mvPosition.z), uScale * 0.012);
  gl_Position = projectionMatrix * mvPosition;
  #include <clipping_planes_vertex>
  #include <fog_vertex>
}`;

export class Motes {
  constructor(boxes) {
    const r = rng(909);
    const total = boxes.reduce((s, b) => s + b.n, 0);
    const pos = new Float32Array(total * 3);
    const mot = new Float32Array(total * 3);
    const info = new Float32Array(total * 4);
    let o = 0;
    for (const b of boxes) {
      for (let i = 0; i < b.n; i++, o++) {
        pos[o * 3] = b.min[0] + r() * (b.max[0] - b.min[0]);
        pos[o * 3 + 1] = b.min[1] + r() * (b.max[1] - b.min[1]);
        pos[o * 3 + 2] = b.min[2] + r() * (b.max[2] - b.min[2]);
        mot[o * 3] = 1 + Math.floor(r() * 3);
        mot[o * 3 + 1] = 1 + Math.floor(r() * 3);
        mot[o * 3 + 2] = 1 + Math.floor(r() * 3);
        info[o * 4] = r();
        info[o * 4 + 1] = 0.25 + r() * 0.7;
        info[o * 4 + 2] = b.size * (0.5 + r());
        info[o * 4 + 3] = 0.12 + r() * 0.3;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aMotion', new THREE.BufferAttribute(mot, 3));
    g.setAttribute('aInfo', new THREE.BufferAttribute(info, 4));
    this.material = new THREE.ShaderMaterial({
      vertexShader: MVERT, fragmentShader: FRAG, transparent: true, depthWrite: false, clipping: true, fog: true,
      uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
        uTime: { value: 0 }, uScale: { value: 800 }, uLoop: { value: DURATION }, uLight: { value: 1 },
        uColor: { value: new THREE.Color(PALETTE.cyan).lerp(new THREE.Color(PALETTE.cream), 0.55) },
      }]),
    });
    this.points = new THREE.Points(g, this.material);
    this.points.frustumCulled = false;
    this.points.renderOrder = 4;
    this.points.name = 'Motes';
  }
  update(t, scale, light) {
    this.material.uniforms.uTime.value = t;
    this.material.uniforms.uScale.value = scale;
    this.material.uniforms.uLight.value = light;
  }
}
