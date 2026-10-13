import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { RAIN_VERT, RAIN_FRAG, FINAL_FRAG } from './shaders.js';
import { createGlyphAtlas } from './atlas.js';
import { MODES, NUM_KEYS } from './modes.js';
import { fx } from './events.js';

THREE.ColorManagement.enabled = false; // palette values are authored display-referred

const LAYERS = 8;
const D_MIN = 4;
const YAW_MAX = 0.32;
const PITCH_MAX = 0.2;
const TAN_HALF = Math.tan(THREE.MathUtils.degToRad(30)); // fov 60

const QUALITY = [
  { layers: 5, pr: 0.75, post: false, bloom: false },
  { layers: 6, pr: 1.0, post: true, bloom: false },
  { layers: 8, pr: 1.5, post: true, bloom: true },
];

export class MatrixScene {
  /** @throws if WebGL2 is unavailable */
  constructor(canvas, { reducedMotion = false, quality = 2 } = {}) {
    this.canvas = canvas;
    this.reduced = reducedMotion;

    this.renderer = new THREE.WebGLRenderer({
      canvas, antialias: false, alpha: false, powerPreference: 'high-performance',
    });
    if (!this.renderer.capabilities.isWebGL2) throw new Error('WebGL2 required');
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
    this.renderer.setClearColor(0x020403, 1);

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 400);
    this.camera.rotation.order = 'YXZ';

    this.atlas = createGlyphAtlas(this.renderer);
    this.geo = new THREE.PlaneGeometry(1, 1);

    // uniforms shared by every layer
    this.shared = {
      uAtlas: { value: this.atlas },
      uTime: { value: 0 }, uRevDelta: { value: 0 }, uRevAmt: { value: 0 },
      uBoot: { value: 1 }, uSpeedVar: { value: 1 }, uGlyphRate: { value: 1 },
      uFlicker: { value: 0 }, uDens: { value: 0.9 }, uConv: { value: 0 },
    };
    this.layers = [];
    for (let i = 0; i < LAYERS; i++) {
      const uniforms = {
        ...this.shared,
        uFocal: { value: new THREE.Vector2() }, uConvR: { value: 20 },
        uCell: { value: 0.4 }, uSeed: { value: i * 3.7 },
        uAlpha: { value: 0 }, uBlur: { value: 0 }, uDepth: { value: 0 },
      };
      const material = new THREE.ShaderMaterial({
        uniforms, vertexShader: RAIN_VERT, fragmentShader: RAIN_FRAG,
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, depthTest: false,
      });
      const mesh = new THREE.Mesh(this.geo, material);
      mesh.frustumCulled = false;
      this.scene.add(mesh);
      this.layers.push({ mesh, material, u: uniforms, wraps: NaN, seed: 0 });
    }

    // current (blended) mode parameters + target
    this.p = {};
    this.target = MODES.rain.num;
    for (const k of NUM_KEYS) this.p[k] = this.target[k];

    // camera rig state
    this.yaw = 0; this.pitch = 0; this.yawT = 0; this.pitchT = 0;
    this.px = 0; this.py = 0;          // pointer in -1..1
    this.cx = 0; this.cy = 0;          // smoothed camera offset
    this.travel = 0; this.vel = 0;
    this.level = 0;
    this.time = 0;                     // simulation clock
    this.realTime = 0;
    this.boot = 1;
    this.brightMul = 1;
    this.focusD = 22;

    this._v = new THREE.Vector3();

    this.composer = null;
    this.bloom = null;
    this.final = null;
    this.qIndex = Math.max(0, Math.min(2, quality));
    this.w = 1; this.h = 1;
    this._buildPost();
    this.setQuality(this.qIndex);
  }

  _buildPost() {
    const size = this.renderer.getSize(new THREE.Vector2());
    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0.85, 0.55, 0.12);
    this.composer.addPass(this.bloom);
    this.final = new ShaderPass({
      uniforms: {
        tDiffuse: { value: null }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) },
        uPx: { value: 1 }, uGlitch: { value: 0 }, uRect: { value: new THREE.Vector4() },
        uSeedG: { value: 0 }, uChroma: { value: 0.0006 }, uScan: { value: 1 },
      },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: FINAL_FRAG,
    });
    this.composer.addPass(this.final);
  }

  get quality() { return this.qIndex; }

  setQuality(q) {
    this.qIndex = q;
    this.q = QUALITY[q];
    this.layers.forEach((l, i) => { l.mesh.visible = i < this.q.layers; });
    this.bloom.enabled = this.q.bloom;
    this.pr = Math.min(window.devicePixelRatio || 1, this.q.pr);
    document.documentElement.classList.toggle('no-post', !this.q.post);
    this.resize();
  }

  setMode(key) { this.target = MODES[key].num; }

  /** Snap parameters (used on reset to avoid a visible blend). */
  snapMode(key) { this.target = MODES[key].num; for (const k of NUM_KEYS) this.p[k] = this.target[k]; }

  resize() {
    const w = Math.max(1, this.canvas.clientWidth || window.innerWidth);
    const h = Math.max(1, this.canvas.clientHeight || window.innerHeight);
    this.w = w; this.h = h;
    this.renderer.setPixelRatio(this.pr);
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(this.pr);
    this.composer.setSize(w, h);
    this.bloom.resolution.set(w / 2, h / 2);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.final.uniforms.uRes.value.set(w * this.pr, h * this.pr);
    this.final.uniforms.uPx.value = this.pr;
  }

  // ---- input -----------------------------------------------------------------
  setPointer(nx, ny) { this.px = nx; this.py = ny; }
  drag(dx, dy) {
    this.yawT = THREE.MathUtils.clamp(this.yawT - dx * 0.0042, -YAW_MAX, YAW_MAX);
    this.pitchT = THREE.MathUtils.clamp(this.pitchT - dy * 0.0042, -PITCH_MAX, PITCH_MAX);
  }
  kick(v) { this.vel = THREE.MathUtils.clamp(this.vel + v, -60, 140); }
  resetCamera() {
    this.yawT = this.pitchT = 0; this.px = this.py = 0; this.vel = 0; this.travel = 0; this.level = 0;
  }

  // ---- frame -----------------------------------------------------------------
  /**
   * @param dt real delta (s)   @param simDt scaled simulation delta (0 while paused)
   */
  update(dt, simDt) {
    const p = this.p;
    const kb = 1 - Math.exp(-dt * 2.2);
    for (let i = 0; i < NUM_KEYS.length; i++) {
      const k = NUM_KEYS[i];
      p[k] += (this.target[k] - p[k]) * kb;
    }
    this.realTime += dt;
    this.time += simDt * fx.speedBoost;

    const S = this.shared;
    S.uTime.value = this.time;
    S.uRevDelta.value = fx.revDelta;
    S.uRevAmt.value = fx.revAmt;
    S.uBoot.value = this.boot;
    S.uSpeedVar.value = p.speedVar;
    S.uGlyphRate.value = p.glyphRate;
    S.uFlicker.value = this.reduced ? p.flicker * 0.3 : p.flicker;
    S.uDens.value = p.dens;
    S.uConv.value = fx.conv;

    // camera: smoothed yaw/pitch + parallax offset + a slow cinematic drift
    const lk = 1 - Math.exp(-dt * p.camLerp);
    this.yaw += (this.yawT - this.yaw) * lk;
    this.pitch += (this.pitchT - this.pitch) * lk;
    const driftK = this.reduced ? 0.15 : p.drift;
    const t = this.realTime;
    const tx = this.px * 1.4 * p.parallax + Math.sin(t * 0.11) * 0.9 * driftK;
    const ty = -this.py * 0.9 * p.parallax + Math.sin(t * 0.083 + 1.7) * 0.55 * driftK;
    this.cx += (tx - this.cx) * lk;
    this.cy += (ty - this.cy) * lk;
    const cam = this.camera;
    cam.position.set(this.cx, this.cy, 0);
    cam.rotation.set(
      this.pitch + Math.sin(t * 0.07 + 0.6) * 0.012 * driftK,
      this.yaw + Math.sin(t * 0.053) * 0.02 * driftK, 0,
    );
    cam.updateMatrixWorld();

    // forward travel along z (wheel / dive / convergence), ambient creep
    const ambient = this.reduced ? p.ambient * 0.3 : p.ambient;
    this.vel += (ambient - this.vel) * (1 - Math.exp(-dt * 1.6));
    this.travel += (this.vel + fx.dolly) * dt;

    // focal ray for convergence
    const v = this._v.set(fx.focalX * TAN_HALF * cam.aspect, fx.focalY * TAN_HALF, -1).applyQuaternion(cam.quaternion);

    const range = p.range;
    const spacing = range / LAYERS;
    const hfov = Math.atan(TAN_HALF * cam.aspect);
    const brightBase = p.bright * this.brightMul * Math.max(0.6, Math.pow(0.93, this.level));
    const nLayers = this.q.layers;
    const stride = LAYERS / nLayers; // fewer layers at low quality, spread over the same depth

    for (let i = 0; i < nLayers; i++) {
      const L = this.layers[i];
      const slot = i * stride;
      const raw = slot * spacing - this.travel;
      const wraps = Math.floor(raw / range);
      const d = D_MIN + (raw - wraps * range);
      if (wraps !== L.wraps) {
        L.wraps = wraps;
        L.u.uSeed.value = (i * 7 + ((wraps * 13 + this.level * 29) % 331 + 331) % 331) % 40 + 0.5;
      }
      const u = L.u;
      const near = THREE.MathUtils.smoothstep(d, D_MIN + 0.5, D_MIN + 9);
      const far = Math.exp(-d * p.fogK);
      const edge = 1 - THREE.MathUtils.smoothstep(d, range * 0.8, range + D_MIN);
      u.uAlpha.value = brightBase * near * far * edge * (0.85 + 0.15 * stride);
      u.uBlur.value = Math.min(2.6, Math.abs(d - this.focusD) * p.blurK);
      u.uDepth.value = Math.min(1, d / range);
      u.uCell.value = (0.2 + 0.0057 * (D_MIN + (slot + 0.5) * spacing)) * 1.1;
      u.uConvR.value = d * 0.45;
      const tz = d / -v.z;
      u.uFocal.value.set(cam.position.x + v.x * tz, cam.position.y + v.y * tz);

      const halfW = d * Math.tan(Math.min(hfov + Math.abs(this.yaw), 1.45)) + 2;
      const halfH = d * Math.tan(Math.min(Math.atan(TAN_HALF) + Math.abs(this.pitch), 1.45)) + 2;
      L.mesh.position.set(cam.position.x, cam.position.y, -d);
      L.mesh.scale.set(halfW * 2, halfH * 2, 1);
    }

    // post
    const F = this.final.uniforms;
    F.uTime.value = this.realTime;
    F.uGlitch.value = fx.glitch;
    F.uRect.value.set(fx.gRect[0], fx.gRect[1], fx.gRect[2], fx.gRect[3]);
    F.uSeedG.value = fx.gSeed;
    F.uChroma.value = p.chroma * (1 + fx.glitch * 2);
    this.bloom.strength = p.bloom * (1 + fx.conv * 0.35);
    this.bloom.radius = p.bloomRadius;
    this.bloom.threshold = p.bloomThr;
  }

  render() {
    if (this.q.post) this.composer.render();
    else this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    for (const l of this.layers) l.material.dispose();
    this.geo.dispose();
    this.atlas.dispose();
    this.composer.dispose();
    this.bloom.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
