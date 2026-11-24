import * as THREE from 'three';
import { GLSL_NOISE } from './chunks';

// Rising, curling steam ribbons: stacked camera-facing quads with advected noise.
export function createSteamMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.NormalBlending,
    uniforms: { uTime: { value: 0 }, uAmount: { value: 1 }, uColor: { value: new THREE.Color(0xfff1dc) } },
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying vec3 vP;
      void main(){ vUv = uv; vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: /* glsl */ `
      ${GLSL_NOISE}
      uniform float uTime; uniform float uAmount; uniform vec3 uColor; varying vec2 vUv; varying vec3 vP;
      void main(){
        float y = vUv.y;
        vec2 p = vec2(vUv.x*2.2 + sin(y*4.+uTime*.8)*.35*y, y*3.0 - uTime*.55);
        float n = fbm2(p*2.4 + vec2(uTime*.07, 0.));
        float n2 = fbm2(p*5.1 - vec2(0., uTime*.2));
        float body = smoothstep(.45,.85, n*.75 + n2*.35);
        float xmask = smoothstep(.0,.5,vUv.x) * smoothstep(1.,.5,vUv.x);
        float ymask = smoothstep(0.,.18,y) * smoothstep(1.,.45,y);
        float a = body * xmask * ymask * .42 * uAmount;
        gl_FragColor = vec4(uColor, a);
      }`,
  });
}
