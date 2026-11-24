import * as THREE from 'three';

// Shared GLSL snippets ------------------------------------------------------
export const GLSL_NOISE = /* glsl */ `
float h31(vec3 p){ p=fract(p*.1031); p+=dot(p,p.zyx+31.32); return fract((p.x+p.y)*p.z); }
float vnoise(vec3 p){
  vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z);
}
float fbm3(vec3 p){ float a=.5,s=0.; for(int i=0;i<4;i++){ s+=a*vnoise(p); p*=2.03; a*=.5; } return s; }
float h21(vec2 p){ p=fract(p*vec2(123.34,456.21)); p+=dot(p,p+45.32); return fract(p.x*p.y); }
float vnoise2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y); }
float fbm2(vec2 p){ float a=.5,s=0.; for(int i=0;i<5;i++){ s+=a*vnoise2(p); p=p*2.02+7.1; a*=.5; } return s; }
`;

// bump perturbation from a procedural height (screen-space derivatives)
export const GLSL_BUMP = /* glsl */ `
vec3 perturbH(vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection){
  vec3 vSigmaX = normalize(dFdx(surf_pos.xyz));
  vec3 vSigmaY = normalize(dFdy(surf_pos.xyz));
  vec3 vN = surf_norm;
  vec3 R1 = cross(vSigmaY, vN);
  vec3 R2 = cross(vN, vSigmaX);
  float fDet = dot(vSigmaX, R1) * faceDirection;
  vec3 vGrad = sign(fDet) * (dHdxy.x * R1 + dHdxy.y * R2);
  return normalize(abs(fDet) * surf_norm - vGrad);
}
`;

/**
 * Patch a built-in three material with custom GLSL while keeping full PBR lighting.
 * opts: uniforms, vertexPars, vertexBegin, fragPars, fragColor, fragRough, fragNormal, fragEmissive, varyings
 */
export function patchMaterial(mat, o = {}) {
  const uniforms = o.uniforms || {};
  mat.userData.uniforms = uniforms;
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (shader, renderer) => {
    Object.assign(shader.uniforms, uniforms);
    const decl = Object.keys(uniforms)
      .map((k) => {
        const v = uniforms[k].value;
        const type = typeof v === 'number' ? 'float' : v.isColor || v.isVector3 ? 'vec3' : v.isVector2 ? 'vec2' : v.isVector4 ? 'vec4' : 'float';
        return `uniform ${type} ${k};`;
      })
      .join('\n');
    const baseV = shader.vertexShader.includes('// PM_BASE');
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${decl}\n${baseV ? '' : '// PM_BASE\n' + GLSL_NOISE + '\nvarying vec3 vObj;\nvarying vec3 vWorldP;'}\n${o.vertexPars || ''}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n${baseV ? '' : 'vObj = position;'}\n${o.vertexBegin || ''}`)
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>\n${baseV ? '' : 'vWorldP = (modelMatrix * vec4(transformed,1.0)).xyz;'}`);
    const baseF = shader.fragmentShader.includes('// PM_BASE');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${decl}\n${baseF ? '' : '// PM_BASE\n' + GLSL_NOISE + '\n' + GLSL_BUMP + '\nvarying vec3 vObj;\nvarying vec3 vWorldP;'}\n${o.fragPars || ''}`)
      .replace('#include <color_fragment>', `#include <color_fragment>\n${o.fragColor || ''}${o.srgb ? '\ndiffuseColor.rgb = pow(diffuseColor.rgb, vec3(2.2));' : ''}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>\n${o.fragRough || ''}`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>\n${o.fragNormal || ''}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\n${o.fragEmissive || ''}`);
    if (prev) prev(shader, renderer);
  };
  mat.customProgramCacheKey = () => (o.key || 'patched') + (o.fragColor || '').length + (o.vertexBegin || '').length + (o.fragNormal || '').length;
  return mat;
}

// Brushed stainless / dark metal --------------------------------------------
export function createMetal({ color = 0xb9b6b0, rough = 0.34, dark = false, stretch = 1 } = {}) {
  const m = new THREE.MeshStandardMaterial({ color, metalness: 1, roughness: rough });
  return patchMaterial(m, {
    key: 'metal' + stretch,
    fragRough: `roughnessFactor = clamp(roughnessFactor + (fbm2(vec2(vObj.x*${(60 / stretch).toFixed(1)}, vObj.y*2.0+vObj.z*3.0))-.5)*.18,0.05,1.);`,
    fragNormal: `{ float hb = fbm2(vec2(vObj.x*${(90 / stretch).toFixed(1)}+vObj.z*5., vObj.y*4.+vObj.z*80.)); normal = perturbH(-vViewPosition, normal, vec2(dFdx(hb), dFdy(hb))*.0035, faceDirection); }`,
  });
}
