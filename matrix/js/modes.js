// Experience modes. Every field feeds the real scene (shaders, camera, post-processing, event cadence).
// Numeric fields are blended smoothly when the mode changes.

export const MODES = {
  rain: {
    label: 'DIGITAL RAIN',
    blurb: 'Full-screen, immersive code streams.',
    num: {
      speed: 1.0, glyphRate: 1.0, speedVar: 1.0, dens: 0.9, flicker: 0.0,
      bright: 1.0, fogK: 0.014, blurK: 0.035, range: 95,
      parallax: 1.0, drift: 1.0, camLerp: 3.0, ambient: 1.6,
      bloom: 0.85, bloomRadius: 0.55, bloomThr: 0.12, chroma: 0.0006,
    },
    // [min, max] seconds between events, [0,0] = never
    events: { glitch: [20, 36], converge: [48, 80], alert: [26, 46], glitchStrength: 1 },
  },
  deep: {
    label: 'DEEP SYSTEM',
    blurb: 'Darker, spatial, slow. Stronger depth.',
    num: {
      speed: 0.55, glyphRate: 0.7, speedVar: 0.8, dens: 0.85, flicker: 0.0,
      bright: 0.82, fogK: 0.021, blurK: 0.06, range: 140,
      parallax: 1.9, drift: 0.55, camLerp: 1.6, ambient: 0.8,
      bloom: 0.95, bloomRadius: 0.8, bloomThr: 0.1, chroma: 0.0008,
    },
    events: { glitch: [32, 52], converge: [28, 48], alert: [30, 50], glitchStrength: 0.7 },
  },
  glitch: {
    label: 'GLITCH MODE',
    blurb: 'Energetic. Controlled distortion, flicker.',
    num: {
      speed: 1.45, glyphRate: 2.1, speedVar: 2.2, dens: 0.82, flicker: 1.0,
      bright: 1.05, fogK: 0.015, blurK: 0.03, range: 90,
      parallax: 1.2, drift: 1.5, camLerp: 4.0, ambient: 2.6,
      bloom: 0.9, bloomRadius: 0.5, bloomThr: 0.12, chroma: 0.0016,
    },
    events: { glitch: [4.5, 9], converge: [50, 80], alert: [24, 42], glitchStrength: 0.8 },
  },
};

export const MODE_KEYS = Object.keys(MODES);
export const NUM_KEYS = Object.keys(MODES.rain.num);
