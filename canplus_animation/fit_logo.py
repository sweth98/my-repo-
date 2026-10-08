"""Fit logo_geometry.PARAMS to the reference PNG with a coordinate-descent IoU search."""
import numpy as np, math, random
from PIL import Image, ImageDraw
import logo_geometry as lg

im = np.array(Image.open("canplus_logo_reference.png").convert("RGB")).astype(int)
r, g, b = im[..., 0], im[..., 1], im[..., 2]
x0, y0, x1, y1 = 15, 75, 95, 145          # icon crop
blue = ((b - r) > 90) & (g > 80)
purple = (abs(r - 98) < 40) & (abs(g - 72) < 40) & (b > 140) & ((b - g) > 70)
blue_m = blue[y0:y1, x0:x1]; pur_m = purple[y0:y1, x0:x1]
print("mask px", blue_m.sum(), pur_m.sum())
ys, xs = np.where(blue_m | pur_m)
print("bbox", xs.min(), xs.max(), ys.min(), ys.max())
S = 4  # supersample
W, H = (x1 - x0), (y1 - y0)

def raster(poly, s, cx, cy):
    img = Image.new("L", (W * S, H * S), 0)
    d = ImageDraw.Draw(img)
    polys = [poly] if poly.geom_type == "Polygon" else list(poly.geoms)
    for pg in polys:
        pts = [((cx + x * s - 0) * S, (cy - y * s) * S) for x, y in pg.exterior.coords]
        d.polygon(pts, fill=255)
    a = np.array(img.resize((W, H), Image.BOX)) / 255.0
    return a

def score(p, s, cx, cy):
    lg.PARAMS.update(p)
    A = raster(lg.hex_c_polygon(p), s, cx, cy); B = raster(lg.plus_polygon(p), s, cx, cy)
    def iou(a, m):
        m = m.astype(float); return (np.minimum(a, m).sum()) / (np.maximum(a, m).sum() + 1e-9)
    return iou(A, blue_m) + iou(B, pur_m)

p = dict(lg.PARAMS); p["top_end"] = list(p["top_end"]); p["bot_end"] = list(p["bot_end"]); p["plus_c"] = list(p["plus_c"])
s = 26.5; cx = 31.5 + 0; cy = 35.0   # px per unit, hex centre in crop px
best = score(p, s, cx, cy); print("start", best)
random.seed(1)
def get(k): 
    return {"Rc":p["Rc"],"t":p["t"],"tex":p["top_end"][0],"tey":p["top_end"][1],"bex":p["bot_end"][0],"bey":p["bot_end"][1],"pcx":p["plus_c"][0],"pcy":p["plus_c"][1],"pl":p["plus_len"],"pt":p["plus_t"],"s":s,"cx":cx,"cy":cy}[k]
keys = ["Rc","t","tex","bex","pcx","pcy","pl","pt","s","cx","cy"]
step = {"Rc":.03,"t":.02,"tex":.04,"bex":.04,"pcx":.03,"pcy":.03,"pl":.04,"pt":.02,"s":1.0,"cx":.8,"cy":.8}
def apply(k, v):
    global s, cx, cy
    if k=="Rc": p["Rc"]=v
    elif k=="t": p["t"]=v
    elif k=="tex": p["top_end"][0]=v
    elif k=="bex": p["bot_end"][0]=v
    elif k=="pcx": p["plus_c"][0]=v
    elif k=="pcy": p["plus_c"][1]=v
    elif k=="pl": p["plus_len"]=v
    elif k=="pt": p["plus_t"]=v
    elif k=="s": s=v
    elif k=="cx": cx=v
    elif k=="cy": cy=v
for it in range(14):
    for k in keys:
        for d in (+1, -1):
            old = get(k); apply(k, old + d * step[k])
            sc_ = score(p, s, cx, cy)
            if sc_ > best: best = sc_
            else: apply(k, old)
    for k in step: step[k] *= 0.7
    print(it, round(best, 4))
print({"Rc":p["Rc"],"t":p["t"],"top_end":p["top_end"],"bot_end":p["bot_end"],"plus_c":p["plus_c"],"plus_len":p["plus_len"],"plus_t":p["plus_t"]}, "s",s,"cx",cx,"cy",cy)
