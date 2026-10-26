# THE INFINITE ASCENT
### An experiment in impossible architecture — Motion Study / 003

A 35-second, 9:16, seamlessly looping architectural film built entirely in Three.js.
A single floating concrete tread assembles a monumental staircase out of empty space,
the staircase branches, passes through a doorway that is *genuinely* non-Euclidean, and
re-enters itself just below its own first step — then the whole structure retracts so the
last frame is the first frame.

```
npm install
npm run dev          # http://localhost:5173  — plays immediately, loops forever
npm run build        # static build in dist/ (relative paths, host anywhere)
```

Controls (hover/tap the stage): play/pause, scrub, replay, **Sound** (synthesised score), **Export** (MP4).
Keys: `Space` play/pause, `←/→` step one frame. The film is always a 9:16 stage, letter/pillar-boxed in
any viewport, so the composition never changes shape.

URL parameters: `?t=12.5` (freeze on a time), `?dev` (loop-validation panel), `?shadow=2048`,
`?samples=0` (no MSAA), `?pr=1` (pixel ratio).

---

## The film

| Time | Sequence | What happens |
|---|---|---|
| 0–7 s | **The First Step** | Near-darkness. A cream light finds one floating tread; at ~1 s it shifts into place, at ~2 s a second tread rises from below, at ~3 s a third resolves out of a cluster of shards. Treads arrive on different heavy trajectories (rise, drop, swing in). Dust puffs on each lock. Slow push-in, slight upward tilt. |
| 7–16 s | **The Staircase Builds Itself** | Faster, rhythmic. A graphite spine slides under the flight, a quarter-turn winder swings in around its centre of curvature (the camera sits inside the curve at ~13 s), a column extends downward, support beams slide in, and the first landing unfolds from three hinged slabs (~15 s). |
| 16–27 s | **Impossible Geometry** | The stair divides: a 40-step spiral loops a central void while a horizontal bridge runs to a monumental frame. The camera flies through it (~20.3 s) and emerges looking at the *first staircase* from a direction that cannot exist. At ~22 s the full structure is revealed from far away, at ~24 s the orbit begins, at ~26 s the final connecting flight starts to assemble beside the original steps. |
| 27–35 s | **The Infinite Ascent** | The last flight and its supports lock in, the loop is complete (~29 s), the camera pulls back, then (~31 s) the structure retracts in reverse build order while the camera spirals back to the opening composition. At 35 s everything — camera, FOV, geometry, light, particles, type — equals frame 0. No fade, no end card. |

### How the impossible connection works
Two frames — **A** (end of the bridge, heading +X) and **B** (just below and behind the first tread,
heading +Z) — are linked by a rigid transform that rotates 90° and teleports. Each doorway is a
stencil window: the same scene is re-rendered through it from a camera carried through the transform
(`src/portal.js`). There is no duplicated geometry and no camera trick: it is correct from any angle
(look at it during the orbit), and the camera can fly straight through. The camera path
(`src/camera.js`) is authored in portal space for that stretch and is carried through the transform at
the exact instant it crosses the doorway plane, so the shot is continuous.

### Architecture (`src/architecture.js`)
One dimensional system (`src/config.js → U`): tread 3.6 × 1.2 × 0.42 m, rise 0.6 m, landing slab 0.5 m,
riser 0.16 m with a recessed shadow reveal, 0.045 m edge bevel. Reusable builders: `addTread`,
`straightFlight`, `curvedFlight` (wedge treads; also used for the 40-step spiral), `addLanding` (hinged
slabs), `addSpine`/`addBeam` (graphite), `addColumn`, `addFrame` (portal frames). Repeated parts use
`InstancedMesh` grouped by geometry (≈215 parts → ≈20 draw calls); nothing is created during playback.

### Timeline (`src/timeline.js`, `src/animations.js`)
Every part has a start pose/orientation, a final pose/orientation, start/end times, an easing curve and
an optional settling motion. Motion factories: `risePlace`, `dropPlace`, `slideBeam`, `rotateAbout`
(hinged panels, curved segments swinging into alignment), `extendY` (columns), `shardMotion`.
Easing is heavy (long deceleration, **no** bounce); settle is a single damped dip of 2–5 cm.
All transforms are pure functions of `t` — nothing accumulates frame to frame, so any frame can be
rendered on its own, in any order, with identical results. The film is one *continuous construction
cycle*: parts retract by playing their own entrances backwards.

### Camera (`src/shots.js`, `src/camera.js`)
A single cyclic C¹ spline (position, look-at, FOV) through hand-placed keys, an orbit generated from a
cylindrical description, and the portal crossing. First key == last key and tangents wrap, so the loop
has no velocity jump.

### Look
Warm-grey matte concrete with procedural object-space tone variation, pores and bump (no textures to load),
dark graphite metal for spines and beams, cream key light with soft shadows, icy-cyan rim, navy
hemisphere fill, exponential haze, a light pool that reveals the structure as it grows, gentle bloom only
on highlights, ACES tone mapping, navy-biased grade, vignette and dithering. The scene clear colour and fog
are pre-compensated so the background renders as exactly `#101C30`.

### Sound (`src/audio.js`, `docs/cue-sheet.md`)
Synthesised offline (seeded, deterministic) into a loop-safe stereo buffer: deep drone with whole-cycle
frequencies, one stone resonance at the first shift, stone impacts / latch clicks / slab settles / slides
on every component lock (taken from the same timeline), a widening stereo field and a gradual rise in
sequence three, a deep restrained resonance at the reveal, then a return to the opening ambience. The
cue list is also written out as `docs/cue-sheet.md` (`npm run cuesheet`).

---

## Loop validation
`?dev` opens a panel that renders **t = 0** and **t = 35** side by side with a pixel diff and a pose/camera
comparison. Headless: `npm run loopcheck`.

Measured result: t = 0 vs t = 35 → **max channel difference 0, mean 0** (pixel-identical); the one-frame
step across the seam (frame 1049 → 0) is the same size as an ordinary frame step (frame 0 → 1).

## Replay and export
* Replay: press **Replay**, or reload. Time is quantised to 30 fps and derived from the wall clock, so
  playback is deterministic; `?t=` freezes any moment.
* **Export (in the browser):** the **Export** button renders all 1050 frames offline at exactly 1080 × 1920
  (frame *n* is rendered from *t = n/30*, independent of machine speed), encodes with WebCodecs
  (H.264, VP9 fallback) and muxes MP4 (with AAC audio when the browser supports it). The soundtrack is also
  saved as WAV. Needs a Chromium-based browser; keep the tab in the foreground.
  Programmatic: `await __ascent.exportVideo({ width: 1080, height: 1920 })`.
* **PNG sequence + ffmpeg** (any GPU machine): `npm run dev`, then `W=1080 npm run frames` →
  `out/frames/`, then `AUDIO=out/export/the-infinite-ascent.wav npm run encode`.
* Stills for review: `npm run stills`, or `node scripts/capture.mjs sheet name 0,5,10,…` for a contact sheet.

## What was verified (and what wasn't)
Verified in this repo with headless Chromium + software WebGL: production build; zero console errors;
stills/contact sheets across the whole timeline; t = 0 ≡ t = 35 pixel-identical; the in-browser exporter
end to end (1050 frames, exactly 35.000 s, H.264) at 270×480 and 540×960 — `docs/preview-540x960.mp4`
(video + synthesised audio muxed with ffmpeg) is that real export, and `docs/contact-sheet.png` is taken
from it; the soundtrack renders and its loop seam is continuous.
**Not verified:** real-GPU frame rate, a full 1080×1920 export (software rendering is too slow here; the
exporter is resolution-independent and the 540p run exercises the same code path), in-browser AAC audio
muxing (headless Chromium has no AAC encoder, so the WAV is written separately), and listening to the
score on speakers — the sound design is synthesised and unreviewed by ear.

## Files
```
index.html            stage + HUD
src/main.js           player, 30 fps clock, UI, sound/export wiring
src/film.js           scene assembly; renderAt(t) — a pure function of time
src/architecture.js   builders + the full assembly script and timings
src/timeline.js       instanced parts, per-part evaluation, portal iris
src/animations.js     reusable motion factories
src/geometry.js       cached bevelled boxes and wedge sectors
src/materials.js      concrete / graphite / frame / reveal
src/lighting.js       rig + looped intensity curves
src/portal.js         stencil portal pair and render pass
src/camera.js         cyclic spline rig, portal-aware
src/shots.js          the shot list
src/particles.js      dust bursts + periodic haze motes
src/post.js           bloom, tone map, grade, vignette, dither, type overlay
src/typography.js     title / subtitle / label (drawn into the frame)
src/audio.js, cues.js synthesised soundtrack and cue list
src/exporter.js       WebCodecs MP4 export
src/dev.js            loop-validation panel
scripts/              capture.mjs (stills / sheets / loopcheck / frames), encode.sh, cuesheet.mjs
```
