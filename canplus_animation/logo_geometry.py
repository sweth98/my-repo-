"""CanPlus logo mark as vector polygons (units: hexagon circumradius ~= 1.0, centred on the hexagon).

Shapes were fitted to the reference PNG by fit_logo.py (IoU against the colour masks).
"""
import math
from shapely.geometry import LineString, Point
from shapely.ops import unary_union

# fitted parameters (see fit_logo.py)
PARAMS = dict(Rc=0.8958, t=0.2556, top_end=(0.4557, 0.651), bot_end=(0.6681, -0.529),
              plus_c=(0.5464, 0.0555), plus_len=0.6504, plus_t=0.1742)


def hex_c_polygon(p=PARAMS):
    Rc, t = p["Rc"], p["t"]
    # pointy-top hexagon, clockwise from the top-right arm end around the left side
    top = (0.0, Rc)
    ul = (-Rc * math.cos(math.radians(30)), Rc * 0.5)
    ll = (-Rc * math.cos(math.radians(30)), -Rc * 0.5)
    bot = (0.0, -Rc)
    # arm ends are projected onto the centre-line edges
    def on_edge(a, b, x):
        s = (x - a[0]) / (b[0] - a[0])
        return (x, a[1] + s * (b[1] - a[1]))
    ur = (Rc * math.cos(math.radians(30)), Rc * 0.5)
    lr = (Rc * math.cos(math.radians(30)), -Rc * 0.5)
    e1 = on_edge(top, ur, p["top_end"][0])
    e2 = on_edge(bot, lr, p["bot_end"][0])
    line = LineString([e1, top, ul, ll, bot, e2])
    return line.buffer(t / 2, cap_style=2, join_style=1, resolution=12)  # flat caps, round joins


def plus_polygon(p=PARAMS):
    cx, cy = p["plus_c"]
    h = p["plus_len"] / 2
    a = LineString([(cx - h, cy), (cx + h, cy)])
    b = LineString([(cx, cy - h), (cx, cy + h)])
    return unary_union([a.buffer(p["plus_t"] / 2, cap_style=1, resolution=12),
                        b.buffer(p["plus_t"] / 2, cap_style=1, resolution=12)])
