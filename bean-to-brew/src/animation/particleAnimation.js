// GPU particle fields. Every particle position is an analytic function of (seed, uTime): no CPU state,
// so any timestamp can be rendered directly (scrub-safe) and thousands of particles cost one draw call.
import * as THREE from 'three';
import { mulberry32 } from './util';

export const PARTICLE_GLOBALS = { uPx: { value: 800 } }; // pixels per world unit at distance 1

export function createParticles({
  count = 1000, seed = 1, motion, uniforms = {}, size = 1, mode = 'soft', color = 0xffffff, colorB = null,
  additive = true, opacity = 1,
} = {}) {
  const r = mulberry32(seed);
  const geo = new THREE.BufferGeometry();
  const s = new Float32Array(count * 4);
  for (let i = 0; i < count * 4; i++) s[i] = r();
  geo.setAttribute('aSeed', new THREE.BufferAttribute(s, 4));
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  const u = {
    uTime: { value: 0 }, uSize: { value: size }, uOpacity: { value: opacity }, uPx: PARTICLE_GLOBALS.uPx,
    uColA: { value: new THREE.Color(color) }, uColB: { value: new THREE.Color(colorB ?? color) },
    ...uniforms,
  };
  const extra = Object.keys(uniforms).map((k) => {
    const v = uniforms[k].value;
    return `uniform ${typeof v === 'number' ? 'float' : v.isVector3 || v.isColor ? 'vec3' : v.isVector2 ? 'vec2' : 'vec4'} ${k};`;
  }).join('\n');
  const mat = new THREE.ShaderMaterial({
    uniforms: u, transparent: mode === 'soft', depthWrite: mode !== 'soft',
    blending: additive && mode === 'soft' ? THREE.AdditiveBlending : THREE.NormalBlending,
    vertexShader: /* glsl */ `
      attribute vec4 aSeed; uniform float uTime,uSize,uPx; ${extra}
      varying vec4 vS; varying float vA; varying vec3 vP;
      float rnd(float x){ return fract(sin(x*127.1+311.7)*43758.5453); }
      void main(){
        vec3 pos = vec3(0.); float alive = 1.; float sz = 1.;
        ${motion}
        vec4 mv = modelViewMatrix*vec4(pos,1.);
        gl_PointSize = max(0., uSize*sz*uPx/max(.01,-mv.z));
        gl_Position = alive > .5 ? projectionMatrix*mv : vec4(3.,3.,3.,1.);
        vS = aSeed; vA = alive; vP = pos;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColA,uColB; uniform float uOpacity; varying vec4 vS; varying float vA; varying vec3 vP;
      void main(){
        vec2 pc = gl_PointCoord*2.-1.; float d = length(pc);
        ${mode === 'soft'
          ? `float a = smoothstep(1.,.0,d); a*=a; gl_FragColor = vec4(mix(uColA,uColB,vS.w)*(.6+.8*vS.z), a*uOpacity*vA);`
          : `if(d>1.) discard; vec3 n = vec3(pc.x, -pc.y, sqrt(1.-d*d)); vec3 base = mix(uColA,uColB,vS.y*vS.y);
             float dif = max(dot(n, normalize(vec3(.45,.65,.6))),0.); float rim = pow(1.-n.z,2.)*.15;
             float spec = pow(max(dot(reflect(-normalize(vec3(.45,.65,.6)),n), vec3(0.,0.,1.)),0.),18.)*.25;
             gl_FragColor = vec4(base*(.18+.95*dif)+spec+rim*base, 1.);`}
        #include <colorspace_fragment>
      }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  points.userData.noDepth = mode === 'soft';
  return { object: points, uniforms: u, update: (t) => { u.uTime.value = t; }, dispose: () => { geo.dispose(); mat.dispose(); } };
}

/** Floating pollen / dust motes in a box volume (rises slowly, wraps). */
export function createDust({ count = 260, box = [24, 12, 16], center = [0, 0, 0], size = 0.12, seed = 4, color = 0xffe3a8, opacity = 0.7, speed = 0.15 } = {}) {
  return createParticles({
    count, seed, size, color, opacity, mode: 'soft',
    uniforms: { uBox: { value: new THREE.Vector3(...box) }, uCenter: { value: new THREE.Vector3(...center) }, uSpeed: { value: speed } },
    motion: `
      vec3 p0 = (aSeed.xyz-.5)*uBox;
      float t = uTime*uSpeed*(.4+aSeed.w);
      pos = p0 + vec3(sin(t*2.+aSeed.x*30.)*.6, 0., cos(t*1.7+aSeed.y*30.)*.5);
      pos.y = mod(p0.y + uBox.y*.5 + t*uBox.y*.3, uBox.y) - uBox.y*.5;
      pos += uCenter;
      sz = .35 + 1.3*aSeed.z;
      alive = 1.;`,
  });
}

/**
 * Falling coffee grounds: a stream leaving (x0,y0,z0) that accelerates under gravity and lands at y=floor.
 * uFlow 0..1 controls active fraction; uSpread widens the plume.
 */
export function createGroundsStream({ count = 5000, seed = 9, size = 0.085 } = {}) {
  return createParticles({
    count, seed, size, mode: 'grain', color: 0x2a140a, colorB: 0x6b3a1c,
    uniforms: {
      uOrigin: { value: new THREE.Vector3(0, 4, 0) }, uFloor: { value: 0 }, uFlow: { value: 1 }, uSpread: { value: 0.12 },
      uRate: { value: 1.2 }, uStart: { value: 0 }, uG: { value: 14 },
    },
    motion: `
      float ph = fract(aSeed.x + (uTime-uStart)*uRate*(.8+.4*aSeed.z));
      float born = floor(aSeed.x + (uTime-uStart)*uRate*(.8+.4*aSeed.z));
      float T = sqrt(2.*max(uOrigin.y-uFloor,.1)/uG);
      float tau = ph*T*1.25;
      float y = uOrigin.y - .5*uG*tau*tau;
      float onFloor = step(y, uFloor);
      y = max(y, uFloor + (aSeed.y-.5)*.12*smoothstep(.0,1.,tau/T-.9));
      vec2 dir = (vec2(aSeed.z, aSeed.w)-.5)*2.;
      float sp = uSpread*(.3+aSeed.y)*(1.+tau*.9);
      pos = vec3(uOrigin.x + dir.x*sp, y, uOrigin.z + dir.y*sp);
      // landed grains spread slightly into a mound
      pos.xz += dir*onFloor*.35*(1.-aSeed.y*.5);
      alive = step(aSeed.y, uFlow) * step(0., uTime-uStart);
      alive *= step(.0, uOrigin.y-uFloor);
      sz = .55 + .9*aSeed.w;`,
  });
}

/** Radial burst of fine particles (bean dispersion) – deterministic given uT0. */
export function createBurst({ count = 700, seed = 12, size = 0.09 } = {}) {
  return createParticles({
    count, seed, size, mode: 'grain', color: 0x1f0f06, colorB: 0x6a3a1a,
    uniforms: { uT0: { value: 0 }, uPower: { value: 6 }, uOrigin: { value: new THREE.Vector3() }, uLife: { value: 3 } },
    motion: `
      float tau = uTime - uT0;
      vec3 d = normalize(vec3(aSeed.x-.5, aSeed.y-.5, aSeed.z-.5)+1e-4);
      float sp = uPower*(.25+aSeed.w);
      float travel = (1.-exp(-tau*1.6))*sp*.9;
      pos = uOrigin + d*travel + vec3(0., -tau*tau*.05*aSeed.w, 0.);
      alive = step(0., tau) * step(tau, uLife);
      sz = (.5+aSeed.z)*smoothstep(uLife, uLife*.4, tau);`,
  });
}

/** Rising embers / chaff for the roaster. */
export function createEmbers({ count = 160, seed = 21, size = 0.09 } = {}) {
  return createParticles({
    count, seed, size, mode: 'soft', color: 0xff7a1c, colorB: 0xffc060, opacity: 0.9,
    uniforms: { uOrigin: { value: new THREE.Vector3() }, uAmt: { value: 1 }, uRadius: { value: 3 } },
    motion: `
      float ph = fract(aSeed.x + uTime*(.18+.25*aSeed.y));
      float a = aSeed.z*6.2831;
      float rad = uRadius*sqrt(aSeed.w);
      pos = uOrigin + vec3(cos(a)*rad, ph*ph*9., sin(a)*rad*.5 + ph*3.) + vec3(sin(uTime*2.+aSeed.x*40.)*.3*ph,0.,0.);
      alive = step(aSeed.y, uAmt) * step(.05,ph);
      sz = (1.-ph)*(.5+aSeed.z);`,
  });
}
