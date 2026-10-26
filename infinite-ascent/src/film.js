// Film: assembles the scene and renders any frame as a pure function of time t ∈ [0, 35].
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { DURATION, FPS, PALETTE, ASPECT } from './config.js';
import { buildArchitecture } from './architecture.js';
import { Structure, portalOpen } from './timeline.js';
import { createMaterials } from './materials.js';
import { Dust, Motes } from './particles.js';
import { createLighting, CURVES } from './lighting.js';
import { PortalPair } from './portal.js';
import { CameraRig } from './camera.js';
import { buildShots } from './shots.js';
import { createPost } from './post.js';
import { Typography } from './typography.js';

export class Film {
  constructor(stage, opts = {}) {
    this.stage = stage;
    this.opts = opts;
    this.t = 0;

    const renderer = new THREE.WebGLRenderer({
      antialias: false, powerPreference: 'high-performance', stencil: true,
      preserveDrawingBuffer: !!opts.preserve,
    });
    renderer.setClearColor(PALETTE.navyScene, 1);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.shadowMap.autoUpdate = false;
    stage.prepend(renderer.domElement);
    this.renderer = renderer;

    this.scene = new THREE.Scene();
    this.scene.background = null; // cleared explicitly by the portal pass
    const pmrem = new THREE.PMREMGenerator(renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environmentIntensity = 0.25;
    pmrem.dispose();

    this.camera = new THREE.PerspectiveCamera(30, ASPECT, 0.1, 600);

    this.arch = buildArchitecture();
    this.materials = createMaterials();
    this.structure = new Structure(this.arch, this.materials);
    this.scene.add(this.structure.group);

    this.dust = new Dust(this.arch.bursts);
    this.scene.add(this.dust.points);
    this.motes = new Motes([
      { n: 380, min: [-10, -4, -16], max: [10, 12, 14], size: 0.07 },
      { n: 700, min: [-24, -10, -26], max: [44, 46, 50], size: 0.14 },
    ]);
    this.scene.add(this.motes.points);

    this.lighting = createLighting(this.scene, { shadowSize: opts.shadowSize ?? 4096 });
    this.portal = new PortalPair(this.arch.portals);
    this.rig = new CameraRig(buildShots(this.arch), this.portal);

    this.typo = new Typography();
    this.textTex = new THREE.CanvasTexture(this.typo.canvas);
    this.textTex.colorSpace = THREE.NoColorSpace;
    this.textTex.minFilter = THREE.LinearFilter;
    this.textTex.generateMipmaps = false;

    this.stencilMats = [...Object.values(this.materials), this.dust.material, this.motes.material];
    this.post = createPost({
      renderer, scene: this.scene, camera: this.camera, portal: this.portal,
      stencilMaterials: this.stencilMats, width: 540, height: 960, textTexture: this.textTex,
      samples: opts.samples ?? 4,
    });

    this._pos = new THREE.Vector3();
    this._look = new THREE.Vector3();
    this.setSize(540, 960, 1);
  }

  /** Stage size in CSS px (always 9:16) and pixel ratio. */
  setSize(w, h, pr) {
    this.cssW = w; this.cssH = h; this.pr = pr;
    const bw = Math.round(w * pr);
    const bh = Math.round(h * pr);
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(w, h, false);
    this.post.composer.setPixelRatio(1);
    this.post.composer.setSize(bw, bh);
    this.post.rt.setSize(bw, bh);
    this.typo.resize(bw, bh);
    this.textTex.dispose();
    this.textTex.needsUpdate = true;
    this.bw = bw; this.bh = bh;
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this._lastDrawn = null;
  }

  /** Render frame at time t (seconds). Deterministic: depends on nothing but t. */
  renderAt(t) {
    t = Math.min(DURATION, Math.max(0, t));
    this.t = t;
    const { camera, structure, lighting, portal } = this;

    structure.update(t);

    let fov = this.rig.sample(t, this._pos, this._look);
    if (this.debugCam) {
      const d = this.debugCam;
      this._pos.set(d[0], d[1], d[2]);
      this._look.set(d[3], d[4], d[5]);
      fov = d[6];
    }
    camera.position.copy(this._pos);
    camera.fov = fov;
    camera.aspect = ASPECT;
    camera.near = 0.1;
    camera.far = 600;
    camera.lookAt(this._look);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld(true);

    lighting.update(t, this._look);
    this.scene.environmentIntensity = 0.12 + 0.55 * CURVES.hemi(t);
    this.post.bloom.strength = CURVES.bloom(t);

    const open = portalOpen(t);
    portal.setOpen(open);
    this.materials.reveal.emissiveIntensity = 2.4 * open;

    const scale = this.bh / (2 * Math.tan((fov * Math.PI) / 360));
    this.dust.update(t, scale);
    this.motes.update(t, scale, CURVES.motes(t));

    if (this.typo.draw(t)) this.textTex.needsUpdate = true;

    this.post.composer.render();
  }

  frameTime(frame) { return frame / FPS; }
}
