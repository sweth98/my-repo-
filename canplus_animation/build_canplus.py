"""
CanPlus - "One platform. Every learning journey."
3D learning-ecosystem animation, built procedurally for Blender (tested on 5.0 / bpy).

Run (headless):
    python build_canplus.py                       # builds canplus.blend
    CP_RENDER=1 python build_canplus.py           # builds + renders PNG frames
    blender -b -P build_canplus.py -- ...         # same, with a regular Blender install

Environment variables
    CP_OUT      output dir for blend + frames           (default ./out)
    CP_RES      horizontal resolution                   (default 1920)
    CP_SAMPLES  Cycles samples                          (default 48)
    CP_FRAMES   "start-end" frame range to render       (default 1-480)
    CP_STILL    single frame number -> renders only that frame
    CP_ENGINE   CYCLES | BLENDER_EEVEE                  (default CYCLES)

Timeline (24 fps, 480 frames = 20 s)
     0-3  s  dark void, small glowing CanPlus mark appears, camera dollies in
     3-6  s  mark expands into the hub, 8 objects emerge and start orbiting
     6-12 s  glowing data lines connect every object back to the hub, packets
             flow; Learner -> CanPlus -> Course -> Assessment -> Certification
    12-16 s  everything spirals inward, flash, ecosystem becomes the logo
    16-20 s  "One platform." / "Every learning journey." / CANPLUS / real logo
"""
import math
import os
import random
import sys

import bpy
import bmesh
from mathutils import Vector, Quaternion, Euler

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.environ.get("CP_OUT", os.path.join(HERE, "out"))
RES_X = int(os.environ.get("CP_RES", "1920"))
RES_Y = int(round(RES_X * 9 / 16))
SAMPLES = int(os.environ.get("CP_SAMPLES", "48"))
ENGINE = os.environ.get("CP_ENGINE", "CYCLES")
LOGO_IMG = os.path.join(HERE, "assets", "canplus_logo.png")
FONT_BOLD = "/usr/share/fonts/opentype/inter/Inter-Bold.otf"
FONT_SEMI = "/usr/share/fonts/opentype/inter/Inter-SemiBold.otf"
FONT_REG = "/usr/share/fonts/opentype/inter/Inter-Medium.otf"

FPS = 24
DUR = 20.0
NF = int(FPS * DUR)

# ---------------------------------------------------------------- palette
def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    lin = [(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4) for x in c]
    return (*lin, 1.0)


BLUE = srgb("#2F6BFF")
BLUE_LT = srgb("#5C9BFF")
PURPLE = srgb("#6A3FD0")
CYAN = srgb("#2FE0FF")
MAGENTA = srgb("#C45BFF")
GOLD = srgb("#FFC45A")
WHITE = srgb("#FFFFFF")
NAVY = srgb("#0B1230")
RED = srgb("#FF5C7A")
GREEN = srgb("#3DF2B0")


# ---------------------------------------------------------------- easing
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def prog(t, t0, t1):
    return clamp((t - t0) / (t1 - t0)) if t1 > t0 else (1.0 if t >= t1 else 0.0)


def smooth(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def ease_out(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def ease_in(x):
    x = clamp(x)
    return x ** 3


def ease_io(x):
    x = clamp(x)
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def ease_back(x, s=1.9):
    x = clamp(x)
    return 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2


def lerp(a, b, x):
    return a + (b - a) * x


# ---------------------------------------------------------------- scene reset
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.name = "CanPlus"
scene.render.fps = FPS
scene.frame_start = 1
scene.frame_end = NF
scene.render.resolution_x = RES_X
scene.render.resolution_y = RES_Y
scene.render.resolution_percentage = 100

# ---------------------------------------------------------------- helpers
_col = bpy.data.collections.new("CanPlus")
scene.collection.children.link(_col)


def link(o):
    _col.objects.link(o)
    return o


def principled(mat):
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    return nt, bsdf, out


def setin(node, name, val):
    try:
        node.inputs[name].default_value = val
    except Exception:
        pass


def make_mat(name, base=(0.05, 0.06, 0.1, 1), rough=0.3, metal=0.0, emit=None, strength=0.0, coat=0.0, spec=0.5):
    m = bpy.data.materials.new(name)
    nt, b, _ = principled(m)
    setin(b, "Base Color", base)
    setin(b, "Roughness", rough)
    setin(b, "Metallic", metal)
    setin(b, "Coat Weight", coat)
    setin(b, "Coat Roughness", 0.1)
    setin(b, "Specular IOR Level", spec)
    if emit is not None:
        setin(b, "Emission Color", emit)
        setin(b, "Emission Strength", strength)
    return m


def emit_mat(name, color, strength=3.0, fade=False):
    """Pure emission. With fade=True, returns (mat, fade_input_socket) where the
    socket is the mix factor (0 = invisible, 1 = fully visible)."""
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")
    em.inputs["Color"].default_value = color
    em.inputs["Strength"].default_value = strength
    if not fade:
        nt.links.new(em.outputs[0], out.inputs["Surface"])
        return m, em
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    mx = nt.nodes.new("ShaderNodeMixShader")
    mx.inputs[0].default_value = 1.0
    nt.links.new(tr.outputs[0], mx.inputs[1])
    nt.links.new(em.outputs[0], mx.inputs[2])
    nt.links.new(mx.outputs[0], out.inputs["Surface"])
    return m, mx


def bevel(o, width=0.04, seg=3):
    md = o.modifiers.new("Bevel", "BEVEL")
    md.width = width
    md.segments = seg
    md.limit_method = "ANGLE"
    return o


def mesh_obj(name, bm, mat=None, parent=None, loc=(0, 0, 0), rot=(0, 0, 0), smooth_shade=True):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if smooth_shade:
        for p in me.polygons:
            p.use_smooth = True
    o = bpy.data.objects.new(name, me)
    link(o)
    if mat:
        o.data.materials.append(mat)
    o.location = loc
    o.rotation_euler = rot
    if parent:
        o.parent = parent
    return o


def box(name, size, mat, parent=None, loc=(0, 0, 0), rot=(0, 0, 0), bev=0.0, seg=3):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= size[0]
        v.co.y *= size[1]
        v.co.z *= size[2]
    o = mesh_obj(name, bm, mat, parent, loc, rot, smooth_shade=False)
    if bev:
        bevel(o, bev, seg)
        for p in o.data.polygons:
            p.use_smooth = True
        o.data.polygons.foreach_set("use_smooth", [True] * len(o.data.polygons))
    return o


def cyl(name, r, depth, mat, parent=None, loc=(0, 0, 0), rot=(0, 0, 0), segs=32, r2=None):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=segs, radius1=r, radius2=r if r2 is None else r2, depth=depth)
    return mesh_obj(name, bm, mat, parent, loc, rot)


def sphere(name, r, mat, parent=None, loc=(0, 0, 0), segs=16, scale=(1, 1, 1)):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segs, v_segments=max(8, segs // 2), radius=r)
    o = mesh_obj(name, bm, mat, parent, loc)
    o.scale = scale
    return o


def empty(name, parent=None, loc=(0, 0, 0), kind="PLAIN_AXES"):
    e = bpy.data.objects.new(name, None)
    e.empty_display_type = kind
    e.empty_display_size = 0.2
    link(e)
    e.location = loc
    if parent:
        e.parent = parent
    return e


def curve_obj(name, pts, radius, mat, closed=False, parent=None, loc=(0, 0, 0), rot=(0, 0, 0), res=4):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = radius
    cu.bevel_resolution = res
    cu.use_fill_caps = True
    sp = cu.splines.new("POLY")
    sp.points.add(len(pts) - 1)
    for p, c in zip(sp.points, pts):
        p.co = (c[0], c[1], c[2], 1.0)
    sp.use_cyclic_u = closed
    o = bpy.data.objects.new(name, cu)
    link(o)
    o.data.materials.append(mat)
    o.location = loc
    o.rotation_euler = rot
    if parent:
        o.parent = parent
    return o


def circle_pts(r, n=128):
    return [(r * math.cos(2 * math.pi * i / n), r * math.sin(2 * math.pi * i / n), 0) for i in range(n)]


def text_obj(name, body, size, mat, font=FONT_BOLD, parent=None, loc=(0, 0, 0), align="CENTER", extrude=0.0, space=1.0):
    cu = bpy.data.curves.new(name, "FONT")
    cu.body = body
    cu.size = size
    cu.align_x = align
    cu.align_y = "CENTER"
    cu.extrude = extrude
    cu.space_character = space
    try:
        cu.font = bpy.data.fonts.load(font)
        cu.font_bold = cu.font
    except Exception:
        pass
    o = bpy.data.objects.new(name, cu)
    link(o)
    o.data.materials.append(mat)
    o.location = loc
    if parent:
        o.parent = parent
    return o


def key(o, f, **chan):
    for k, v in chan.items():
        setattr(o, k, v)
        o.keyframe_insert(k, frame=f)


def stepify(o):
    ad = o.animation_data
    if ad and ad.action:
        try:
            for fc in ad.action.fcurves:
                for kp in fc.keyframe_points:
                    kp.interpolation = "CONSTANT"
        except Exception:
            pass


# ================================================================ WORLD / RENDER
world = bpy.data.worlds.new("Void")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (0.004, 0.006, 0.016, 1)
bg.inputs["Strength"].default_value = 1.0

r = scene.render
r.engine = ENGINE
if ENGINE == "CYCLES":
    c = scene.cycles
    c.device = "CPU"
    c.samples = SAMPLES
    c.use_adaptive_sampling = True
    c.adaptive_threshold = 0.03
    c.adaptive_min_samples = 8
    c.use_denoising = True
    try:
        c.denoiser = "OPENIMAGEDENOISE"
    except Exception:
        pass
    c.max_bounces = 5
    c.diffuse_bounces = 2
    c.glossy_bounces = 3
    c.transmission_bounces = 2
    c.transparent_max_bounces = 8
    c.sample_clamp_indirect = 8.0
    c.sample_clamp_direct = 0.0
    c.caustics_reflective = False
    c.caustics_refractive = False
    c.use_light_tree = True
    try:
        c.use_fast_gi = False
    except Exception:
        pass
scene.view_settings.view_transform = "Standard"
try:
    scene.view_settings.look = "None"
except Exception:
    pass
scene.view_settings.exposure = 0.0
scene.view_settings.gamma = 1.0
scene.display_settings.display_device = "sRGB"
r.image_settings.file_format = "PNG"
r.image_settings.color_mode = "RGB"
r.image_settings.color_depth = "8"
r.film_transparent = False

# ================================================================ CAMERA RIG
cam_data = bpy.data.cameras.new("Cam")
cam_data.lens = 35
cam_data.sensor_width = 36
cam_data.dof.use_dof = True
cam_data.dof.aperture_fstop = 3.2
cam_data.clip_end = 500
cam = bpy.data.objects.new("Camera", cam_data)
link(cam)
scene.camera = cam
target = empty("CamTarget", loc=(0, 0, 0))
tc = cam.constraints.new("TRACK_TO")
tc.target = target
tc.track_axis = "TRACK_NEGATIVE_Z"
tc.up_axis = "UP_Y"
cam_data.dof.focus_object = None


def cam_state(t):
    """returns (azimuth_deg, elevation_deg, distance, target_z)"""
    # distance: slow dolly-in, further push at the end
    d = lerp(25.0, 17.5, ease_out(prog(t, 0, 3.4)))
    d = lerp(d, 15.0, smooth(prog(t, 3.4, 12.0)))
    d = lerp(d, 13.4, ease_io(prog(t, 12.0, 14.3)))
    d = lerp(d, 12.2, ease_out(prog(t, 14.3, 17.0)))
    az = lerp(-22, 20, smooth(prog(t, 0, 12.5)))
    az = lerp(az, 0, ease_io(prog(t, 12.5, 15.5)))
    el = lerp(10, 23, smooth(prog(t, 0, 7)))
    el = lerp(el, 17, smooth(prog(t, 7, 12.5)))
    el = lerp(el, 0, ease_io(prog(t, 12.5, 15.8)))
    tz = lerp(0.0, -0.2, smooth(prog(t, 3, 8)))
    tz = lerp(tz, 0.0, smooth(prog(t, 12, 15)))
    return az, el, d, tz


# ================================================================ LIGHTS
def area_light(name, loc, energy, color, size, pointat=(0, 0, 0)):
    ld = bpy.data.lights.new(name, "AREA")
    ld.energy = energy
    ld.color = color[:3]
    ld.size = size
    o = bpy.data.objects.new(name, ld)
    link(o)
    o.location = loc
    o.visible_glossy = False
    o.visible_camera = False
    tt = o.constraints.new("TRACK_TO")
    tt.target = target
    tt.track_axis = "TRACK_NEGATIVE_Z"
    tt.up_axis = "UP_Y"
    return o


area_light("KeyBlue", (-9, -6, 7), 1100, BLUE_LT, 7)
area_light("KeyMagenta", (10, -4, 5), 800, MAGENTA, 7)
area_light("RimCyan", (0, 12, 6), 1200, CYAN, 10)
hub_light_data = bpy.data.lights.new("HubGlow", "POINT")
hub_light_data.energy = 0
hub_light_data.shadow_soft_size = 0.6
hub_light_data.color = (0.45, 0.6, 1.0)
hub_light = bpy.data.objects.new("HubGlow", hub_light_data)
link(hub_light)
hub_light.location = (0, -0.9, 0)

# ================================================================ FLOOR
FLOOR_Z = -2.7
fm = bpy.data.materials.new("Floor")
fm.use_nodes = True
nt = fm.node_tree
nt.nodes.clear()
o_ = nt.nodes.new("ShaderNodeOutputMaterial")
bs = nt.nodes.new("ShaderNodeBsdfPrincipled")
setin(bs, "Base Color", (0.012, 0.016, 0.035, 1))
setin(bs, "Roughness", 0.16)
setin(bs, "Metallic", 0.55)
tcn = nt.nodes.new("ShaderNodeTexCoord")
vm = nt.nodes.new("ShaderNodeVectorMath")
vm.operation = "LENGTH"
nt.links.new(tcn.outputs["Object"], vm.inputs[0])
ramp = nt.nodes.new("ShaderNodeValToRGB")
ramp.color_ramp.elements[0].position = 0.28
ramp.color_ramp.elements[0].color = (1, 1, 1, 1)
ramp.color_ramp.elements[1].position = 0.95
ramp.color_ramp.elements[1].color = (0, 0, 0, 1)
mp = nt.nodes.new("ShaderNodeMapRange")
mp.inputs["From Min"].default_value = 0
mp.inputs["From Max"].default_value = 28
mp.inputs["To Min"].default_value = 0
mp.inputs["To Max"].default_value = 1
nt.links.new(vm.outputs["Value"], mp.inputs["Value"])
nt.links.new(mp.outputs["Result"], ramp.inputs["Fac"])
trn = nt.nodes.new("ShaderNodeBsdfTransparent")
mxf = nt.nodes.new("ShaderNodeMixShader")
nt.links.new(ramp.outputs["Color"], mxf.inputs[0])
nt.links.new(trn.outputs[0], mxf.inputs[1])
nt.links.new(bs.outputs[0], mxf.inputs[2])
# faint grid emission
brk = nt.nodes.new("ShaderNodeTexBrick")
brk.inputs["Scale"].default_value = 1.0
brk.inputs["Mortar Size"].default_value = 0.012
brk.inputs["Brick Width"].default_value = 1.0
brk.inputs["Row Height"].default_value = 1.0
brk.offset = 0.0
brk.inputs["Color1"].default_value = (0, 0, 0, 1)
brk.inputs["Color2"].default_value = (0, 0, 0, 1)
brk.inputs["Mortar Smooth"].default_value = 0.3
nt.links.new(tcn.outputs["Object"], brk.inputs["Vector"])
mcol = nt.nodes.new("ShaderNodeMath")
mcol.operation = "MULTIPLY"
mcol.inputs[1].default_value = 0.0
em_ = nt.nodes.new("ShaderNodeEmission")
em_.inputs["Color"].default_value = BLUE
em_.inputs["Strength"].default_value = 0.0
nt.links.new(mxf.outputs[0], o_.inputs["Surface"])
plane = bpy.data.meshes.new("FloorMesh")
bm = bmesh.new()
bmesh.ops.create_grid(bm, x_segments=2, y_segments=2, size=60)
bm.to_mesh(plane)
bm.free()
floor = bpy.data.objects.new("Floor", plane)
link(floor)
floor.location = (0, 0, FLOOR_Z)
floor.data.materials.append(fm)

# ================================================================ HUB LOGO (3D CanPlus mark)
logo = empty("CanPlusLogo", kind="PLAIN_AXES")
mark_mat = bpy.data.materials.new("MarkBlue")
mark_mat.use_nodes = True
nt = mark_mat.node_tree
nt.nodes.clear()
mo = nt.nodes.new("ShaderNodeOutputMaterial")
mb = nt.nodes.new("ShaderNodeBsdfPrincipled")
setin(mb, "Base Color", BLUE)
setin(mb, "Roughness", 0.18)
setin(mb, "Metallic", 0.0)
setin(mb, "Coat Weight", 1.0)
setin(mb, "Coat Roughness", 0.05)
tcx = nt.nodes.new("ShaderNodeTexCoord")
sep = nt.nodes.new("ShaderNodeSeparateXYZ")
nt.links.new(tcx.outputs["Object"], sep.inputs[0])
mr = nt.nodes.new("ShaderNodeMapRange")
mr.inputs["From Min"].default_value = -1.0
mr.inputs["From Max"].default_value = 1.0
nt.links.new(sep.outputs["Z"], mr.inputs["Value"])
gr = nt.nodes.new("ShaderNodeValToRGB")
gr.color_ramp.elements[0].position = 0.0
gr.color_ramp.elements[0].color = srgb("#2552E8")
gr.color_ramp.elements[1].position = 1.0
gr.color_ramp.elements[1].color = srgb("#5BA2FF")
nt.links.new(mr.outputs["Result"], gr.inputs["Fac"])
nt.links.new(gr.outputs["Color"], mb.inputs["Base Color"])
nt.links.new(gr.outputs["Color"], mb.inputs["Emission Color"])
setin(mb, "Emission Strength", 1.0)
nt.links.new(mb.outputs[0], mo.inputs["Surface"])

plus_mat = make_mat("MarkPlus", PURPLE, rough=0.2, emit=PURPLE, strength=0.8, coat=1.0)

# open hexagon "C": pointy-top hex, opening on the right edge (between 30 deg and -30 deg)
HR = 1.0
verts = [(HR * math.cos(math.radians(a)), HR * math.sin(math.radians(a))) for a in (30, 90, 150, 210, 270, 330)]
path = [verts[0]]
FIL = 0.115
for i in range(1, 5):
    p, a, b = verts[i], verts[i - 1], verts[i + 1]
    va = (a[0] - p[0], a[1] - p[1])
    vb = (b[0] - p[0], b[1] - p[1])
    la, lb = math.hypot(*va), math.hypot(*vb)
    pa = (p[0] + va[0] / la * FIL * 1.6, p[1] + va[1] / la * FIL * 1.6)
    pb = (p[0] + vb[0] / lb * FIL * 1.6, p[1] + vb[1] / lb * FIL * 1.6)
    for k in range(9):
        u = k / 8
        x = (1 - u) ** 2 * pa[0] + 2 * (1 - u) * u * p[0] + u * u * pb[0]
        y = (1 - u) ** 2 * pa[1] + 2 * (1 - u) * u * p[1] + u * u * pb[1]
        path.append((x, y))
path.append(verts[5])
pts3 = [(x, 0.0, z) for x, z in path]
STROKE = 0.15
mark = curve_obj("MarkHex", pts3, STROKE, mark_mat, parent=logo, res=8)
mark.data.use_fill_caps = False
for end in (verts[0], verts[5]):
    sphere("MarkCap", STROKE, mark_mat, parent=logo, loc=(end[0], 0, end[1]), segs=24)
# plus sign
PX = 0.66
box("PlusH", (0.62, 0.20, 0.17), plus_mat, parent=logo, loc=(PX, -0.02, 0), bev=0.07, seg=4)
box("PlusV", (0.17, 0.20, 0.62), plus_mat, parent=logo, loc=(PX, -0.02, 0), bev=0.07, seg=4)
# soft backplate glow so the mark reads as a lit object
halo_m, halo_mix = emit_mat("LogoHalo", BLUE, 1.0, fade=True)

# hub rings around the mark (hexagonal "digital hub")
hub_ring_mat, hub_ring_mix = emit_mat("HubRing", CYAN, 3.0, fade=True)
hub_hexes = []
halo_pivot = empty("HaloPivot")
_cr = halo_pivot.constraints.new("COPY_ROTATION")
_cr.target = cam
for i, (hr_, tilt, spd) in enumerate([(1.75, 0.0, 0.5), (1.6, math.radians(90), -0.25)]):
    hexo = curve_obj(f"HubHex{i}", [(hr_ * math.cos(math.radians(60 * k)), hr_ * math.sin(math.radians(60 * k)), 0) for k in range(6)],
                     0.012, hub_ring_mat, closed=True, loc=(0, 0, 0), res=2)
    hexo.rotation_euler = (tilt, 0, 0)
    if i == 1:
        hexo.parent = halo_pivot
    hub_hexes.append((hexo, spd, tilt))

# ================================================================ ORBIT ITEMS
body_mat = make_mat("Body", (0.025, 0.03, 0.06, 1), rough=0.22, metal=0.7, coat=0.6)
glass_mat = make_mat("Glass", (0.03, 0.05, 0.12, 1), rough=0.1, metal=0.2, coat=1.0)
white_paper = make_mat("Paper", (0.9, 0.93, 1, 1), rough=0.6, emit=(0.8, 0.88, 1, 1), strength=0.55)


def glow_mat(name, color, s=4.0):
    return make_mat(name, color, rough=0.25, emit=color, strength=s)


items = {}


def build_laptop():
    root = empty("Laptop")
    box("Base", (1.35, 0.92, 0.06), body_mat, root, (0, 0, 0), bev=0.025)
    box("Keys", (1.12, 0.5, 0.012), glow_mat("KeysGlow", BLUE, 1.2), root, (0, -0.05, 0.034))
    box("Pad", (0.4, 0.2, 0.012), glow_mat("PadGlow", BLUE_LT, 0.9), root, (0, -0.33, 0.034))
    hinge = empty("Hinge", root, (0, 0.46, 0.04))
    hinge.rotation_euler = (math.radians(-18), 0, 0)
    box("Lid", (1.35, 0.045, 0.9), body_mat, hinge, (0, 0, 0.45), bev=0.02)
    scr = box("Screen", (1.25, 0.01, 0.78), glow_mat("ScreenBG", srgb("#0B2A7A"), 1.6), hinge, (0, -0.03, 0.46))
    # UI mock-up on screen
    box("UIbar", (1.1, 0.012, 0.07), glow_mat("UIbar", CYAN, 3.0), hinge, (0, -0.036, 0.78))
    for i, (w, c) in enumerate([(0.34, PURPLE), (0.34, BLUE_LT), (0.34, MAGENTA)]):
        box(f"Tile{i}", (w, 0.012, 0.28), glow_mat(f"Tile{i}", c, 2.6), hinge, (-0.4 + i * 0.4, -0.036, 0.52), bev=0.01)
    for i in range(3):
        box(f"Line{i}", (1.1 - i * 0.25, 0.012, 0.03), glow_mat(f"Line{i}", WHITE, 1.4), hinge, (-0.12 * i, -0.036, 0.24 - i * 0.07))
    return root


def build_mobile():
    root = empty("Mobile")
    box("Phone", (0.55, 0.07, 1.05), body_mat, root, (0, 0, 0), bev=0.08, seg=5)
    box("Display", (0.47, 0.01, 0.96), glow_mat("PhoneBG", srgb("#10246B"), 1.8), root, (0, -0.038, 0), bev=0.05, seg=4)
    box("Hdr", (0.4, 0.012, 0.1), glow_mat("PhoneHdr", CYAN, 3.0), root, (0, -0.043, 0.36), bev=0.02)
    for i, c in enumerate([PURPLE, BLUE_LT, MAGENTA]):
        box(f"Card{i}", (0.4, 0.012, 0.18), glow_mat(f"PCard{i}", c, 2.6), root, (0, -0.043, 0.15 - i * 0.24), bev=0.03)
    return root


def build_cap():
    root = empty("GradCap")
    box("Board", (1.35, 1.35, 0.06), glow_mat("CapBoard", srgb("#14213F"), 0.4), root, (0, 0, 0.12), rot=(0, 0, math.radians(45)), bev=0.012)
    box("BoardEdge", (1.38, 1.38, 0.02), glow_mat("CapEdge", BLUE_LT, 3.0), root, (0, 0, 0.085), rot=(0, 0, math.radians(45)))
    cyl("Skull", 0.42, 0.34, glow_mat("CapBody", srgb("#1B2C5C"), 0.5), root, (0, 0, -0.1), segs=40, r2=0.5)
    sphere("Button", 0.07, glow_mat("CapBtn", GOLD, 5.0), root, (0, 0, 0.17))
    box("Cord", (0.02, 0.02, 0.0001), glow_mat("CordM", GOLD, 5.0), root, (0, 0, 0.0))
    # tassel cord on the board toward the corner, then hanging
    cord = curve_obj("Cord", [(0, 0, 0.17), (0.35, 0, 0.16), (0.78, 0, 0.15), (0.92, 0, 0.0), (0.92, 0, -0.18)], 0.012, glow_mat("CordMat", GOLD, 5.0), parent=root, res=3)
    cord.rotation_euler = (0, 0, math.radians(45))
    t = box("Tassel", (0.07, 0.07, 0.22), glow_mat("TasselMat", GOLD, 4.0), root, (0, 0, 0), bev=0.02)
    t.parent = root
    t.location = (0.92 * math.cos(math.radians(45)), 0.92 * math.sin(math.radians(45)), -0.3)
    root.scale = (1, 1, 1)
    return root


def build_cert():
    root = empty("Certificate")
    box("Paper", (1.5, 0.035, 1.05), white_paper, root, (0, 0, 0), bev=0.015)
    gold = glow_mat("CertGold", GOLD, 4.5)
    for (sx, sz, lx, lz) in [(1.38, 0.025, 0, 0.47), (1.38, 0.025, 0, -0.47), (0.025, 0.94, 0.68, 0), (0.025, 0.94, -0.68, 0)]:
        box("Border", (sx, 0.045, sz), gold, root, (lx, -0.002, lz))
    navy = glow_mat("CertInk", srgb("#16306E"), 0.8)
    box("Title", (0.78, 0.045, 0.085), navy, root, (0, -0.004, 0.27), bev=0.01)
    for i, w in enumerate([1.0, 0.85, 0.7]):
        box(f"Ln{i}", (w, 0.045, 0.035), glow_mat(f"CertLn{i}", srgb("#5A6FA8"), 0.6), root, (0, -0.004, 0.08 - i * 0.12))
    seal = cyl("Seal", 0.17, 0.05, glow_mat("SealGold", GOLD, 6.0), root, (0.45, -0.04, -0.28), (math.radians(90), 0, 0), segs=40)
    cyl("SealIn", 0.11, 0.06, glow_mat("SealIn", srgb("#FFE9B0"), 4.0), root, (0.45, -0.045, -0.28), (math.radians(90), 0, 0), segs=40)
    for sgn in (-1, 1):
        box("Ribbon", (0.09, 0.02, 0.3), glow_mat("Ribbon", RED, 3.0), root, (0.45 + sgn * 0.07, -0.035, -0.5), rot=(0, sgn * math.radians(14), 0))
    return root


def build_brain():
    root = empty("AIBrain")
    wire = glow_mat("BrainWire", MAGENTA, 5.5)
    core = make_mat("BrainCore", srgb("#1A0B3A"), rough=0.3, emit=PURPLE, strength=0.5)
    # displacement texture for organic folds
    tex = bpy.data.textures.new("BrainClouds", "CLOUDS")
    tex.noise_scale = 0.55
    tex.noise_depth = 2
    for sgn in (-1, 1):
        bm = bmesh.new()
        bmesh.ops.create_icosphere(bm, subdivisions=3, radius=0.5)
        for v in bm.verts:
            v.co.x *= 0.52
            v.co.y *= 0.82
            v.co.z *= 0.66
        h = mesh_obj(f"Hemi{sgn}", bm, core, root, (sgn * 0.27, 0, 0))
        d = h.modifiers.new("Fold", "DISPLACE")
        d.texture = tex
        d.strength = 0.14
        d.mid_level = 0.45
        w = h.modifiers.new("Wire", "WIREFRAME")
        w.thickness = 0.014
        w.use_replace = False
        w.material_offset = 1
        h.data.materials.append(wire)
    # neural nodes + synapse lines
    rng = random.Random(11)
    nodes = []
    for i in range(16):
        th = rng.uniform(0, 2 * math.pi)
        ph = math.acos(rng.uniform(-1, 1))
        x, y, z = 0.72 * math.sin(ph) * math.cos(th), 0.55 * math.sin(ph) * math.sin(th) * 1.0, 0.45 * math.cos(ph)
        nodes.append((x, y, z))
        sphere(f"Node{i}", 0.04, glow_mat("NodeGlow", srgb("#DFF8FF"), 14.0), root, (x, y * 1.2, z), segs=12)
    link_mat = glow_mat("SynapseGlow", CYAN, 4.0)
    for i in range(16):
        a = nodes[i]
        b = nodes[(i * 5 + 3) % 16]
        curve_obj("Syn", [(a[0], a[1] * 1.2, a[2]), (b[0], b[1] * 1.2, b[2])], 0.006, link_mat, parent=root, res=1)
    root.rotation_euler = (0, 0, 0)
    return root


def build_chart():
    root = empty("Analytics")
    box("Plate", (1.6, 0.9, 0.05), glass_mat, root, (0, 0, -0.03), bev=0.02)
    hs = [0.32, 0.55, 0.45, 0.85, 1.2]
    cols = [CYAN, BLUE_LT, srgb("#7C8DFF"), PURPLE, MAGENTA]
    pts = []
    for i, (h, c) in enumerate(zip(hs, cols)):
        x = -0.58 + i * 0.29
        box(f"Bar{i}", (0.2, 0.2, h), glow_mat(f"BarM{i}", c, 3.2), root, (x, 0.0, h / 2), bev=0.02)
        pts.append((x, 0.0, h + 0.12))
    curve_obj("Trend", pts, 0.018, glow_mat("TrendM", WHITE, 9.0), parent=root, res=3)
    for p in pts:
        sphere("Dot", 0.05, glow_mat("DotM", WHITE, 14.0), root, p, segs=12)
    # axes
    box("AxisX", (1.45, 0.02, 0.012), glow_mat("AxisM", BLUE_LT, 2.0), root, (0, -0.33, 0.0))
    return root


def build_play():
    root = empty("Video")
    box("Frame", (1.5, 0.08, 0.9), body_mat, root, (0, 0, 0), bev=0.09, seg=5)
    box("Screen", (1.38, 0.012, 0.78), glow_mat("VidBG", srgb("#0F1E66"), 1.5), root, (0, -0.045, 0.0), bev=0.07, seg=4)
    tri = cyl("PlayTri", 0.26, 0.05, glow_mat("PlayM", WHITE, 7.0), root, (0.02, -0.07, 0.04), (math.radians(90), 0, 0), segs=3)
    ring = curve_obj("PlayRing", circle_pts(0.42, 64), 0.02, glow_mat("PlayRingM", CYAN, 5.0), parent=root, loc=(0, -0.07, 0.04), rot=(math.radians(90), 0, 0), res=3)
    box("Track", (1.15, 0.012, 0.035), glow_mat("TrackM", srgb("#3B4C8F"), 1.0), root, (0, -0.05, -0.3), bev=0.01)
    box("Prog", (0.55, 0.014, 0.035), glow_mat("ProgM", CYAN, 5.0), root, (-0.3, -0.052, -0.3), bev=0.01)
    return root


def build_books():
    root = empty("Books")
    spec = [("#2F6BFF", 1.25, 0.86, 0.17, 0.0, 0.0), ("#7A4FE0", 1.12, 0.78, 0.16, 6, 0.17), ("#2FE0FF", 1.0, 0.7, 0.15, -8, 0.33), ("#C45BFF", 0.88, 0.62, 0.13, 10, 0.47)]
    for i, (hx, w, d, h, yaw, z) in enumerate(spec):
        c = srgb(hx)
        bk = empty(f"Book{i}", root, (0, 0, z - 0.2), "PLAIN_AXES")
        bk.rotation_euler = (0, 0, math.radians(yaw))
        box("Cover", (w, d, h), make_mat(f"Cover{i}", c, rough=0.25, emit=c, strength=1.6, coat=0.6), bk, (0, 0, h / 2), bev=0.025)
        box("Pages", (w - 0.08, 0.04, h - 0.04), white_paper, bk, (0.0, -d / 2 - 0.0, h / 2))
        box("Spine", (0.04, d * 0.98, h * 0.7), glow_mat(f"Spine{i}", WHITE, 2.0), bk, (-w / 2 + 0.03, 0, h / 2))
    return root


# id, builder, label, ring radius, direction, start angle(deg), size, color, tilt
ITEM_K = 1.15
ITEMS = [
    ("brain", build_brain, "AI LEARNING", 3.25, +1, 20, 1.15, MAGENTA),
    ("play", build_play, "VIDEO", 3.25, +1, 140, 1.0, CYAN),
    ("mobile", build_mobile, "MOBILE", 3.25, +1, 260, 0.95, BLUE_LT),
    ("laptop", build_laptop, "LEARNERS", 4.35, -1, 70, 1.0, BLUE_LT),
    ("books", build_books, "COURSES", 4.35, -1, 190, 1.05, PURPLE),
    ("chart", build_chart, "ANALYTICS", 4.35, -1, 310, 1.0, CYAN),
    ("cap", build_cap, "INSTITUTION", 5.45, +1, 100, 1.05, GOLD),
    ("cert", build_cert, "CERTIFICATIONS", 5.45, +1, 280, 1.0, GOLD),
]
OMEGA = {3.25: 0.34, 4.35: 0.25, 5.45: 0.19}

label_mat_data = []
for idx, (nm, fn, lab, R, dr, a0, sz, colr) in enumerate(ITEMS):
    root = fn()
    root.name = f"Item_{nm}"
    items[nm] = dict(root=root, label=lab, R=R, dir=dr, a0=math.radians(a0), size=sz * ITEM_K, color=colr, idx=idx)

# ================================================================ ORBIT RINGS (orbit paths)
orbit_mat, orbit_mix = emit_mat("OrbitLine", srgb("#4A7BFF"), 1.2, fade=True)
orbit_rings = []
for R in (3.25, 4.35, 5.45):
    o = curve_obj(f"Orbit{R}", circle_pts(R, 160), 0.006, orbit_mat, closed=True, res=1)
    orbit_rings.append((o, R))
floor_ring_mat, floor_ring_mix = emit_mat("FloorRing", srgb("#3F6BFF"), 2.2, fade=True)
floor_rings = []
for R in (2.4, 3.8, 5.4):
    o = curve_obj(f"FloorRing{R}", circle_pts(R, 160), 0.012, floor_ring_mat, closed=True, loc=(0, 0, FLOOR_Z + 0.01), res=1)
    floor_rings.append((o, R))

# ================================================================ LINES + DATA PACKETS
line_mat = emit_mat("DataLine", srgb("#38B6FF"), 5.0)[0]
pk_mat = emit_mat("Packet", srgb("#BFF4FF"), 18.0)[0]
chain_mat = emit_mat("ChainLine", srgb("#FFFFFF"), 14.0)[0]
chain_pk_mat = emit_mat("ChainPacket", srgb("#FFFFFF"), 40.0)[0]

unit_cyl_bm = lambda: None  # (documented: every line is a unit cylinder scaled per frame)


def unit_cyl(name, mat, segs=8):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=segs, radius1=1, radius2=1, depth=1)
    o = mesh_obj(name, bm, mat)
    o.rotation_mode = "QUATERNION"
    return o


lines = {}
for nm in items:
    lines[nm] = unit_cyl(f"Line_{nm}", line_mat)
packets = {}
for nm in items:
    packets[nm] = [sphere(f"Pk_{nm}_{k}", 1.0, pk_mat, segs=10) for k in range(3)]
# chain: Laptop -> Hub -> Books -> Chart -> Cert
CHAIN = ["laptop", "hub", "books", "chart", "cert"]
chain_lines = [unit_cyl(f"Chain_{i}", chain_mat) for i in range(4)]
chain_pulse = sphere("ChainPulse", 1.0, chain_pk_mat, segs=16)
chain_halo = sphere("ChainHalo", 1.0, emit_mat("ChainHaloM", srgb("#7FD6FF"), 3.0)[0], segs=16)

# ================================================================ LABELS (copy camera rotation)
labels = {}
for nm, d in items.items():
    lm, lmx = emit_mat(f"Lab_{nm}", WHITE, 2.4, fade=True)
    to = text_obj(f"Label_{nm}", d["label"], 0.27, lm, font=FONT_SEMI, space=1.15)
    cr = to.constraints.new("COPY_ROTATION")
    cr.target = cam
    labels[nm] = (to, lmx)

# ================================================================ DUST
dust_root = empty("Dust")
dust_m = emit_mat("DustM", srgb("#8FB6FF"), 6.0)[0]
dust_m2 = emit_mat("DustM2", srgb("#C79BFF"), 6.0)[0]
rng = random.Random(5)
for i in range(190):
    rr = rng.uniform(6, 34)
    th = rng.uniform(0, 2 * math.pi)
    zz = rng.uniform(-6, 12)
    s = rng.uniform(0.018, 0.065)
    sphere(f"D{i}", s, dust_m if i % 3 else dust_m2, dust_root, (rr * math.cos(th), rr * math.sin(th), zz), segs=6)

# ================================================================ BURST / SHOCKWAVE
shock_m, shock_mix = emit_mat("Shock", srgb("#7FB4FF"), 4.5, fade=True)
shock = curve_obj("Shock", circle_pts(1.0, 128), 0.018, shock_m, closed=True, res=2)
shock2_m, shock2_mix = emit_mat("Shock2", srgb("#C79BFF"), 8.0, fade=True)
shock2 = curve_obj("Shock2", circle_pts(1.0, 128), 0.011, shock2_m, closed=True, res=2)
shock3 = curve_obj("Shock3", circle_pts(1.0, 128), 0.025, shock_m, closed=True, res=2)

# ================================================================ SCREEN-SPACE ELEMENTS (children of the camera)
# local camera space: -Z forward
def cam_child(obj, dist, x=0.0, y=0.0):
    obj.parent = cam
    obj.location = (x, y, -dist)
    return obj


cap_words = ["LEARNER", "CANPLUS", "COURSE", "ASSESSMENT", "CERTIFICATION"]
cap_mix = []
cap_objs = []
CAPD = 9.0
CAPY = 2.05
sizes = []
tmp = []
for w in cap_words:
    lm, lmx = emit_mat(f"Cap_{w}", srgb("#7C92C8"), 1.8, fade=True)
    to = text_obj(f"Cap_{w}", w, 0.17, lm, font=FONT_SEMI, space=1.35)
    cap_objs.append(to)
    cap_mix.append((lm, lmx))
bpy.context.view_layer.update()
widths = [o.dimensions.x for o in cap_objs]
gap = 0.42
total = sum(widths) + gap * (len(widths) - 1) + 0.0
xpos = -total / 2
cap_x = []
for w, o in zip(widths, cap_objs):
    o.location = (xpos + w / 2, 0, 0)
    cap_x.append(xpos + w / 2)
    cam_child(o, CAPD, xpos + w / 2, CAPY)
    xpos += w + gap
# arrows between words
cap_arrows = []
arr_m, arr_mx = emit_mat("CapArrow", srgb("#4C6FD1"), 2.0, fade=True)
for i in range(len(cap_words) - 1):
    xr = cap_x[i] + widths[i] / 2 + gap / 2
    a = cyl(f"Arr{i}", 0.06, 0.012, arr_m, loc=(0, 0, 0), segs=3)
    cam_child(a, CAPD, xr, CAPY)
    a.rotation_euler = (0, 0, 0)
    cap_arrows.append(a)

# tagline
tag1_m, tag1_mx = emit_mat("Tag1", WHITE, 2.2, fade=True)
tag2_m, tag2_mx = emit_mat("Tag2", srgb("#9DB8FF"), 2.2, fade=True)
tag1 = text_obj("Tag1", "One platform.", 0.5, tag1_m, font=FONT_BOLD, space=1.0)
tag2 = text_obj("Tag2", "Every learning journey.", 0.5, tag2_m, font=FONT_BOLD, space=1.0)
cam_child(tag1, 8.0, 0, -1.25)
cam_child(tag2, 8.0, 0, -1.9)
TAG_BASE = (-1.25, -1.9)

# CANPLUS wordmark
wm_m, wm_mx = emit_mat("Wordmark", WHITE, 3.0, fade=True)
wordmark = text_obj("Wordmark", "CANPLUS", 0.78, wm_m, font=FONT_BOLD, space=1.55)
cam_child(wordmark, 8.0, 0, -1.5)

# final card: white iris + real logo
card_disc_m, card_disc_mix = emit_mat("CardDisc", (1, 1, 1, 1), 1.0, fade=True)
bm = bmesh.new()
bmesh.ops.create_circle(bm, cap_ends=True, segments=96, radius=1.0)
card_disc = mesh_obj("CardDisc", bm, card_disc_m, smooth_shade=False)
cam_child(card_disc, 8.5)
edge_m, edge_mix = emit_mat("IrisEdge", srgb("#5E9BFF"), 14.0, fade=True)
iris_edge = curve_obj("IrisEdge", circle_pts(1.0, 128), 0.02, edge_m, closed=True, res=2)
cam_child(iris_edge, 8.45)

img = bpy.data.images.load(LOGO_IMG)
img.colorspace_settings.name = "sRGB"
logo_card_m = bpy.data.materials.new("RealLogo")
logo_card_m.use_nodes = True
nt = logo_card_m.node_tree
nt.nodes.clear()
oo = nt.nodes.new("ShaderNodeOutputMaterial")
ti = nt.nodes.new("ShaderNodeTexImage")
ti.image = img
ti.interpolation = "Cubic"
ti.extension = "EXTEND"
em = nt.nodes.new("ShaderNodeEmission")
em.inputs["Strength"].default_value = 1.0
nt.links.new(ti.outputs["Color"], em.inputs["Color"])
tr = nt.nodes.new("ShaderNodeBsdfTransparent")
mxl = nt.nodes.new("ShaderNodeMixShader")
mxl.inputs[0].default_value = 0.0
nt.links.new(tr.outputs[0], mxl.inputs[1])
nt.links.new(em.outputs[0], mxl.inputs[2])
nt.links.new(mxl.outputs[0], oo.inputs["Surface"])
asp = img.size[0] / img.size[1]
LOGO_W = 5.4
bm = bmesh.new()
uvl = bm.loops.layers.uv.new("UV")
hw, hh = LOGO_W / 2, LOGO_W / asp / 2
vs = [bm.verts.new(c) for c in ((-hw, -hh, 0), (hw, -hh, 0), (hw, hh, 0), (-hw, hh, 0))]
fc = bm.faces.new(vs)
for lp, uv in zip(fc.loops, ((0, 0), (1, 0), (1, 1), (0, 1))):
    lp[uvl].uv = uv
real_logo = mesh_obj("RealLogoPlane", bm, logo_card_m, smooth_shade=False)
cam_child(real_logo, 8.4)
# plane is created in XY; camera child so XY is the screen plane already.

# ================================================================ COMPOSITING (bloom + vignette)
def build_compositor():
    try:
        scene.use_nodes = True
    except Exception:
        pass
    ng = getattr(scene, "compositing_node_group", None)
    if ng is None and hasattr(bpy.data, "node_groups"):
        ng = bpy.data.node_groups.new("CanPlusComp", "CompositorNodeTree")
        scene.compositing_node_group = ng
    nt = ng if ng is not None else scene.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    rl = nt.nodes.new("CompositorNodeRLayers")
    gl = nt.nodes.new("CompositorNodeGlare")
    try:
        gl.inputs["Type"].default_value = "Fog Glow"
        gl.inputs["Quality"].default_value = "Medium"
        gl.inputs["Threshold"].default_value = 0.9
        gl.inputs["Strength"].default_value = 0.9
        gl.inputs["Size"].default_value = 0.65
        gl.inputs["Smoothness"].default_value = 1.0
    except Exception as e:
        print("glare setup:", e)
    gl2 = nt.nodes.new("CompositorNodeGlare")
    try:
        gl2.inputs["Type"].default_value = "Bloom"
        gl2.inputs["Threshold"].default_value = 1.3
        gl2.inputs["Strength"].default_value = 0.45
        gl2.inputs["Size"].default_value = 0.9
    except Exception as e:
        print("bloom setup:", e)
    comp = nt.nodes.new("NodeGroupOutput") if False else None
    try:
        out = nt.nodes.new("CompositorNodeComposite")
    except Exception:
        out = nt.nodes.new("NodeGroupOutput")
        nt.interface.new_socket("Image", in_out="OUTPUT", socket_type="NodeSocketColor")
    nt.links.new(rl.outputs["Image"], gl.inputs["Image"])
    gout = [s for s in gl.outputs if s.name in ("Image", "Glare")]
    nt.links.new(gl.outputs["Image"], gl2.inputs["Image"])
    nt.links.new(gl2.outputs["Image"], out.inputs[0])


try:
    build_compositor()
except Exception as e:
    print("COMPOSITOR FAILED:", e)

# ================================================================ BAKE ANIMATION
def item_state(d, t):
    R, dr, a0 = d["R"], d["dir"], d["a0"]
    om = OMEGA[R]
    i = d["idx"]
    ts = 3.55 + 0.27 * i
    p = ease_back(prog(t, ts, ts + 1.5), 1.2)
    pe = ease_out(prog(t, ts, ts + 1.5))
    tc = 12.0 + 0.08 * i
    q = prog(t, tc, tc + 2.05)
    qi = ease_in(q)
    # angle: orbit + outward swirl on emergence + inward swirl on collapse
    ang = a0 + dr * om * max(0.0, t - 3.0) + dr * (1 - pe) * 2.4 + dr * qi * 5.5 + dr * 0.9 * (q ** 2) * 2
    rad = R * (1 - qi) if q > 0 else R * p
    h = 0.22 * math.sin(1.1 * t + i * 1.3) * (1 - qi) * pe
    x, y = rad * math.sin(ang), -rad * math.cos(ang)
    sc = d["size"] * (ease_back(prog(t, ts, ts + 1.2), 1.4)) * (1 - ease_in(prog(t, tc + 0.7, tc + 2.05)))
    yaw = 0.55 * math.sin(0.7 * t + i) + (0.0 if d["dir"] > 0 else 0.0) + t * (0.15 if i % 2 else -0.12) * 0.5
    spin = qi * 6.0
    return Vector((x, y, h)), yaw + spin, max(sc, 0.0), pe if q == 0 else (1 - qi)


def quat_align(vec):
    if vec.length < 1e-6:
        return Quaternion((1, 0, 0, 0))
    return vec.normalized().to_track_quat("Z", "Y")


def set_seg(o, f, a, b, th, vis=True):
    v = b - a
    L = v.length
    mid = (a + b) / 2
    if not vis or L < 1e-4:
        o.scale = (0, 0, 0)
    else:
        o.scale = (th, th, L)
    o.location = mid
    o.rotation_quaternion = quat_align(v)
    for ch in ("location", "rotation_quaternion", "scale"):
        o.keyframe_insert(ch, frame=f)


def fade_key(mix_node, f, val):
    mix_node.inputs[0].default_value = clamp(val)
    mix_node.inputs[0].keyframe_insert("default_value", frame=f)


def bake():
    bpy.context.preferences.edit.keyframe_new_interpolation_type = "CONSTANT"  # every frame is keyed
    # stash node sockets we animate
    logo_emit = mb.inputs["Emission Strength"]
    plus_emit = [n for n in plus_mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED"][0].inputs["Emission Strength"]
    for f in range(1, NF + 1):
        t = (f - 1) / FPS
        scene.frame_set(f)
        # ---------------- camera
        az, el, d, tz = cam_state(t)
        azr, elr = math.radians(az), math.radians(el)
        cam.location = (d * math.sin(azr) * math.cos(elr), -d * math.cos(azr) * math.cos(elr), d * math.sin(elr) + tz)
        cam.keyframe_insert("location", frame=f)
        target.location = (0, 0, tz)
        target.keyframe_insert("location", frame=f)
        cam_data.dof.focus_distance = d * 0.97
        cam_data.dof.keyframe_insert("focus_distance", frame=f)
        cam_data.dof.aperture_fstop = lerp(3.2, 14.0, smooth(prog(t, 14.5, 15.8)))
        cam_data.dof.keyframe_insert("aperture_fstop", frame=f)

        # ---------------- logo scale / position / glow
        s = lerp(0.0, 0.36, ease_out(prog(t, 0.0, 1.6)))
        s += 0.012 * math.sin(t * 4.0) * (1 - prog(t, 2.6, 3.2))
        s = lerp(s, 1.0, ease_back(prog(t, 3.05, 4.7), 1.35)) if t >= 3.05 else s
        s *= 1 + 0.015 * math.sin(t * 2.2) * smooth(prog(t, 5, 6)) * (1 - prog(t, 12, 12.5))
        # anticipation squeeze
        sq = ease_in(prog(t, 12.2, 14.15))
        s = s * lerp(1.0, 0.82, sq)
        # impact pop to large
        pop = ease_back(prog(t, 14.15, 15.55), 1.5)
        s = lerp(s, 2.25, pop) if t >= 14.15 else s
        # settle up for the message
        st = ease_io(prog(t, 15.9, 16.7))
        s = lerp(s, 1.3, st) if t >= 15.9 else s
        lz = 0.0
        lz = lerp(lz, 0.7, st) if t >= 15.9 else lz
        # wordmark moment: mark goes to centre-top
        s2 = ease_io(prog(t, 18.2, 18.8))
        if t >= 18.2:
            s = lerp(s, 1.4, s2)
            lz = lerp(lz, 0.75, s2)
        logo.scale = (s, s, s)
        logo.location = (0, 0, lz)
        logo.rotation_euler = (0, 0, 0)
        for ch in ("scale", "location", "rotation_euler"):
            logo.keyframe_insert(ch, frame=f)
        flash = math.exp(-((t - 14.18) / 0.22) ** 2) * 7.0 if t > 14.0 else 0.0
        glow = 1.0 + 0.5 * smooth(prog(t, 3, 5)) + flash + 0.15 * math.sin(t * 3) + 4.0 * math.exp(-((t - 3.1) / 0.3) ** 2)
        glow = glow * (1 + 0.5 * ease_out(prog(t, 14.2, 14.5)) * (1 - ease_out(prog(t, 14.5, 16.5))))
        logo_emit.default_value = glow
        logo_emit.keyframe_insert("default_value", frame=f)
        plus_emit.default_value = glow * 0.8
        plus_emit.keyframe_insert("default_value", frame=f)
        # hub light
        hub_light_data.energy = (260 + 300 * smooth(prog(t, 3, 5)) + flash * 900) * (1 if t < 16 else 0.7) * clamp(s * 1.2)
        hub_light_data.keyframe_insert("energy", frame=f)

        # ---------------- hub hex rings
        hub_on = smooth(prog(t, 3.2, 4.4)) * (1 - ease_in(prog(t, 13.2, 14.1)))
        for k, (hexo, spd, tilt) in enumerate(hub_hexes):
            hexo.scale = (hub_on * (0.4 + 0.6 * ease_out(prog(t, 3.2, 4.6))) * (s if t > 14.1 else 1.0),) * 3
            if k == 0:
                hexo.rotation_euler = (0, 0, spd * (t - 3))
                hexo.location = (0, 0, lz)
            else:  # camera-facing hex halo, spins in its own plane
                hexo.rotation_euler = (0, 0, spd * (t - 3))
                hexo.location = (0, 0, 0)
                halo_pivot.location = (0, 0, lz)
                halo_pivot.keyframe_insert("location", frame=f)
            for ch in ("scale", "rotation_euler"):
                hexo.keyframe_insert(ch, frame=f)
        # keep hex rings hugging the logo
        fade_key(hub_ring_mix, f, hub_on)

        # ---------------- orbit lines, floor rings
        orb_on = smooth(prog(t, 3.3, 5.2)) * (1 - ease_in(prog(t, 12.4, 13.8)))
        fade_key(orbit_mix, f, orb_on * 0.9)
        for o, Rr in orbit_rings:
            sc_ = ease_out(prog(t, 3.3, 5.0)) * (1 - ease_in(prog(t, 12.4, 13.8)) * 0.9)
            o.scale = (sc_, sc_, sc_)
            o.keyframe_insert("scale", frame=f)
        fl_on = smooth(prog(t, 3.0, 4.6)) * (1 - ease_in(prog(t, 12.6, 14.0)))
        fade_key(floor_ring_mix, f, fl_on)
        for k, (o, Rr) in enumerate(floor_rings):
            sc_ = ease_out(prog(t, 3.2 + 0.15 * k, 5.2 + 0.1 * k)) * (1 - ease_in(prog(t, 12.6, 14.0)))
            o.scale = (sc_, sc_, sc_)
            o.keyframe_insert("scale", frame=f)

        # ---------------- orbit items + lines + packets + labels
        positions = {}
        for nm, dd in items.items():
            pos, yaw, sc_, vis = item_state(dd, t)
            positions[nm] = (pos, sc_)
            root = dd["root"]
            root.location = pos
            root.rotation_euler = (0, 0, yaw)
            root.scale = (sc_, sc_, sc_)
            for ch in ("location", "rotation_euler", "scale"):
                root.keyframe_insert(ch, frame=f)
        hubp = Vector((0, -0.0, 0))
        for nm, dd in items.items():
            i = dd["idx"]
            pos, sc_ = positions[nm]
            lt0 = 6.0 + 0.32 * i
            u = ease_out(prog(t, lt0, lt0 + 0.9))
            col_q = prog(t, 12.0 + 0.08 * i, 12.0 + 0.08 * i + 2.05)
            endp = pos * u
            # start slightly outside the mark so the line emerges from it
            start = hubp
            on = (u > 0.001) and (sc_ > 0.02) and (col_q < 0.97)
            th = 0.014 * (1 - 0.5 * ease_in(col_q))
            set_seg(lines[nm], f, start, endp, th, vis=on)
            # packets
            for k, pk in enumerate(packets[nm]):
                fr = ((t * 0.55 + k / 3.0 + i * 0.17) % 1.0)
                if dd["dir"] > 0:
                    fr = 1 - fr
                full = u > 0.995 and col_q < 0.9
                pp = pos * fr
                ps = (0.05 * smooth(min(fr, 1 - fr) * 5)) if full else 0.0
                pk.location = pp
                pk.scale = (ps, ps, ps)
                pk.keyframe_insert("location", frame=f)
                pk.keyframe_insert("scale", frame=f)
            # labels
            to, lmx = labels[nm]
            lab_on = smooth(prog(t, 6.6 + 0.3 * i, 7.4 + 0.3 * i)) * (1 - ease_in(prog(t, 11.4, 12.2)))
            to.location = pos + Vector((0, 0, -0.95 * dd["size"] - 0.05))
            to.scale = (0.9 + 0.1 * lab_on,) * 3
            to.keyframe_insert("location", frame=f)
            to.keyframe_insert("scale", frame=f)
            fade_key(lmx, f, lab_on * 0.9)

        # ---------------- chain highlight  Learner -> CanPlus -> Course -> Assessment -> Certification
        CH0, CHD = 9.3, 0.62
        seg_t = [(CH0 + i * CHD, CH0 + (i + 1) * CHD) for i in range(4)]

        def node_pos(name):
            return Vector((0, 0, 0)) if name == "hub" else positions[name][0]
        # chain lines (appear as the pulse passes, fade away after)
        for i in range(4):
            a, b = node_pos(CHAIN[i]), node_pos(CHAIN[i + 1])
            ts_, te_ = seg_t[i]
            uu = ease_in(prog(t, ts_, te_)) if t < te_ else 1.0
            keep = 1 - smooth(prog(t, 11.2, 11.9))
            end = a + (b - a) * clamp(prog(t, ts_, te_))
            on = (t >= ts_) and keep > 0.02
            set_seg(chain_lines[i], f, a, end, 0.02 * keep, vis=on)
        # pulse sphere
        pulse_pos = Vector((0, 0, 0))
        pulse_on = 0.0
        for i in range(4):
            ts_, te_ = seg_t[i]
            if ts_ <= t <= te_ + 0.001:
                a, b = node_pos(CHAIN[i]), node_pos(CHAIN[i + 1])
                pulse_pos = a + (b - a) * smooth(prog(t, ts_, te_))
                pulse_on = 1.0
        ps_ = 0.075 * pulse_on
        chain_pulse.location = pulse_pos
        chain_pulse.scale = (ps_,) * 3
        chain_halo.location = pulse_pos
        chain_halo.scale = (ps_ * 1.9,) * 3
        for o in (chain_pulse, chain_halo):
            o.keyframe_insert("location", frame=f)
            o.keyframe_insert("scale", frame=f)

        # caption words (screen space)
        cap_in = smooth(prog(t, 9.0, 9.6)) * (1 - smooth(prog(t, 11.9, 12.5)))
        for i, (lm, lmx) in enumerate(cap_mix):
            ts_ = CH0 + (i - 1) * CHD if i > 0 else CH0 - 0.2
            lit = smooth(prog(t, CH0 + max(i - 1, 0) * CHD, CH0 + max(i - 1, 0) * CHD + 0.25)) if i > 0 else smooth(prog(t, CH0 - 0.2, CH0 + 0.2))
            lit_end = smooth(prog(t, 11.2, 11.9))
            # words: brighten when pulse arrives
            fade_key(lmx, f, cap_in * (0.55 + 0.45 * lit))
            em_n = [n for n in lm.node_tree.nodes if n.type == "EMISSION"][0]
            em_n.inputs["Strength"].default_value = 1.4 + 3.2 * lit * (1 - lit_end)
            em_n.inputs["Strength"].keyframe_insert("default_value", frame=f)
            em_n.inputs["Color"].default_value = tuple(lerp(a_, b_, lit) for a_, b_ in zip(srgb("#6E86C8"), srgb("#E8F3FF")))
            em_n.inputs["Color"].keyframe_insert("default_value", frame=f)
        for i, a in enumerate(cap_arrows):
            sc_ = cap_in * 1.0
            a.scale = (sc_, sc_, sc_)
            a.keyframe_insert("scale", frame=f)
        fade_key(arr_mx, f, cap_in)

        # ---------------- shockwaves
        def shock_ring(o, mx, t0, dur, rmax, strength_curve=1.0, flat=False):
            q_ = prog(t, t0, t0 + dur)
            sc_ = lerp(0.1, rmax, ease_out(q_)) if q_ > 0 else 0.0
            o.scale = (sc_, sc_, sc_)
            o.rotation_euler = (0, 0, 0) if flat else (math.radians(90), 0, 0)
            o.keyframe_insert("scale", frame=f)
            o.keyframe_insert("rotation_euler", frame=f)
            fade_key(mx, f, (1 - q_) ** 2.2 * strength_curve if 0 < q_ < 1 else 0.0)
        shock_ring(shock, shock_mix, 3.05, 1.8, 7.0, flat=True)
        shock_ring(shock3, shock_mix, 4.1, 1.5, 8.5, 0.0) if False else None
        # impact shockwaves (cam-facing: rotate to face the camera roughly)
        shock_ring(shock2, shock2_mix, 14.12, 1.4, 11.0)

        # ---------------- dust drift
        dust_root.rotation_euler = (0, 0, 0.012 * t)
        dust_root.keyframe_insert("rotation_euler", frame=f)

        # ---------------- tagline + wordmark (screen space)
        for tg, mx, base_y, t0 in ((tag1, tag1_mx, TAG_BASE[0], 16.2), (tag2, tag2_mx, TAG_BASE[1], 17.0)):
            a_in = smooth(prog(t, t0, t0 + 0.8))
            a_out = 1 - smooth(prog(t, 18.15, 18.55))
            tg.location = (0, base_y - 0.0 + (1 - ease_out(prog(t, t0, t0 + 0.9))) * -0.35, -8.0)
            tg.keyframe_insert("location", frame=f)
            fade_key(mx, f, a_in * a_out)
        a_in = smooth(prog(t, 18.45, 19.05))
        fade_key(wm_mx, f, a_in)
        wordmark.location = (0, -1.5 + (1 - ease_out(prog(t, 18.45, 19.1))) * -0.3, -8.0)
        wordmark.keyframe_insert("location", frame=f)
        wm_scale = lerp(0.94, 1.0, ease_out(prog(t, 18.45, 19.4)))
        wordmark.scale = (wm_scale,) * 3
        wordmark.keyframe_insert("scale", frame=f)

        # ---------------- final iris wipe -> real logo
        iw = prog(t, 18.95, 19.45)
        ir = ease_io(iw) * 9.5
        card_disc.scale = (ir, ir, 1)
        card_disc.keyframe_insert("scale", frame=f)
        iris_edge.scale = (ir, ir, 1)
        iris_edge.keyframe_insert("scale", frame=f)
        fade_key(card_disc_mix, f, 1.0 if iw > 0 else 0.0)
        fade_key(edge_mix, f, (1 - prog(t, 19.3, 19.55)) if 0 < iw < 1.0 or (iw >= 1.0 and t < 19.55) else 0.0)
        lg_in = smooth(prog(t, 19.25, 19.75))
        mxl.inputs[0].default_value = lg_in
        mxl.inputs[0].keyframe_insert("default_value", frame=f)
        lgs = lerp(0.94, 1.0, ease_out(prog(t, 19.25, 20.0)))
        real_logo.scale = (lgs, lgs, 1)
        real_logo.keyframe_insert("scale", frame=f)

        # logo halo (unused geometry; kept hidden)


bake()
scene.frame_set(1)

os.makedirs(OUT, exist_ok=True)
blend_path = os.path.join(OUT, "canplus.blend")
bpy.ops.wm.save_as_mainfile(filepath=blend_path)
print("saved", blend_path)

# ================================================================ RENDER
if os.environ.get("CP_RENDER") or os.environ.get("CP_STILL"):
    frames_dir = os.path.join(OUT, "frames")
    os.makedirs(frames_dir, exist_ok=True)
    if os.environ.get("CP_STILL"):
        fs = [int(x) for x in os.environ["CP_STILL"].split(",")]
    else:
        a, b = [int(x) for x in os.environ.get("CP_FRAMES", f"1-{NF}").split("-")]
        fs = list(range(a, b + 1))
    scene.render.use_overwrite = False
    for f in fs:
        path = os.path.join(frames_dir, f"f_{f:04d}.png")
        if os.path.exists(path) and not os.environ.get("CP_STILL"):
            continue
        scene.frame_set(f)
        scene.render.filepath = path
        bpy.ops.render.render(write_still=True)
        print("rendered", f, flush=True)
