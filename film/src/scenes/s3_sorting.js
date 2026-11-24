// S3 Sorting. Ref: V2 (0-14s): cascade from mesh chute onto a vibrating perforated deck, blue tray,
// grey guide rail, handheld oblique camera, deep DOF, flat daylight, gantry in the background.
// Motion is analytic (closed-form in t): cascade = ballistic arc; deck = slow conveyor drift + ~10 Hz
// micro-hop/rotation per cherry. It is a visual approximation of a vibrating screen, not a DEM simulation.
import * as THREE from 'three';
import { rng, cherryGeometry, cherryMaterial, pickCherryColor, lerp, smooth } from '../shared.js';
export const duration = 8;

export function build(ctx) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0xcfd2d0);
  scene.fog = new THREE.Fog(0xd8d8d2, 3, 9);
  const camera = new THREE.PerspectiveCamera(38, ctx.W / ctx.H, 0.02, 40);
  const r = rng(41);
  scene.environment = ctx.envs.studio; scene.environmentIntensity = 0.5;

  // soft daylight: big overhead window + warm bounce so reds stay rich (graded warmer than raw V2)
  scene.add(new THREE.HemisphereLight(0xf2f0ea, 0x8a7a68, 1.1));
  const sun = new THREE.DirectionalLight(0xfff0dc, 3.2); sun.position.set(1.5, 3.2, 1.8); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -2, right: 2, top: 1.2, bottom: -1.2, near: 0.5, far: 9 });
  sun.shadow.radius = 4; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.01;
  sun.target.position.set(1.2, 0, 0); scene.add(sun, sun.target);

  const L = 2.6, Wd = 0.9;                                    // deck length (x) and width (z)
  const hole = (() => { const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
    x.fillStyle = '#9aa0a4'; x.fillRect(0, 0, 256, 256); x.fillStyle = '#16181a';
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { x.beginPath(); x.arc(16 + i * 32 + (j % 2) * 16, 16 + j * 32, 7, 0, 6.3); x.fill(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(L * 8, Wd * 8); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; })();
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(L, Wd).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ map: hole, roughness: 0.5, metalness: 0.6 }));
  deck.position.set(L / 2, 0, 0); deck.receiveShadow = true; scene.add(deck);
  const blue = new THREE.MeshStandardMaterial({ color: 0x4f7fb4, roughness: 0.55, metalness: 0.25 });
  const wall = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), blue); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; scene.add(m); return m; };
  wall(L, 0.14, 0.04, L / 2, 0.07, -Wd / 2 - 0.02); wall(L, 0.14, 0.04, L / 2, 0.07, Wd / 2 + 0.02); wall(0.04, 0.14, Wd + 0.08, L + 0.02, 0.07, 0);
  // grey diagonal guide rail (V2's strong diagonal)
  const rail = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.07, 0.015), new THREE.MeshStandardMaterial({ color: 0xaeb4ba, roughness: 0.35, metalness: 0.7 }));
  rail.position.set(1.15, 0.035, 0.22); rail.rotation.y = -0.16; rail.castShadow = true; scene.add(rail);
  // mesh chute (upper-left) tilted toward the deck, emits the cascade at its lip
  const mesh = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d'); x.fillStyle = '#2a2c2e'; x.fillRect(0, 0, 128, 128);
    x.strokeStyle = '#8c9296'; x.lineWidth = 3; for (let i = 0; i < 128; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 128); x.moveTo(0, i); x.lineTo(128, i); x.stroke(); }
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 4); return t; })();
  const chute = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.02, 0.8), new THREE.MeshStandardMaterial({ map: mesh, roughness: 0.6, metalness: 0.5 }));
  chute.position.set(-0.12, 0.66, 0); chute.rotation.z = -0.5; chute.castShadow = true; scene.add(chute);

  // background: pale wall, bright windows (bokeh), steel gantry diagonals
  const wallM = new THREE.Mesh(new THREE.PlaneGeometry(14, 6), new THREE.MeshStandardMaterial({ color: 0xe4e0d6, roughness: 1 }));
  wallM.position.set(1.2, 1.8, -2.6); scene.add(wallM);
  const win = new THREE.MeshBasicMaterial({ color: 0xfff6e4, fog: false });
  for (let i = 0; i < 4; i++) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 1.1), win); w.position.set(-0.6 + i * 1.3, 2.0, -2.55); scene.add(w); }
  const steel = new THREE.MeshStandardMaterial({ color: 0x6f94c4, roughness: 0.5, metalness: 0.6 });
  for (let i = 0; i < 9; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.7, 0.05), steel); b.position.set(-0.4 + i * 0.5, 1.1, -1.8); b.rotation.z = (i % 2 ? 1 : -1) * 0.5; scene.add(b); }

  // cherries: conveyor population + dedicated cascade population
  const CH = cherryGeometry(9), cm = cherryMaterial();
  const SP = 0.024, lanes = Math.floor(Wd / SP) - 1, rows = Math.floor(L / SP);
  const nDeck = lanes * rows, nCas = 320, N = nDeck + nCas;
  const im = new THREE.InstancedMesh(CH, cm, N); im.castShadow = im.receiveShadow = true; scene.add(im);
  const col = new THREE.Color(), P = [];
  const G = 9.81, H0 = 0.62, tFall = Math.sqrt(2 * (H0 - 0.014) / G);
  const V = 0.11, T = L / V + tFall;                          // conveyor cycle (s)
  for (let i = 0; i < N; i++) {
    const cas = i >= nDeck, k = cas ? i - nDeck : i;
    const lane = cas ? r() : (k % lanes) / lanes, row = cas ? r() : Math.floor(k / lanes) / rows;
    P.push({ cas, lane: (lane - 0.5) * (Wd - 0.06) + (r() - 0.5) * SP * 0.95, u: row + (r() - 0.5) / rows * 0.95, layer: r(), s: 0.011 + r() * 0.005, ph: r() * 6.28, hop: 0.002 + r() * 0.0035, ax: [r() - 0.5, r() - 0.5, r() - 0.5], rv: 1 + r() * 2, vx: 0.12 + r() * 0.1, lz: (r() - 0.5) * 0.35 });
    im.setColorAt(i, pickCherryColor(r, col));
  }
  im.instanceColor.needsUpdate = true;
  const o = new THREE.Object3D(), q = new THREE.Quaternion(), ax = new THREE.Vector3();
  const FREQ = 10;                                           // deck shake Hz (visual estimate)

  const out = { scene, camera, focus: 1.6, aperture: 0.00025, maxblur: 0.01, warm: 0.95 };
  out.update = (t) => {
    const shake = Math.sin(t * FREQ * 6.283);
    for (let i = 0; i < N; i++) {
      const c = P[i]; let x, y, z = c.lane, vis = 1;
      if (c.cas) {                                            // cascade: ballistic arc from the chute lip, then sits in the pile
        const tau = (t * 1.0 + c.u) % 1 * 1.0;
        if (tau < tFall * 1.25) { const f = Math.min(tau, tFall); x = -0.18 + c.vx * f + 0.18; y = H0 - 0.5 * G * f * f; z = c.lane * 0.55 + c.lz * 0.2 * (1 - f / tFall); if (tau > tFall) y = 0.014; }
        else { x = 0.13 + c.vx * tFall + (tau - tFall) * V; y = 0.014 + c.s * 0.9 + Math.max(0, Math.sin(t * FREQ * 6.283 + c.ph)) * c.hop; z = c.lane * 0.55; }
      } else {
        const ph = ((t / T + c.u) % 1) * T;
        if (ph < tFall) { const f = ph; x = 0.02 + c.vx * f * 0.6; y = H0 - 0.5 * G * f * f; z = c.lane * 0.75; }
        else { const s = (ph - tFall) * V; x = 0.12 + s; y = c.s * 0.9 + c.layer * c.s * 0.9 + Math.max(0, Math.sin(t * FREQ * 6.283 + c.ph)) * c.hop; z = c.lane + Math.sin(t * 4 + c.ph) * 0.0015; }
        if (x > L - 0.03) vis = 0;
      }
      o.position.set(x, y, z);
      ax.set(...c.ax).normalize(); q.setFromAxisAngle(ax, c.ph + t * c.rv * (c.cas ? 6 : 0.4) + shake * 0.05); o.quaternion.copy(q);
      o.scale.setScalar(c.s * vis); o.updateMatrix(); im.setMatrixAt(i, o.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
    // camera: handheld oblique. Start on the cascade, drift along the deck, end revealing the gantry (V2 timeline)
    const k = t / duration, e = smooth(k);
    const rv = smooth(Math.max(0, (k - 0.7) / 0.3));            // last 30%: tilt up to reveal gantry/windows (V2 9-14s)
    camera.position.set(lerp(0.55, 1.45, e) + Math.sin(t * 1.9) * 0.006, lerp(0.55, 0.72, e) + Math.sin(t * 2.7 + 1) * 0.005, lerp(1.15, 1.25, e));
    camera.lookAt(lerp(0.0, 1.3, e), lerp(0.3, 0.12, e) + rv * 0.3, lerp(0.0, -0.1, e));
    out.focus = lerp(1.2, 1.7, e) + rv * 1.2; out.aperture = 0.0004;
  };
  return out;
}
