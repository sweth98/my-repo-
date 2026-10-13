# THE MATRIX — digital rain

An interactive Three.js digital-rain world. No build step, no backend, no API keys.
Three.js (r170) is vendored in `vendor/three`, so it also works offline.

## Run

ES modules need an HTTP server (not `file://`). From this folder:

```bash
python3 -m http.server 8000      # then open http://localhost:8000
```

Optional URL flags: `?quality=low|med|high` (fixes quality, disables auto-downgrade), `?noauto`, `?debug` (exposes `window.matrix`).

## Controls

| Input | Action |
| --- | --- |
| Mouse move | subtle parallax |
| Drag | look around (clamped angles) |
| Scroll | move forward / backward through the code |
| Double-click / double-tap | enter a deeper layer |
| Space | pause / resume |
| R | reset camera and scene |
| F | fullscreen |
| 1 / 2 / 3 | Digital Rain / Deep System / Glitch Mode |
| M | mute |
| `/` or Enter | focus console |
| H | hide / show the control guide |

Console commands: `help`, `status`, `glitch`, `slow`, `fast`, `clear`, plus `mode <rain|deep|glitch>`, `converge`, `alert`, `dive`, `pause`, `mute`, `reset`.

## How it works

- `js/shaders.js` — rain is generated per fragment (no per-character geometry): each column hashes its own speed, length, density, pauses and glyph mutation rate. Heads are white-green, trails fade to dark emerald.
- `js/scene.js` — 8 depth layers (planes) that wrap endlessly along z, with per-layer fog and mip-based depth of field; yaw/pitch/parallax rig; bloom + scanline/vignette/glitch post pass. Adaptive quality lowers resolution/layers/bloom if the frame rate drops.
- `js/events.js` — boot, reality glitch, code convergence and system alert, scheduled on simulation time (so Space pauses them too).
- `js/modes.js` — mode presets that blend smoothly into the live scene.
- `js/audio.js` — synthesised WebAudio (hum, keystrokes, startup tones, glitch); starts only after pressing Start; mute is persisted.
- `js/fallback.js` — 2D canvas rain when WebGL2 is unavailable.
