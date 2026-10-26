// Global constants for THE INFINITE ASCENT.

export const DURATION = 35;      // seconds, master timeline length
export const FPS = 30;           // playback / export frame rate
export const FRAMES = DURATION * FPS;
export const REF_W = 1080;       // reference resolution (9:16)
export const REF_H = 1920;
export const ASPECT = REF_W / REF_H;

export const PALETTE = {
  navy: 0x101c30,
  navyScene: 0x212c3e, // pre-tonemap value that renders as #101C30 after ACES + sRGB
  navyDeep: 0x070d18,
  cream: 0xf2ebdd,
  cyan: 0xbfeaf0,
  slate: 0x829cb8,
  concrete: 0x9f978b,
  graphite: 0x1f232a,
};

// One consistent dimensional system for every stair in the structure (metres).
export const U = {
  W: 3.6,        // tread width
  D: 1.2,        // tread depth (going)
  T: 0.42,       // tread thickness
  R: 0.6,        // rise per step
  RISER_T: 0.16, // riser plate thickness
  SLAB_T: 0.5,   // landing slab thickness
  BEVEL: 0.045,  // edge treatment radius
};
