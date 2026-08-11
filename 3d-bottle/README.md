# Futuristic 3D Bottle

An interactive Three.js scene rendering a glowing, warm-toned futuristic
bottle — glass-like lathe-geometry body, an emissive liquid core, neon
neck rings, a glowing pedestal, bloom post-processing, and drifting warm
particles.

## Viewing

Just open `index.html` in a modern browser (Three.js is vendored locally
under `vendor/three/` and loaded via an import map, so no build step,
install, or network access is required):

```bash
python3 -m http.server -d 3d-bottle 8000
# then open http://localhost:8000
```

Or simply double-click `index.html` to open it directly (some browsers
restrict ES module imports over `file://`, so serving it locally is the
more reliable option).

Drag to orbit the camera, scroll to zoom. The scene auto-rotates slowly
on its own.
