// Cherry skin: ripeness (green→yellow→red), glossy clear-coat, fake subsurface rim glow.
import * as THREE from 'three';
import { patchMaterial } from './chunks';

export function createCherryMaterial({ ripe = 1 } = {}) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.34, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.11,
    sheen: 1, sheenColor: new THREE.Color(0xff5a3a), sheenRoughness: 0.5,
  });
  const uniforms = { uRipe: { value: ripe }, uSeed: { value: 1 }, uTime: { value: 0 } };
  patchMaterial(mat, {
    key: 'cherry', srgb: true,
    uniforms,
    fragPars: `
      vec3 cherryRamp(float r, float n){
        vec3 g = mix(vec3(.22,.40,.10), vec3(.34,.52,.16), n);
        vec3 y = mix(vec3(.80,.62,.12), vec3(.92,.74,.18), n);
        vec3 o = mix(vec3(.80,.22,.06), vec3(.90,.30,.08), n);
        vec3 red = mix(vec3(.50,.015,.03), vec3(.80,.045,.05), n);
        vec3 c = mix(g, y, smoothstep(.0,.35,r));
        c = mix(c, o, smoothstep(.3,.62,r));
        return mix(c, red, smoothstep(.55,.95,r));
      }`,
    fragColor: `
      float cn = fbm3(vObj*3.2 + uSeed*7.);
      float cn2 = fbm3(vObj*26. + uSeed);
      vec3 cc = cherryRamp(uRipe, cn);
      cc *= .9 + .2*cn2;
      // darker toward the crown dimple (top, +y)
      cc *= 1. - .35*smoothstep(.55,.95,vObj.y/ max(.001, length(vObj)) );
      diffuseColor.rgb = cc;`,
    fragNormal: `
      { float hb = fbm3(vObj*34.+uSeed)*.5 + vnoise(vObj*90.)*.12;
        normal = perturbH(-vViewPosition, normal, vec2(dFdx(hb), dFdy(hb))*.006, faceDirection); }`,
    fragEmissive: `
      { vec3 Vv = normalize(vViewPosition); float fr = pow(1. - clamp(dot(normalize(normal), Vv),0.,1.), 2.2);
        totalEmissiveRadiance += mix(vec3(.05,.12,.02), vec3(.34,.012,.01), uRipe) * fr * .9; }`,
  });
  mat.userData.setRipe = (r) => (uniforms.uRipe.value = r);
  return mat;
}
