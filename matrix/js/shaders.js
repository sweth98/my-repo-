// GLSL for the digital rain layers and the final cinematic pass.
// Rain is generated procedurally per fragment: no per-character geometry.

export const RAIN_VERT = /* glsl */ `
varying vec2 vW;
void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vW = wp.xy;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const RAIN_FRAG = /* glsl */ `
precision highp float;

uniform sampler2D uAtlas;
uniform float uTime;      // simulation clock (seconds, already scaled by speed)
uniform float uRevDelta;  // time offset applied to "reversing" columns during a glitch
uniform float uRevAmt;    // fraction of columns affected by the reverse glitch
uniform float uBoot;      // 0..1 how many columns have been initialised
uniform float uSpeedVar;  // strength of speed changes / pauses
uniform float uGlyphRate; // glyph mutation rate
uniform float uFlicker;   // 0..1 fraction of cells that flicker
uniform float uDens;      // character density (0..1)
uniform float uConv;      // code convergence amount
uniform vec2  uFocal;     // convergence focus in this layer's world space
uniform float uConvR;     // convergence radius in world units
uniform float uCell;      // world size of a character cell
uniform float uSeed;
uniform float uAlpha;     // layer brightness after fog / fades
uniform float uBlur;      // depth-of-field blur, in mip levels
uniform float uDepth;     // 0 near .. 1 far, tints toward dark emerald

varying vec2 vW;

const vec3 NEON = vec3(0.0, 1.0, 0.2549);
const vec3 EMER = vec3(0.0, 0.5608, 0.0667);
const vec3 HEAD = vec3(0.8471, 1.0, 0.8824);

float h11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float h21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 p = vW;

  // Code convergence: world space is compressed toward a focal point.
  vec2 dq = p - uFocal;
  float g = exp(-dot(dq, dq) / (uConvR * uConvR));
  p = uFocal + dq * (1.0 + 1.1 * uConv * g);

  vec2 gp = p / uCell;
  // derivatives must be taken in uniform control flow, before any early-out
  float bm = exp2(uBlur);
  vec2 dx = dFdx(gp) * bm / vec2(16.0, 8.0);
  vec2 dy = dFdy(gp) * bm / vec2(16.0, 8.0);
  float col = floor(gp.x);
  vec2 cuv = fract(gp);
  float row = -floor(gp.y) - 1.0; // increases downward

  float cid = col + uSeed * 97.0;
  float h1 = h11(cid * 1.713 + 0.37);
  float h2 = h11(cid * 2.371 + 4.10);
  float h3 = h11(cid * 3.173 + 8.80);
  float h4 = h11(cid * 4.911 + 2.90);
  float h5 = h11(cid * 5.537 + 6.30);
  float h6 = h11(cid * 7.211 + 1.10);
  float h7 = h11(cid * 9.131 + 5.50);

  // Column initialisation during boot.
  float act = smoothstep(h6, h6 + 0.08, uBoot * 1.08);
  if (act <= 0.0) { gl_FragColor = vec4(0.0); return; }

  // Per-stream parameters.
  float speed = mix(4.0, 17.0, h1 * h1);       // rows per second
  float len   = mix(7.0, 30.0, h2);            // trail length (rows)
  float P     = len * mix(1.45, 2.6, h3);      // spacing between streams in a column
  float w     = mix(0.25, 0.9, h4);
  float pause = step(0.72, h5) * (0.7 + 0.3 * h4);          // ~28% of columns stall now and then
  float amp   = speed / w * (0.18 * uSpeedVar + pause * 0.92);

  float T = uTime + (h7 < uRevAmt ? uRevDelta : 0.0);
  float H = speed * T + amp * sin(T * w + h5 * 6.2832) + h3 * P * 7.0;

  float x = H - row;
  float n = floor(x / P);
  float d = x - n * P;
  float hs = h21(vec2(cid, n) + uSeed);
  float lenS = len * mix(0.6, 1.0, hs);
  if (d >= lenS) { gl_FragColor = vec4(0.0); return; }

  float b = pow(1.0 - d / lenS, 1.7);

  vec2 cell = vec2(cid, row);
  float hc = h21(cell + 3.7);
  float rate = uGlyphRate * (0.15 + hc * 0.9) * (d < 1.0 ? 4.0 : 1.0);
  float st = floor(uTime * rate + hc * 50.0);
  float gi = floor(h21(cell + st * 1.37 + 11.0) * 128.0);

  b *= mix(0.55, 1.0, h21(cell + st * 0.71 + 5.0));          // shimmer
  b *= mix(0.12, 1.0, step(h21(cell * 1.9 + 8.0), uDens));    // density drop-outs
  float fl = step(1.0 - uFlicker * 0.07, h21(cell + floor(uTime * 9.0) * 3.1));
  b *= 1.0 - 0.75 * fl;

  vec3 c = mix(EMER, NEON, smoothstep(0.0, 0.55, b));
  c = mix(c, EMER, uDepth * 0.5);
  float head = 1.0 - smoothstep(0.6, 1.3, d);
  float neck = (1.0 - smoothstep(1.0, 3.5, d)) * 0.45;
  c = mix(c, mix(NEON, HEAD, 0.5), neck);
  c = mix(c, HEAD, head);
  b = max(b, head);
  c += HEAD * 0.35 * uConv * g * b;

  // Glyph lookup from the 16x8 atlas, with explicit gradients so cell seams don't pick wrong mips.
  float gx = mod(gi, 16.0);
  float gy = floor(gi / 16.0);
  vec2 auv = vec2((gx + cuv.x) / 16.0, (7.0 - gy + cuv.y) / 8.0);
  float a = textureGrad(uAtlas, auv, dx, dy).r;

  vec3 o = c * a * b * uAlpha * act;
  gl_FragColor = vec4(o, 1.0);
}
`;

export const FINAL_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tDiffuse;
uniform float uTime;
uniform vec2  uRes;
uniform float uPx;       // device pixel ratio actually rendered
uniform float uGlitch;   // 0..1 envelope
uniform vec4  uRect;     // glitch region in uv
uniform float uSeedG;
uniform float uChroma;
uniform float uScan;
varying vec2 vUv;

float h11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }

void main() {
  vec2 uv = vUv;
  float ch = uChroma * (0.4 + 1.6 * length(uv - 0.5));

  if (uGlitch > 0.001) {
    vec2 r0 = uRect.xy; vec2 r1 = uRect.zw;
    vec2 m2 = smoothstep(r0, r0 + 0.02, uv) * (1.0 - smoothstep(r1 - 0.02, r1, uv));
    float m = m2.x * m2.y * uGlitch;
    float band = floor(uv.y * 70.0);
    uv.x += (h11(band + uSeedG * 13.0) - 0.5) * 0.07 * m;
    ch += 0.006 * m;
  }

  vec2 dir = normalize(uv - 0.5 + 1e-4) * ch;
  vec3 col;
  col.r = texture2D(tDiffuse, uv + dir).r;
  col.g = texture2D(tDiffuse, uv).g;
  col.b = texture2D(tDiffuse, uv - dir).b;

  // Atmosphere: faint green haze at the centre, vignette, scanlines, grain.
  float r = length((vUv - 0.5) * vec2(1.0, 0.85));
  col += vec3(0.0, 0.012, 0.004) * (1.0 - smoothstep(0.0, 0.8, r));
  col *= 1.0 - 0.6 * pow(clamp(r * 1.3, 0.0, 1.0), 2.2);

  float sl = 0.5 + 0.5 * sin(gl_FragCoord.y * 6.2832 / (3.0 * uPx));
  col *= 1.0 - uScan * 0.12 * sl;
  float band = smoothstep(0.0, 0.5, sin(vUv.y * 3.0 - uTime * 0.25));
  col *= 1.0 + uScan * 0.03 * band;

  float gr = h11(dot(gl_FragCoord.xy, vec2(0.0671, 0.0231)) + fract(uTime) * 17.0) - 0.5;
  col += vec3(0.0, 1.0, 0.3) * gr * 0.012;

  gl_FragColor = vec4(max(col, 0.0), 1.0);
}
`;
