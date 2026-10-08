# CanPlus – 3D Learning Ecosystem (Blender)

20-second cinematic animation: a CanPlus logo hub with learners, institution, courses, AI, analytics and
certifications orbiting and connecting to it, collapsing back into the logo and ending on the tagline + lockup.

| Time | Beat |
|------|------|
| 0–3 s | Dark environment, small glowing logo appears, camera dollies in |
| 3–6 s | Logo expands into a hub; laptop, mobile, cap, certificate, AI brain, analytics chart, video, books emerge and orbit |
| 6–12 s | Glowing data lines connect every object to the hub; pulses flow along the chain Learner → CanPlus → Course → Analytics → Certification |
| 12–16 s | Objects spiral inward, impact flash + shockwave, logo grows large |
| 16–20 s | "One platform." / "Every learning journey." then the CanPlus logo lockup |

## Files
- `build_scene.py` – builds the fully keyframed scene (`canplus_ecosystem.blend`). Needs `bpy`, `shapely`, `mapbox-earcut`.
- `cp_objects.py`, `cp_util.py` – the 8 hero objects, materials and helpers.
- `logo_geometry.py`, `fit_logo.py` – vector CanPlus mark fitted to `canplus_logo_reference.png`.
- `render_frames.py` → `post.py` (bloom, tone-map, vignette, chromatic aberration, grain) → ffmpeg; `run_all.sh` runs everything.
- `preview.py` – quick still previews.

Rendered with Cycles on CPU at 1280×720/24fps. For 1080p/30fps: `CP_RES=1920x1080 CP_FPS=30 CP_SAMPLES=48` (needs a GPU or a lot of time).
