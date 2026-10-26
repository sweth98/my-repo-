// The impossible connection.
//
// Two monumental frames, A (end of the horizontal bridge) and B (foot of the final
// flight, just below the first tread), are joined by a rigid transform that is NOT a
// translation in the real world: stepping out of A heading +X, you emerge from B
// heading +Z. The scene contains no duplicated geometry — each doorway is a stencil
// window through which the *same* scene is re-rendered from a transformed camera.
// That is real, view-independent impossible architecture rather than a camera trick,
// and the camera can fly straight through it.
import * as THREE from 'three';
import { Pass } from 'three/examples/jsm/postprocessing/Pass.js';
import { PALETTE } from './config.js';

const Y = new THREE.Vector3(0, 1, 0);

export class PortalPair {
  constructor(def) {
    this.W = def.width;
    this.H = def.height;
    const mk = (d) => ({
      origin: d.plane.clone(), // centre of the opening's floor on the portal plane
      yaw: d.yaw,
      heading: new THREE.Vector3(Math.sin(d.yaw), 0, Math.cos(d.yaw)),
    });
    this.A = mk(def.A);
    this.B = mk(def.B);
    this.dYaw = this.B.yaw - this.A.yaw;
    this.qAB = new THREE.Quaternion().setFromAxisAngle(Y, this.dYaw);
    this.qBA = this.qAB.clone().invert();

    this.scene = new THREE.Scene(); // holds only the two window quads
    const mat = (ref) => new THREE.MeshBasicMaterial({
      colorWrite: false, depthWrite: false, side: THREE.DoubleSide,
      stencilWrite: true, stencilRef: ref, stencilFunc: THREE.AlwaysStencilFunc,
      stencilFail: THREE.KeepStencilOp, stencilZFail: THREE.KeepStencilOp, stencilZPass: THREE.ReplaceStencilOp,
    });
    const geo = new THREE.PlaneGeometry(this.W, this.H);
    geo.translate(0, this.H / 2, 0); // origin at the floor
    this.winA = new THREE.Mesh(geo, mat(1));
    this.winB = new THREE.Mesh(geo, mat(2));
    // A's window faces the approach side (-heading); B's faces the exit side (+heading).
    this.winA.position.copy(this.A.origin);
    this.winA.rotation.y = this.A.yaw + Math.PI;
    this.winB.position.copy(this.B.origin);
    this.winB.rotation.y = this.B.yaw;
    this.scene.add(this.winA, this.winB);

    // clipping planes (in the destination space): keep only what lies *beyond* the exit plane
    this.clipForA = new THREE.Plane().setFromNormalAndCoplanarPoint(this.B.heading, this.B.origin);
    this.clipForB = new THREE.Plane().setFromNormalAndCoplanarPoint(this.A.heading.clone().negate(), this.A.origin);

    this.clip = new THREE.Plane();
    this.camA = new THREE.PerspectiveCamera();
    this.camB = new THREE.PerspectiveCamera();
    this.open = 0;
  }

  /** M: A-space -> B-space (rigid). */
  toB(v, out = new THREE.Vector3()) {
    return out.copy(v).sub(this.A.origin).applyQuaternion(this.qAB).add(this.B.origin);
  }
  /** M^-1: B-space -> A-space. */
  toA(v, out = new THREE.Vector3()) {
    return out.copy(v).sub(this.B.origin).applyQuaternion(this.qBA).add(this.A.origin);
  }

  /** Signed distance of p in front of A's window (positive = approach side). */
  distFrontA(p) {
    return -this.A.heading.dot(p.clone().sub(this.A.origin));
  }

  setOpen(a) {
    this.open = a;
    for (const w of [this.winA, this.winB]) {
      w.visible = a > 0.002;
      w.scale.y = Math.max(a, 0.0001);
    }
  }

  _prepCam(dst, src, q, mapFn) {
    dst.copy(src, false);
    dst.projectionMatrix.copy(src.projectionMatrix);
    dst.projectionMatrixInverse.copy(src.projectionMatrixInverse);
    mapFn(src.position, dst.position);
    dst.quaternion.copy(q).multiply(src.quaternion);
    dst.scale.set(1, 1, 1);
    dst.updateMatrixWorld(true);
  }

  /** Is window `w` of this pair potentially visible from `camera`? */
  _facing(w, camera, normal) {
    const to = camera.position.clone().sub(w.position);
    return to.dot(normal) > 0;
  }
}

/**
 * Custom first pass for EffectComposer: renders the world, stamps the doorway windows
 * into the stencil buffer, then re-renders the world through each window.
 */
export class PortalRenderPass extends Pass {
  constructor(scene, camera, portal, stencilMaterials) {
    super();
    this.scene = scene;
    this.camera = camera;
    this.portal = portal;
    this.mats = stencilMaterials;
    this.needsSwap = false;
    this.clearColor = new THREE.Color(PALETTE.navyScene);
    this.enabled = true;
    this.portalsEnabled = true;
    this._frustum = new THREE.Frustum();
    this._pv = new THREE.Matrix4();
    this._v = new THREE.Vector3();
  }

  _setStencil(ref) {
    for (const m of this.mats) {
      if (ref === 0) {
        m.stencilWrite = false;
      } else {
        m.stencilWrite = true;
        m.stencilRef = ref;
        m.stencilFunc = THREE.EqualStencilFunc;
        m.stencilFail = m.stencilZFail = m.stencilZPass = THREE.KeepStencilOp;
      }
    }
  }

  render(renderer, writeBuffer, readBuffer) {
    const P = this.portal;
    const cam = this.camera;
    const prevAuto = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);
    renderer.setClearColor(this.clearColor, 1);
    renderer.clear(true, true, true);

    // 1) the real world
    this._setStencil(0);
    renderer.shadowMap.needsUpdate = true;
    renderer.render(this.scene, cam);

    if (this.portalsEnabled && P.open > 0.002) {
      cam.updateMatrixWorld(true);
      P.scene.updateMatrixWorld(true);
      this._pv.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
      this._frustum.setFromProjectionMatrix(this._pv);
      // which side of each doorway is the viewer on?
      const sideA = -P.A.heading.dot(this._v.copy(cam.position).sub(P.A.origin)); // >0 approach side
      const sideB = P.B.heading.dot(this._v.copy(cam.position).sub(P.B.origin)); // >0 exit side
      const showA = P.winA.visible && this._frustum.intersectsObject(P.winA);
      const showB = P.winB.visible && this._frustum.intersectsObject(P.winB);

      // 2) stamp the windows into the stencil (depth-tested against the real world)
      const vis = [P.winA.visible, P.winB.visible];
      P.winA.visible = showA;
      P.winB.visible = showB;
      if (showA || showB) renderer.render(P.scene, cam);
      P.winA.visible = vis[0];
      P.winB.visible = vis[1];

      // 3) re-render the same scene through each doorway (the windows are not in `scene`)
      if (showA) {
        P._prepCam(P.camA, cam, P.qAB, (s, d) => P.toB(s, d));
        renderer.clearDepth();
        this._setStencil(1);
        // seen from the approach side we emerge from B (keep beyond B); from behind, the mirror
        P.clip.setFromNormalAndCoplanarPoint(this._v.copy(P.B.heading).multiplyScalar(sideA > 0 ? 1 : -1), P.B.origin);
        renderer.clippingPlanes = [P.clip];
        renderer.render(this.scene, P.camA);
      }
      if (showB) {
        P._prepCam(P.camB, cam, P.qBA, (s, d) => P.toA(s, d));
        renderer.clearDepth();
        this._setStencil(2);
        P.clip.setFromNormalAndCoplanarPoint(this._v.copy(P.A.heading).multiplyScalar(sideB > 0 ? -1 : 1), P.A.origin);
        renderer.clippingPlanes = [P.clip];
        renderer.render(this.scene, P.camB);
      }
      renderer.clippingPlanes = [];
      this._setStencil(0);
    }
    renderer.autoClear = prevAuto;
  }
}
