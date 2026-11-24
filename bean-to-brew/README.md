# FROM BEAN TO BREW — The Life of a Cup of Coffee

A 60-second, 1920×1080, 30 fps (1 800 frames) **procedural 3D motion-design film** built with
React · Three.js · React Three Fiber · GSAP · custom GLSL. Everything you see is generated in the browser:
no models, no video clips, no image textures — geometry, materials, particles, liquid, typography and
sound are all code.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build && npm run preview
```

Use a Chromium-based browser with hardware WebGL2 for real-time playback.

## What it is

One coffee bean's journey, ten connected scenes, joined by object-based match cuts (a hero-centred iris that closes
on the object that carries across the cut) rather than generic fades.

| # | Time | Scene | Hero action |
|---|------|-------|-------------|
| 01 | 00–05 | The Origin | macro plantation, flower blooms → petals fall → berry swells green→red (time-lapse) |
| 02 | 05–10 | The Harvest | cherry cluster reveal, release from branch (slow-mo fall), skin opens to the pulp core |
| 03 | 10–15 | The Processing | pulp dissolves, parchment peels, wet beans drop into a rippling wash channel and are tracked downstream |
| 04 | 15–20 | The Green Bean | extreme-macro orbit of one green bean, then a drying bed is revealed in a depth wave |
| 05 | 20–27 | The Roast | roaster lid opens, beans pour into a perforated rotating drum, roast green→tan→brown→dark with first-crack pops, embers, heat shimmer |
| 06 | 27–32 | The Transformation | roasted bean splits into many (slow-mo burst), one flies to camera |
| 07 | 32–37 | The Grind | beans consumed by a conical burr, 16 000-grain stream of grounds builds a mound |
| 08 | 37–45 | The Brew | tamp, twist-lock, pressure gauge, first drops, viscous espresso column, cup fills |
| 09 | 45–55 | The Cup | crema forms, heart latte-art, steam, elegant orbit + pull-back |
| 10 | 55–60 | The Circle | a bean appears beside the cup → circular cut back to the plantation → title lock-up |

Typography uses only the supplied wording (Cormorant Garamond + Inter, bundled via `@fontsource`).

## Architecture

```
src/
  animation/
    masterTimeline.js     absolute-time GSAP master timeline (typography + colour grade), scene table, text cues
    clockStore.js         transport state: time, play/pause, speed, quality, aspect, camera mode
    cameraChoreography.js keyframed Hermite camera (position / look-at / fov / focus / aperture) + orbit helper
    transitionSystem.js   the 9 match-cut transitions (hero-sized iris, colour, radial motion blur)
    lighting.js           keyframed lighting rig (golden hour → roaster glow → studio → cup)
    backdrops.js          per-scene gradient dome + bokeh
    beanTransformation.js instanced bean fields + roast curve (first-crack event)
    particleAnimation.js  GPU particle fields (dust, grounds stream, burst, embers) – analytic in (seed, t)
    liquidAnimation.js    espresso extraction timeline (drops → column → fill → crema → latte art)
    exporter.js           frame-accurate offline MP4 export (WebCodecs + mp4-muxer)
  components/             CoffeePlant, CoffeeFlower, CoffeeCherry, Green/RoastedCoffeeBean, CoffeeRoaster,
                          CoffeeGrinder, CoffeeGrounds, EspressoMachine, EspressoLiquid, CoffeeCup, SteamSystem,
                          WaterTrough, CinematicCamera, Typography, Film (renderer + post pipeline)
  scenes/                 Scene01 … Scene10 (pure functions of absolute time)
  shaders/                bean (green↔roasted), cherry, espresso, crema, steam, backdrop, DoF, grade/iris
  audio/                  soundTimeline.js (cue sheet) + audioEngine.js (procedural score + SFX)
  interface/              PreviewControls, Timeline, SceneSelector, PlaybackMode, ExportPanel
```

### Determinism

Every animated value is a pure function of the absolute time `t`: scenes receive `t` each frame, GSAP is
scrubbed with `master.time(t)`, particles are analytic in `(seed, uTime)`, beans in the roaster/grinder are
evaluated parametrically (no physics integration, no `Math.random`, seeded PRNG only). So the film can be rendered at
any timestamp, in any order — the scrubber, scene buttons, frame stepping and the offline exporter all use the same path.

### Render pipeline (Film.jsx)

scene → HDR half-float target (4× MSAA on *High*, with depth texture) → depth-of-field (thin-lens CoC from the depth
texture, golden-angle bokeh gather) → mild bloom (*High*) → ACES tone-map + grade + iris match-cut + radial motion blur +
heat shimmer + vignette + grain.
Quality presets: **Low** (no DoF/bloom/shadows/MSAA) · **Medium** (DoF) · **High** (DoF + bloom + MSAA + shadow maps, DPR ≤ 2).

### Materials

`MeshPhysicalMaterial` patched with GLSL via `onBeforeCompile` (`shaders/chunks.js`): derivative-based procedural bump,
no texture files. Bean = one material with `uRoast` (colour ramp, oiliness/clear-coat, groove darkening, crack lines,
surface expansion); cherry = ripeness ramp + clear-coat + fake sub-surface rim; espresso = vertex-animated viscous column
with backlit amber; crema = domain-warped swirl, bubbles, heart-in-heart art; brushed steel = stretched-noise anisotropy.

## Controls

Play/pause, restart, ±1 frame, speed 0.1–2×, quality (+ auto step-down), scene loop (individual scene playback), 16:9 / 9:16 / 1:1 preview, full-screen, free-look camera
(drag / wheel), scene selector, frame-accurate scrubber with timecode + frame counter, sound cue sheet, clean
**Cinematic mode** (no UI; click = pause, Esc = exit), Export.
Keys: `Space` play, `←/→` frame (Shift = 10), `[` `]` scene, `F` full-screen, `C` cinematic.

## Export

*Export → MP4* renders all 1 800 frames **offline at exact timestamps** (not a screen recording), encodes with WebCodecs
(H.264 or VP9 — selectable) and muxes MP4 (+ AAC audio, or Opus where AAC encoding is unavailable): 1920×1080 (16:9),
1080×1920 (9:16), 1080×1080 (1:1). *Save current frame* writes a PNG of the exact frame including typography.
Tested in this repo (headless Chromium, software GL): a VP9+Opus MP4 export produced valid video/audio streams that `ffprobe` could read, with the typography composited into the frames. The H.264 path could not be validated there (that headless build reports H.264 as supported but writes an unreadable file), so if an H.264 export does not play, re-export with *VP9*.
Limits: needs a Chromium browser with WebCodecs and a GPU (a full 1080p export is roughly real-time-or-slower).
Without WebCodecs, drive `window.__film.filmApi.renderAt(t, w, h)` yourself to capture a frame sequence.

## Sound — honest status

There are **no recorded audio files**. `audio/audioEngine.js` synthesizes a 60 s score (pads, kalimba-style arpeggio,
frame-drum, shaker, bells) and ~35 SFX cues (birds, wind, water, roaster drum, crackle, grinder, espresso pump, liquid,
ceramic clink, steam, signature chime) with Web Audio, pre-rendered once in an `OfflineAudioContext` and played from the
scrub position, so sound cues align to the frames (`audio/soundTimeline.js` is the cue sheet, with the placeholder file
names a sound designer would replace them with). The mix was verified to render non-silent with a rising level curve but
was **not auditioned by ear** during development — treat it as a structured draft score.

## Known limitations / honest notes

* Photorealism is procedural: surfaces are convincing PBR with shader detail, not scanned assets. No true fluid or granular
  simulation — liquid is a vertex-animated column + droplets + analytic fill; grounds are analytic GPU particles.
* Depth of field is screen-space; transparent objects (steam, glass, water) do not write depth, so they blur like the background.
* First load compiles shaders for every scene (a progress overlay runs a warm-up pass); the soundtrack renders in the background.
* Real-time 1080p/High needs a discrete or recent integrated GPU. Use *Medium/Low* on weak hardware; export is unaffected.
