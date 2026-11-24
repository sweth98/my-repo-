// Cup surface: dark espresso → golden crema, fine bubbles, swirl and latte-art heart.
import * as THREE from 'three';
import { patchMaterial } from './chunks';

export function createCremaMaterial() {
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x3b1a08, roughness: 0.2, metalness: 0, clearcoat: 0.1, clearcoatRoughness: 0.35, envMapIntensity: 0.45,
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
      // cellular bubble field: x = dome height (0..1), y = rim darkness, z = per-bubble random
      vec3 bubbles(vec2 p, float scale, float density){
        vec2 q = p*scale; vec2 id = floor(q); vec2 f = fract(q)-.5;
        float rnd = h21(id+scale), on = step(1.-density, h21(id*1.7+3.3+scale));
        vec2 off = (vec2(h21(id+7.7), h21(id+2.3))-.5)*.5;
        float rad = (.16+.3*rnd)*on;
        float d = length(f-off)/max(rad,1e-3);
        float dome = sqrt(max(0.,1.-d*d))*step(d,1.);
        return vec3(dome, smoothstep(.78,1.,d)*step(d,1.)*on, rnd*on);
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
      // real bubbles: three sizes, dark rims, pale domes, a few big dark beads
      vec3 b1 = bubbles(uv*.9+q*.1, 7., .55), b2 = bubbles(uv*.9+q*.1+4.1, 16., .6), b3 = bubbles(uv*.9+q*.1+9.7, 34., .7);
      float rimD = max(b1.y, max(b2.y*.8, b3.y*.6));
      crema = mix(crema, vec3(.25,.11,.04), rimD*.4);
      crema += (b1.x*.12 + b2.x*.09 + b3.x*.06) * vec3(.6,.42,.22);
      float bead = step(.965, b1.z) * smoothstep(.55,.9,b1.x);
      crema = mix(crema, vec3(.03,.012,.005), bead*.9);
      // pour impact: dark disturbed ring of fine grounds/bubbles around the stream
      float imp = uImpact * smoothstep(.36,.06,r) * (.6+.8*fbm2(q*20.));
      crema = mix(crema, vec3(.05,.02,.008), clamp(imp,0.,1.)*.85);
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
      roughnessFactor = mix(.12, .4, uCrema) ;`,
    fragNormal: `
      { vec2 qq = uv*.9 + swirlUV(uv,(sin(uTime*.3)*.25+.7))*.1; vec3 nb1 = bubbles(qq, 7., .55), nb2 = bubbles(qq+4.1, 16., .6), nb3 = bubbles(qq+9.7, 34., .7);
        float bh = (nb1.x*.9 + nb2.x*.6 + nb3.x*.35) * uCrema;
        float rr = length(vObj.xz);
        float rippl = sin(rr*16. - uTime*5.) * exp(-rr*.55) * uImpact * .6;
        float h = creamH(uv, uTime)*uCrema*.1 + rippl*.05 + bh*.05;
        normal = perturbH(-vViewPosition, normal, vec2(dFdx(h), dFdy(h))*.7, faceDirection); }`,
  });
  return mat;
}
