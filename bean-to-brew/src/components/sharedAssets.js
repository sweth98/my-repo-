import * as THREE from 'three';

/**
 * Warm photo-studio environment baked once with PMREM (PBR reflections):
 * a dark brown room with soft elliptical light panels – gives metal and glaze real contrast.
 */
export function buildEnvironment(renderer) {
  const scene = new THREE.Scene();
  const pm = new THREE.PMREMGenerator(renderer);
  const room = new THREE.Mesh(new THREE.SphereGeometry(30, 32, 16), new THREE.MeshBasicMaterial({ color: new THREE.Color(0x2a1a10).multiplyScalar(0.9), side: THREE.BackSide }));
  scene.add(room);
  const panels = [];
  const mk = (c, i, w, h, pos) => {
    const g = new THREE.CircleGeometry(0.5, 48); g.scale(w, h, 1);
    const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(i), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); scene.add(m); panels.push(m);
  };
  mk(0xffd2a0, 7, 12, 8, [-14, 11, 12]);   // large warm key softbox (upper left, front)
  mk(0xffe9cf, 5, 20, 3, [0, 18, -4]);     // overhead strip
  mk(0xfff0dc, 3, 3, 16, [16, 3, 4]);      // tall right strip (clean vertical highlight on metal)
  mk(0xffb36b, 3, 8, 5, [6, 4, -16]);      // warm back kicker / rim
  mk(0xffc88f, 0.8, 22, 4, [0, -10, 8]);   // faint bounce from below
  const rt = pm.fromScene(scene, 0.035);
  pm.dispose();
  panels.forEach((m) => { m.geometry.dispose(); m.material.dispose(); });
  room.geometry.dispose(); room.material.dispose();
  return rt.texture;
}
