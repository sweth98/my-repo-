import React from 'react';
import * as THREE from 'three';
import { patchMaterial } from '../shaders/chunks';
import { createCremaMaterial } from '../shaders/cremaShader';
import { useAsset } from './useAsset';
import { liquidY } from '../animation/liquidAnimation';

// cup profile (r,y) — inner wall listed bottom→rim, used for the liquid radius
const INNER = [[0, 0.5], [1.2, 0.55], [2.2, 0.8], [2.9, 1.4], [3.4, 2.6], [3.72, 3.8], [3.85, 4.5]];
export function innerRadiusAt(y) {
  for (let i = 0; i < INNER.length - 1; i++) {
    const [r0, y0] = INNER[i], [r1, y1] = INNER[i + 1];
    if (y <= y1) return r0 + ((y - y0) / (y1 - y0)) * (r1 - r0);
  }
  return INNER[INNER.length - 1][0];
}
const spline2 = (pts, n = 6) => {
  const c = new THREE.SplineCurve(pts.map((p) => new THREE.Vector2(p[0], p[1])));
  return c.getPoints(pts.length * n);
};

export function ceramicMaterial(color = 0xeadcc4) {
  const m = new THREE.MeshPhysicalMaterial({ color, roughness: 0.2, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.06, sheen: 0.2, sheenColor: new THREE.Color(0xfff0d8) });
  return patchMaterial(m, {
    key: 'ceramic', srgb: false,
    fragColor: `
      float sp = step(.97, vnoise(vObj*120.)) * .8;
      float sp2 = step(.96, vnoise(vObj*210.+4.)) * .5;
      diffuseColor.rgb *= 1. - (sp+sp2)*.62*vec3(.45,.7,.9);
      diffuseColor.rgb *= .96 + .06*fbm3(vObj*3.);`,
    fragNormal: `{ float h = fbm3(vObj*9.)*.5; normal = perturbH(-vViewPosition, normal, vec2(dFdx(h), dFdy(h))*.0025, faceDirection); }`,
  });
}

/** Ceramic cup + saucer + espresso/crema surface. Origin = bottom of saucer. */
export function createCup() {
  const res = []; const object = new THREE.Group();
  const cer = ceramicMaterial(); res.push(cer);
  // cup body via lathe (outer wall up, rim, inner wall down)
  const outer = [[1.9, 0.0], [2.15, 0.05], [2.2, 0.28], [2.7, 0.62], [3.3, 1.5], [3.8, 2.7], [4.08, 3.8], [4.17, 4.5], [4.12, 4.64], [4.0, 4.72], [3.9, 4.64]];
  const body = spline2([...outer, [3.85, 4.5]].slice(0, outer.length + 1), 5);
  const inner = spline2(INNER.slice().reverse().map((p) => [p[0], p[1]]), 5);
  const prof = [...body, ...inner].filter((p, i, a) => i === 0 || p.distanceTo(a[i - 1]) > 1e-4);
  const cupG = new THREE.LatheGeometry(prof.map((p) => new THREE.Vector2(Math.max(0, p.x), p.y)), 96); res.push(cupG);
  const cup = new THREE.Mesh(cupG, cer); cup.position.y = 0.28; cup.castShadow = true; cup.receiveShadow = true;
  // handle
  const hc = new THREE.CatmullRomCurve3([new THREE.Vector3(3.95, 3.7, 0), new THREE.Vector3(5.1, 3.95, 0), new THREE.Vector3(5.85, 2.9, 0), new THREE.Vector3(5.2, 1.6, 0), new THREE.Vector3(3.4, 1.3, 0)]);
  const hg = new THREE.TubeGeometry(hc, 40, 0.26, 14, false); hg.scale(1, 1, 0.8); res.push(hg);
  const handle = new THREE.Mesh(hg, cer); handle.position.y = 0.28; handle.castShadow = true;
  // saucer
  const sp = spline2([[0, 0.2], [2.4, 0.2], [2.5, 0.0], [2.95, 0.0], [3.05, 0.14], [4.6, 0.3], [6.0, 0.62], [6.3, 0.8], [6.2, 0.88], [5.95, 0.76], [4.4, 0.44], [2.6, 0.3], [0, 0.28]], 4);
  const sg = new THREE.LatheGeometry(sp.map((p) => new THREE.Vector2(Math.max(0, p.x), p.y)), 96); res.push(sg);
  const saucer = new THREE.Mesh(sg, cer); saucer.castShadow = true; saucer.receiveShadow = true;
  // liquid surface
  const cm = createCremaMaterial(); cm.userData.uniforms.uR.value = 1; res.push(cm);
  const lg = new THREE.CircleGeometry(1, 96); lg.rotateX(-Math.PI / 2); res.push(lg);
  const liquid = new THREE.Mesh(lg, cm); liquid.receiveShadow = true;
  object.add(saucer, cup, handle, liquid);
  const u = cm.userData.uniforms;
  function update({ level = 0, crema = 0, art = 0, impact = 0, time = 0, tilt = 0 } = {}) {
    const y = liquidY(level);
    const r = innerRadiusAt(y - 0.28) - 0.03;
    liquid.position.y = y; liquid.scale.set(r, 1, r); liquid.visible = level > 0.001;
    u.uCrema.value = crema; u.uArt.value = art; u.uImpact.value = impact; u.uTime.value = time;
    // the heart's orientation follows the handle
    liquid.rotation.y = tilt;
  }
  update({});
  return { object, update, liquid, cup, saucer, dispose: () => res.forEach((x) => x.dispose && x.dispose()) };
}

export default function CoffeeCup({ apiRef, ...props }) {
  const a = useAsset(createCup);
  if (apiRef) apiRef.current = a;
  return <primitive object={a.object} {...props} />;
}
