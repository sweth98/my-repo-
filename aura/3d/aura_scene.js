// AURA 3D concept model (Three.js r181 globals: THREE, OrbitControls, canvas, width, height).
// Units: 1 = 1 cm. Body 36 x 2.4 x 24 cm. Click canvas: rotate -> exploded -> phone+laptop ghosts.
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 500);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(width, height);
renderer.setClearColor(0x14161a, 1);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
camera.position.set(34, 30, 48);
scene.add(new THREE.AmbientLight(0xffffff, 0.55));
const key = new THREE.DirectionalLight(0xffffff, 1.0); key.position.set(30, 50, 30); scene.add(key);
const rim = new THREE.DirectionalLight(0x6aa8ff, 0.5); rim.position.set(-40, 20, -30); scene.add(rim);

const W = 36, D = 24;
const group = new THREE.Group(); scene.add(group);
const alu = new THREE.MeshStandardMaterial({ color: 0x8d9097, metalness: 0.9, roughness: 0.35 });
const glassM = new THREE.MeshPhysicalMaterial({ color: 0x0b0d10, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.03, transparent: true, opacity: 0.93 });
const pcbM = new THREE.MeshStandardMaterial({ color: 0x1d6b3a, roughness: 0.6 });
const ferriteM = new THREE.MeshStandardMaterial({ color: 0x2b2b2e, roughness: 0.8 });
const copperM = new THREE.MeshStandardMaterial({ color: 0xc87533, metalness: 0.9, roughness: 0.3 });
const layers = {};
function add(name, mesh, y) { mesh.position.y = y; group.add(mesh); layers[name] = { mesh, base: y }; return mesh; }

const z2c = new THREE.Vector3(6, 0, 0), z1c = new THREE.Vector3(-12.5, 0, 0);   // zone centres (cm)

// 1 base + walls + feet + rear vents
const base = new THREE.Group();
base.add(new THREE.Mesh(new THREE.BoxGeometry(W, 0.3, D), alu));
const wallT = 0.4;
[D / 2 - wallT / 2, -D / 2 + wallT / 2].forEach(z => { const m = new THREE.Mesh(new THREE.BoxGeometry(W, 2.0, wallT), alu); m.position.set(0, 1.0, z); base.add(m); });
[-W / 2 + wallT / 2, W / 2 - wallT / 2].forEach(x => { const m = new THREE.Mesh(new THREE.BoxGeometry(wallT, 2.0, D), alu); m.position.set(x, 1.0, 0); base.add(m); });
[[-15, -9], [15, -9], [-15, 9], [15, 9]].forEach(p => { const f = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 0.3, 24), new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 })); f.position.set(p[0], -0.3, p[1]); base.add(f); });
for (let i = 0; i < 14; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.0, 0.1), new THREE.MeshBasicMaterial({ color: 0x050505 })); s.position.set(-8 + i * 1.3, 1.0, -D / 2 - 0.02); base.add(s); }
add('base', base, 0);

// 2 main PCB (lower layer, under the coils)
const pcb = new THREE.Group();
pcb.add(new THREE.Mesh(new THREE.BoxGeometry(14, 0.16, 8), pcbM));
for (let i = 0; i < 7; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.5, 1.0), new THREE.MeshStandardMaterial({ color: 0x222831, roughness: 0.5 })); c.position.set(-5 + i * 1.7, 0.33, (i % 2 ? 1.5 : -1.5)); pcb.add(c); }
const mcu = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.2, 2.4), new THREE.MeshStandardMaterial({ color: 0xbbbbbb, metalness: 0.8, roughness: 0.3 })); mcu.position.set(5, 0.2, 0); pcb.add(mcu);
pcb.position.x = 7; pcb.position.z = -7;
add('pcb', pcb, 0.55);

// 3 spreader + load cells
const spreader = new THREE.Group();
spreader.add(new THREE.Mesh(new THREE.BoxGeometry(W - 2, 0.3, D - 2), new THREE.MeshStandardMaterial({ color: 0xa5a8ae, metalness: 0.8, roughness: 0.45 })));
[[-15, -9], [15, -9], [-15, 9], [15, 9]].forEach(p => { const lc = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.35, 0.6), new THREE.MeshStandardMaterial({ color: 0xb8b8b8, metalness: 0.7, roughness: 0.4 })); lc.position.set(p[0], 0.3, p[1]); spreader.add(lc); });
add('spreader', spreader, 0.95);

// 4 coils: Z2 spiral + ferrite (dia 17 cm coil, 18.4 cm ferrite), Z1 puck + magnet ring
const coils = new THREE.Group();
const ferrite = new THREE.Mesh(new THREE.CylinderGeometry(9.2, 9.2, 0.25, 64), ferriteM); ferrite.position.copy(z2c); coils.add(ferrite);
const pts = []; for (let t = 0; t < 14 * Math.PI * 2; t += 0.1) { const r = 3 + (t / (14 * Math.PI * 2)) * 5.4; pts.push(new THREE.Vector3(Math.cos(t) * r, 0.25, Math.sin(t) * r)); }
const spiral = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 900, 0.07, 6, false), copperM); spiral.position.add(z2c); coils.add(spiral);
const f1 = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.4, 0.2, 48), ferriteM); f1.position.copy(z1c); coils.add(f1);
const pts1 = []; for (let t = 0; t < 9 * Math.PI * 2; t += 0.12) { const r = 1.1 + (t / (9 * Math.PI * 2)) * 1.9; pts1.push(new THREE.Vector3(Math.cos(t) * r, 0.2, Math.sin(t) * r)); }
const sp1 = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts1), 400, 0.06, 6, false), copperM); sp1.position.add(z1c); coils.add(sp1);
for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; const mg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.25, 0.3), new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 1, roughness: 0.3 })); mg.position.set(z1c.x + Math.cos(a) * 3.9, 0.2, Math.sin(a) * 3.9); mg.rotation.y = -a; coils.add(mg); }
add('coils', coils, 1.35);

// 5 sensor PCB: LDC metal-sense (amber) x4, Hall (cyan) x4, ToF (red) x2
const sens = new THREE.Group();
sens.add(new THREE.Mesh(new THREE.BoxGeometry(W - 3, 0.08, D - 3), new THREE.MeshStandardMaterial({ color: 0x103d22, transparent: true, opacity: 0.55, roughness: 0.6 })));
const mk = (c, g, x, z) => { const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.6 })); m.position.set(x, 0.15, z); sens.add(m); };
[[-4, -8.5], [16, -8.5], [-4, 8.5], [16, 8.5]].forEach(p => mk(0xffb347, new THREE.BoxGeometry(1.4, 0.1, 1.4), p[0], p[1]));
[[-3.5, 0], [3.5, 0], [0, -3.5], [0, 3.5]].forEach(p => mk(0x4dd2ff, new THREE.CylinderGeometry(0.25, 0.25, 0.12, 12), z1c.x + p[0], p[1]));
mk(0xff5a5a, new THREE.CylinderGeometry(0.35, 0.35, 0.15, 16), z1c.x, 9.5);
mk(0xff5a5a, new THREE.CylinderGeometry(0.35, 0.35, 0.15, 16), z2c.x, 10.2);
add('sensors', sens, 1.8);

// 6 LED light guide
const led = new THREE.Group();
const ledMat = new THREE.MeshBasicMaterial({ color: 0x4fa3ff });
const bar = new THREE.Mesh(new THREE.BoxGeometry(W - 6, 0.08, 0.12), ledMat); bar.position.set(0, 0, D / 2 - 0.25); led.add(bar);
const r1 = new THREE.Mesh(new THREE.RingGeometry(3.6, 3.75, 64), ledMat); r1.rotation.x = -Math.PI / 2; r1.position.set(z1c.x, 0.02, 0); led.add(r1);
const r2 = new THREE.Mesh(new THREE.RingGeometry(10.5, 10.62, 96), ledMat); r2.rotation.x = -Math.PI / 2; r2.position.set(z2c.x, 0.02, 0); led.add(r2);
add('led', led, 2.0);

// 7 glass top
add('glass', new THREE.Mesh(new THREE.BoxGeometry(W - 0.4, 0.4, D - 0.4), glassM), 2.25);

// device ghosts
const phone = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.8, 15), new THREE.MeshStandardMaterial({ color: 0x2d3a55, metalness: 0.5, roughness: 0.3, transparent: true, opacity: 0 }));
phone.position.set(z1c.x, 3.0, 0); group.add(phone);
const lap = new THREE.Mesh(new THREE.BoxGeometry(22, 0.6, 19), new THREE.MeshStandardMaterial({ color: 0x555a63, metalness: 0.9, roughness: 0.35, transparent: true, opacity: 0 }));
lap.position.set(z2c.x, 3.0, 0); group.add(lap);

const floor = new THREE.Mesh(new THREE.CircleGeometry(60, 64), new THREE.MeshBasicMaterial({ color: 0x1b1e24 }));
floor.rotation.x = -Math.PI / 2; floor.position.y = -0.62; scene.add(floor);
const grid = new THREE.GridHelper(120, 24, 0x2a2e36, 0x22262d); grid.position.y = -0.6; scene.add(grid);

let target = 0, explode = 0, mode = 0;
canvas.addEventListener('click', () => { mode = (mode + 1) % 3; target = mode === 1 ? 1 : 0; });
const order = ['base', 'pcb', 'spreader', 'coils', 'sensors', 'led', 'glass'];
const t0 = performance.now();
function animate() {
  requestAnimationFrame(animate);
  const t = (performance.now() - t0) / 1000;
  explode += (target - explode) * 0.06;
  order.forEach((n, i) => { layers[n].mesh.position.y = layers[n].base + explode * i * 3.2; });
  phone.material.opacity = mode === 2 ? 0.85 : 0; lap.material.opacity = mode === 2 ? 0.8 : 0;
  phone.position.y = 2.9 + Math.sin(t * 2) * 0.05; lap.position.y = 2.9;
  const p = 0.55 + 0.45 * Math.sin(t * 2.2);
  ledMat.color.setRGB(0.25 * p + 0.1, 0.55 * p + 0.15, 1.0 * p);
  if (mode === 0) group.rotation.y += 0.002;
  controls.update();
  renderer.render(scene, camera);
}
animate();
