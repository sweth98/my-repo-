// S1 Plantation. Ref: V1 0-2s (backlit branch, golden-hour bokeh) + V1 6-8s (wet macro cherry).
// Light: low warm sun from behind-left (rim light), soft sky fill. Handheld-style micro drift.
import * as THREE from 'three';
import { rng, cherryGeometry, cherryMaterial, pickCherryColor, leafGeometry, leafMaterial, lerp, smooth, clamp } from '../shared.js';
export const duration = 8;

export function build(ctx) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xc89040);
  scene.fog = new THREE.Fog(0xe0aa58, 9, 30);
  const camera = new THREE.PerspectiveCamera(32, ctx.W / ctx.H, 0.05, 60);
  const r = rng(11);

  // lights: golden backlight + warm bounce
  scene.add(new THREE.HemisphereLight(0xffe2b0, 0x4a5a22, 1.8));
  const sun = new THREE.DirectionalLight(0xffb866, 6.5);
  sun.position.set(-4, 3.2, -6); sun.target.position.set(0, 0, 0);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 20 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);
  const key = new THREE.DirectionalLight(0xffd9a0, 2.6); key.position.set(3, 1.5, 5); scene.add(key);

  // sun glow disc + distant orchard bokeh sources
  const glow = new THREE.Mesh(new THREE.CircleGeometry(2.4, 48), new THREE.MeshBasicMaterial({ color: 0xffd08a, fog: false }));
  glow.position.set(-4.5, 3.8, -16); scene.add(glow);
  const bk = new THREE.MeshBasicMaterial({ color: 0xffc070, fog: false });
  for (let i = 0; i < 70; i++) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.05 + r() * 0.12, 12), bk);
    m.position.set(-6 + r() * 12, -2 + r() * 6, -10 - r() * 5); m.material = bk; scene.add(m);
  }
  const gc = document.createElement('canvas'); gc.width = 4; gc.height = 256; const gx = gc.getContext('2d');
  const gr = gx.createLinearGradient(0, 0, 0, 256);
  [[0, '#ffe2a8'], [0.35, '#e8b45c'], [0.55, '#9c8a3a'], [0.75, '#4a5a1c'], [1, '#2a3a10']].forEach(([a, c]) => gr.addColorStop(a, c));
  gx.fillStyle = gr; gx.fillRect(0, 0, 4, 256);
  const gt = new THREE.CanvasTexture(gc); gt.colorSpace = THREE.SRGBColorSpace;
  const back = new THREE.Mesh(new THREE.PlaneGeometry(70, 50), new THREE.MeshBasicMaterial({ map: gt, fog: false }));
  back.position.set(0, 2, -20); scene.add(back);

  // branch: curved stem along X, leaves in pairs, cherry clusters at nodes
  const branch = new THREE.Group(); scene.add(branch);
  const curve = new THREE.CatmullRomCurve3([[-2.4, -0.5, 0], [-1, -0.1, 0.1], [0.4, 0.2, -0.05], [1.6, 0.05, 0.1], [2.6, -0.3, 0]].map((a) => new THREE.Vector3(...a)));
  branch.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.035, 8), new THREE.MeshStandardMaterial({ color: 0x4a3420, roughness: 0.85 })));
  const lg = leafGeometry(), lm = leafMaterial();
  const cg = cherryGeometry(3), cm = cherryMaterial();
  const leaves = [], clusters = [];
  const N = 11;
  for (let i = 0; i < N; i++) {
    const u = (i + 0.5) / N, p = curve.getPoint(u), tan = curve.getTangent(u);
    for (const side of [-1, 1]) {
      const L = new THREE.Mesh(lg, lm); L.castShadow = L.receiveShadow = true;
      const s = 0.55 + r() * 0.35;
      L.scale.setScalar(s); L.position.copy(p);
      L.rotation.set(-Math.PI / 2 + (r() - 0.5) * 0.6, side * (0.6 + r() * 0.5) + (r() - 0.5) * 0.4, 0, 'YXZ');
      L.userData = { base: L.rotation.clone(), ph: r() * 6, amp: 0.02 + r() * 0.03 };
      branch.add(L); leaves.push(L);
    }
    // cluster of 3-6 cherries on short stalks hanging below the node
    const n = 6 + Math.floor(r() * 5), cl = new THREE.Group(); cl.position.copy(p);
    cl.userData = { ph: r() * 6 };
    for (let k = 0; k < n; k++) {
      const ch = new THREE.Mesh(cg, new THREE.MeshPhysicalMaterial({ ...cm, color: pickCherryColor(r) }));
      ch.material = cm.clone(); ch.material.color = pickCherryColor(r);
      const sc = 0.048 + r() * 0.016; ch.scale.set(sc, sc, sc);
      ch.position.set((r() - 0.5) * 0.2, -0.07 - r() * 0.2, (r() - 0.5) * 0.18);
      ch.rotation.set((r() - 0.5) * 0.8, r() * 6, (r() - 0.5) * 0.8);
      ch.castShadow = ch.receiveShadow = true; cl.add(ch);
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.1, 5), new THREE.MeshStandardMaterial({ color: 0x5a4a22 }));
      st.position.set(ch.position.x * 0.5, ch.position.y + 0.07, ch.position.z * 0.5); cl.add(st);
    }
    branch.add(cl); clusters.push(cl);
  }
  // water droplets on cherries (tiny clearcoat spheres): the macro "wet" read
  const dg = new THREE.SphereGeometry(1, 12, 8), dm = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0, transmission: 1, thickness: 0.4, ior: 1.33, transparent: true });
  clusters.forEach((cl) => cl.children.filter((c) => c.geometry === cg).forEach((ch) => {
    for (let d = 0; d < 3; d++) {
      const m = new THREE.Mesh(dg, dm), a = r() * 6.28, b = 0.2 + r() * 1.0;
      m.scale.set(0.004 + r() * 0.004, 0.005 + r() * 0.006, 0.004 + r() * 0.004);
      m.position.copy(ch.position).add(new THREE.Vector3(Math.cos(a) * Math.sin(b), Math.cos(b), Math.sin(a) * Math.sin(b)).multiplyScalar(ch.scale.x * 0.98));
      cl.add(m);
    }
  }));

  const out = { scene, camera, focus: 3, aperture: 0.0008, maxblur: 0.014, warm: 1.1 };
  out.update = (t) => {
    const k = t / duration, e = smooth(k);
    // slow dolly-in (4.8 -> 3.0 m) + gentle arc + handheld micro drift (two incommensurate sines)
    const dist = lerp(5.2, 2.9, e);
    camera.position.set(lerp(-0.9, 0.5, e) + Math.sin(t * 1.3) * 0.006, lerp(-0.1, -0.1, e) + Math.sin(t * 0.9 + 1) * 0.005, dist);
    camera.lookAt(lerp(-0.4, 0.3, e), lerp(-0.2, -0.22, e), 0);
    // rack focus: starts on far leaves, settles on the cluster nearest the lens axis
    out.focus = lerp(dist + 0.4, dist - 0.1, smooth(clamp(k * 1.6)));
    // wind: leaves flutter, clusters sway as weighted pendulums
    leaves.forEach((L) => { const u = L.userData; L.rotation.x = u.base.x + Math.sin(t * 1.7 + u.ph) * u.amp; L.rotation.z = Math.sin(t * 1.3 + u.ph) * u.amp; });
    clusters.forEach((c) => { c.rotation.z = Math.sin(t * 1.1 + c.userData.ph) * 0.04; c.rotation.x = Math.sin(t * 0.8 + c.userData.ph * 1.7) * 0.03; });
  };
  return out;
}
