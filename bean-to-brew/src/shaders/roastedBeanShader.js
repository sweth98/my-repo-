// Green ↔ roasted bean material. One PBR material, `uRoast` (0 green … 1 dark roast)
// drives colour ramp, roughness/clear-coat oiliness, surface cracking and bump.
import * as THREE from 'three';
import { patchMaterial } from './chunks';

export function createBeanMaterial({ roast = 0 } = {}) {
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.8, metalness: 0, clearcoat: 0, clearcoatRoughness: 0.35,
    sheen: 0.0,
  });
  const uniforms = { uRoast: { value: roast }, uCrack: { value: 0 }, uTime: { value: 0 }, uWet: { value: 0 } };
  patchMaterial(mat, {
    key: 'bean', srgb: true,
    uniforms,
    vertexPars: `attribute float aRoast; varying float vRoast; varying float vPuff;`,
    vertexBegin: `
      vRoast = clamp(uRoast + aRoast, 0., 1.);
      transformed += normal * (smoothstep(.45,.62,vRoast) * .035 + vRoast*.012);`,
    fragPars: `
      varying float vRoast;
      vec3 roastRamp(float r, float n){
        vec3 green = mix(vec3(.50,.56,.30), vec3(.66,.66,.42), n);
        vec3 tan   = mix(vec3(.62,.50,.24), vec3(.74,.60,.33), n);
        vec3 light = mix(vec3(.38,.20,.09), vec3(.52,.30,.14), n);
        vec3 med   = mix(vec3(.20,.10,.045), vec3(.31,.17,.08), n);
        vec3 dark  = mix(vec3(.065,.032,.016), vec3(.13,.07,.035), n);
        vec3 c = mix(green, tan, smoothstep(.0,.28,r));
        c = mix(c, light, smoothstep(.28,.52,r));
        c = mix(c, med, smoothstep(.5,.78,r));
        c = mix(c, dark, smoothstep(.76,1.,r));
        return c;
      }
      float grooveMask(vec3 p){
        float cy = sin(p.x*3.14159)*.06;
        float d = abs(p.y - cy);
        return clamp(smoothstep(.12,.03,d) * smoothstep(-.02,.06,p.z) * smoothstep(1.0,.72,abs(p.x)), 0., 1.);
      }
    `,
    fragColor: `
      float bn = fbm3(vObj*5.5 + 3.1);
      float bn2 = fbm3(vObj*22.);
      vec3 base = roastRamp(vRoast, bn);
      float gm = grooveMask(vObj);
      // green: silverskin in groove is paler; roasted: groove is nearly black
      vec3 grooveCol = mix(vec3(.72,.70,.52), vec3(.025,.012,.006), smoothstep(.2,.6,vRoast));
      base = mix(base, grooveCol, gm*.85);
      // mottling and speckles
      base *= .88 + .24*bn2;
      // first-crack lines (cracks open along groove + wrinkles)
      float crackLine = smoothstep(.04,.0, abs(fbm3(vObj*9.+1.7)-.5)) * smoothstep(.5,.75,vRoast) * uCrack;
      base *= 1. - crackLine*.6;
      diffuseColor.rgb = base;
    `,
    fragRough: `
      float oil = smoothstep(.45,.95,vRoast);
      roughnessFactor = mix(.86, .40 - .12*bn2, oil);
      roughnessFactor = mix(roughnessFactor, .18, uWet*.8);
      `,
    fragNormal: `
      { float hb = mix(fbm3(vObj*28.)*.35 + fbm3(vObj*70.)*.18, fbm3(vObj*16.)*.45 + fbm3(vObj*55.)*.3 + vnoise(vObj*120.)*.1, smoothstep(.2,.8,vRoast));
        hb -= gm*.5;
        normal = perturbH(-vViewPosition, normal, vec2(dFdx(hb), dFdy(hb))*mix(.012,.02,vRoast), faceDirection); }
      `,
    fragEmissive: `
      totalEmissiveRadiance += vec3(.9,.28,.04) * smoothstep(.0,.3,vRoast) * (1.-smoothstep(.3,.6,vRoast)) * 0.0;
    `,
  });
  // oily clearcoat tied to roast — updated by setRoast()
  mat.userData.setRoast = (r) => {
    uniforms.uRoast.value = r;
    mat.clearcoat = THREE.MathUtils.smoothstep(r, 0.5, 0.95) * 0.55;
  };
  mat.userData.setRoast(roast);
  return mat;
}
