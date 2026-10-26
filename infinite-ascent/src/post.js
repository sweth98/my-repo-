// Post pipeline: portal-aware scene pass -> gentle bloom -> tone map/sRGB -> finish
// (navy-biased grade, vignette, dithering, typography overlay).
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { PortalRenderPass } from './portal.js';

const FinishShader = {
  name: 'FinishShader',
  uniforms: {
    tDiffuse: { value: null },
    tText: { value: null },
    uVignette: { value: 0.5 },
  },
  vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform sampler2D tText; uniform float uVignette; varying vec2 vUv;
    float hash(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * .1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
    void main(){
      vec3 col = texture2D(tDiffuse, vUv).rgb;
      // navy-biased shadows
      col += vec3(0.010, 0.017, 0.030) * (1.0 - col);
      // vignette
      vec2 q = (vUv - 0.5) * vec2(1.0, 0.82);
      float v = smoothstep(0.30, 0.86, length(q));
      col *= 1.0 - uVignette * v;
      // triangular-pdf dither against banding in the dark gradients
      float n = hash(gl_FragCoord.xy) + hash(gl_FragCoord.xy + 17.17) - 1.0;
      col += n / 255.0;
      // typography (straight alpha, already in output space)
      vec4 tx = texture2D(tText, vUv);
      col = mix(col, tx.rgb, tx.a);
      gl_FragColor = vec4(col, 1.0);
    }`,
};

// Guards the HDR buffer: a single NaN/inf pixel would be smeared across the frame by bloom.
const SanitizeShader = {
  name: 'SanitizeShader',
  uniforms: { tDiffuse: { value: null } },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
    void main(){ vec4 c = texture2D(tDiffuse, vUv); if (any(isnan(c.rgb)) || any(isinf(c.rgb))) c.rgb = vec3(0.0); c.rgb = min(c.rgb, vec3(24.0)); gl_FragColor = c; }`,
};

export function createPost({ renderer, scene, camera, portal, stencilMaterials, width, height, textTexture, samples = 4 }) {
  const rt = new THREE.WebGLRenderTarget(width, height, {
    type: THREE.HalfFloatType, depthBuffer: true, stencilBuffer: true, samples,
  });
  const composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(1);
  composer.setSize(width, height);

  const scenePass = new PortalRenderPass(scene, camera, portal, stencilMaterials);
  composer.addPass(scenePass);

  composer.addPass(new ShaderPass(SanitizeShader));
  const bloom = new UnrealBloomPass(new THREE.Vector2(width, height), 0.3, 0.6, 1.05);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  const finish = new ShaderPass(FinishShader);
  finish.uniforms.tText.value = textTexture;
  composer.addPass(finish);

  return { composer, scenePass, bloom, finish, rt };
}
