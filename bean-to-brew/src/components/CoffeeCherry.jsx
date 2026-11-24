import React from 'react';
import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { createCherryMaterial } from '../shaders/coffeeCherryShader';
import { patchMaterial } from '../shaders/chunks';
import { createGreenBean } from './GreenCoffeeBean';
import { noise3, smoothstep, clamp } from '../animation/util';
import { useAsset } from './useAsset';

/** Cherry skin geometry (radius ≈ 1) with stem dimple, crown ring and organic irregularity. */
export function buildCherryGeometry(seed = 1) {
  let g = new THREE.SphereGeometry(1, 48, 36);
  g.deleteAttribute('uv'); g.deleteAttribute('normal');
  g = mergeVertices(g, 1e-4);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    let { x, y, z } = v;
    const r2 = x * x + z * z;
    if (y > 0) y -= 0.16 * Math.exp(-r2 / 0.07) * y;                    // stem dimple
    if (y < 0) y += 0.1 * Math.exp(-Math.pow(Math.sqrt(r2) - 0.22, 2) / 0.012) * y * -0.6; // crown ring
    if (y < 0) y *= 1 - 0.07 * Math.exp(-r2 / 0.05);
    const n = noise3(x * 1.7 + seed * 5.3, y * 1.7, z * 1.7 + seed) - 0.5;
    const k = 1 + n * 0.085;
    p.setXYZ(i, x * 0.96 * k, y * 1.04 * k, z * 0.94 * k);
  }
  g.computeVertexNormals();
  return g;
}

/** Split a smooth indexed geometry along x=0 into two shells that share normals (seamless when closed). */
function splitHalves(g) {
  const idx = g.index.array, pos = g.attributes.position;
  const a = [], b = [];
  for (let i = 0; i < idx.length; i += 3) {
    const cx = (pos.getX(idx[i]) + pos.getX(idx[i + 1]) + pos.getX(idx[i + 2])) / 3;
    (cx >= 0 ? a : b).push(idx[i], idx[i + 1], idx[i + 2]);
  }
  const mk = (arr) => { const h = g.clone(); h.setIndex(arr); return h; };
  return [mk(a), mk(b)];
}

function pulpMaterial() {
  const m = new THREE.MeshPhysicalMaterial({ color: 0xd9967c, roughness: 0.35, clearcoat: 0.9, clearcoatRoughness: 0.15, sheen: 0.6, sheenColor: new THREE.Color(0xffd7b8) });
  return patchMaterial(m, {
    key: 'pulp', srgb: true,
    uniforms: { uPeel: { value: 0 } },
    fragColor: `
      float dn = fbm3(vObj*3.4 + 5.) ;
      if (dn < uPeel*1.15 - .08) discard;
      float edge = smoothstep(.0,.07, dn - (uPeel*1.15 - .08));
      diffuseColor.rgb = mix(vec3(.88,.55,.45), vec3(.96,.78,.62), fbm3(vObj*9.));
      diffuseColor.rgb = mix(vec3(.55,.16,.1), diffuseColor.rgb, edge);`,
    fragNormal: `{ float hb = fbm3(vObj*18.); normal = perturbH(-vViewPosition, normal, vec2(dFdx(hb), dFdy(hb))*.01, faceDirection); }`,
  });
}
function parchmentMaterial() {
  const m = new THREE.MeshPhysicalMaterial({ color: 0xd8c8a0, roughness: 0.55, clearcoat: 0.5, clearcoatRoughness: 0.3 });
  return patchMaterial(m, {
    key: 'parch', srgb: true,
    uniforms: { uPeel: { value: 0 } },
    fragColor: `
      float dn = fbm3(vObj*4.1 + 9.);
      if (dn < uPeel*1.15 - .08) discard;
      diffuseColor.rgb = mix(vec3(.86,.78,.55), vec3(.93,.87,.68), fbm3(vObj*12.));`,
  });
}

/**
 * Cherry. `splittable` builds two skin halves around a pulp core containing a parchment-wrapped bean pair,
 * so the same object can ripen, hang, fall, open (skin halves slide apart) and peel back to the beans.
 */
export function createCherry({ ripe = 1, seed = 1, splittable = false, stem = true } = {}) {
  const res = [];
  const object = new THREE.Group();
  const geo = buildCherryGeometry(seed); res.push(geo);
  const skin = createCherryMaterial({ ripe }); skin.userData.uniforms.uSeed.value = seed; res.push(skin);
  const api = { object, skin, setRipe: (r) => skin.userData.setRipe(r) };

  const dark = new THREE.MeshStandardMaterial({ color: 0x2a1708, roughness: 0.8 }); res.push(dark);
  const crown = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.045, 8, 20), dark);
  crown.rotation.x = Math.PI / 2; crown.position.y = -1.02; res.push(crown.geometry);
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x5a6a2c, roughness: 0.6 }); res.push(stemMat);
  let stemMesh = null;
  if (stem) {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.85, 0), new THREE.Vector3(0.05, 1.4, 0.0), new THREE.Vector3(0.0, 2.1, 0.0)]);
    const sg = new THREE.TubeGeometry(curve, 10, 0.075, 8, false); res.push(sg);
    stemMesh = new THREE.Mesh(sg, stemMat); stemMesh.castShadow = true;
    object.add(stemMesh);
  }

  if (!splittable) {
    const mesh = new THREE.Mesh(geo, skin); mesh.castShadow = true; mesh.receiveShadow = true;
    object.add(mesh, crown);
    api.update = ({ ripe: r, scale } = {}) => { if (r !== undefined) skin.userData.setRipe(r); if (scale !== undefined) object.scale.setScalar(scale); };
  } else {
    const [ga, gb] = splitHalves(geo); res.push(ga, gb);
    const inner = new THREE.MeshStandardMaterial({ color: 0xe8b79d, roughness: 0.4, side: THREE.BackSide }); res.push(inner);
    const mk = (g, sign) => {
      const grp = new THREE.Group();
      const m = new THREE.Mesh(g, skin); m.castShadow = true;
      const im = new THREE.Mesh(g, inner); im.scale.setScalar(0.975);
      grp.add(m, im);
      return grp;
    };
    const halfA = mk(ga, 1), halfB = mk(gb, -1);
    if (stemMesh) halfA.add(stemMesh);
    halfB.add(crown);
    const core = new THREE.Group();
    const pulp = pulpMaterial(); res.push(pulp);
    const pulpMesh = new THREE.Mesh(geo, pulp); pulpMesh.scale.setScalar(0.9); pulpMesh.castShadow = true;
    const parch = parchmentMaterial(); res.push(parch);
    // two beans in parchment, flat faces together
    const beans = [];
    const pair = new THREE.Group();
    for (let s = -1; s <= 1; s += 2) {
      const b = createGreenBean({ seed: 7 + s, wet: 1, res: 'hi' }); res.push(b);
      b.object.scale.setScalar(0.78);
      b.object.rotation.set(0, -s * Math.PI / 2, Math.PI / 2); // length along y, flat faces toward each other
      b.object.position.x = s * 0.2;
      const sh = new THREE.Mesh(b.mesh.geometry, parch); sh.scale.setScalar(1.045);
      b.object.add(sh);
      pair.add(b.object); beans.push(b);
    }
    core.add(pulpMesh, pair);
    object.add(halfA, halfB, core);
    api.halfA = halfA; api.halfB = halfB; api.core = core; api.beans = beans; api.pair = pair;
    api.pulp = pulp; api.parch = parch; api.pulpMesh = pulpMesh;
    api.update = ({ ripe: r, scale, open = 0, peel = 0, parchPeel = 0, split = 0 } = {}) => {
      if (r !== undefined) skin.userData.setRipe(r);
      if (scale !== undefined) object.scale.setScalar(scale);
      halfA.position.x = open * 1.6; halfB.position.x = -open * 1.6;
      halfA.rotation.z = -open * 0.35; halfB.rotation.z = open * 0.35;
      halfA.position.y = halfB.position.y = open * 0.0;
      pulp.userData.uniforms.uPeel.value = peel;
      parch.userData.uniforms.uPeel.value = parchPeel;
      pulpMesh.visible = peel < 0.999;
      beans.forEach((b, i) => { b.object.position.x = (i ? 1 : -1) * (0.2 + split * 0.55); b.update({ wet: 1 - split * 0.4 }); });
      crown.visible = open < 0.01 || true;
    };
  }
  api.dispose = () => res.forEach((x) => x.dispose && x.dispose());
  api.update({ ripe });
  return api;
}

export default function CoffeeCherry({ apiRef, ...props }) {
  const a = useAsset(createCherry);
  if (apiRef) apiRef.current = a;
  return <primitive object={a.object} {...props} />;
}
