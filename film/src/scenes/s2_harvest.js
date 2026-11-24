// S2 Harvest. Ref: V1 2-8s (cherries spilled on linen, diagonal window shadows) and V2 for pile behaviour.
// Physics: lightweight sphere solver (gravity, restitution, friction, pair collisions). Visual quality, not a certified sim.
import * as THREE from 'three';
import { rng, cherryGeometry, cherryMaterial, pickCherryColor, linenTextures, lerp, smooth, clamp } from '../shared.js';
export const duration = 6;

export function build(ctx) {
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0xd8c6a2);
  const camera = new THREE.PerspectiveCamera(28, ctx.W / ctx.H, 0.02, 30);
  const r = rng(23), tex = linenTextures();
  tex.map.repeat.set(3, 5); tex.bump.repeat.set(3, 5);

  // linen with soft folds (low-freq displacement)
  const pg = new THREE.PlaneGeometry(2.4, 4, 120, 200); pg.rotateX(-Math.PI / 2);
  const pp = pg.attributes.position;
  for (let i = 0; i < pp.count; i++) { const x = pp.getX(i), z = pp.getZ(i); pp.setY(i, 0.012 * Math.sin(x * 4 + z * 1.3) * Math.cos(z * 2.2 - x) + 0.006 * Math.sin(z * 9 + x * 2)); }
  pg.computeVertexNormals();
  const linen = new THREE.Mesh(pg, new THREE.MeshStandardMaterial({ map: tex.map, bumpMap: tex.bump, bumpScale: 1.6, roughness: 0.95 }));
  linen.receiveShadow = true; scene.add(linen);

  // window light: low warm sun through blinds -> diagonal stripe shadows
  const sun = new THREE.DirectionalLight(0xffcf94, 4.2); sun.position.set(-2.2, 2.2, 1.2); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -2, right: 2, top: 2, bottom: -2, near: 0.2, far: 8 });
  sun.shadow.radius = 5; sun.shadow.bias = -0.0003; scene.add(sun);
  for (let i = 0; i < 7; i++) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 3, 0.02), new THREE.MeshBasicMaterial()); b.position.set(-1.6 + i * 0.1, 1.7 + i * 0.02, 0.8 - i * 0.12); b.rotation.set(0, 0.5, 0.35); b.visible = true; b.castShadow = true; b.material.colorWrite = false; b.material.depthWrite = false; scene.add(b); }
  scene.add(new THREE.HemisphereLight(0xfff0d8, 0xb09870, 0.9));
  scene.environment = ctx.envs.studio; scene.environmentIntensity = 0.35;

  // cherries
  const N = 64, g = cherryGeometry(5), m = cherryMaterial();
  const mesh = new THREE.InstancedMesh(g, m, N); mesh.castShadow = mesh.receiveShadow = true; scene.add(mesh);
  const col = new THREE.Color(), S = [];
  for (let i = 0; i < N; i++) {
    const sc = 0.03 + r() * 0.008;
    S.push({ s: sc, p: new THREE.Vector3(), v: new THREE.Vector3(), q: new THREE.Quaternion().random(), w: new THREE.Vector3(), t0: 0.15 + i * 0.03, spawn: [(r() - 0.5) * 0.06, 0.22 + r() * 0.1, -0.1 + (r() - 0.5) * 0.06], vel: [(r() - 0.5) * 0.35, 0, 0.25 + r() * 0.35] });
    mesh.setColorAt(i, pickCherryColor(r, col));
  }
  mesh.instanceColor.needsUpdate = true;

  // fixed-step solver; deterministic; re-simulated from 0 on backward seek
  const DT = 1 / 120; let simT = 0;
  const reset = () => { simT = 0; S.forEach((c) => { c.p.set(0, -9, 0); c.v.set(0, 0, 0); c.alive = false; c.w.set(0, 0, 0); }); };
  const tmp = new THREE.Vector3(), dq = new THREE.Quaternion();
  function step() {
    simT += DT;
    for (const c of S) {
      if (!c.alive && simT >= c.t0) { c.alive = true; c.p.set(...c.spawn); c.v.set(...c.vel); c.w.set(r() * 6 - 3, r() * 6 - 3, r() * 6 - 3); }
      if (!c.alive) continue;
      c.v.y -= 9.81 * DT; c.p.addScaledVector(c.v, DT);
      const R = c.s * 0.95;
      if (c.p.y < R) { c.p.y = R; if (c.v.y < 0) c.v.y *= -0.28; c.v.x *= 0.97; c.v.z *= 0.97; // table: low bounce (soft cloth), strong rolling friction
        const roll = Math.hypot(c.v.x, c.v.z); if (roll < 0.04) { c.v.x *= 0.8; c.v.z *= 0.8; } c.w.multiplyScalar(0.96); }
      dq.setFromAxisAngle(tmp.copy(c.w).normalize().addScalar(1e-6).normalize(), c.w.length() * DT); c.q.premultiply(dq);
    }
    for (let i = 0; i < N; i++) { const a = S[i]; if (!a.alive) continue;
      for (let j = i + 1; j < N; j++) { const b = S[j]; if (!b.alive) continue;
        tmp.subVectors(b.p, a.p); const d = tmp.length(), min = (a.s + b.s) * 0.9;
        if (d < min && d > 1e-6) { tmp.multiplyScalar(1 / d); const pen = (min - d) * 0.5; a.p.addScaledVector(tmp, -pen); b.p.addScaledVector(tmp, pen);
          const rel = tmp.dot(b.v) - tmp.dot(a.v); if (rel < 0) { const imp = rel * 0.5 * 1.25; a.v.addScaledVector(tmp, imp); b.v.addScaledVector(tmp, -imp); } } } }
  }
  const dummy = new THREE.Object3D();
  function sync() { S.forEach((c, i) => { dummy.position.copy(c.p); dummy.quaternion.copy(c.q); dummy.scale.setScalar(c.s); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); }); mesh.instanceMatrix.needsUpdate = true; }
  reset();

  const out = { scene, camera, focus: 1.2, aperture: 0.0016, maxblur: 0.016, warm: 1.05 };
  out.update = (t) => {
    if (t < simT) reset();
    while (simT < t) step(); sync();
    const e = smooth(t / duration);
    camera.position.set(lerp(0.6, 0.35, e) + Math.sin(t * 1.1) * 0.003, lerp(1.25, 0.8, e), lerp(1.3, 0.85, e));
    camera.lookAt(0, 0, 0.06);
    out.focus = camera.position.distanceTo(new THREE.Vector3(0, 0.02, 0.08));
  };
  return out;
}
