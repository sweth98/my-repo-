// Matte warm-grey concrete with procedural (object-space) surface variation,
// plus dark graphite metal for selected structural members.
import * as THREE from 'three';
import { PALETTE } from './config.js';

const NOISE_GLSL = /* glsl */ `
float hash31(vec3 p){ p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3)); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vnoise(vec3 x){
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash31(i), hash31(i + vec3(1,0,0)), f.x), mix(hash31(i + vec3(0,1,0)), hash31(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash31(i + vec3(0,0,1)), hash31(i + vec3(1,0,1)), f.x), mix(hash31(i + vec3(0,1,1)), hash31(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float fbm(vec3 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++){ s += a * vnoise(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
vec3 perturbN(vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection){
  vec3 dx = dFdx(surf_pos.xyz); vec3 dy = dFdy(surf_pos.xyz);
  if (dot(dx, dx) < 1e-14 || dot(dy, dy) < 1e-14) return surf_norm;
  vec3 vSigmaX = normalize(dx); vec3 vSigmaY = normalize(dy); vec3 vN = surf_norm;
  vec3 R1 = cross(vSigmaY, vN); vec3 R2 = cross(vN, vSigmaX);
  float fDet = dot(vSigmaX, R1) * faceDirection;
  if (abs(fDet) < 1e-4) return surf_norm; // edge-on: no perturbation (avoids normalize(0) = NaN)
  vec3 vGrad = sign(fDet) * (dHdxy.x * R1 + dHdxy.y * R2);
  return normalize(abs(fDet) * surf_norm - vGrad);
}
`;

function injectSurface(material, { scale = 1, bump = 0.55, pores = 0.16, tone = 0.13 }) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uBump = { value: bump };
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aSeed;\nvarying vec3 vOP;\nvarying float vSeed;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvOP = position;\nvSeed = aSeed;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vOP;\nvarying float vSeed;\nuniform float uBump;\n${NOISE_GLSL}`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec3 sp = vOP * ${scale.toFixed(3)};
        float nL = fbm(sp * 0.22 + vSeed * 13.7);
        float nM = fbm(sp * 1.6 + vSeed * 7.3);
        float pore = smoothstep(0.74, 0.9, vnoise(sp * 46.0 + vSeed * 3.1)) * 0.8;
        diffuseColor.rgb *= mix(${(1 - tone).toFixed(3)}, ${(1 + tone * 0.7).toFixed(3)}, nL) * mix(0.95, 1.04, nM);
        diffuseColor.rgb *= 1.0 - ${pores.toFixed(3)} * pore;`
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        roughnessFactor = clamp(roughnessFactor + (nM - 0.5) * 0.14 + pore * 0.08, 0.45, 1.0);`
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        {
          float hgt = fbm(sp * 7.0 + vSeed * 5.0) * 0.8 + vnoise(sp * 30.0 + vSeed) * 0.2 - pore * 0.2;
          vec2 dh = vec2(dFdx(hgt), dFdy(hgt));
          normal = perturbN(-vViewPosition, normal, dh * uBump, faceDirection);
        }`
      );
  };
  material.customProgramCacheKey = () => `surf-${scale}-${bump}-${pores}-${tone}`;
}

export function createMaterials() {
  const concrete = new THREE.MeshStandardMaterial({
    color: PALETTE.concrete,
    roughness: 0.9,
    metalness: 0.0,
    envMapIntensity: 0.35,
  });
  injectSurface(concrete, { scale: 1, bump: 0.22, pores: 0.16, tone: 0.13 });

  // Frame concrete is a touch darker and denser so the portals read as monuments.
  const frame = new THREE.MeshStandardMaterial({
    color: 0x8f897f,
    roughness: 0.86,
    metalness: 0.0,
    envMapIntensity: 0.35,
  });
  injectSurface(frame, { scale: 0.8, bump: 0.2, pores: 0.14, tone: 0.1 });

  const graphite = new THREE.MeshStandardMaterial({
    color: PALETTE.graphite,
    roughness: 0.46,
    metalness: 0.72,
    envMapIntensity: 0.9,
  });
  injectSurface(graphite, { scale: 2.5, bump: 0.12, pores: 0.0, tone: 0.06 });

  // Thin reveal around portal openings: the only place the icy cyan is emissive.
  const reveal = new THREE.MeshStandardMaterial({
    color: 0x20323d,
    emissive: PALETTE.cyan,
    emissiveIntensity: 0.0,
    roughness: 0.6,
    metalness: 0.0,
  });

  return { concrete, frame, graphite, reveal };
}
