"""The eight hero objects that orbit the CanPlus hub. Each builder authors geometry in an upright
local frame (x right, y away from viewer, z up) under a root empty that the timeline animates."""
import math
import random

import bmesh
import bpy
from mathutils import Vector, noise
from shapely.geometry import Point, Polygon, box as sbox
from shapely.affinity import rotate as srotate, translate as stranslate

import cp_util as U
from cp_util import (add_box, add_flat, rrect, new_obj, link, empty, finish, smooth_mesh,
                     poly_mesh)

M = {}
FONT_DIR = "/usr/share/fonts/opentype/inter/"


def make_materials():
    M["dark"] = U.holo("dark_blue", U.BLUE_L, rim_strength=2.4)
    M["dark_p"] = U.holo("dark_purple", U.PURPLE, rim_strength=2.4)
    M["dark_c"] = U.holo("dark_cyan", U.CYAN, rim_strength=2.4)
    M["white"] = U.emissive("e_white", U.WHITE, 3.0)
    M["ui"] = U.emissive("e_ui", U.WHITE, 1.3)
    M["ui_dim"] = U.emissive("e_ui_dim", U.WHITE, 0.55)
    M["cyan"] = U.emissive("e_cyan", U.CYAN, 3.5)
    M["blue"] = U.emissive("e_blue", U.BLUE, 4.0)
    M["purple"] = U.emissive("e_purple", U.PURPLE, 4.0)
    M["pink"] = U.emissive("e_pink", U.PINK, 3.5)
    M["gold"] = U.emissive("e_gold", U.GOLD, 3.0)
    M["keys"] = U.emissive("e_keys", U.BLUE, 0.9)
    M["paper"] = U.principled("paper", U.CREAM, rough=0.55, emit=U.CREAM, estr=0.35)
    M["ink"] = U.principled("ink", U.hexc("#14224a"), rough=0.5, emit=U.hexc("#2a4bd0"), estr=0.25)
    M["screen_bp"] = U.gradient_emissive("scr_bp", U.hexc("#1E49C8"), U.hexc("#8466F0"), 1.3, axis=1, lo=-0.45, hi=0.45)
    M["screen_pc"] = U.gradient_emissive("scr_pc", U.hexc("#5B3FD0"), U.hexc("#2BB6FF"), 1.3, axis=1, lo=-0.45, hi=0.45)
    M["bar"] = U.gradient_emissive("bar", U.hexc("#1D5BF0"), U.hexc("#38D6FF"), 2.2, axis=1, lo=-0.4, hi=0.4)
    M["brain"] = U.gradient_emissive("brain", U.hexc("#4B2FB0"), U.hexc("#D070FF"), 1.1, axis=0, lo=-0.6, hi=0.6, rough=0.3)
    M["brain_wire"] = U.emissive("brain_wire", U.CYAN, 3.0)
    M["cov_blue"] = U.principled("cov_blue", U.hexc("#1C4FD8"), rough=0.35, coat=0.5, emit=U.BLUE, estr=0.5)
    M["cov_purple"] = U.principled("cov_purple", U.hexc("#5B3FD0"), rough=0.35, coat=0.5, emit=U.PURPLE, estr=0.5)
    M["cov_dark"] = U.principled("cov_dark", U.hexc("#101C3C"), rough=0.35, coat=0.5, emit=U.CYAN, estr=0.2)
    M["pages"] = U.principled("pages", U.CREAM, rough=0.7, emit=U.CREAM, estr=0.45)


def font(weight="SemiBold"):
    return bpy.data.fonts.load(f"{FONT_DIR}Inter-{weight}.otf")


def make_text(name, body, size, mat, parent=None, loc=(0, 0, 0), rot=(0, 0, 0), weight="SemiBold",
              align="CENTER", spacing=1.0, extrude=0.0):
    cu = bpy.data.curves.new(name, "FONT")
    cu.body = body
    cu.font = font(weight)
    cu.size = size
    cu.align_x = align
    cu.align_y = "CENTER"
    cu.space_character = spacing
    cu.extrude = extrude
    o = bpy.data.objects.new(name, cu)
    o.data.materials.append(mat)
    o.location = loc
    o.rotation_euler = rot
    return link(o, parent)


def tube(name, pts, radius, mat, parent, res=4):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = radius
    cu.bevel_resolution = res
    cu.fill_mode = "FULL"
    sp = cu.splines.new("POLY")
    sp.points.add(len(pts) - 1)
    for p, c in zip(sp.points, pts):
        p.co = (c[0], c[1], c[2], 1)
    o = bpy.data.objects.new(name, cu)
    o.data.materials.append(mat)
    return link(o, parent)


def bm_obj(name, bm, mat, parent, loc=(0, 0, 0), rot=(0, 0, 0)):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    smooth_mesh(me)
    return new_obj(name, me, mat, parent, loc, rot)


def cone(name, r_bottom, r_top, depth, mat, parent, loc, segs=32, rot=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=segs, radius1=r_bottom, radius2=r_top, depth=depth)
    return bm_obj(name, bm, mat, parent, loc, rot)


def sphere(name, r, mat, parent, loc, segs=24):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=segs // 2, radius=r)
    return bm_obj(name, bm, mat, parent, loc)


# --------------------------------------------------------------------------- 1. laptop
def build_laptop(root):
    add_box("lap_base", (1.34, 0.90, 0.055), (0, -0.45, -0.42), M["dark"], root, bevel=0.02)
    # key grid
    bm = bmesh.new()
    for r in range(5):
        for c in range(13):
            x = -0.57 + c * 0.095
            y = -0.14 - r * 0.095
            v = [bm.verts.new((x + dx, y + dy, -0.388)) for dx, dy in ((-0.036, -0.032), (0.036, -0.032), (0.036, 0.032), (-0.036, 0.032))]
            bm.faces.new(v)
    bm_obj("lap_keys", bm, M["keys"], root)
    add_box("lap_pad", (0.40, 0.24, 0.006), (0, -0.70, -0.388), M["dark_c"], root, bevel=0.004)

    lid = empty("lap_lid", root, loc=(0, 0.0, -0.39))
    lid.rotation_euler = (-0.2, 0, 0)
    add_box("lap_shell", (1.34, 0.045, 0.88), (0, 0, 0.44), M["dark"], lid, bevel=0.02)
    cz = 0.44
    add_flat("lap_screen", rrect(1.24, 0.76, 0.03), 0.008, M["screen_bp"], lid, 0, cz, 0.026, bevel=0)
    add_flat("lap_hdr", rrect(1.12, 0.06, 0.02), 0.006, M["ui"], lid, 0, cz + 0.28, 0.034, bevel=0)
    for i, z in enumerate((0.13, 0.02, -0.09)):
        add_flat(f"lap_side{i}", rrect(0.24, 0.05, 0.02), 0.006, M["ui"] if i == 0 else M["ui_dim"], lid, -0.46, cz + z, 0.034, bevel=0)
    add_flat("lap_card", rrect(0.66, 0.40, 0.03), 0.006, M["ui_dim"], lid, 0.2, cz + 0.07, 0.034, bevel=0)
    tri = Polygon([(-0.05, -0.075), (0.09, 0), (-0.05, 0.075)]).buffer(0.015, resolution=6)
    add_flat("lap_play", tri, 0.008, M["white"], lid, 0.2, cz + 0.07, 0.042, bevel=0)
    add_flat("lap_bar", rrect(0.62, 0.035, 0.016), 0.006, M["cyan"], lid, 0.17, cz - 0.2, 0.036, bevel=0)
    add_flat("lap_bar2", rrect(0.40, 0.035, 0.016), 0.006, M["ui_dim"], lid, 0.06, cz - 0.27, 0.036, bevel=0)
    add_flat("lap_avatar", Point(0, 0).buffer(0.06, resolution=14), 0.008, M["gold"], lid, -0.46, cz + 0.2, 0.036, bevel=0)


# --------------------------------------------------------------------------- 2. mobile
def build_mobile(root):
    add_flat("mob_body", rrect(0.60, 1.18, 0.10), 0.07, M["dark"], root, 0, 0, 0, bevel=0.012, seg=3)
    add_flat("mob_screen", rrect(0.53, 1.10, 0.075), 0.008, M["screen_bp"], root, 0, 0, 0.037, bevel=0)
    add_flat("mob_notch", rrect(0.17, 0.045, 0.022), 0.01, M["dark"], root, 0, 0.5, 0.043, bevel=0)
    add_flat("mob_title", rrect(0.30, 0.04, 0.02), 0.006, M["ui"], root, -0.07, 0.38, 0.043, bevel=0)
    tints = ["cyan", "gold", "pink", "white", "cyan", "purple"]
    for i in range(6):
        r, c = divmod(i, 2)
        add_flat(f"mob_app{i}", rrect(0.16, 0.16, 0.045), 0.008, M[tints[i]], root, -0.13 + 0.26 * c, 0.2 - 0.2 * r, 0.043, bevel=0)
        add_flat(f"mob_lbl{i}", rrect(0.10, 0.02, 0.01), 0.006, M["ui_dim"], root, -0.13 + 0.26 * c, 0.2 - 0.2 * r - 0.115, 0.043, bevel=0)
    add_flat("mob_card", rrect(0.42, 0.16, 0.04), 0.006, M["ui_dim"], root, 0, -0.42, 0.043, bevel=0)
    add_flat("mob_prog", rrect(0.28, 0.035, 0.017), 0.006, M["cyan"], root, -0.07, -0.42, 0.048, bevel=0)
    add_flat("mob_home", rrect(0.18, 0.02, 0.01), 0.006, M["ui"], root, 0, -0.52, 0.043, bevel=0)


# --------------------------------------------------------------------------- 3. graduation cap
def build_cap(root):
    g = empty("cap_tilt", root)
    g.rotation_euler = (0.28, 0, 0)
    cone("cap_skull", 0.40, 0.36, 0.36, M["dark"], g, (0, 0, -0.04), rot=(0, 0, 0))
    board = add_box("cap_board", (1.04, 1.04, 0.07), (0, 0, 0.17), M["dark"], g, rot=(0, 0, math.pi / 4), bevel=0.018)
    ring = Polygon(rrect(1.06, 1.06, 0.0001).exterior.coords, [rrect(1.0, 1.0, 0.0001).exterior.coords])
    ring = srotate(ring, 45, origin=(0, 0))
    new_obj("cap_trim", poly_mesh("cap_trim", ring, 0.012), M["blue"], g, (0, 0, 0.2))
    sphere("cap_button", 0.055, M["gold"], g, (0, 0, 0.225))
    cx = 0.74
    tube("cap_cord", [(0, 0, 0.225), (0.28, 0.0, 0.215), (0.56, 0.0, 0.215), (cx, 0.0, 0.2), (cx + 0.03, 0.0, 0.0), (cx + 0.03, 0.0, -0.12)], 0.011, M["gold"], g)
    cone("cap_tassel", 0.075, 0.018, 0.2, M["gold"], g, (cx + 0.03, 0, -0.24))
    sphere("cap_knob", 0.03, M["gold"], g, (cx + 0.03, 0, -0.1))


# --------------------------------------------------------------------------- 4. certificate
def build_certificate(root):
    add_flat("cert_paper", rrect(1.52, 1.06, 0.04), 0.03, M["paper"], root, 0, 0, 0, bevel=0.006, seg=2)
    border = rrect(1.40, 0.94, 0.03).difference(rrect(1.36, 0.90, 0.025))
    add_flat("cert_border", border, 0.008, M["blue"], root, 0, 0, 0.018, bevel=0)
    border2 = rrect(1.30, 0.84, 0.02).difference(rrect(1.29, 0.83, 0.018))
    add_flat("cert_border2", border2, 0.006, M["gold"], root, 0, 0, 0.018, bevel=0)
    make_text("cert_title", "CERTIFICATE", 0.115, M["ink"], root, (0, -0.03, 0.27), (math.pi / 2, 0, 0), spacing=1.18)
    make_text("cert_sub", "OF ACHIEVEMENT", 0.06, M["ink"], root, (0, -0.03, 0.14), (math.pi / 2, 0, 0), weight="Medium", spacing=1.3)
    for i, (w, z) in enumerate(((0.8, 0.02), (0.62, -0.08), (0.7, -0.18))):
        add_flat(f"cert_line{i}", rrect(w, 0.028, 0.012), 0.006, M["ink"], root, -0.2 + (0.8 - w) * 0.0, z, 0.02, bevel=0)
    # seal
    pts = []
    for i in range(32):
        r = 0.185 if i % 2 == 0 else 0.15
        a = i * math.pi / 16
        pts.append((r * math.cos(a), r * math.sin(a)))
    seal = Polygon(pts)
    sx, sz = 0.46, -0.27
    for k, ang in enumerate((-14, 14)):
        tail = Polygon([(-0.06, 0), (0.06, 0), (0.06, -0.26), (0, -0.19), (-0.06, -0.26)])
        tail = srotate(tail, ang, origin=(0, 0))
        add_flat(f"cert_tail{k}", tail, 0.01, M["blue"], root, sx, sz - 0.04, 0.024, bevel=0)
    add_flat("cert_seal", seal, 0.03, M["gold"], root, sx, sz, 0.03, bevel=0.006, seg=2)
    add_flat("cert_seal_in", Point(0, 0).buffer(0.1, resolution=16).difference(Point(0, 0).buffer(0.088, resolution=16)),
             0.01, M["paper"], root, sx, sz, 0.05, bevel=0)
    star = Polygon([(0, 0.07), (0.02, 0.02), (0.07, 0.02), (0.03, -0.01), (0.045, -0.06), (0, -0.03),
                    (-0.045, -0.06), (-0.03, -0.01), (-0.07, 0.02), (-0.02, 0.02)])
    add_flat("cert_star", star, 0.01, M["paper"], root, sx, sz, 0.052, bevel=0)


# --------------------------------------------------------------------------- 5. AI brain
def _fold(p):
    q = p.normalized()
    d = noise.noise(q * 3.6) * 0.5 + noise.noise(q * 7.2) * 0.25
    return 1.0 + 0.085 * (1 - 2 * abs(noise.noise(q * 4.4))) + 0.03 * d


def _brain_mesh(name, subdiv, grow=1.0):
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=subdiv, radius=1.0)
    for v in bm.verts:
        p = v.co.copy()
        f = _fold(p)
        # elongated ellipsoid, flattened underside, central fissure on top
        x, y, z = p.x * 0.66, p.y * 0.48, p.z * 0.50
        if z < -0.12:
            z = -0.12 + (z + 0.12) * 0.55
        fiss = max(0.0, 1 - abs(p.y) / 0.09) * max(0.0, p.z)
        v.co = Vector((x * f * grow, y * f * grow - 0.0, (z * f - fiss * 0.05) * grow))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return me


def build_brain(root):
    g = empty("brain_grp", root)
    g.rotation_euler = (0, 0, 0)
    me = _brain_mesh("brain_solid", 5)
    smooth_mesh(me)
    new_obj("brain_solid", me, M["brain"], g, (0, 0, 0.0), (0, 0, 0))
    wm = _brain_mesh("brain_wire", 3, 1.012)
    w = new_obj("brain_wire", wm, M["brain_wire"], g)
    mod = w.modifiers.new("Wire", "WIREFRAME")
    mod.thickness = 0.007
    mod.use_even_offset = True
    # cerebellum + stem
    cb = bmesh.new()
    bmesh.ops.create_uvsphere(cb, u_segments=28, v_segments=14, radius=1.0)
    for v in cb.verts:
        v.co = Vector((v.co.x * 0.24, v.co.y * 0.20, v.co.z * 0.14))
        v.co *= 1 + 0.06 * (1 - 2 * abs(noise.noise(v.co * 14)))
    bm_obj("brain_cb", cb, M["brain"], g, (0.30, 0.0, -0.22))
    cone("brain_stem", 0.055, 0.04, 0.22, M["brain"], g, (0.05, 0.0, -0.31), segs=16, rot=(0, 0.25, 0))
    # neurons on the surface
    random.seed(7)
    for i in range(26):
        d = Vector((random.gauss(0, 1), random.gauss(0, 1), random.gauss(0.2, 1))).normalized()
        if d.z < -0.35:
            d.z = abs(d.z)
        p = Vector((d.x * 0.66, d.y * 0.48, d.z * 0.5)) * _fold(d) * 1.02
        sphere(f"brain_n{i}", random.uniform(0.016, 0.034), M["white"] if i % 3 else M["cyan"], g, p, segs=10)
    # tiny orbiting "data" ring around the brain
    r = U.torus("brain_ring", 0.95, 0.006, M["cyan"], g)
    r.rotation_euler = (math.radians(72), 0.0, math.radians(12))


# --------------------------------------------------------------------------- 6. analytics chart
def build_chart(root):
    add_flat("chart_panel", rrect(1.54, 1.08, 0.07), 0.06, M["dark"], root, 0, 0, 0, bevel=0.012)
    add_flat("chart_inner", rrect(1.42, 0.96, 0.05), 0.01, M["dark_c"], root, 0, 0, 0.032, bevel=0)
    for i, z in enumerate((-0.12, 0.1, 0.32)):
        add_flat(f"chart_grid{i}", rrect(1.26, 0.008, 0.004), 0.004, M["blue"], root, 0, z, 0.04, bevel=0)
    add_flat("chart_axis", rrect(1.3, 0.016, 0.008), 0.006, M["ui"], root, 0, -0.34, 0.042, bevel=0)
    heights = (0.20, 0.34, 0.28, 0.50, 0.70)
    tops = []
    for i, h in enumerate(heights):
        x = -0.5 + i * 0.25
        add_flat(f"chart_bar{i}", rrect(0.15, h, 0.025), 0.045, M["bar"], root, x, -0.34 + h / 2, 0.055, bevel=0.006, seg=2)
        tops.append((x, -0.34 + h + 0.12))
    pts = [(x, -0.07, z) for x, z in tops]
    tube("chart_trend", pts, 0.014, M["gold"], root)
    for i, (x, z) in enumerate(tops):
        sphere(f"chart_dot{i}", 0.04, M["white"], root, (x, -0.07, z), segs=16)
    xa, za = tops[-1]
    cone("chart_arrow", 0.065, 0.0, 0.14, M["gold"], root, (xa + 0.1, -0.07, za + 0.07), segs=16, rot=(0, math.radians(120), 0))


# --------------------------------------------------------------------------- 7. video / play
def build_play(root):
    add_flat("play_panel", rrect(1.58, 1.0, 0.08), 0.06, M["dark_p"], root, 0, 0, 0, bevel=0.012)
    add_flat("play_screen", rrect(1.46, 0.88, 0.055), 0.01, M["screen_pc"], root, 0, 0.0, 0.034, bevel=0)
    tri = Polygon([(-0.13, -0.19), (0.22, 0), (-0.13, 0.19)]).buffer(0.035, resolution=8)
    add_flat("play_ring", Point(0, 0).buffer(0.31, resolution=40).difference(Point(0, 0).buffer(0.285, resolution=40)),
             0.012, M["ui"], root, 0, 0.05, 0.042, bevel=0)
    add_flat("play_tri", tri, 0.03, M["white"], root, 0.0, 0.05, 0.05, bevel=0.006, seg=2)
    add_flat("play_track", rrect(1.2, 0.04, 0.02), 0.008, M["ui_dim"], root, 0, -0.33, 0.042, bevel=0)
    add_flat("play_fill", rrect(0.62, 0.04, 0.02), 0.01, M["cyan"], root, -0.29, -0.33, 0.046, bevel=0)
    add_flat("play_knob", Point(0, 0).buffer(0.045, resolution=14), 0.02, M["white"], root, 0.02, -0.33, 0.05, bevel=0)
    add_flat("play_tag", rrect(0.30, 0.07, 0.03), 0.008, M["ui_dim"], root, -0.52, 0.34, 0.042, bevel=0)


# --------------------------------------------------------------------------- 8. books / content
def _book(root, name, w, d, h, cover, loc, rz):
    g = empty(name, root, loc=loc)
    g.rotation_euler = (0, 0, rz)
    t = 0.035
    add_box(name + "_back", (w, 0.045, h), (0, d / 2 - 0.0225, 0), cover, g, bevel=0.012)
    add_box(name + "_top", (w, d, t), (0, 0, h / 2 - t / 2), cover, g, bevel=0.012)
    add_box(name + "_bot", (w, d, t), (0, 0, -h / 2 + t / 2), cover, g, bevel=0.012)
    add_box(name + "_pages", (w - 0.06, d - 0.05, h - 2 * t + 0.01), (0.0, -0.03, 0), M["pages"], g, bevel=0.004, seg=2)
    # title strip + emblem on the top cover (lying flat)
    new_obj(name + "_strip", poly_mesh(name + "_strip", rrect(w * 0.6, 0.06, 0.02), 0.008), M["gold"], g, (0.0, 0.05, h / 2 + 0.003))
    new_obj(name + "_emb", poly_mesh(name + "_emb", Point(0, 0).buffer(0.05, resolution=10), 0.008), M["white"], g, (-w * 0.28, -0.1, h / 2 + 0.003))
    return g


def build_books(root):
    _book(root, "bk1", 1.22, 0.86, 0.20, M["cov_blue"], (0.0, 0.0, -0.30), math.radians(-4))
    _book(root, "bk2", 1.12, 0.80, 0.17, M["cov_purple"], (0.05, 0.0, -0.09), math.radians(6))
    _book(root, "bk3", 1.0, 0.72, 0.15, M["cov_dark"], (-0.04, 0.0, 0.10), math.radians(-9))
    # floating pages rising out of the stack
    for i, (x, z, a) in enumerate(((-0.35, 0.58, -12), (0.3, 0.78, 10), (0.0, 1.0, -4))):
        o = new_obj(f"bk_page{i}", poly_mesh(f"bk_page{i}", rrect(0.46, 0.34, 0.02), 0.01), M["white"] if i != 1 else M["cyan"],
                    root, (x, 0, z), (math.radians(-65), math.radians(a), 0))
    return None


BUILDERS = {
    "laptop": build_laptop, "mobile": build_mobile, "cap": build_cap, "certificate": build_certificate,
    "brain": build_brain, "chart": build_chart, "play": build_play, "books": build_books,
}
