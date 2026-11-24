import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { clock, subscribe } from '../animation/clockStore';
import { seekMaster, filmState } from '../animation/masterTimeline';
import { transitionAt } from '../animation/transitionSystem';
import { applyLighting, createRig } from '../animation/lighting';
import { applyBackdrop } from '../animation/backdrops';
import { frameRegistry } from '../animation/director';
import { PARTICLE_GLOBALS } from '../animation/particleAnimation';
import { buildEnvironment } from './sharedAssets';
import { createBackdropMaterial } from '../shaders/backdropShader';
import { GradeShader } from '../shaders/gradeShader';
import { DofShader } from '../shaders/dofShader';
import { applyCinematicCamera, freeCam } from './CinematicCamera';
import { filmApi } from '../animation/filmApi';
import { SCENE_COMPONENTS } from '../scenes';
import { useClock } from '../interface/clockHooks';

function makeQuad(shader, extraDefines) {
  const mat = new THREE.ShaderMaterial({
    uniforms: THREE.UniformsUtils.clone(shader.uniforms),
    vertexShader: shader.vertexShader,
    fragmentShader: shader.fragmentShader,
    depthTest: false, depthWrite: false, defines: extraDefines || {},
  });
  return new FullScreenQuad(mat);
}

function Pipeline() {
  const { gl, scene, camera, invalidate, get } = useThree();
  const S = useRef({});

  useEffect(() => {
    gl.shadowMap.enabled = true; gl.shadowMap.type = THREE.PCFSoftShadowMap;
    gl.toneMapping = THREE.NoToneMapping;
    const env = buildEnvironment(gl);
    scene.environment = env;
    const rig = createRig(scene);
    const backdrop = new THREE.Mesh(new THREE.SphereGeometry(150, 32, 16), createBackdropMaterial());
    backdrop.renderOrder = -10; backdrop.frustumCulled = false; backdrop.userData.noDepth = true;
    scene.add(backdrop);
    const grade = makeQuad(GradeShader);
    const dof = makeQuad(DofShader);
    S.current = { env, rig, backdrop, grade, dof, rtScene: null, rtA: null, bloom: null, w: 0, h: 0 };
    const unsub = subscribe(() => invalidate());
    return () => {
      unsub();
      env.dispose(); backdrop.geometry.dispose(); backdrop.material.dispose();
      grade.material.dispose(); dof.material.dispose();
      S.current.rtScene?.dispose(); S.current.rtA?.dispose(); S.current.bloom?.dispose();
      scene.remove(rig.key, rig.key.target, rig.rim, rig.hemi, rig.gA, rig.gB, backdrop);
      rig.key.dispose(); rig.key.shadow.map?.dispose();
      S.current = {};
    };
  }, [gl, scene, invalidate]);

  const ensureTargets = (w, h, quality) => {
    const s = S.current;
    const msaa = quality === 'high' ? 4 : 0;
    if (s.w === w && s.h === h && s.q === quality && s.rtScene) return;
    s.rtScene?.dispose(); s.rtA?.dispose(); s.bloom?.dispose();
    const depth = new THREE.DepthTexture(w, h); depth.type = THREE.UnsignedIntType;
    s.rtScene = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: msaa, depthTexture: depth, depthBuffer: true });
    s.rtA = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType });
    s.bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.22, 0.6, 0.92);
    s.w = w; s.h = h; s.q = quality;
  };

  /** Render one frame for absolute time t. Pure function of t + clock settings. */
  const renderFrame = (t, aspectOverride) => {
    const s = S.current;
    if (!s.rig) return;
    const v = gl.getDrawingBufferSize(new THREE.Vector2());
    const w = v.x, h = v.y; const aspect = aspectOverride || w / h;
    const quality = clock.quality;
    ensureTargets(w, h, quality);
    seekMaster(t);
    const cam = applyCinematicCamera(camera, t, aspect, clock.cameraMode);
    camera.near = 0.1; camera.far = 300; camera.updateProjectionMatrix();
    applyLighting(s.rig, scene, t, quality);
    gl.shadowMap.enabled = quality !== 'low';
    applyBackdrop(s.backdrop.material, t);
    s.backdrop.position.copy(camera.position);
    PARTICLE_GLOBALS.uPx.value = h / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    frameRegistry.forEach((fn) => fn(t, { camera }));

    gl.setRenderTarget(s.rtScene); gl.clear(); gl.render(scene, camera);
    let src = s.rtScene.texture;
    if (quality !== 'low') {
      const u = s.dof.material.uniforms;
      u.tColor.value = src; u.tDepth.value = s.rtScene.depthTexture;
      u.uNear.value = camera.near; u.uFar.value = camera.far; u.uFocus.value = cam.focus;
      u.uAperture.value = cam.ap; u.uMaxBlur.value = 0.034; u.uAspect.value = aspect;
      gl.setRenderTarget(s.rtA); s.dof.render(gl);
      src = s.rtA.texture;
      if (quality === 'high') { s.bloom.render(gl, null, s.rtA); }
    }
    const tr = transitionAt(t);
    const g = filmState.grade; const gu = s.grade.material.uniforms;
    gu.tDiffuse.value = src; gu.uTime.value = t; gu.uAspect.value = aspect;
    gu.uTint.value = [g.tr, g.tg, g.tb]; gu.uSat.value = g.sat; gu.uContrast.value = g.contrast; gu.uLift.value = [g.lr, g.lg, g.lb];
    gu.uIris.value = tr.iris; gu.uIrisSoft.value = tr.soft; gu.uIrisColor.value = tr.color; gu.uIrisShape.value = tr.shape;
    gu.uBlur.value = tr.blur; gu.uShimmer.value = filmState.shimmer;
    gu.uVignette.value = 0.3; gu.uGrain.value = 0.028;
    gl.setRenderTarget(null); s.grade.render(gl);
  };

  // adaptive quality: if playback can't hold ~24 fps on High/Medium, step the quality preset down
  const perf = useRef({ last: 0, acc: 0, n: 0 });
  useFrame(() => {
    const now = performance.now(), p = perf.current;
    renderFrame(clock.time);
    if (clock.playing && clock.speed === 1 && clock.autoQuality) {
      if (p.last) { p.acc += now - p.last; p.n++; }
      if (p.n >= 60) { const avg = p.acc / p.n; if (avg > 46 && clock.quality !== 'low') setClock({ quality: clock.quality === 'high' ? 'medium' : 'low' }); p.acc = 0; p.n = 0; }
      p.last = now;
    } else { p.last = 0; p.acc = 0; p.n = 0; }
  }, 1);

  useEffect(() => {
    filmApi.canvas = gl.domElement;
    filmApi.renderAt = (t, w, h) => {
      gl.setPixelRatio(1); gl.setSize(w, h, false);
      renderFrame(t, w / h);
      return gl.domElement;
    };
    const restore = () => {
      const st = get();
      gl.setPixelRatio(st.viewport.dpr); gl.setSize(st.size.width, st.size.height, false); invalidate();
    };
    filmApi.restore = restore;
    // compile every material/program once (one frame inside each scene) so playback never hitches on first use
    filmApi.warmup = async (onProgress) => {
      const times = [0.3, 2.5, 7.8, 9.6, 12.5, 14.5, 17.5, 19.5, 21.2, 24.0, 28.5, 33.0, 35.5, 38.0, 41.5, 46.0, 52.0, 56.5, 59.0];
      for (let i = 0; i < times.length; i++) { renderFrame(times[i]); onProgress && onProgress((i + 1) / times.length); await new Promise((r) => setTimeout(r, 0)); }
      renderFrame(clock.time); invalidate();
    };
    filmApi.ready = true;
    window.__film = { filmApi, clock, seek: (t) => setClock({}) || (clock.time = t, setClock({})) };
    return () => { filmApi.ready = false; };
  }, [gl]);
  return null;
}

function World() {
  return <>{SCENE_COMPONENTS.map((C, i) => <C key={i} />)}</>;
}

export default function Film({ children }) {
  const quality = useClock().quality;
  const dpr = quality === 'high' ? Math.min(1.5, window.devicePixelRatio || 1) : 1;
  const wrap = useRef();
  // pointer-driven free camera
  useEffect(() => {
    const el = wrap.current; if (!el) return;
    let drag = null;
    const down = (e) => { if (clock.cameraMode === 'free') drag = [e.clientX, e.clientY]; };
    const move = (e) => { if (!drag) return; freeCam.yaw -= (e.clientX - drag[0]) * 0.005; freeCam.pitch -= (e.clientY - drag[1]) * 0.005; drag = [e.clientX, e.clientY]; subscribeBump(); };
    const up = () => (drag = null);
    const wheel = (e) => { if (clock.cameraMode !== 'free') return; freeCam.dolly = Math.min(3, Math.max(0.3, freeCam.dolly * (1 + e.deltaY * 0.001))); subscribeBump(); };
    el.addEventListener('pointerdown', down); window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); el.addEventListener('wheel', wheel, { passive: true });
    return () => { el.removeEventListener('pointerdown', down); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); el.removeEventListener('wheel', wheel); };
  }, []);
  return (
    <div ref={wrap} style={{ position: 'absolute', inset: 0 }}>
      <Canvas
        frameloop="demand" dpr={dpr} shadows
        gl={{ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: true, alpha: false }}
        camera={{ fov: 30, near: 0.1, far: 300, position: [0, 0, 10] }}
      >
        <Pipeline />
        <World />
      </Canvas>
      {children}
    </div>
  );
}
import { set as setClock } from '../animation/clockStore';
const subscribeBump = () => setClock({});
