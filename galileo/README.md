# Galileo's Law of the Inclined Plane

A 22-second 3D animation of a ball rolling down a slope, demonstrating that
distance grows as the **square** of elapsed time, and that successive equal
times cover distances in the ratio **1 : 3 : 5 : 7**.

**Output:** `galileo-inclined-plane.mp4` — 1280×720, 30 fps, H.264, ~1.5 MB.

## What it shows

| Time | Beat |
|---|---|
| 0:00 | Title card |
| 0:03 | Ball released from rest; a gate drops at every second of travel |
| 0:07 | The gates stand at 1, 4, 9 and 16 m — the squares of 1, 2, 3, 4 |
| 0:09 | s ∝ t² stated against the measured table |
| 0:11 | Odd-number rule: the gaps between gates are 1, 3, 5, 7 |
| 0:14 | Two spheres of different mass and size, released together, stay level |
| 0:19 | Recap card |

## The physics

A solid sphere rolling without slipping down an incline accelerates at

```
a = (5/7) · g · sin θ
```

The 5/7 is the rolling correction: some of the released potential energy goes
into spin rather than forward motion, so a rolling ball accelerates more slowly
than a sliding block (which would give `a = g sin θ`).

The scene pins **a = 2.00 m/s²** and derives the angle from it
(θ = 16.59°) rather than the other way round. That is the honest inverse of the
same formula, and it makes `s = t²` exactly — so the gates land on 1, 4, 9 and
16 m instead of 1.0009, 4.0037, 9.0084, 16.0149. Distances are computed from
`s = ½at²` every frame; nothing is hand-placed.

Both the t² law and the odd-number rule hold for *any* constant acceleration —
which is precisely why Galileo could use a slow incline to measure a law that
also governs free fall. The incline dilutes gravity without changing its form.

Neither mass nor radius appears in the acceleration, so the two spheres in the
final act tie. That is specific to solid spheres: a hollow sphere gives
`a = (3/5) g sin θ` and would lose.

Drag and rolling resistance are neglected.

## Rebuilding the video

Requires Node 18+ and ffmpeg (`apt install ffmpeg`).

```bash
npm install
npm run setup              # copies three.js into vendor/
npm run serve &            # static server on :4190
npm run capture            # renders 660 PNG frames to frames/
npm run encode             # frames/ -> galileo-inclined-plane.mp4
```

Preview a handful of moments without rendering the whole take:

```bash
node preview.mjs /tmp "0,5,9,13,17,21"
```

If Chromium is already on disk, point at it rather than downloading:
`CHROMIUM_PATH=/path/to/chromium npm run capture`.

## How the rendering works

`scene.html` exposes `window.__setTime(t)`, which positions the camera, ball,
gates, highlight bands and every HUD element as a **pure function of `t`** and
renders exactly one frame. Nothing is driven by `requestAnimationFrame` or the
wall clock.

That purity is the whole trick: `capture.mjs` can step `t` in exact 1/30 s
increments and screenshot each result, so the output has a rigid frame rate no
matter how slowly the software rasteriser runs. Recording a live canvas in a
headless browser gives variable-rate, dropped-frame output instead.

It also means any frame can be rendered in isolation — which is what
`preview.mjs` relies on, and why a bug where the caption's opacity persisted
across frames instead of being set from `t` had to be fixed.

Layout is split by strength: the 3D scene carries the physical demonstration,
while captions, the readout and the numeric tables are DOM elements over the
canvas, so the typography stays crisp at any resolution.

## Files

```
scene.html     the whole animation - geometry, timeline, HUD
capture.mjs    steps t frame by frame and screenshots each one
preview.mjs    renders a few named timestamps for quick iteration
vendor/        three.js build, populated by `npm run setup` (gitignored)
```
