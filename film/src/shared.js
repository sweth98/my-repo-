// Shared look-dev: asset factories, materials, grade. Every scene uses these
// so cherries, beans and colour grading stay consistent (continuity rule).
import * as THREE from 'three';

export function rng(seed) { // deterministic, so seeks/screenshots are repeatable
  let s = seed >>> 0 || 1;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

export const PALETTE = {
  ripe: [0.62, 0.03, 0.07], deep: [0.30, 0.02, 0.06],
  orange: [0.85, 0.30, 0.06], yellow: [0.80, 0.62, 0.10], dry: [0.10, 0.045, 0.04],
};

// ---- Cherry: slightly oblate sphere, crown dimple at +Y, stem scar, lumpy skin
export function cherryGeometry(seed = 1) {
  const r = rng(seed);
  const g = new THREE.SphereGeometry(1, 40, 28);
  const p = g.attributes.position, v = new THREE.Vector3();
  const ph = [r() * 6, r() * 6, r() * 6];
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = v.clone().normalize();
    let k = 1 + 0.014 * Math.sin(n.x * 5 + ph[0]) * Math.cos(n.z * 4 + ph[1]) + 0.008 * Math.sin(n.y * 7 + ph[2]);
    v.multiplyScalar(k);
    v.x *= 0.88; v.z *= 0.9; v.y *= 1.0;            // organic, not a perfect sphere
    const bottom = Math.max(0, -n.y - 0.75) / 0.25;    // stem scar dimple
    v.y += bottom * bottom * 0.05;
    const top = Math.max(0, n.y - 0.82) / 0.18;        // calyx crown ring + dimple
    v.y -= top * top * 0.035;
    
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

export function cherryMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff, roughness: 0.38, metalness: 0, clearcoat: 0.55, clearcoatRoughness: 0.25,
    sheen: 0.2, sheenColor: new THREE.Color(0x802030), vertexColors: false,
  });
}
// ripeness mix used by every scene
export function pickCherryColor(r, c = new THREE.Color()) {
  const x = r();
  const k = x < 0.55 ? 'ripe' : x < 0.72 ? 'deep' : x < 0.85 ? 'orange' : x < 0.93 ? 'dry' : 'yellow';
  const b = PALETTE[k];
  const j = 0.85 + r() * 0.3;
  return c.setRGB(b[0] * j, b[1] * j, b[2] * j);
}

// ---- Bean: ellipsoid with centre-cut crease along long axis
export function beanGeometry(seed = 1) {
  const r = rng(seed);
  const g = new THREE.SphereGeometry(1, 36, 24), p = g.attributes.position, v = new THREE.Vector3();
  const ph = r() * 6;
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    v.set(v.x * 1.0, v.y * 0.50, v.z * 0.68);
    const t = v.x;                                   // -1..1 along the length
    const taper = 1 - 0.18 * t * t;
    v.y *= taper; v.z *= taper;
    if (v.y > 0) {                                   // flat face with wavy crease
      const cz = Math.sin(t * 3.2 + ph) * 0.06;
      const w = Math.exp(-Math.pow((v.z - cz) / 0.075, 2));
      v.y -= w * 0.16 * (1 - Math.abs(t) * 0.7) * (v.y / 0.5);
      v.y *= 0.82;
    }
    v.x += Math.sin(v.z * 4 + ph) * 0.015;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}
export function beanMaterial(level = 0.7) { // 0 green .. 1 dark roast
  const c = new THREE.Color().lerpColors(new THREE.Color(0x9aa075), new THREE.Color(0x2b160c), level);
  return new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.45 - level * 0.1, clearcoat: 0.25 * level, clearcoatRoughness: 0.5 });
}

// ---- Procedural linen: woven canvas for colour + bump
export function linenTextures(size = 1024) {
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const x = cv.getContext('2d'), r = rng(7);
  x.fillStyle = '#d9cdb4'; x.fillRect(0, 0, size, size);
  for (let i = 0; i < size; i += 3) {               // warp / weft threads with irregular thickness
    x.fillStyle = `rgba(${90 + r() * 40},${80 + r() * 40},${60 + r() * 30},${0.12 + r() * 0.12})`;
    x.fillRect(i, 0, 1 + r() * 2, size);
    x.fillStyle = `rgba(255,250,235,${0.08 + r() * 0.12})`;
    x.fillRect(0, i + r() * 2, size, 1 + r() * 2);
  }
  for (let i = 0; i < 400; i++) {                    // slubs
    x.fillStyle = `rgba(120,100,70,${r() * 0.12})`;
    x.fillRect(r() * size, r() * size, 20 + r() * 80, 1 + r() * 2);
  }
  const map = new THREE.CanvasTexture(cv); map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping; map.anisotropy = 8;
  const bump = new THREE.CanvasTexture(cv); bump.wrapS = bump.wrapT = THREE.RepeatWrapping;
  return { map, bump };
}

// ---- Leaf (waxy, veined) ----
export function leafGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.bezierCurveTo(0.35, 0.25, 0.4, 0.9, 0, 1.6); s.bezierCurveTo(-0.4, 0.9, -0.35, 0.25, 0, 0);
  const g = new THREE.ShapeGeometry(s, 12), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {              // fold along midrib + droop
    const x = p.getX(i), y = p.getY(i);
    p.setZ(i, Math.abs(x) * 0.35 - y * y * 0.12);
  }
  g.computeVertexNormals(); return g;
}
export function leafMaterial() {
  return new THREE.MeshPhysicalMaterial({ color: 0x1f4a1c, roughness: 0.35, clearcoat: 0.5, clearcoatRoughness: 0.3, side: THREE.DoubleSide, emissive: 0x2c4a0c, emissiveIntensity: 1.5, transmission: 0, sheen: 0.4, sheenColor: new THREE.Color(0xb0d040) });
}

// ---- Grade + vignette + grain (the single "colour identity" pass) ----
export const GradeShader = {
  uniforms: { tDiffuse: { value: null }, time: { value: 0 }, warm: { value: 1.0 }, vig: { value: 0.35 }, contrast: { value: 1.08 }, sat: { value: 1.08 }, grain: { value: 0.035 }, fade: { value: 0 } },
  vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader: `uniform sampler2D tDiffuse;uniform float time,warm,vig,contrast,sat,grain,fade;varying vec2 vUv;
  float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233))+time)*43758.5453);}
  void main(){vec3 c=texture2D(tDiffuse,vUv).rgb;
   float l=dot(c,vec3(.2126,.7152,.0722));
   // split-tone: warm highlights, teal-ish cool shadows kept subtle so reds stay rich
   c=mix(c,c*vec3(1.06,1.0,.90),warm*smoothstep(.3,1.,l));
   c=mix(c,c*vec3(.94,.99,1.04),warm*(1.-smoothstep(0.,.25,l))*.6);
   c=mix(vec3(l),c,sat); c=(c-.5)*contrast+.5;
   float d=distance(vUv,vec2(.5));c*=1.-vig*smoothstep(.35,.85,d);
   c+=(h(vUv*vec2(720.,1280.))-.5)*grain;
   c*=1.-fade; gl_FragColor=vec4(max(c,0.),1.);}`,
};

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const smooth = (t) => t * t * (3 - 2 * t);
