// The camera shot list. Keys are {t, p: position, l: look-at target, fov, space?}.
// 'A' keys are authored in A-space: the camera flies straight through the monumental
// opening, and the rig carries it through the portal transform at the crossing instant.
import { DURATION } from './config.js';
import { orbitKeys } from './camera.js';

const lerp = (a, b, t) => a + (b - a) * t;
const sm = (x) => { x = Math.min(1, Math.max(0, x)); return x * x * (3 - 2 * x); };
function curve(keys) {
  return (t) => {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 0; i < keys.length - 1; i++) {
      const [t0, v0] = keys[i];
      const [t1, v1] = keys[i + 1];
      if (t <= t1) return lerp(v0, v1, sm((t - t0) / (t1 - t0)));
    }
    return keys[keys.length - 1][1];
  };
}

export function buildShots(arch) {
  const m = arch.meta;
  const aY = arch.portals.A.floorY;   // bridge level
  const aZ = m.L1_ZC;
  const centre = [10, 16, 16];

  const open = [
    // SEQUENCE ONE — the first step: slow push in, slight upward tilt
    { t: 0.0, p: [7.5, 3.4, -15.5], l: [0.2, 1.6, 0.8], fov: 30 },
    { t: 3.5, p: [6.6, 3.9, -13.0], l: [0.1, 2.6, 2.6], fov: 30 },
    { t: 7.0, p: [5.4, 5.2, -9.5], l: [0, 4.2, 6.0], fov: 31 },
    // SEQUENCE TWO — tracking upward alongside the growing structure
    { t: 10.0, p: [6.5, 8.2, -4.5], l: [0.5, 5.6, 7.0], fov: 33 },
    { t: 12.6, p: [-1.5, 11.5, 6.0], l: [7.5, 8.0, 14.0], fov: 36 },   // the stair curves round the camera
    { t: 15.0, p: [-4.0, 15.0, 2.5], l: [10.5, 10.8, 17.0], fov: 37 }, // first major landing forms
    // SEQUENCE THREE — impossible geometry
    { t: 16.8, p: [-8.0, 15.0, 7.0], l: [16.0, 13.5, aZ], fov: 37 },
    { t: 18.0, p: [-1.0, 14.6, 11.0], l: [24.0, 14.8, aZ], fov: 36 },
    { t: 18.9, p: [8.0, 14.2, 15.0], l: [28.0, 15.4, aZ], fov: 35 },
    { t: 19.6, p: [15.5, 14.4, aZ], l: [31.0, 15.6, aZ], fov: 34 },
    // …straight through the opening (A-space)
    { t: 20.0, p: [21.5, 14.9, aZ], l: [34.0, 16.0, aZ], fov: 34, space: 'A' },
    { t: 20.7, p: [27.4, 16.8, aZ], l: [39.0, 14.2, aZ], fov: 34, space: 'A' },
    { t: 21.3, p: [32.0, 22.0, aZ], l: [44.0, 13.0, aZ], fov: 33, space: 'A' },
  ];

  // Orbit of the completed structure: cylindrical description, sampled into dense keys.
  const theta = curve([[22.5, -18], [25.0, 60], [27.5, 150], [28.9, 185], [30.9, 262], [32.4, 312], [33.4, 355.5]]);
  const radius = curve([[22.5, 108], [27.0, 112], [29.5, 114], [31.0, 100], [32.4, 62], [33.4, 31.6]]);
  const height = curve([[22.5, 10], [27.0, 18], [29.5, 24], [31.0, 20], [32.4, 2], [33.4, -12.6]]);
  const lookAt = (t) => {
    const k = sm((t - 31.2) / 2.2);
    return [lerp(centre[0], 0.2, k), lerp(centre[1] - 1, 1.6, k), lerp(centre[2], 0.8, k)];
  };
  const fov = curve([[22.5, 27], [29.5, 28], [31.5, 29], [33.4, 30]]);
  const orbit = orbitKeys({ centre, t0: 22.5, t1: 33.4, step: 0.2, cyl: (t) => ({ theta: theta(t), r: radius(t), h: height(t) }), look: lookAt, fov });

  const bridge = [
    // pull-back through the dark between the doorway and the overview
    { t: 21.9, p: [-4.0, 17.0, -24.0], l: [8.0, 11.0, 8.0], fov: 30 },
  ];

  const close = [
    { t: 34.3, p: [7.9, 3.35, -16.0], l: [0.2, 1.55, 0.75], fov: 30 },
    { t: DURATION, p: [7.5, 3.4, -15.5], l: [0.2, 1.6, 0.8], fov: 30 }, // == t0 : seamless loop
  ];

  return [...open, ...bridge, ...orbit, ...close].sort((a, b) => a.t - b.t);
}
