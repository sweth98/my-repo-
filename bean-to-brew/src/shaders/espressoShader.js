// Espresso stream: a vertex-animated column with viscous necking and ripples.
import * as THREE from 'three';
import { patchMaterial } from './chunks';

export function createEspressoMaterial() {
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0x5a2c10, roughness: 0.06, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02,
    envMapIntensity: 1.6, ior: 1.45, specularIntensity: 1,
  });
  const uniforms = {
    uTime: { value: 0 }, uTop: { value: 1 }, uBottom: { value: 0 }, uR0: { value: 0.12 },
    uFlow: { value: 1 }, uFront: { value: 0 },
  };
  patchMaterial(mat, {
    key: 'espresso',
    uniforms,
    vertexPars: `varying float vV; varying float vThin;`,
    fragPars: `varying float vThin; varying float vV;`,
    vertexBegin: `
      // position.y in [0,1] along the stream (0 = spout, 1 = tip). x,z hold the unit circle.
      float v = position.y;
      vV = v;
      float yWorld = mix(uTop, uBottom, v);
      float fall = (uTop - yWorld);
      // accelerating flow thins the column (continuity: r ~ v^-1/2)
      float thin = 1.0 / sqrt(1.0 + fall * 0.35);
      float rip = sin(yWorld*14. - uTime*9.) * .06 + sin(yWorld*31. - uTime*17.) * .025;
      float neck = 1. + rip * smoothstep(.05,.5,v);
      // leading edge bulb
      float tip = smoothstep(.93, 1., v);
      float bulb = 1. + .55 * sin(tip * 3.14159) * (1.-uFlow*.0);
      float r = uR0 * thin * neck * mix(1., bulb, step(uFlow, .999));
      r *= smoothstep(0., .035, v) * .6 + .4;
      r *= smoothstep(1.0, .975, v) * .9 + .1 * uFlow;
      // slight lateral wobble
      float wob = sin(yWorld*5. - uTime*3.)*.012*fall;
      transformed = vec3(position.x * r + wob, yWorld, position.z * r);
      vThin = thin;`,
    fragEmissive: `
      { vec3 Vv = normalize(vViewPosition); float f = clamp(dot(normalize(normal), Vv),0.,1.);
        // thin, backlit amber at the silhouettes; deep brown in the core
        totalEmissiveRadiance += vec3(.62,.28,.07) * pow(1.-f, 1.4) * .75 * (.5+.5*vThin)
                               + vec3(.30,.12,.025) * (.35 + .65*f) * (.6 + .4*sin(vV*40. - uTime*6.)); }`,
  });
  return mat;
}
