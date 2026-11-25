#!/usr/bin/env python3
"""Render "Why Time Has a Direction" - an animated explainer (about 100 s, 1280x720, 24 fps).

Everything (frames + soundtrack) is generated procedurally with NumPy + Pillow and
encoded with ffmpeg.

    python3 make_video.py                 # full render -> arrow_of_time.mp4
    python3 make_video.py still 3 20 55   # write stills at those seconds (preview)
"""
import math
import os
import random
import subprocess
import sys
import wave
from multiprocessing import Pool

import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1280, 720, 24
DUR = 100.0
NF = int(DUR * FPS)
HERE = os.path.dirname(os.path.abspath(__file__))

CYAN = (90, 200, 255)
AMBER = (255, 178, 70)
RED = (255, 95, 110)
WHITE = (232, 237, 255)
DIM = (130, 142, 178)


# ----------------------------------------------------------------- helpers
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def lerp(a, b, u):
    return a + (b - a) * u


def sstep(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def lerpc(c1, c2, u):
    return tuple(int(lerp(a, b, u)) for a, b in zip(c1, c2))


def win(t, a, b, f=0.5):
    return clamp(min((t - a) / f, (b - t) / f))


SUPM = str.maketrans("0123456789-+", "⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺")


def sup(n):
    return str(n).translate(SUPM)


FD = "/usr/share/fonts/truetype/dejavu/"
_fc = {}


def F(sz, bold=False):
    k = (sz, bold)
    if k not in _fc:
        _fc[k] = ImageFont.truetype(FD + ("DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"), sz)
    return _fc[k]


def make_bg():
    ys = np.linspace(0, 1, H)[:, None, None]
    top = np.array([7, 9, 22], np.float32)
    bot = np.array([18, 14, 44], np.float32)
    arr = np.repeat(top + (bot - top) * ys, W, axis=1)
    rng = np.random.default_rng(42)
    for _ in range(170):
        x, y = rng.integers(0, W), rng.integers(0, H)
        b = rng.uniform(30, 110)
        arr[y, x] += b
        if rng.random() < 0.15 and 0 < x < W - 1:
            arr[y, x - 1] += b * 0.4
            arr[y, x + 1] += b * 0.4
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


BG = make_bg()
_sprites = {}


def sprite(r, col):
    key = (r, col)
    if key not in _sprites:
        R = max(2, r * 2)
        yy, xx = np.mgrid[-R:R + 1, -R:R + 1]
        d = np.sqrt(xx * xx + yy * yy) / R
        halo = np.clip(1 - d, 0, 1) ** 2.2 * 0.75
        core = np.clip(1 - d / 0.38, 0, 1) ** 0.8
        inten = np.clip(halo + core, 0, 1.4)[..., None]
        _sprites[key] = (inten * np.array(col, np.float32)).astype(np.float32)
    return _sprites[key]


class Ctx:
    def __init__(self):
        self.img = BG.copy()
        self.d = ImageDraw.Draw(self.img, "RGBA")
        self.gl = []

    def glow(self, x, y, r, col, k=1.0):
        self.gl.append((x, y, int(round(r)), col, k))

    def flush(self):
        if not self.gl:
            return
        arr = np.asarray(self.img).astype(np.float32)
        for x, y, r, col, k in self.gl:
            sp = sprite(r, col)
            R = sp.shape[0] // 2
            x0, y0 = int(round(x)) - R, int(round(y)) - R
            xa, ya = max(0, x0), max(0, y0)
            xb, yb = min(W, x0 + sp.shape[1]), min(H, y0 + sp.shape[0])
            if xb <= xa or yb <= ya:
                continue
            arr[ya:yb, xa:xb] += sp[ya - y0:yb - y0, xa - x0:xb - x0] * k
        self.img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
        self.d = ImageDraw.Draw(self.img, "RGBA")
        self.gl = []


def T(c, xy, s, sz=28, col=WHITE, a=1.0, bold=False, anchor="la"):
    c.d.text(xy, s, font=F(sz, bold), fill=tuple(col) + (int(255 * clamp(a)),), anchor=anchor)


def panel(c, box, label=None, lcol=DIM, a=1.0):
    c.d.rounded_rectangle(box, radius=14, fill=(8, 12, 30, int(150 * a)),
                          outline=(70, 90, 150, int(200 * a)), width=2)
    if label:
        T(c, (box[0] + 16, box[1] + 10), label, 21, lcol, a, bold=True)


def tower(c, cx, y, a=1.0):
    """'1 in 10^(10^123)' with real superscripts, centred at cx, baseline y."""
    parts = [("1 in 10", 88, WHITE), ("10", 56, AMBER), ("123", 34, AMBER)]
    w0 = F(88, True).getlength(parts[0][0])
    w1 = F(56, True).getlength("10")
    w2 = F(34, True).getlength("123")
    x = cx - (w0 + w1 + w2) / 2
    T(c, (x, y), parts[0][0], 88, WHITE, a, True, "ls")
    T(c, (x + w0 + 2, y - 40), "10", 56, AMBER, a, True, "ls")
    T(c, (x + w0 + w1 + 4, y - 78), "123", 34, AMBER, a, True, "ls")


# ------------------------------------------------------------- scene 1: title
def s_title(c, t):
    a = sstep(t / 1.4)
    L = sstep((t - 0.4) / 3.2)
    y, x0 = 480, 200
    x1 = lerp(x0, 1080, L)
    c.d.line([(x0, y), (x1, y)], fill=CYAN + (200,), width=3)
    for i in range(0, 15):
        x = x0 + i * 62.8
        if x < x1:
            c.d.line([(x, y - 8), (x, y + 8)], fill=CYAN + (130,), width=2)
    if L > 0.02:
        c.d.polygon([(x1 + 16, y), (x1 - 6, y - 11), (x1 - 6, y + 11)], fill=CYAN + (235,))
    c.glow(x1, y, 30, CYAN, 0.9)
    T(c, (x0, y + 26), "PAST", 20, DIM, sstep((t - 1) / 1.2), True, "la")
    T(c, (1080, y + 26), "FUTURE", 20, DIM, sstep((t - 3) / 1.2), True, "ra")
    T(c, (640, 210), "WHY DOES TIME", 72, WHITE, a, True, "mm")
    T(c, (640, 295), "HAVE A DIRECTION?", 72, AMBER, sstep((t - 0.6) / 1.4), True, "mm")
    T(c, (640, 385), "a short film about the arrow of time", 28, DIM, sstep((t - 2.2) / 1.5), False, "mm")


# -------------------------------------------------- scene 2: time symmetry
R_B, TH, V_B = 20, math.radians(30), 170.0
TC = (300 - 2 * R_B * math.cos(TH) - 40) / V_B
T_COL = 2.4


def ball_pos(u):
    xc = 300 - 2 * R_B * math.cos(TH)
    if u < TC:
        return (40 + V_B * u, 170.0), (300.0, 190.0)
    dt = u - TC
    A = (xc + V_B * math.sin(TH) ** 2 * dt, 170 - V_B * math.sin(TH) * math.cos(TH) * dt)
    B = (300 + V_B * math.cos(TH) ** 2 * dt, 190 + V_B * math.cos(TH) * math.sin(TH) * dt)
    return A, B


def draw_collision(c, ox, oy, u, d):
    for k in range(14, 0, -1):  # trails in the direction the movie has already played
        uu = clamp(u - d * k * 0.045, 0, T_COL)
        A, B = ball_pos(uu)
        al = (1 - k / 15) * 0.5
        c.glow(ox + A[0], oy + A[1], 4, CYAN, al * 0.9)
        c.glow(ox + B[0], oy + B[1], 4, AMBER, al * 0.9)
    A, B = ball_pos(u)
    c.d.line([(ox, oy + 232), (ox + 540, oy + 232)], fill=(70, 90, 150, 60), width=1)
    c.glow(ox + A[0], oy + A[1], 24, CYAN, 1.0)
    c.glow(ox + B[0], oy + B[1], 24, AMBER, 1.0)


def s_sym(c, t):
    T(c, (640, 58), "The fundamental laws are time-symmetric", 36, WHITE, win(t, 0, 99, 0.8), True, "mm")
    P = T_COL + 1.0
    tau = clamp((t - 0.8) % P, 0, T_COL)
    for (box, lab, d) in (((60, 110, 620, 480), "FORWARD   time →", 1), ((660, 110, 1220, 480), "REVERSED   ← time", -1)):
        panel(c, box, lab, CYAN if d == 1 else AMBER)
        u = tau if d == 1 else T_COL - tau
        draw_collision(c, box[0] + 10, box[1] + 50, u, d)
    T(c, (640, 530), "Both movies obey Newton's laws perfectly.", 26, DIM, sstep((t - 3) / 1.5), False, "mm")


# ------------------------------------------------------ scene 3: shattering glass
G_G = 600.0
FLOOR = 270.0
_gr = random.Random(5)
GLASS = []
for i in range(8):
    for j in range(10):
        xc0 = 230 + i * 10 + 5
        yin = 20 + j * 10 + 5
        yc0 = yin + 150
        vx = (i - 3.5) * 38 + _gr.uniform(-45, 45)
        vy = -_gr.uniform(70, 340) * (1 - j / 22)
        disc = vy * vy - 2 * G_G * (yc0 - (FLOOR - 5))
        dtl = (-vy + math.sqrt(max(disc, 0))) / G_G
        GLASS.append((xc0, yin, yc0, vx, vy, dtl, _gr.uniform(0.6, 1.0), _gr.choice([0, 0, 0, 7, 11])))
TAU0 = math.sqrt(2 * 150 / G_G)
T_GLASS = 2.7


def tile_pos(tile, u):
    xc0, yin, yc0, vx, vy, dtl, br, ypile = tile
    if u < TAU0:
        return xc0, yin + 0.5 * G_G * u * u
    dt = u - TAU0
    if dt < dtl:
        return xc0 + vx * dt, yc0 + vy * dt + 0.5 * G_G * dt * dt
    return xc0 + vx * dtl + vx * 0.10 * (1 - math.exp(-(dt - dtl) * 5)), FLOOR - 5 - ypile * 0.5


def draw_glass(c, ox, oy, u):
    c.d.line([(ox, oy + FLOOR), (ox + 540, oy + FLOOR)], fill=(120, 140, 200, 160), width=2)
    for tile in GLASS:
        x, y = tile_pos(tile, u)
        b = tile[6]
        col = (int(110 * b), int(200 * b), int(255 * b))
        c.d.rectangle([ox + x - 4.5, oy + y - 4.5, ox + x + 4.5, oy + y + 4.5], fill=col + (175,),
                      outline=(200, 235, 255, 150))
    if 0 <= u - TAU0 < 0.16:
        c.glow(ox + 270, oy + FLOOR - 5, int(40 + 220 * (u - TAU0)), WHITE, 1.0 - (u - TAU0) / 0.16)


def s_glass(c, t):
    T(c, (640, 58), "Same laws. A very different story.", 36, WHITE, win(t, 0, 99, 0.8), True, "mm")
    P = T_GLASS + 1.2
    tau = clamp((t - 0.8) % P, 0, T_GLASS)
    for (box, lab, d) in (((60, 110, 620, 480), "FORWARD   time →", 1), ((660, 110, 1220, 480), "REVERSED   ← time", -1)):
        panel(c, box, lab, CYAN if d == 1 else AMBER)
        draw_glass(c, box[0] + 10, box[1] + 50, tau if d == 1 else T_GLASS - tau)
    T(c, (340, 505), "Perfectly ordinary.", 24, CYAN, sstep((t - 2) / 1), False, "mm")
    T(c, (940, 505), "Allowed by physics.  Never seen.", 24, AMBER, sstep((t - 6) / 1), False, "mm")


# --------------------------------------------------------- scene 4: coins
_cr = random.Random(11)
COIN_STATES = [[1] * 100]
COIN_LAST = [0]
for _ in range(400):
    s = list(COIN_STATES[-1])
    k = _cr.randrange(100)
    s[k] ^= 1
    COIN_STATES.append(s)
    COIN_LAST.append(k)
BINOM = [math.comb(100, k) for k in range(101)]


def sci(w):
    if w < 10000:
        return f"{w:,}"
    e = len(str(w)) - 1
    return f"{w / 10 ** (e - 3) / 1000:.1f}×10{sup(e)}"


def s_coins(c, t):
    T(c, (640, 58), "Why disorder wins: counting", 36, WHITE, win(t, 0, 99, 0.8), True, "mm")
    rate = 22.0
    stepf = max(0.0, (t - 2.2) * rate)
    n = min(int(stepf), len(COIN_STATES) - 1)
    frac = stepf - n
    st = COIN_STATES[n]
    heads = sum(st)
    # coins
    ox, oy = 100, 130
    panel(c, (70, 110, 470, 520), "100 COINS", DIM)
    for idx in range(100):
        cx = ox + (idx % 10) * 34 + 17 + 12
        cy = oy + (idx // 10) * 34 + 17 + 28
        wscale = 1.0
        if n > 0 and idx == COIN_LAST[n] and frac < 1:
            wscale = abs(math.cos(math.pi * frac)) * 0.95 + 0.05
        r = 13
        if st[idx]:
            fill, out = AMBER + (255,), (255, 220, 150, 255)
        else:
            fill, out = (40, 66, 140, 255), CYAN + (255,)
        c.d.ellipse([cx - r * wscale, cy - r, cx + r * wscale, cy + r], fill=fill, outline=out, width=2)
    # distribution
    px0, base, maxh = 560, 440, 250
    panel(c, (520, 110, 1230, 520), "HOW MANY ARRANGEMENTS (W) GIVE k HEADS?", DIM)
    bw = 6.4
    for k in range(101):
        h = BINOM[k] / BINOM[50] * maxh
        x = px0 + k * bw + 6
        cur = (k == heads)
        col = AMBER if cur else (70, 120, 200)
        c.d.rectangle([x, base - max(h, 2), x + bw - 1.5, base], fill=col + (255 if cur else 190,))
    c.d.line([(px0, base + 2), (px0 + 101 * bw + 12, base + 2)], fill=(120, 140, 200, 200), width=2)
    T(c, (px0, base + 8), "all tails", 17, DIM)
    T(c, (px0 + 101 * bw + 12, base + 8), "all heads", 17, DIM, anchor="ra")
    xm = px0 + heads * bw + 6 + bw / 2
    hh = BINOM[heads] / BINOM[50] * maxh
    c.glow(xm, base - max(hh, 2), 14, AMBER, 0.9)
    wtxt = sci(BINOM[heads])
    T(c, (xm if 22 < heads < 78 else (xm - 90 if heads >= 78 else xm + 90), base - max(hh, 2) - 38),
      f"heads = {heads}", 22, AMBER, 1, True, "mm")
    T(c, (px0 + 4, 150), f"W = {wtxt}", 30, WHITE, 1, True, "la")
    T(c, (px0 + 4, 190), "entropy  S = k · ln W", 22, CYAN, sstep((t - 4) / 1.5), False, "la")
    if heads >= 99:
        T(c, (640, 560), "perfectly ordered: only ONE way", 22, AMBER, 1, False, "mm")


# ------------------------------------------------------------ scene 5: gas
NG = 500
_g = np.random.default_rng(3)
GX0 = _g.uniform(0, 0.2, NG)
GY0 = _g.uniform(0, 1, NG)
_ang = _g.uniform(0, 2 * np.pi, NG)
_sp = np.exp(_g.normal(np.log(0.20), 0.35, NG))
GVX = _sp * np.cos(_ang)
GVY = _sp * np.sin(_ang) * (640 / 380)


def fold(x):
    m = np.mod(x, 2.0)
    return np.where(m > 1, 2 - m, m)


def gas_pos(s):
    return fold(GX0 + GVX * s), fold(GY0 + GVY * s)


def gas_S(s):
    x, y = gas_pos(s)
    h, _, _ = np.histogram2d(x, y, bins=[10, 6], range=[[0, 1], [0, 1]])
    p = h.ravel() / NG
    p = p[p > 0]
    return float(-(p * np.log(p)).sum() / np.log(60))


GS = [gas_S(i * 0.05) for i in range(0, 181)]


def gas_s(t):
    if t < 1:
        return 0.0
    if t < 10:
        return t - 1
    if t < 11.5:
        return 9.0
    if t < 20.5:
        return 9 - (t - 11.5)
    return 0.0


def gas_entropy(t):
    s = gas_s(t)
    return GS[int(round(s / 0.05))]


def s_gas(c, t):
    T(c, (640, 58), "Entropy: the count of hidden arrangements", 36, WHITE, win(t, 0, 99, 0.8), True, "mm")
    bx, by, bw, bh = 60, 130, 640, 380
    s = gas_s(t)
    flip = sstep((t - 10) / 0.6) if t < 20.5 else 1.0
    if t >= 20.5:
        flip = 1.0
    col = lerpc(CYAN, AMBER, flip)
    c.d.rounded_rectangle([bx, by, bx + bw, by + bh], radius=6, fill=(8, 12, 30, 150),
                          outline=(90, 110, 170, 220), width=2)
    c.d.line([(bx + 0.2 * bw, by), (bx + 0.2 * bw, by + bh)], fill=(150, 160, 210, 70), width=1)
    x, y = gas_pos(s)
    for xi, yi in zip(x, y):
        c.glow(bx + xi * bw, by + yi * bh, 4, col, 0.85)
    T(c, (bx, by - 10), "500 gas molecules in a box", 20, DIM, 1, False, "lb")
    # graph
    gx0, gy0, gw, gh = 770, 150, 440, 330
    panel(c, (740, 110, 1230, 520), "ENTROPY OF THE GAS", DIM)
    c.d.line([(gx0, gy0 + gh + 10), (gx0 + gw, gy0 + gh + 10)], fill=(120, 140, 200, 200), width=2)
    c.d.line([(gx0, gy0 + 20), (gx0, gy0 + gh + 10)], fill=(120, 140, 200, 200), width=2)
    for xx in range(gx0, gx0 + gw, 14):
        c.d.line([(xx, gy0 + 38), (xx + 6, gy0 + 38)], fill=(150, 160, 210, 100), width=1)
    T(c, (gx0 + gw, gy0 + 22), "maximum", 16, DIM, 1, False, "rb")
    T(c, (gx0 + gw, gy0 + gh + 14), "time →", 16, DIM, 1, False, "ra")
    pts = []
    tt = 1.0
    while tt <= min(t, 20.5) + 1e-6:
        S = (gas_entropy(tt) - 0.55) / 0.45
        pts.append((gx0 + (tt - 1) / 19.5 * gw, gy0 + gh + 10 - clamp(S) * (gh - 32)))
        tt += 0.1
    if len(pts) > 1:
        c.d.line(pts, fill=lerpc(CYAN, AMBER, flip) + (255,), width=4, joint="curve")
        c.glow(pts[-1][0], pts[-1][1], 14, col, 1.0)
    # flip effect
    if 10 <= t < 11.6:
        k = (t - 10) / 1.6
        c.glow(bx + bw / 2, by + bh / 2, int(80 + 380 * k), AMBER, 0.5 * (1 - k))
        T(c, (bx + bw / 2, by + bh / 2), "REVERSE EVERY VELOCITY", 34, WHITE, win(t, 10, 11.6, 0.3), True, "mm")
    if 12.5 <= t:
        T(c, (bx + bw / 2, 540), "chance of this happening by luck: 1 in 10" + sup(350) + "   (for just 500 molecules)",
          21, AMBER, sstep((t - 12.5) / 1.2), False, "mm")
    if t >= 19.5:
        T(c, (bx + bw / 2, 572), "a real room of air: about 1 in 10^(3×10" + sup(24) + ")", 21, RED, sstep((t - 19.5) / 1.0), False, "mm")


# ------------------------------------------------------ scene 6: the cosmos
NC = 700
_cg = np.random.default_rng(8)
CUX = _cg.uniform(0, 1, NC)
CUY = _cg.uniform(0, 1, NC)
CK = _cg.integers(0, 9, NC)
CCX = _cg.uniform(0.14, 0.86, 9)
CCY = _cg.uniform(0.18, 0.82, 9)
CGX = _cg.normal(0, 1, NC)
CGY = _cg.normal(0, 1, NC)
CPH = _cg.uniform(0, 6.28, NC)
S0C = 0.04


def cosmos_u(t):
    if t < 1.5:
        return 0.0
    if t < 5:
        return sstep((t - 1.5) / 3.5)
    if t < 6:
        return 1.0
    if t < 11:
        return 1 - sstep((t - 6) / 5)
    return 0.0


def curve_S(u):
    return S0C + (1 - S0C) * (1 - math.exp(-3.4 * u))


def s_cosmos(c, t):
    T(c, (640, 58), "The arrow of time is a slope", 36, WHITE, win(t, 0, 99, 0.8), True, "mm")
    u = cosmos_u(t)
    umax = sstep((t - 1.5) / 3.5) if t < 5 else 1.0
    pb = (60, 110, 600, 520)
    panel(c, pb, "THE UNIVERSE", DIM)
    e = sstep(u)
    shrink = lerp(1.0, 0.22, sstep((u - 0.72) / 0.28))
    col = lerpc((255, 215, 160), (150, 205, 255), sstep(u * 1.6))
    col = lerpc(col, (190, 80, 80), sstep((u - 0.78) / 0.22))
    rad = 4 if u < 0.8 else 3
    for i in range(NC):
        k = CK[i]
        ux = CUX[i] + 0.004 * math.sin(t * 2 + CPH[i])
        uy = CUY[i] + 0.004 * math.cos(t * 2 + CPH[i])
        cx = CCX[k] + CGX[i] * 0.05 * shrink
        cy = CCY[k] + CGY[i] * 0.07 * shrink
        x = pb[0] + 12 + lerp(ux, cx, e) * (pb[2] - pb[0] - 24)
        y = pb[1] + 40 + lerp(uy, cy, e) * (pb[3] - pb[1] - 56)
        c.glow(x, y, rad, col, 0.8 if u < 0.8 else 0.6)
    # graph
    gx0, gy0, gw, gh = 690, 150, 500, 310
    panel(c, (640, 110, 1230, 520), "ENTROPY OF THE UNIVERSE", DIM)
    base = gy0 + gh
    c.d.line([(gx0, base), (gx0 + gw, base)], fill=(120, 140, 200, 200), width=2)
    c.d.line([(gx0, gy0), (gx0, base)], fill=(120, 140, 200, 200), width=2)
    T(c, (gx0 + gw, base + 6), "cosmic time →", 16, DIM, 1, False, "ra")
    pts = []
    n = 90
    for i in range(n + 1):
        uu = i / n * umax
        pts.append((gx0 + uu * gw, base - curve_S(uu) * (gh - 20)))
    if len(pts) > 1 and umax > 0.001:
        c.d.line(pts, fill=(150, 200, 255, 255), width=4, joint="curve")
    mx, my = gx0 + u * gw, base - curve_S(u) * (gh - 20)
    c.glow(mx, my, 16, AMBER, 1.0)
    T(c, (gx0 + 8, base - 8 - S0C * (gh - 20) - 34), "BIG BANG", 17, AMBER, 1, True, "la")
    if umax > 0.45:
        px = gx0 + 0.45 * gw
        py = base - curve_S(0.45) * (gh - 20)
        c.d.ellipse([px - 4, py - 4, px + 4, py + 4], fill=WHITE + (255,))
        T(c, (px, py + 14), "today", 17, WHITE, sstep((umax - 0.45) * 8), False, "ma")
    if umax > 0.97:
        T(c, (gx0 + gw, base - (gh - 20) - 24), "heat death", 17, DIM, 1, False, "ra")
    if t >= 11:
        a = sstep((t - 11) / 1.2)
        k = 0.5 + 0.5 * math.sin(t * 4)
        c.glow(gx0 + 6, base - S0C * (gh - 20), int(30 + 10 * k), AMBER, 0.8 * a)
        T(c, (gx0 + 40, base - 70), "extraordinarily LOW entropy", 21, AMBER, a, True)
        T(c, (gx0 + 40, base - 44), "(smooth, hot, gravity hasn't clumped it yet)", 15, DIM, a)
    if t >= 16:
        a = sstep((t - 16) / 1.0)
        c.flush()
        c.d.rectangle([0, 0, W, H], fill=(4, 5, 14, int(215 * a)))
        T(c, (640, 215), "Roger Penrose's estimate of the odds of", 28, DIM, sstep((t - 16.5) / 1), False, "mm")
        T(c, (640, 255), "a universe starting this smooth:", 28, DIM, sstep((t - 16.5) / 1), False, "mm")
        tower(c, 640, 400, sstep((t - 17.3) / 1.2))
        T(c, (640, 470), "a number with more zeros than there are atoms in the observable universe", 22, WHITE,
          sstep((t - 19.0) / 1.2), False, "mm")


# ------------------------------------------------------- scene 7: the mystery
CARDS = ["Cosmic\ninflation?", "A multiverse?", "A cyclic\nuniverse?", "A deeper\nlaw?"]


def s_mystery(c, t):
    k = 0.5 + 0.5 * math.sin(t * 2.2)
    dim = 1 - 0.7 * sstep((t - 10) / 1.2)
    T(c, (640, 150), "Why was the Big Bang", 46, WHITE, sstep(t / 1.2) * dim, True, "mm")
    T(c, (640, 210), "so extraordinarily orderly?", 46, AMBER, sstep((t - 0.5) / 1.2) * dim, True, "mm")
    for i, label in enumerate(CARDS):
        a = sstep((t - (3.8 + i * 1.0)) / 0.8) * dim
        cx = 170 + i * 310
        box = (cx - 135, 300, cx + 135, 440)
        c.d.rounded_rectangle(box, radius=16, fill=(14, 20, 50, int(190 * a)), outline=CYAN + (int(200 * a),), width=2)
        T(c, (cx, 370), label, 30, WHITE, a, True, "mm")
        T(c, (cx, 468), "unproven", 18, DIM, a, False, "mm")
        c.glow(cx, 440, 22, CYAN, 0.25 * a * (0.6 + 0.4 * k))
    if t >= 10:
        a = sstep((t - 10) / 1.2)
        T(c, (640, 290), "Nobody knows.", 84, WHITE, a, True, "mm")
        c.glow(640, 290, 160, AMBER, 0.10 * a)
    if t >= 12.6:
        a = sstep((t - 12.6) / 1.3)
        T(c, (640, 390), "The arrow of time points back", 32, CYAN, a, False, "mm")
        T(c, (640, 434), "to a question we have yet to answer.", 32, CYAN, a, False, "mm")
        yy = 520
        L = sstep((t - 13) / 2.5)
        c.d.line([(300, yy), (lerp(300, 980, L), yy)], fill=CYAN + (int(180 * a),), width=3)
        c.glow(lerp(300, 980, L), yy, 22, CYAN, 0.9 * a)


# ----------------------------------------------------------------- timeline
SCENES = [(0, 7, s_title), (7, 17, s_sym), (17, 28, s_glass), (28, 40, s_coins),
          (40, 62, s_gas), (62, 84, s_cosmos), (84, 100, s_mystery)]

CAPTIONS = [
    (7.4, 12.2, "Newton, Maxwell, Einstein, Schrödinger: the fundamental laws work the same forwards and backwards."),
    (12.2, 16.8, "Play a collision in reverse, and it looks perfectly natural."),
    (17.4, 22.0, "But play a glass shattering in reverse… and something feels deeply wrong."),
    (22.0, 27.6, "Every law allows it. Yet we never see it. Why does time have a direction?"),
    (28.4, 33.4, "The answer is counting. Take 100 coins, all heads: there is exactly one way to be that ordered."),
    (33.4, 39.6, "But there are about 10²⁹ ways to be half and half. Shuffle at random, and disorder wins by sheer numbers."),
    (40.4, 44.2, "Do the same with gas. Start with every molecule crowded in one corner."),
    (44.2, 49.8, "As they spread out, entropy, the number of ways to arrange them, climbs."),
    (50.2, 54.0, "Now reverse every velocity. The laws allow it: the gas retraces its steps…"),
    (54.0, 60.4, "…back into the corner. Allowed by physics, but absurdly improbable."),
    (62.4, 67.0, "Entropy rises toward the future only because it was lower in the past."),
    (67.4, 73.0, "So follow the slope backwards: lower and lower, all the way to the Big Bang."),
    (73.2, 77.6, "Odd: that hot, smooth plasma looks disordered, but gravity hadn't clumped anything yet."),
    (84.5, 88.6, "Why did the universe begin in such an extraordinarily low-entropy state?"),
    (88.8, 93.8, "Inflation? A multiverse? A cycle? A deeper law? None of these is settled."),
]


def caption(c, t):
    for a0, a1, txt in CAPTIONS:
        if a0 <= t <= a1:
            a = clamp(min((t - a0) / 0.4, (a1 - t) / 0.4))
            f = F(28)
            words, lines, cur = txt.split(" "), [], ""
            for w in words:
                trial = (cur + " " + w).strip()
                if f.getlength(trial) > 1020:
                    lines.append(cur)
                    cur = w
                else:
                    cur = trial
            lines.append(cur)
            h = 38 * len(lines)
            y0 = 692 - h
            c.d.rounded_rectangle([90, y0 - 12, W - 90, 700], radius=16, fill=(4, 6, 16, int(165 * a)))
            for i, ln in enumerate(lines):
                T(c, (640, y0 + 19 + 38 * i), ln, 28, (245, 247, 255), a, False, "mm")
            return


def render(t):
    c = Ctx()
    for a0, a1, fn in SCENES:
        if a0 <= t < a1 or (t >= DUR - 1e-9 and a1 == DUR):
            fn(c, t - a0)
            c.flush()
            fade = clamp(min((t - a0) / 0.7, (a1 - t) / 0.7))
            if fade < 1:
                c.img = Image.blend(BG, c.img, fade)
                c.d = ImageDraw.Draw(c.img, "RGBA")
            break
    caption(c, t)
    return c.img


def frame_bytes(i):
    return render(min(i / FPS, DUR - 1e-6)).tobytes()


# -------------------------------------------------------------------- audio
def make_audio(path):
    sr = 44100
    n = int((DUR + 1.5) * sr)
    t = np.arange(n) / sr
    rng = np.random.default_rng(1)
    pad = np.zeros(n)
    chords = [[220.0, 261.63, 329.63], [174.61, 220.0, 261.63], [261.63, 329.63, 392.0], [196.0, 246.94, 293.66]]
    seg = 8.0
    for k in range(int(DUR / seg) + 2):
        s0, s1 = k * seg - 1.0, k * seg + seg + 1.0
        i0, i1 = max(0, int(s0 * sr)), min(n, int(s1 * sr))
        if i1 <= i0:
            continue
        tt = t[i0:i1]
        env = np.sin(np.clip((tt - s0) / (s1 - s0), 0, 1) * np.pi) ** 2
        ch = chords[k % 4]
        sig = np.zeros_like(tt)
        for f in ch:
            for dt in (-0.004, 0.004):
                for h, a in ((1, 1.0), (2, 0.35), (3, 0.15)):
                    sig += a * np.sin(2 * np.pi * f * (1 + dt) * h * tt + rng.uniform(0, 6.28))
        sig += 1.6 * np.sin(2 * np.pi * ch[0] / 2 * tt)
        pad[i0:i1] += sig * env * 0.035
    L, R = pad.copy(), pad.copy()
    notes = [220, 261.63, 293.66, 329.63, 392.0, 440, 523.25, 659.25]
    ptime = 7.0
    while ptime < 97:
        f = rng.choice(notes)
        pan = rng.uniform(0.25, 0.75)
        dur = 1.6
        m = int(dur * sr)
        lt = np.arange(m) / sr
        env = np.exp(-lt * 3.2) * (1 - np.exp(-lt * 250))
        reverse = 51.5 <= ptime <= 60.5
        if reverse:
            env = env[::-1]
        sig = (np.sin(2 * np.pi * f * lt) + 0.3 * np.sin(4 * np.pi * f * lt)) * env * 0.05
        i0 = int(ptime * sr) - (m if reverse else 0)
        i0 = max(0, i0)
        i1 = min(n, i0 + m)
        L[i0:i1] += sig[:i1 - i0] * (1 - pan)
        R[i0:i1] += sig[:i1 - i0] * pan
        ptime += rng.choice([0.5, 0.5, 1.0, 0.75])
    # riser while all velocities reverse (t = 50 .. 51.5)
    i0, i1 = int(50 * sr), int(51.5 * sr)
    tt = np.arange(i1 - i0) / sr
    freq = 150 * (10 ** (tt / 1.5))
    ph = 2 * np.pi * np.cumsum(freq) / sr
    env = np.sin(np.clip(tt / 1.5, 0, 1) * np.pi / 2) ** 2
    ris = np.sin(ph) * env * 0.05
    L[i0:i1] += ris
    R[i0:i1] += ris
    # soft impact at glass shatter loops + at the 'Nobody knows' line
    for hit in (84 + 10.0,):
        j0 = int(hit * sr)
        lt = np.arange(int(3 * sr)) / sr
        boom = np.sin(2 * np.pi * 55 * lt) * np.exp(-lt * 1.3) * 0.2
        L[j0:j0 + len(boom)] += boom
        R[j0:j0 + len(boom)] += boom
    # reverb through an FFT convolution with a decaying-noise impulse response
    out = []
    for x, seed in ((L, 7), (R, 8)):
        r = np.random.default_rng(seed)
        ir_t = np.arange(int(2.2 * sr)) / sr
        ir = r.normal(0, 1, len(ir_t)) * np.exp(-ir_t * 2.4)
        ir /= np.sqrt((ir ** 2).sum())
        size = 1 << int(np.ceil(np.log2(len(x) + len(ir))))
        wet = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[:len(x)]
        out.append(x * 0.7 + wet * 0.55)
    st = np.stack(out, axis=1)
    st /= np.abs(st).max() / 0.8
    fade = np.minimum(np.clip(t / 1.5, 0, 1), np.clip((DUR + 1.0 - t) / 2.5, 0, 1))
    st *= fade[:, None]
    pcm = (st * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())


# --------------------------------------------------------------------- main
def main():
    if len(sys.argv) > 1 and sys.argv[1] == "still":
        out = os.environ.get("STILL_DIR", HERE)
        for s in sys.argv[2:]:
            render(float(s)).save(os.path.join(out, f"still_{float(s):06.2f}.png"))
        return
    wav = os.path.join(HERE, "soundtrack.wav")
    mp4 = os.path.join(HERE, "arrow_of_time.mp4")
    print("synthesising soundtrack…", flush=True)
    make_audio(wav)
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
           "-r", str(FPS), "-i", "-", "-i", wav, "-c:v", "libx264", "-preset", "medium", "-crf", "19",
           "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-t", str(DUR), "-movflags", "+faststart", mp4]
    p = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    with Pool(os.cpu_count() or 2) as pool:
        for i, b in enumerate(pool.imap(frame_bytes, range(NF), chunksize=6)):
            p.stdin.write(b)
            if i % 240 == 0:
                print(f"frame {i}/{NF}", flush=True)
    p.stdin.close()
    p.wait()
    print("done ->", mp4)


if __name__ == "__main__":
    main()
