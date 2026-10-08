# CanPlus – "One platform. Every learning journey."

A 20 s (24 fps) procedural Blender animation: the CanPlus mark sits at the centre of a 3D learning
ecosystem; laptop, mobile, graduation cap, certificate, AI brain, analytics chart, video and books
orbit it, connect with glowing data lines, collapse back into the logo and resolve to the real logo.

| Time | Beat |
|------|------|
| 0–3 s | Dark void, small glowing CanPlus mark, slow camera dolly-in |
| 3–6 s | Mark expands into the hub; 8 objects emerge and orbit on 3 rings |
| 6–12 s | Glowing lines tie each object to the hub, data packets flow; `LEARNER → CANPLUS → COURSE → ASSESSMENT → CERTIFICATION` pulse |
| 12–16 s | Objects spiral inward, flash, mark pops to full-screen |
| 16–20 s | "One platform." / "Every learning journey." / CANPLUS / real logo |

Files
- `build_canplus.py` – builds the whole scene + animation (everything is keyframed per frame; saves `out/canplus.blend`).
- `render.sh` – renders PNG frames (Cycles) and encodes `canplus_ecosystem.mp4`.
- `assets/canplus_logo.png` – the supplied logo, cropped and 8x upscaled (used on the end card).
- `canplus_ecosystem.mp4` – rendered preview (1280×720).

Env vars: `CP_RES` (width), `CP_SAMPLES`, `CP_FRAMES=1-480`, `CP_STILL=240` (render one frame), `CP_ENGINE`.
Open `out/canplus.blend` in Blender to scrub the timeline or tweak materials/camera.

Note: the supplied logo is only 225 px wide, so the end card is a soft upscale. Send an SVG/PNG at 1000 px+ to
swap it in (`assets/canplus_logo.png`) for a crisp final frame.
