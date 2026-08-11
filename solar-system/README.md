# 3D Solar System

An interactive Three.js scene with the Sun and all nine planets (Mercury
through Pluto) orbiting on individual paths, each spinning on its own
axis. Saturn has a ring, Earth has a moon, and the Sun glows via bloom
post-processing against a starfield background. Hover a planet to see
its name.

Orbit distances and planet sizes are scaled for a clear, legible view
rather than true astronomical scale (real distances would make the
inner planets invisible next to Neptune's orbit). Orbital speed falls
off with distance in a rough Kepler-like way, so outer planets move
more slowly than inner ones.

## Viewing

Three.js is vendored locally under `vendor/three/` and loaded via an
import map, so no build step, install, or network access is required.
Serve the folder locally (some browsers restrict ES module imports over
`file://`):

```bash
python3 -m http.server -d solar-system 8000
# then open http://localhost:8000
```

Drag to orbit the camera, scroll to zoom. The scene auto-rotates slowly
on its own.
