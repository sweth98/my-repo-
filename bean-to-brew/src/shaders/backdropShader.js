import * as THREE from 'three';
import { GLSL_NOISE } from './chunks';

// Gradient dome with procedural out-of-focus bokeh lights – gives each scene its atmosphere.
export function createBackdropMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, depthTest: false,
    uniforms: {
      uTop: { value: new THREE.Color(0x203b1a) }, uBottom: { value: new THREE.Color(0x0e1a08) },
      uGlow: { value: new THREE.Color(0xffd98a) }, uGlowDir: { value: new THREE.Vector3(0.6, 0.55, -0.6).normalize() },
      uGlowAmt: { value: 0.6 }, uBokeh: { value: 0.5 }, uBokehColor: { value: new THREE.Color(0xffe6a0) }, uTime: { value: 0 },
    },
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }`,
    fragmentShader: /* glsl */ `
      ${GLSL_NOISE}
      uniform vec3 uTop,uBottom,uGlow,uGlowDir,uBokehColor; uniform float uGlowAmt,uBokeh,uTime; varying vec3 vDir;
      void main(){
        vec3 d = normalize(vDir);
        float h = d.y*.5+.5;
        vec3 col = mix(uBottom, uTop, smoothstep(.1,.9,h));
        float g = max(dot(d,normalize(uGlowDir)),0.);
        col += uGlow * (pow(g,6.)*.5 + pow(g,48.)*.8) * uGlowAmt;
        // bokeh discs on a spherical grid
        vec2 uv = vec2(atan(d.z,d.x)*3.2, d.y*4.5);
        float acc = 0.;
        for(int k=0;k<2;k++){
          vec2 q = uv*(4.+float(k)*3.) + float(k)*17.;
          vec2 id = floor(q), f = fract(q)-.5;
          float rnd = h21(id+float(k)*3.1);
          vec2 off = vec2(h21(id+7.7), h21(id+2.3))-.5;
          float rad = .12+.22*rnd;
          float disc = smoothstep(rad, rad*.35, length(f-off*.5));
          float ring = smoothstep(rad*.7, rad, length(f-off*.5))*disc*.5;
          float on = step(.55, h21(id+9.1));
          float tw = .75+.25*sin(uTime*.4+rnd*30.);
          acc += (disc*.6+ring)*on*tw*(.4+.6*rnd);
        }
        col += uBokehColor * acc * uBokeh * .45 * (.35+.65*h);
        gl_FragColor = vec4(col,1.);
        #include <tonemapping_fragment>
      }`,
  });
}
