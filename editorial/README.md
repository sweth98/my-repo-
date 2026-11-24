# From Bean to Brew: The Life of a Cup of Coffee

60 s editorial motion-graphics explainer. React + GSAP + HTML/CSS/SVG. 1920×1080 @ 30 fps and a 9:16 (1080×1920) composition.

```bash
npm install
npm run dev            # http://127.0.0.1:5174  (?clean=1 hides controls, ?fmt=v for 9:16)
node render.mjs --fmt h   # deterministic MP4 (needs Playwright + Chromium + ffmpeg)
node render.mjs --fmt v
```

## Structure
- `src/engine.js`: reusable animation vocabulary (`enter`, `exit`, `words`, `wordsOut`, `draw`, `arrow`, `parallax`, `bar`, `wipeTransition`, `discTransition`, `liquidTransition`, `colourCover`). Each call records start/end/entrance/hold/exit/ease/layer in a registry (the *Timeline spec* panel / "Export spec JSON").
- `src/scenes/s1..s7.jsx`: one file per scene (S7 also holds the ending, S8). Each exports `Scene()` (layout for both formats) and `build(tl, ctx)` (the timeline).
- `src/art.jsx`: original SVG cutouts (bean, cherry, leaves, cup, grinder, espresso machine, map) and label system.
- `src/audio.js`: procedural soundtrack and SFX (WebAudio). Same scheduler drives live playback and offline WAV render.
- `public/img/`: photographic stills taken from the supplied reference clips.

## Scene times
01 Question 0-6 · 02 Where it begins 6-13 · 03 Inside the cherry 13-19 · 04 Transformation 19-29 · 05 Grind 29-37 · 06 Brew 37-47 · 07 Final cup 47-56 · 08 Ending 56-60

## Notes
- All animation is a single paused GSAP timeline, so scrubbing to any time is deterministic.
- Map: Natural Earth land (via `world-atlas`); tropics at ±23.44°. No statistics are shown.
- Photos are stills from the reference videos you supplied; check rights before publishing.
