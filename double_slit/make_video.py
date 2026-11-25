#!/usr/bin/env python3
"""Render an animated explainer of Young's double-slit experiment.

Physics is computed, not faked: each slit is a row of Huygens point sources and
the displayed field is the real superposition cos(k*r - w*t)/sqrt(r).  The
photon phase samples hits from the true two-slit intensity.

Usage: python3 make_video.py [out.mp4] [--stills t1,t2,...]
Requires numpy, pillow and an ffmpeg binary on PATH.
"""
import subprocess
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

# ------------------------------------------------------------------ settings
W, H, FPS, DUR = 1280, 720, 30, 30.0
S = 2  # overlay supersampling for anti-aliased lines/text

LAM, PERIOD = 28.0, 0.6  # wavelength (px), temporal period (s)
K, OMEGA = 2 * np.pi / LAM, 2 * np.pi / PERIOD
BX, SX, CY = 300, 800, 360  # barrier x, screen x, axis y
D, SW = 150, 14  # slit separation, slit width
TOP, BOT = 110, 610  # field region (y)
X0 = 40  # field region left edge
BG = np.array([8, 12, 28], np.float32)

T_SINGLE, T_OPEN, T_OPEN_END = 3.0, 8.0, 9.5
T_ANNOT, T_Q, T_PHOT, T_PHOT_END, T_END = 13.0, 16.0, 19.0, 27.0, 27.0
N_PHOTONS, FLIGHT = 2000, 0.35

FONT_R = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_B = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
_fonts = {}


def font(size, bold=False):
    key = (size, bold)
    if key not in _fonts:
        _fonts[key] = ImageFont.truetype(FONT_B if bold else FONT_R, int(size * S))
    return _fonts[key]


def clamp01(x):
    return float(min(1.0, max(0.0, x)))


def ramp(t, a, b):
    x = clamp01((t - a) / (b - a))
    return x * x * (3 - 2 * x)


# ------------------------------------------------------------ wave physics
ys = np.arange(TOP, BOT, dtype=np.float32)
xr = np.arange(BX + SW // 2 + 1, SX, dtype=np.float32)  # right of barrier
xl = np.arange(X0, BX - SW // 2, dtype=np.float32)  # left of barrier
YY, XX = np.meshgrid(ys, xr, indexing="ij")


def slit_field(yc):
    acc = np.zeros(YY.shape, np.complex64)
    for off in np.linspace(-SW / 2 + 2, SW / 2 - 2, 5):
        r = np.hypot(XX - (BX + SW // 2), YY - (yc + off))
        acc += np.exp(1j * K * r) / np.sqrt(r + 150.0)
    return acc


Y1, Y2 = CY - D / 2, CY + D / 2
A1, A2 = slit_field(Y1), slit_field(Y2)
COL1, COL2 = A1[:, -1], A2[:, -1]
I2 = np.abs(COL1 + COL2) ** 2
IMAX = float(I2.max())
REF = float(np.sqrt(IMAX))

# colour map: indigo trough -> dark -> amber crest
_v = np.linspace(-1, 1, 512)
_neg, _mid, _pos = np.array([40, 100, 235.0]), BG, np.array([255, 205, 90.0])
LUT = np.where(
    (_v < 0)[:, None],
    _mid + (_neg - _mid) * (np.abs(_v) ** 0.85)[:, None],
    _mid + (_pos - _mid) * (np.abs(_v) ** 0.85)[:, None],
).astype(np.float32)


def field_rgb(t, amp1, amp2):
    ph = OMEGA * t
    left = 0.8 * np.cos(K * xl - ph)
    left = left * np.clip((xl - X0) / 60.0, 0, 1)  # soft source edge
    right = np.real(np.exp(-1j * ph) * (amp1 * A1 + amp2 * A2)) / REF
    left_img = np.broadcast_to(left, (len(ys), len(xl)))
    gap = np.zeros((len(ys), SW + 1), np.float32)
    f = np.concatenate([left_img, gap, right], axis=1)
    f = np.tanh(1.05 * f)
    idx = ((f + 1) * 0.5 * 511).astype(np.int32)
    return LUT[idx]


# ----------------------------------------------------------------- photons
rng = np.random.default_rng(7)
cdf = np.cumsum(I2) / I2.sum()
hit_y = ys[np.searchsorted(cdf, rng.random(N_PHOTONS)).clip(0, len(ys) - 1)]
hit_y = hit_y + rng.random(N_PHOTONS)  # sub-pixel scatter
hit_x = rng.random(N_PHOTONS)  # position across detector strip (0..1)
from_slit = rng.integers(0, 2, N_PHOTONS)
tau = (np.arange(1, N_PHOTONS + 1) / N_PHOTONS) ** (1 / 2.2)
hit_t = T_PHOT + 1.2 + (T_PHOT_END - T_PHOT - 1.8) * tau + FLIGHT
STRIP_X0, STRIP_W = SX + 8, 110
HIST_X0, HIST_W = SX + 150, 270
BIN = 6
nbins = (BOT - TOP) // BIN
exp_hist = np.add.reduceat(I2, np.arange(0, len(I2), BIN))[:nbins]
exp_hist = exp_hist / exp_hist.sum() * N_PHOTONS
state = {"canvas": np.zeros((BOT - TOP, STRIP_W), np.float32), "ptr": 0,
         "hist": np.zeros(nbins, np.float32)}


def reset_state():
    state["canvas"][:] = 0
    state["ptr"] = 0
    state["hist"][:] = 0


def advance_hits(t):
    while state["ptr"] < N_PHOTONS and hit_t[state["ptr"]] <= t:
        i = state["ptr"]
        yy = int(hit_y[i] - TOP)
        xx = int(hit_x[i] * (STRIP_W - 3))
        if 0 <= yy < BOT - TOP - 1:
            state["canvas"][yy:yy + 2, xx:xx + 2] += 1.0
            b = min(nbins - 1, yy // BIN)
            state["hist"][b] += 1
        state["ptr"] += 1


# --------------------------------------------------------------- overlay UI
def txt(d, x, y, s, size, fill=(235, 240, 255), a=1.0, anchor="la", bold=False):
    d.text((x * S, y * S), s, font=font(size, bold), anchor=anchor,
           fill=(*fill, int(255 * a)))


def line(d, p, q, fill, width=2, a=1.0):
    d.line([p[0] * S, p[1] * S, q[0] * S, q[1] * S], fill=(*fill, int(255 * a)),
           width=int(width * S))


def rect(d, x0, y0, x1, y1, fill, a=1.0, r=0):
    box = [x0 * S, y0 * S, x1 * S, y1 * S]
    if r:
        d.rounded_rectangle(box, radius=r * S, fill=(*fill, int(255 * a)))
    else:
        d.rectangle(box, fill=(*fill, int(255 * a)))


def dot(d, x, y, r, fill, a=1.0):
    d.ellipse([(x - r) * S, (y - r) * S, (x + r) * S, (y + r) * S],
              fill=(*fill, int(255 * a)))


def arrow(d, p, q, fill, width=2, a=1.0):
    line(d, p, q, fill, width, a)
    v = np.array(q, float) - np.array(p, float)
    n = v / (np.hypot(*v) + 1e-9)
    nx = np.array([-n[1], n[0]])
    for sgn in (1, -1):
        tip = np.array(q, float) - n * 10 + nx * 5 * sgn
        line(d, q, tuple(tip), fill, width, a)


CAPTIONS = [
    (T_SINGLE, T_OPEN, "1 · One slit open",
     "Light passing through a single slit diffracts and spreads into one broad band."),
    (T_OPEN, T_ANNOT, "2 · Open the second slit",
     "Now two wave sources overlap. Their waves interfere and the band splits into fringes."),
    (T_ANNOT, T_PHOT, "3 · Why the fringes appear",
     "Crest meets crest: waves add, bright. Crest meets trough: waves cancel, dark."),
    (T_PHOT, T_END, "4 · One photon at a time",
     "Each photon lands as a single dot, yet the dots build up the same interference fringes."),
]


def peaks():
    """Indices of the first bright fringe above the axis and the dark fringe between."""
    c = int(CY - TOP)
    pk = [i for i in range(2, len(I2) - 2)
          if I2[i] > I2[i - 1] and I2[i] >= I2[i + 1] and I2[i] > 0.3 * IMAX]
    above = [i for i in pk if i < c - 15]
    p1 = max(above)
    center = min(pk, key=lambda i: abs(i - c))
    seg = I2[p1:center]
    q = p1 + int(np.argmin(seg))
    return TOP + p1, TOP + q


YP, YQ = peaks()


def overlay(t, amp2):
    big = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
    d = ImageDraw.Draw(big)
    steel, edge = (150, 162, 185), (215, 225, 245)
    slit1_c, slit2_c = (Y1, Y2)

    # panel frame around field
    d.rectangle([X0 * S, TOP * S, SX * S, BOT * S], outline=(70, 85, 120, 255),
                width=2 * S)

    # barrier with two slits
    bx0, bx1 = BX - SW // 2, BX + SW // 2
    segs = [(TOP, Y1 - SW / 2), (Y1 + SW / 2, Y2 - SW / 2), (Y2 + SW / 2, BOT)]
    for a_, b_ in segs:
        rect(d, bx0, a_, bx1, b_, steel)
    if amp2 < 0.999:  # slit 2 blocked
        rect(d, bx0, Y2 - SW / 2, bx1, Y2 + SW / 2, steel, a=1 - amp2)
    # screen
    rect(d, SX, TOP, SX + 5, BOT, edge)

    # labels
    txt(d, X0 + 8, TOP + 8, "Coherent light", 15, (255, 215, 140))
    arrow(d, (X0 + 8, TOP + 40), (X0 + 90, TOP + 40), (255, 215, 140))
    txt(d, BX, TOP - 10, "Barrier", 15, edge, anchor="ms")
    txt(d, SX + 4, TOP - 10, "Screen", 15, edge, anchor="rs")
    # slit separation d
    xd = BX - 26
    line(d, (xd, Y1), (xd, Y2), (170, 230, 255), 2)
    for yy in (Y1, Y2):
        line(d, (xd - 6, yy), (xd + 6, yy), (170, 230, 255), 2)
    txt(d, xd - 10, CY, "d", 20, (170, 230, 255), anchor="rm", bold=True)
    # distance L above field
    ay = TOP - 34
    arrow(d, (BX + 4, ay), (SX - 2, ay), (170, 230, 255), 2)
    arrow(d, (SX - 2, ay), (BX + 4, ay), (170, 230, 255), 2)
    txt(d, (BX + SX) / 2, ay - 4, "L", 20, (170, 230, 255), anchor="ms", bold=True)

    # title (persistent small)
    if t > 3.0:
        txt(d, 40, 22, "Young's Double-Slit Experiment", 26, (255, 255, 255),
            a=ramp(t, 3.0, 3.8), bold=True)

    # caption
    for a_, b_, head, body in CAPTIONS:
        if a_ <= t < b_ or (b_ == T_END and t >= a_):
            fade = ramp(t, a_, a_ + 0.6)
            if b_ == T_END:
                fade *= 1 - ramp(t, T_END, T_END + 0.6)
            rect(d, 0, 636, W, H, (6, 9, 22), a=0.78 * fade)
            txt(d, 40, 648, head, 22, (255, 205, 100), a=fade, bold=True)
            txt(d, 40, 680, body, 20, (232, 238, 255), a=fade)

    # ---- scene C: ray annotations
    if T_ANNOT <= t < T_PHOT:
        for (yt, kind, t0, t1) in ((YP, "P", T_ANNOT, T_Q), (YQ, "Q", T_Q, T_PHOT)):
            if not (t0 <= t < t1):
                continue
            f = min(ramp(t, t0, t0 + 0.6), 1 - ramp(t, t1 - 0.5, t1)) if kind == "P" \
                else ramp(t, t0, t0 + 0.6)
            p1_ = (BX + SW // 2, Y1)
            p2_ = (BX + SW // 2, Y2)
            P = (SX, yt)
            line(d, p1_, P, (90, 230, 255), 3, a=f)
            line(d, p2_, P, (255, 120, 200), 3, a=f)
            col = (120, 255, 160) if kind == "P" else (255, 130, 130)
            dot(d, SX, yt, 9, col, a=f)
            r1 = np.hypot(SX - p1_[0], yt - p1_[1])
            r2 = np.hypot(SX - p2_[0], yt - p2_[1])
            delta = abs(r2 - r1) / LAM
            if kind == "P":
                head, sub = "Bright fringe", "constructive interference"
                rule = f"path difference = {round(delta):d} λ  (m = {round(delta):d})"
            else:
                head, sub = "Dark fringe", "destructive interference"
                rule = f"path difference = {delta:.1f} λ  (half a wavelength)"
            rect(d, 360, 478, 782, 600, (6, 9, 22), a=0.82 * f, r=10)
            txt(d, 376, 486, head, 22, col, a=f, bold=True)
            txt(d, 376, 514, sub, 16, (232, 238, 255), a=f)
            txt(d, 376, 538, rule, 16, (232, 238, 255), a=f)
            txt(d, 376, 566, "bright when  d sinθ = m λ   ·   spacing = λ L / d", 15,
                (255, 205, 100), a=f)
            txt(d, SX + 14, yt, kind, 20, col, a=f, bold=True, anchor="lm")

    # ---- right-hand panel
    a_i = 1 - ramp(t, T_PHOT, T_PHOT + 0.8)  # intensity curve visible before photons
    if a_i > 0:
        amp1 = 1.0
        I = np.abs(amp1 * COL1 + amp2 * COL2) ** 2 / IMAX
        base, scale = SX + 44, 400
        pts = [((base + scale * v) * S, y * S) for v, y in zip(I, ys)]
        poly = [(base * S, TOP * S)] + pts + [(base * S, (BOT - 1) * S)]
        d.polygon(poly, fill=(255, 190, 80, int(70 * a_i)))
        d.line(pts, fill=(255, 205, 100, int(255 * a_i)), width=3 * S)
        line(d, (base, TOP), (base, BOT), (120, 135, 170), 2, a=a_i)
        txt(d, base + 200, TOP - 10, "Intensity on screen", 16, (255, 205, 100),
            a=a_i, anchor="ms")
    a_p = ramp(t, T_PHOT, T_PHOT + 0.8)
    if a_p > 0:
        d.rectangle([(STRIP_X0 - 2) * S, TOP * S, (STRIP_X0 + STRIP_W + 2) * S, BOT * S],
                    outline=(120, 135, 170, int(255 * a_p)), width=2 * S)
        txt(d, STRIP_X0 + STRIP_W / 2, TOP - 10, "Detector", 16, edge, a=a_p, anchor="ms")
        txt(d, HIST_X0 + HIST_W / 2, TOP - 10, "Photon count", 16, (255, 205, 100),
            a=a_p, anchor="ms")
        scale_h = HIST_W / (exp_hist.max() * 1.15)
        for i, c in enumerate(state["hist"]):
            if c > 0:
                rect(d, HIST_X0, TOP + i * BIN + 1, HIST_X0 + c * scale_h,
                     TOP + (i + 1) * BIN - 1, (255, 190, 80), a=0.9 * a_p)
        n = int(state["ptr"])
        txt(d, HIST_X0 + HIST_W / 2, BOT + 16, f"{n} photons detected", 17,
            (232, 238, 255), a=a_p, anchor="ms", bold=True)
        # flying photons
        lo = np.searchsorted(hit_t, t, side="left")
        hi = np.searchsorted(hit_t, t + FLIGHT, side="right")
        for i in range(max(lo, hi - 60), hi):
            u = 1 - (hit_t[i] - t) / FLIGHT
            if not 0 <= u <= 1:
                continue
            sy = Y1 if from_slit[i] == 0 else Y2
            px = BX + SW // 2 + (SX - BX - SW // 2) * u
            py = sy + (hit_y[i] - sy) * u
            dot(d, px, py, 4, (255, 245, 200), a=a_p)

    # ---- title & end cards
    if t < T_SINGLE + 0.8:
        f = 1 - ramp(t, T_SINGLE - 0.6, T_SINGLE + 0.2)
        rect(d, 140, 230, 1140, 470, (6, 9, 22), a=0.8 * f, r=18)
        txt(d, W / 2, 330, "Young's Double-Slit Experiment", 50, (255, 255, 255),
            a=f, anchor="mm", bold=True)
        txt(d, W / 2, 396, "How light reveals its wave nature", 26, (255, 205, 100),
            a=f, anchor="mm")
    if t >= T_END:
        f = ramp(t, T_END, T_END + 0.9)
        rect(d, 0, 0, W, H, (6, 9, 22), a=0.88 * f)
        txt(d, W / 2, 250, "Light behaves like a wave…", 40, (255, 255, 255), a=f,
            anchor="mm", bold=True)
        txt(d, W / 2, 320, "…but is detected as particles.", 40, (255, 205, 100),
            a=f, anchor="mm", bold=True)
        txt(d, W / 2, 410, "bright fringes:  d sinθ = m λ", 28, (232, 238, 255), a=f,
            anchor="mm")
        txt(d, W / 2, 460, "fringe spacing:  Δy = λ L / d", 28, (232, 238, 255), a=f,
            anchor="mm")
        txt(d, W / 2, 540, "Wave–particle duality", 24, (170, 230, 255), a=f, anchor="mm")
    return big.resize((W, H), Image.LANCZOS)


# ------------------------------------------------------------------- frame
def render(t):
    if t < T_SINGLE:  # title card: both slits, dimmed
        amp2, f_alpha = 1.0, 0.5
    elif t < T_SINGLE + 0.6:  # close slit 2 for the single-slit scene
        u = ramp(t, T_SINGLE, T_SINGLE + 0.6)
        amp2, f_alpha = 1 - u, 0.5 + 0.5 * u
    else:
        amp2, f_alpha = ramp(t, T_OPEN, T_OPEN_END), 1.0
    if T_PHOT <= t:
        f_alpha = 1 - 0.78 * ramp(t, T_PHOT, T_PHOT + 1.0)
    if t >= T_END:
        f_alpha = 0.22
    img = np.empty((H, W, 3), np.float32)
    img[:] = BG
    fld = field_rgb(t, 1.0, amp2)
    img[TOP:BOT, X0:SX] = BG + (fld - BG) * f_alpha

    if t < T_PHOT:  # fringe strip next to the screen
        I = np.abs(COL1 + amp2 * COL2) ** 2 / IMAX
        c = np.array([255, 215, 140], np.float32)
        strip = BG + (c - BG) * (np.clip(I, 0, 1) ** 0.75)[:, None]
        img[TOP:BOT, SX + 7:SX + 36] = strip[:, None, :]
    else:
        advance_hits(t)
        hc = np.clip(state["canvas"] * 0.9, 0, 1)
        warm = np.array([255, 225, 150], np.float32)
        region = img[TOP:BOT, STRIP_X0:STRIP_X0 + STRIP_W]
        k = ramp(t, T_PHOT, T_PHOT + 0.8)
        dark = np.array([3, 5, 14], np.float32)
        region[:] = np.maximum(region * (1 - k) + dark * k, hc[..., None] * warm)
    base = Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).convert("RGBA")
    out = Image.alpha_composite(base, overlay(t, amp2))
    return out.convert("RGB")


def main():
    args = sys.argv[1:]
    out = "double_slit.mp4"
    stills = None
    while args:
        a = args.pop(0)
        if a == "--stills":
            stills = [float(x) for x in args.pop(0).split(",")]
        else:
            out = a
    n = int(DUR * FPS)
    if stills:
        for ts in sorted(stills):
            reset_state()
            # replay hits so the preview state is right
            for tt in np.arange(T_PHOT, ts, 0.1):
                advance_hits(tt)
            render(ts).save(f"/tmp/claude-0/-home-user-my-repo-/78f7ab3c-1bd3-53fb-8e8c-62ec72b9e89a/scratchpad/still_{ts:05.1f}.png")
        return
    ff = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
         "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset",
         "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out],
        stdin=subprocess.PIPE)
    for i in range(n):
        ff.stdin.write(render(i / FPS).tobytes())
        if i % 60 == 0:
            print(f"frame {i}/{n}", flush=True)
    ff.stdin.close()
    ff.wait()
    print("wrote", out)


if __name__ == "__main__":
    main()
