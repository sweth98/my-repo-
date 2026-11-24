import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BokehPass } from 'three/examples/jsm/postprocessing/BokehPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GradeShader, smooth, clamp } from './shared.js';
import * as s1 from './scenes/s1_plantation.js';
import * as s2 from './scenes/s2_harvest.js';
import * as s3 from './scenes/s3_sorting.js';

const SCENES = [s1, s2, s3];       // S4..S8 added in later stages
const W = 720, H = 1280;           // 9:16 master
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1); renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('wrap').appendChild(renderer.domElement);

const pmrem = new THREE.PMREMGenerator(renderer);
const studioEnv = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

const ctx = { renderer, envs: { studio: studioEnv }, W, H };
const built = SCENES.map((m) => m.build(ctx));
const starts = []; let total = 0;
SCENES.forEach((m) => { starts.push(total); total += m.duration; });

const composer = new EffectComposer(renderer);
const rp = new RenderPass(built[0].scene, built[0].camera); composer.addPass(rp);
const bokeh = new BokehPass(built[0].scene, built[0].camera, { focus: 1, aperture: 0.0002, maxblur: 0.012 });
composer.addPass(bokeh);
const grade = new ShaderPass(GradeShader); composer.addPass(grade);
composer.addPass(new OutputPass());

let idx = -1;
function seek(T) {
  T = clamp(T, 0, total - 1e-3);
  let i = SCENES.length - 1; while (starts[i] > T) i--;
  const t = T - starts[i], d = SCENES[i].duration;
  const sc = built[i];
  if (i !== idx) { idx = i; rp.scene = sc.scene; rp.camera = sc.camera; bokeh.scene = sc.scene; bokeh.camera = sc.camera; }
  sc.update(t, ctx);
  bokeh.uniforms.focus.value = sc.focus; bokeh.uniforms.aperture.value = sc.aperture;
  bokeh.uniforms.maxblur.value = sc.maxblur ?? 0.012;
  grade.uniforms.time.value = T % 7.13;
  grade.uniforms.warm.value = sc.warm ?? 1;
  // dip-to-warm-black at scene edges (placeholder for match cuts; see plan §7)
  const edge = 0.5; grade.uniforms.fade.value = 1 - smooth(clamp(Math.min(t, d - t) / edge)) ;
  if (i === 0 && t < edge) grade.uniforms.fade.value = 1 - smooth(clamp(t / edge));
  composer.render();
  document.getElementById('hud').textContent = `scene ${i + 1}/${SCENES.length}  t=${t.toFixed(2)}s  total=${T.toFixed(2)}/${total}s`;
}
window.__seek = seek; window.__total = total;

const q = new URLSearchParams(location.search);
if (q.has('t')) seek(parseFloat(q.get('t')));
else { const t0 = performance.now(); (function loop() { seek(((performance.now() - t0) / 1000) % total); requestAnimationFrame(loop); })(); }
