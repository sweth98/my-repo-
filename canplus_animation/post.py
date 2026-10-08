"""Linear EXR -> graded PNG: bloom, filmic tone-map, vignette, chromatic aberration, film grain.
   python post.py indir outdir [start end]      (frames named NNNN.exr)
"""
import os, sys, glob
import cv2
import numpy as np
import OpenEXR

FPS = int(os.environ.get('CP_FPS', 30))

def tonemap(x):
    # ACES fitted (Narkowicz) per channel -> naturally desaturates hot highlights
    a, b, c, d, e = 2.51, 0.03, 2.43, 0.59, 0.14
    return np.clip((x * (a * x + b)) / (x * (c * x + d) + e), 0, 1)

def bloom(img, h):
    k = h / 1080.0
    lum = np.maximum(img - 0.9, 0.0)           # only real highlights
    out = np.zeros_like(img)
    for sigma, w in ((3, 0.30), (8, 0.35), (22, 0.40), (60, 0.20), (150, 0.16)):
        s = max(1.0, sigma * k)
        out += w * cv2.GaussianBlur(lum, (0, 0), s)
    return out

_cache = {}
def lens_maps(w, h):
    if (w, h) in _cache:
        return _cache[(w, h)]
    ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
    cx, cy = (w - 1) / 2, (h - 1) / 2
    dx, dy = (xs - cx) / cx, (ys - cy) / cx
    r2 = dx * dx + dy * dy
    maps = []
    for amt in (1.0 + 0.0030, 1.0, 1.0 - 0.0030):   # R expands, B contracts
        sc = 1 + (amt - 1) * r2 * 1.0 / max(r2.max(), 1e-6) * 1.0
        maps.append((cx + dx * amt * cx, cy + dy * amt * cx))
    vig = 1.0 - 0.38 * np.clip(r2 / r2.max(), 0, 1) ** 1.3
    _cache[(w, h)] = (maps, vig.astype(np.float32))
    return _cache[(w, h)]

def process(path, frame, out_path):
    img = OpenEXR.File(path).channels()["RGBA"].pixels[..., :3].astype(np.float32)   # RGB linear
    h, w = img.shape[:2]
    img = np.nan_to_num(img, nan=0.0, posinf=50.0)
    img = np.minimum(img, 60.0)
    img = img + bloom(img, h) * 0.85
    t = (frame - 1) / FPS
    img *= min(1.0, t / 0.45 + 0.02) ** 1.5          # gentle fade-in from black
    maps, vig = lens_maps(w, h)
    chans = []
    for c, (mx, my) in zip(range(3), maps):
        chans.append(cv2.remap(img[..., c], mx.astype(np.float32), my.astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE))
    img = np.stack(chans, -1)
    img *= vig[..., None]
    out = tonemap(img * 1.05)
    out = out ** (1 / 2.2)                              # display gamma
    # slight saturation & contrast curve
    lum = out.mean(-1, keepdims=True)
    out = np.clip(lum + (out - lum) * 1.12, 0, 1)
    out = out * out * (3 - 2 * out) * 0.35 + out * 0.65
    rng = np.random.default_rng(frame)
    out += rng.normal(0, 0.010, out.shape).astype(np.float32) * (0.4 + 0.6 * (1 - out))   # grain, stronger in shadows
    out = np.clip(out, 0, 1)
    cv2.imwrite(out_path, (out[..., ::-1] * 255 + 0.5).astype(np.uint8))

if __name__ == "__main__":
    indir, outdir = sys.argv[1], sys.argv[2]
    os.makedirs(outdir, exist_ok=True)
    files = sorted(glob.glob(os.path.join(indir, "*.exr")))
    lo = int(sys.argv[3]) if len(sys.argv) > 3 else 0
    hi = int(sys.argv[4]) if len(sys.argv) > 4 else 10 ** 9
    for p in files:
        f = int(os.path.basename(p)[:4])
        if lo <= f <= hi:
            o = os.path.join(outdir, f"{f:04d}.png")
            if not os.path.exists(o):
                process(p, f, o)
                print("post", f, flush=True)
