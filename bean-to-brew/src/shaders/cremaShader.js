// Cup surface: dark espresso → golden crema, fine bubbles, swirl and latte-art heart.
import * as THREE from 'three';
import { patchMaterial } from './chunks';

export function createCremaMaterial() {
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x3b1a08, roughness: 0.2, metalness: 0, clearcoat: 0.18, clearcoatRoughness: 0.3,
  });
  const uniforms = { uTime: { value: 0 }, uCrema: { value: 0 }, uArt: { value: 0 }, uImpact: { value: 0 }, uR: { value: 3.3 } };
  patchMaterial(mat, {
    key: 'crema', srgb: true,
    uniforms,
    fragPars: `
      vec2 swirlUV(vec2 p, float k){ float r=length(p); float a=atan(p.y,p.x) + k*(1.-smoothstep(0.,1.1,r))*2.2; return r*vec2(cos(a),sin(a)); }
      float dot2(vec2 v){ return dot(v,v); }
      float heartSDF(vec2 p){
        p.x = abs(p.x);
        if (p.y + p.x > 1.0) return sqrt(dot2(p - vec2(.25,.75))) - sqrt(2.0)/4.0;
        return sqrt(min(dot2(p - vec2(0.,1.)), dot2(p - .5*max(p.x + p.y, 0.)))) * sign(p.x - p.y);
      }
      float creamH(vec2 uv, float t){
        vec2 q = swirlUV(uv, sin(t*.35)*.6 + .8);
        float bub = vnoise2(q*70.) ; bub = smoothstep(.7,.85,bub);
        float fine = fbm2(q*9. + t*.04);
        return fine*.6 + bub*.4;
      }
    `,
    fragColor: `
      vec2 uv = vObj.xz / uR;
      float r = length(uv);
      float t = uTime;
      vec2 q = swirlUV(uv, (sin(t*.3)*.25 + .7));
      float mott = fbm2(q*4.2 + vec2(0., t*.02));
      float fine = fbm2(q*11. + 3.);
      float tiger = fbm2(q*2.6 + 4.);
      float bubb = smoothstep(.72,.86, vnoise2(q*95.));
      vec3 espresso = vec3(.06,.026,.011) * (.8+.4*mott);
      vec3 crema = mix(vec3(.40,.20,.075), vec3(.70,.45,.20), smoothstep(.28,.78,mott*.7+fine*.3));
      crema = mix(crema, vec3(.30,.14,.05), smoothstep(.55,.95,tiger)*.35);
      crema += bubb * vec3(.07,.05,.03);
      float rim = smoothstep(.80,1.0,r);
      crema = mix(crema, vec3(.26,.11,.04), rim*.55);
      vec3 col = mix(espresso, crema, uCrema);
      // latte art: layered cream heart (heart-in-heart) pulled into the crema
      vec2 hp = vec2(uv.x, -uv.y) * 1.75 + vec2(0., .48);
      float hd = heartSDF(hp);
      float inside = smoothstep(.02,-.02, hd) * uArt;
      float rings = smoothstep(.15,.55, abs(fract(hd*-9.)-.5)*2.);
      vec3 milk = mix(vec3(.96,.84,.62), vec3(.86,.68,.42), rings*.8);
      col = mix(col, milk, inside*.88);
      float edge = smoothstep(.05,.0,abs(hd))*uArt; col = mix(col, vec3(.30,.14,.05), edge*.22*(1.-inside));
      diffuseColor.rgb = col;`,
    fragRough: `
      roughnessFactor = mix(.12, .52, uCrema) ;`,
    fragNormal: `
      { float rr = length(vObj.xz);
        float rippl = sin(rr*16. - uTime*5.) * exp(-rr*.55) * uImpact * .6;
        float h = creamH(uv, uTime)*uCrema*.16 + rippl*.05;
        normal = perturbH(-vViewPosition, normal, vec2(dFdx(h), dFdy(h))*.7, faceDirection); }`,
  });
  return mat;
}
