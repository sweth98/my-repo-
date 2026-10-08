"""Shared helpers for the CanPlus Blender build: colours, easing, mesh + material factories."""
import math
import bmesh
import bpy
import numpy as np
import mapbox_earcut as earcut
from mathutils import Vector
from shapely.geometry import Polygon
from shapely.geometry.polygon import orient

# --------------------------------------------------------------------------- colour


def _lin(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hexc(h, a=1.0):
    h = h.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    return (_lin(r), _lin(g), _lin(b), a)


BLUE = hexc("#2377F9")      # logo blue
BLUE_L = hexc("#6AAEFF")
BLUE_D = hexc("#143FB0")
CYAN = hexc("#38D6FF")
PURPLE = hexc("#8466F0")    # brightened logo purple (emissive friendly)
PURPLE_D = hexc("#6248B2")  # logo purple
PINK = hexc("#C86BFF")
GOLD = hexc("#FFC857")
WHITE = hexc("#EAF2FF")
CREAM = hexc("#F4F1E6")
NAVY = hexc("#0A1226")

# --------------------------------------------------------------------------- easing


def clamp01(x):
    return max(0.0, min(1.0, x))


def seg(t, a, b):
    return clamp01((t - a) / (b - a))


def smooth(x):
    x = clamp01(x)
    return x * x * (3 - 2 * x)


def smoother(x):
    x = clamp01(x)
    return x ** 3 * (x * (6 * x - 15) + 10)


def out_cubic(x):
    x = clamp01(x)
    return 1 - (1 - x) ** 3


def in_cubic(x):
    x = clamp01(x)
    return x ** 3


def out_back(x, s=1.9):
    x = clamp01(x)
    return 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2


def bump(x, w=1.0):
    """Gaussian bump centred on 0."""
    return math.exp(-(x / w) ** 2)


def pchip(t, pts):
    """Monotone cubic Hermite interpolation (no overshoot between keys, C1 continuous)."""
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    n = len(xs)
    if t <= xs[0]:
        return ys[0]
    if t >= xs[-1]:
        return ys[-1]
    h = [xs[i + 1] - xs[i] for i in range(n - 1)]
    d = [(ys[i + 1] - ys[i]) / h[i] for i in range(n - 1)]
    m = [0.0] * n
    m[0], m[-1] = d[0], d[-1]
    for i in range(1, n - 1):
        if d[i - 1] * d[i] <= 0:
            m[i] = 0.0
        else:
            w1 = 2 * h[i] + h[i - 1]
            w2 = h[i] + 2 * h[i - 1]
            m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i])
    i = max(j for j in range(n - 1) if xs[j] <= t)
    s = (t - xs[i]) / h[i]
    h00 = (1 + 2 * s) * (1 - s) ** 2
    h10 = s * (1 - s) ** 2
    h01 = s * s * (3 - 2 * s)
    h11 = s * s * (s - 1)
    return h00 * ys[i] + h10 * h[i] * m[i] + h01 * ys[i + 1] + h11 * h[i] * m[i + 1]


# --------------------------------------------------------------------------- objects


def link(o, parent=None):
    bpy.context.scene.collection.objects.link(o)
    if parent is not None:
        o.parent = parent
    return o


def empty(name, parent=None, loc=(0, 0, 0), display="PLAIN_AXES", size=0.2):
    o = bpy.data.objects.new(name, None)
    o.empty_display_type = display
    o.empty_display_size = size
    o.location = loc
    return link(o, parent)


def new_obj(name, mesh, mat=None, parent=None, loc=(0, 0, 0), rot=(0, 0, 0), scl=(1, 1, 1)):
    o = bpy.data.objects.new(name, mesh)
    if mat is not None:
        o.data.materials.append(mat)
    o.location = loc
    o.rotation_euler = rot
    o.scale = scl
    return link(o, parent)


def torus(name, major, minor, mat, parent=None, segs=160):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=segs, minor_segments=8)
    o = bpy.context.object
    o.name = name
    o.data.materials.append(mat)
    for p in o.data.polygons:
        p.use_smooth = True
    if parent is not None:
        o.parent = parent
    return o


def smooth_mesh(me):
    for p in me.polygons:
        p.use_smooth = True


def finish(o, bevel=0.02, seg=3):
    """Bevel + weighted normals => crisp, premium-looking edges on smooth-shaded geometry."""
    if bevel > 0:
        m = o.modifiers.new("Bevel", "BEVEL")
        m.width = bevel
        m.segments = seg
        m.limit_method = "ANGLE"
        m.angle_limit = math.radians(35)
    smooth_mesh(o.data)
    w = o.modifiers.new("WN", "WEIGHTED_NORMAL")
    w.keep_sharp = True
    w.mode = "FACE_AREA"
    return o


def box_mesh(name, sx, sy, sz):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= sx
        v.co.y *= sy
        v.co.z *= sz
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return me


def add_box(name, size, loc, mat, parent, rot=(0, 0, 0), bevel=0.015, seg=3):
    o = new_obj(name, box_mesh(name, *size), mat, parent, loc, rot)
    return finish(o, bevel, seg) if bevel else o


def poly_mesh(name, poly, depth):
    """Extrude a shapely polygon (in XY) along Z, centred on z=0."""
    polys = [poly] if poly.geom_type == "Polygon" else list(poly.geoms)
    bm = bmesh.new()
    for pg in polys:
        pg = orient(pg, 1.0)
        rings = [list(pg.exterior.coords)[:-1]] + [list(r.coords)[:-1] for r in pg.interiors]
        flat = [p for r in rings for p in r]
        ends, c = [], 0
        for r in rings:
            c += len(r)
            ends.append(c)
        tris = earcut.triangulate_float64(np.array(flat, dtype=np.float64), np.array(ends, dtype=np.uint32))
        h = depth / 2
        fv = [bm.verts.new((x, y, h)) for x, y in flat]
        bv = [bm.verts.new((x, y, -h)) for x, y in flat]
        for i in range(0, len(tris), 3):
            a, b, c3 = tris[i:i + 3]
            try:
                bm.faces.new((fv[a], fv[b], fv[c3]))
                bm.faces.new((bv[c3], bv[b], bv[a]))
            except ValueError:
                pass
        start = 0
        for r in rings:
            n = len(r)
            for i in range(n):
                a, b = start + i, start + (i + 1) % n
                try:
                    bm.faces.new((fv[a], bv[a], bv[b], fv[b]))
                except ValueError:
                    pass
            start += n
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    return me


def add_flat(name, poly, depth, mat, parent, x=0.0, z=0.0, front=0.0, bevel=0.01, seg=2):
    """Flat shape standing upright in the XZ plane (facing -Y). `front` pushes it toward the viewer."""
    o = new_obj(name, poly_mesh(name, poly, depth), mat, parent, (x, -front, z), (math.pi / 2, 0, 0))
    return finish(o, bevel, seg) if bevel else o


def rrect(w, h, r, cx=0.0, cy=0.0):
    from shapely.geometry import box
    r = min(r, w / 2 - 1e-4, h / 2 - 1e-4)
    return box(cx - w / 2 + r, cy - h / 2 + r, cx + w / 2 - r, cy + h / 2 - r).buffer(r, resolution=8)


# --------------------------------------------------------------------------- materials

ANIM_SOCKETS = {}   # name -> socket, keyed per frame by the timeline


def _new_mat(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    return m


def principled(name, base, rough=0.3, metal=0.0, emit=None, estr=0.0, coat=0.0, anim=False):
    m = _new_mat(name)
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = base
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    b.inputs["Coat Weight"].default_value = coat
    if emit is not None:
        b.inputs["Emission Color"].default_value = emit
        b.inputs["Emission Strength"].default_value = estr
    if anim:
        ANIM_SOCKETS[name] = b.inputs["Emission Strength"]
    return m


def emissive(name, color, strength=1.0, anim=False):
    m = _new_mat(name)
    nt = m.node_tree
    nt.nodes.clear()
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = color
    em.inputs["Strength"].default_value = strength
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(em.outputs[0], out.inputs[0])
    if anim:
        ANIM_SOCKETS[name] = em.inputs["Strength"]
    return m


def holo(name, rim, base=(0.012, 0.02, 0.05, 1), rough=0.22, metal=0.7, rim_strength=2.0):
    """Dark glossy body with a fresnel rim glow in `rim` colour."""
    m = _new_mat(name)
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = base
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    b.inputs["Coat Weight"].default_value = 0.4
    lw = nt.nodes.new("ShaderNodeLayerWeight")
    lw.inputs["Blend"].default_value = 0.35
    mul = nt.nodes.new("ShaderNodeMath")
    mul.operation = "MULTIPLY"
    mul.inputs[1].default_value = rim_strength
    nt.links.new(lw.outputs["Fresnel"], mul.inputs[0])
    b.inputs["Emission Color"].default_value = rim
    nt.links.new(mul.outputs[0], b.inputs["Emission Strength"])
    return m


def gradient_emissive(name, c0, c1, strength=1.5, axis=1, lo=-0.5, hi=0.5, rough=0.2, anim=False):
    """Emissive surface with a linear colour gradient along the object's local `axis`."""
    m = _new_mat(name)
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    mr = nt.nodes.new("ShaderNodeMapRange")
    mr.inputs["From Min"].default_value = lo
    mr.inputs["From Max"].default_value = hi
    ramp = nt.nodes.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = c0
    ramp.color_ramp.elements[1].color = c1
    nt.links.new(tc.outputs["Object"], sep.inputs[0])
    nt.links.new(sep.outputs[axis], mr.inputs["Value"])
    nt.links.new(mr.outputs[0], ramp.inputs[0])
    nt.links.new(ramp.outputs[0], b.inputs["Emission Color"])
    base = nt.nodes.new("ShaderNodeRGB")
    base.outputs[0].default_value = (0.01, 0.015, 0.04, 1)
    nt.links.new(base.outputs[0], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = rough
    b.inputs["Emission Strength"].default_value = strength
    if anim:
        ANIM_SOCKETS[name] = b.inputs["Emission Strength"]
    return m
