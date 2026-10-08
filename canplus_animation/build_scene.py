"""Build the CanPlus 'learning ecosystem' animation as a fully keyframed Blender scene.

    python build_scene.py [out.blend]

Environment: CP_RES=1920x1080  CP_SAMPLES=48  CP_FPS=30
"""
import math
import os
import random
import sys

import bpy
import addon_utils
from mathutils import Vector, Quaternion
from shapely.ops import unary_union
from shapely.affinity import translate as stranslate

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import cp_util as U                      # noqa: E402
import cp_objects as O                   # noqa: E402
import logo_geometry as lg               # noqa: E402
from cp_util import seg, smooth, smoother, out_cubic, in_cubic, out_back, bump, pchip  # noqa: E402

addon_utils.enable("cycles")
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.context.preferences.edit.keyframe_new_interpolation_type = "LINEAR"

FPS = int(os.environ.get("CP_FPS", 30))
DUR = 20
NF = FPS * DUR
RES = [int(v) for v in os.environ.get("CP_RES", "1920x1080").split("x")]
SAMPLES = int(os.environ.get("CP_SAMPLES", 48))

sc = bpy.context.scene
FLOOR_Z = -1.8
T_COL0, T_COL1 = 12.0, 14.0          # objects collapse into the hub
T_IMPACT = 14.0

# ------------------------------------------------------------------ world / render
world = bpy.data.worlds.new("World")
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs["Color"].default_value = (0.0014, 0.0026, 0.0075, 1)
bg.inputs["Strength"].default_value = 1.0
sc.world = world

sc.render.engine = "CYCLES"
cy = sc.cycles
cy.device = "CPU"
cy.samples = SAMPLES
cy.use_adaptive_sampling = True
cy.adaptive_threshold = 0.02
cy.use_denoising = True
cy.denoiser = "OPENIMAGEDENOISE"
cy.max_bounces = 6
cy.diffuse_bounces = 2
cy.glossy_bounces = 4
cy.transmission_bounces = 2
cy.sample_clamp_indirect = 4.0
cy.sample_clamp_direct = 0.0
cy.caustics_reflective = False
cy.caustics_refractive = False
sc.render.resolution_x, sc.render.resolution_y = RES
sc.render.resolution_percentage = 100
sc.render.fps = FPS
sc.frame_start, sc.frame_end = 1, NF
sc.render.use_motion_blur = True
sc.render.motion_blur_shutter = 0.35
sc.view_settings.view_transform = "Standard"
sc.render.image_settings.file_format = "OPEN_EXR"
sc.render.image_settings.color_depth = "16"
sc.render.image_settings.exr_codec = "DWAA"

# ------------------------------------------------------------------ materials / hub logo
O.make_materials()
M = O.M

blue_poly = lg.hex_c_polygon()
plus_poly = lg.plus_polygon()
allp = unary_union([blue_poly, plus_poly])
minx, miny, maxx, maxy = allp.bounds
cx0, cy0 = (minx + maxx) / 2, (miny + maxy) / 2
MARK_W, MARK_H = maxx - minx, maxy - miny
blue_poly = stranslate(blue_poly, -cx0, -cy0)
plus_poly = stranslate(plus_poly, -cx0, -cy0)

logo_blue = bpy.data.materials.new("logo_blue")
logo_blue.use_nodes = True
nt = logo_blue.node_tree
pb = nt.nodes["Principled BSDF"]
tc = nt.nodes.new("ShaderNodeTexCoord")
sep = nt.nodes.new("ShaderNodeSeparateXYZ")
mr = nt.nodes.new("ShaderNodeMapRange")
mr.inputs["From Min"].default_value = -1.0
mr.inputs["From Max"].default_value = 1.0
ramp = nt.nodes.new("ShaderNodeValToRGB")
ramp.color_ramp.elements[0].color = U.hexc("#1650E8")
ramp.color_ramp.elements[1].color = U.hexc("#4C98FF")
nt.links.new(tc.outputs["Object"], sep.inputs[0])
nt.links.new(sep.outputs[1], mr.inputs["Value"])
nt.links.new(mr.outputs[0], ramp.inputs[0])
nt.links.new(ramp.outputs[0], pb.inputs["Emission Color"])
pb.inputs["Base Color"].default_value = U.hexc("#0A2A9A")
pb.inputs["Roughness"].default_value = 0.16
pb.inputs["Coat Weight"].default_value = 0.8
pb.inputs["Coat Roughness"].default_value = 0.05
pb.inputs["Emission Strength"].default_value = 1.8
U.ANIM_SOCKETS["logo_blue"] = pb.inputs["Emission Strength"]

logo_purple = U.principled("logo_purple", U.PURPLE_D, rough=0.16, coat=0.8, emit=U.PURPLE, estr=2.0, anim=True)

logo = U.empty("CanPlus_Logo", display="CUBE", size=0.5)
bm = U.new_obj("logo_C", U.poly_mesh("logo_C", blue_poly, 0.34), logo_blue, logo, rot=(math.pi / 2, 0, 0))
U.finish(bm, 0.045, 5)
pm = U.new_obj("logo_plus", U.poly_mesh("logo_plus", plus_poly, 0.34), logo_purple, logo, rot=(math.pi / 2, 0, 0))
U.finish(pm, 0.045, 5)

# ------------------------------------------------------------------ floor
floor_mat = bpy.data.materials.new("floor")
floor_mat.use_nodes = True
ft = floor_mat.node_tree
fb = ft.nodes["Principled BSDF"]


def node(nt_, kind, **kw):
    n = nt_.nodes.new(kind)
    for k, v in kw.items():
        setattr(n, k, v)
    return n


def val(nt_, name, v=0.0):
    n = nt_.nodes.new("ShaderNodeValue")
    n.outputs[0].default_value = v
    U.ANIM_SOCKETS[name] = n.outputs[0]
    return n


def math_(nt_, op, a=None, b=None, clamp=False):
    n = nt_.nodes.new("ShaderNodeMath")
    n.operation = op
    n.use_clamp = clamp
    for i, x in enumerate((a, b)):
        if x is None:
            continue
        if isinstance(x, (int, float)):
            n.inputs[i].default_value = x
        else:
            nt_.links.new(x, n.inputs[i])
    return n.outputs[0]


tcf = ft.nodes.new("ShaderNodeTexCoord")
sf = ft.nodes.new("ShaderNodeSeparateXYZ")
ft.links.new(tcf.outputs["Object"], sf.inputs[0])
X, Y = sf.outputs[0], sf.outputs[1]
comb = ft.nodes.new("ShaderNodeCombineXYZ")
ft.links.new(X, comb.inputs[0])
ft.links.new(Y, comb.inputs[1])
vl = ft.nodes.new("ShaderNodeVectorMath")
vl.operation = "LENGTH"
ft.links.new(comb.outputs[0], vl.inputs[0])
R = vl.outputs["Value"]


def mrange(nt_, v, fmin, fmax, tmin, tmax):
    n = nt_.nodes.new("ShaderNodeMapRange")
    n.clamp = True
    for sock, x in (("From Min", fmin), ("From Max", fmax), ("To Min", tmin), ("To Max", tmax)):
        if isinstance(x, (int, float)):
            n.inputs[sock].default_value = x
        else:
            nt_.links.new(x, n.inputs[sock])
    nt_.links.new(v, n.inputs["Value"])
    return n.outputs[0]


ring = mrange(ft, math_(ft, "ABSOLUTE", math_(ft, "SINE", math_(ft, "MULTIPLY", R, math.pi * 0.45))), 0.0, 0.07, 1.0, 0.0)
ang = math_(ft, "ARCTAN2", Y, X)
spoke = mrange(ft, math_(ft, "ABSOLUTE", math_(ft, "SINE", math_(ft, "MULTIPLY", ang, 12.0))), 0.0, 0.03, 1.0, 0.0)
pattern = math_(ft, "ADD", ring, math_(ft, "MULTIPLY", spoke, 0.16))
falloff = math_(ft, "POWER", 0.84, R)
reveal = val(ft, "floor_reveal", -1.0)
mask = mrange(ft, R, math_(ft, "SUBTRACT", reveal.outputs[0], 1.4), reveal.outputs[0], 1.0, 0.0)
shockR, shockI = val(ft, "floor_shockR", -5.0), val(ft, "floor_shockI", 0.0)
d = math_(ft, "DIVIDE", math_(ft, "SUBTRACT", R, shockR.outputs[0]), 0.5)
shock = math_(ft, "MULTIPLY", math_(ft, "EXPONENT", math_(ft, "MULTIPLY", math_(ft, "POWER", d, 2.0), -1.0)), shockI.outputs[0])
glow = math_(ft, "ADD", math_(ft, "MULTIPLY", math_(ft, "MULTIPLY", pattern, falloff), math_(ft, "MULTIPLY", mask, 1.0)), math_(ft, "MULTIPLY", shock, 1.5))
ft.links.new(math_(ft, "MULTIPLY", glow, 3.2), fb.inputs["Emission Strength"])
fb.inputs["Emission Color"].default_value = U.hexc("#2F8CFF")
fb.inputs["Base Color"].default_value = (0.006, 0.010, 0.026, 1)
noise_t = ft.nodes.new("ShaderNodeTexNoise")
noise_t.inputs["Scale"].default_value = 0.35
noise_t.inputs["Detail"].default_value = 3.0
ft.links.new(tcf.outputs["Object"], noise_t.inputs["Vector"])
rough = mrange(ft, noise_t.outputs["Fac"], 0.3, 0.7, 0.05, 0.22)
ft.links.new(rough, fb.inputs["Roughness"])
fb.inputs["Metallic"].default_value = 0.0
fb.inputs["IOR"].default_value = 1.5
fb.inputs["Specular IOR Level"].default_value = 0.8

me = bpy.data.meshes.new("floor")
bm_ = __import__("bmesh").new()
__import__("bmesh").ops.create_grid(bm_, x_segments=1, y_segments=1, size=60)
bm_.to_mesh(me)
bm_.free()
floor = U.new_obj("Floor", me, floor_mat, loc=(0, 0, FLOOR_Z))

# ------------------------------------------------------------------ lights
hub_target = U.empty("HubTarget")


def area(name, loc, size, energy, color):
    ld = bpy.data.lights.new(name, "AREA")
    ld.energy, ld.size, ld.color = energy, size, color[:3]
    o = bpy.data.objects.new(name, ld)
    o.location = loc
    o.visible_camera = False
    o.visible_glossy = False
    U.link(o)
    c = o.constraints.new("TRACK_TO")
    c.target = hub_target
    c.track_axis, c.up_axis = "TRACK_NEGATIVE_Z", "UP_Y"
    return ld


area("Key", (-6.5, -8, 6), 6, 260, (0.7, 0.82, 1.0))
area("RimBlue", (8, 6, 3), 5, 1100, (0.15, 0.4, 1.0))
area("RimPurple", (-8, 6, 2), 5, 1000, (0.5, 0.25, 1.0))
area("FloorFill", (0, -9, 4), 8, 90, (0.5, 0.7, 1.0))

hub_ld = bpy.data.lights.new("HubLight", "POINT")
hub_ld.color = (0.45, 0.55, 1.0)
hub_ld.shadow_soft_size = 0.35
hub_light = bpy.data.objects.new("HubLight", hub_ld)
hub_light.visible_glossy = False
hub_light.visible_camera = False
U.link(hub_light)

# ------------------------------------------------------------------ camera
cam_data = bpy.data.cameras.new("Cam")
cam_data.lens = 45
cam_data.sensor_fit = "HORIZONTAL"
cam_data.dof.use_dof = True
cam_data.dof.focus_object = hub_target
cam_data.dof.aperture_fstop = 1.4
cam_data.clip_start, cam_data.clip_end = 0.1, 200
cam = bpy.data.objects.new("Camera", cam_data)
U.link(cam)
tt = cam.constraints.new("TRACK_TO")
tt.target = hub_target
tt.track_axis, tt.up_axis = "TRACK_NEGATIVE_Z", "UP_Y"
sc.camera = cam

# ------------------------------------------------------------------ orbiting objects
ORBS = [
    # key       label             ring angle  size  flow(+1 in / -1 out)
    dict(key="laptop",      label="LEARNERS",       ring="A", deg=0,   size=0.95, flow=+1),
    dict(key="play",        label="COURSES",        ring="B", deg=45,  size=1.02, flow=+1),
    dict(key="brain",       label="AI LEARNING",    ring="A", deg=90,  size=1.02, flow=-1),
    dict(key="chart",       label="ANALYTICS",      ring="B", deg=135, size=1.02, flow=-1),
    dict(key="certificate", label="CERTIFICATIONS", ring="A", deg=180, size=1.0,  flow=-1),
    dict(key="cap",         label="INSTITUTION",    ring="B", deg=225, size=1.0,  flow=+1),
    dict(key="books",       label="CONTENT",        ring="A", deg=270, size=0.95, flow=+1),
    dict(key="mobile",      label="MOBILE",         ring="B", deg=315, size=1.0,  flow=+1),
]
RING = {"A": dict(R=3.5, tilt=0.18, omega=0.46), "B": dict(R=5.2, tilt=-0.10, omega=0.34)}
CHAIN = {"laptop": 9.0, "play": 9.6, "chart": 10.2, "certificate": 10.8}   # flow highlight order


def link_material(name, color, flow, base=0.5, peak=3.2):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    t = m.node_tree
    t.nodes.clear()
    out = t.nodes.new("ShaderNodeOutputMaterial")
    em = t.nodes.new("ShaderNodeEmission")
    tcx = t.nodes.new("ShaderNodeTexCoord")
    sp = t.nodes.new("ShaderNodeSeparateXYZ")
    t.links.new(tcx.outputs["Generated"], sp.inputs[0])
    z = sp.outputs[2]
    time_n = val(t, name + "_time", 0.0)
    gain_n = val(t, name + "_gain", 0.0)
    ph = t.nodes.new("ShaderNodeObjectInfo")
    x = math_(t, "ADD", math_(t, "MULTIPLY", z, 2.6), math_(t, "ADD", math_(t, "MULTIPLY", time_n.outputs[0], 0.9 * flow), ph.outputs["Random"]))
    fr = math_(t, "FRACT", x)
    pulse = math_(t, "POWER", math_(t, "SUBTRACT", 1.0, fr), 5.0)
    s = math_(t, "MULTIPLY", math_(t, "ADD", base, math_(t, "MULTIPLY", pulse, peak)), gain_n.outputs[0])
    mix = t.nodes.new("ShaderNodeMix")
    mix.data_type = "RGBA"
    mix.inputs[6].default_value = color
    mix.inputs[7].default_value = U.WHITE
    t.links.new(pulse, mix.inputs[0])
    t.links.new(mix.outputs[2], em.inputs["Color"])
    t.links.new(s, em.inputs["Strength"])
    t.links.new(em.outputs[0], out.inputs[0])
    return m


def unit_cylinder(name, radius, segs=8):
    bm_ = __import__("bmesh").new()
    __import__("bmesh").ops.create_cone(bm_, cap_ends=False, segments=segs, radius1=radius, radius2=radius, depth=1.0)
    for v in bm_.verts:
        v.co.z += 0.5
    me_ = bpy.data.meshes.new(name)
    bm_.to_mesh(me_)
    bm_.free()
    return me_


for k, o in enumerate(ORBS):
    r = RING[o["ring"]]
    o["R"], o["tilt"], o["omega"] = r["R"], r["tilt"], r["omega"]
    o["theta0"] = math.radians(o["deg"])
    o["t_app"] = 3.55 + 0.30 * k
    o["root"] = U.empty("orb_" + o["key"], display="PLAIN_AXES", size=0.3)
    O.BUILDERS[o["key"]](o["root"])
    o["phase"] = k * 0.9
    # spoke back to the hub
    mat = link_material("spoke_" + o["key"], U.CYAN if o["flow"] > 0 else U.PINK, o["flow"], base=0.9, peak=4.5)
    sp = U.new_obj("spoke_" + o["key"], unit_cylinder("spoke_" + o["key"], 0.022), mat)
    sp.rotation_mode = "QUATERNION"
    o["spoke"] = sp
    o["spoke_mat"] = "spoke_" + o["key"]
    # label
    lm = U.emissive("lbl_" + o["key"], U.WHITE, 0.0)
    U.ANIM_SOCKETS["lbl_" + o["key"]] = lm.node_tree.nodes["Emission"].inputs["Strength"]
    lab = O.make_text("lbl_" + o["key"], o["label"], 0.21, lm, None, spacing=1.3)
    c = lab.constraints.new("TRACK_TO")
    c.target, c.track_axis, c.up_axis = cam, "TRACK_Z", "UP_Y"
    o["label_obj"] = lab
    o["label_mat"] = "lbl_" + o["key"]

# neighbour links (constellation)
ring_mat = link_material("ringlink", U.BLUE_L, +1, base=0.35, peak=2.2)
for i, o in enumerate(ORBS):
    nxt = ORBS[(i + 1) % len(ORBS)]
    cyl = U.new_obj(f"nlink_{i}", unit_cylinder(f"nlink_{i}", 0.010), ring_mat)
    cyl.rotation_mode = "QUATERNION"
    o["nlink"] = cyl
    o["nlink_to"] = nxt

# orbit-path rings
for tag, r in RING.items():
    g = U.empty("orbit_" + tag)
    m = U.emissive("orbit_" + tag, U.CYAN if tag == "A" else U.PURPLE, 1.0)
    U.ANIM_SOCKETS["orbit_" + tag] = m.node_tree.nodes["Emission"].inputs["Strength"]
    t_ = U.torus("orbit_ring_" + tag, r["R"], 0.007, m, g, segs=200)
    g.rotation_euler = (r["tilt"], 0, 0)
    r["empty"] = g

# ------------------------------------------------------------------ dust / bokeh particles
random.seed(11)
bmd = __import__("bmesh").new()
for i in range(200):
    p = Vector((random.uniform(-15, 15), random.uniform(-9, 14), random.uniform(FLOOR_Z + 0.2, 8)))
    s = random.choice((0.012, 0.018, 0.026, 0.04)) * random.uniform(0.7, 1.3)
    vs = [bmd.verts.new(p + Vector(o_) * s) for o_ in ((1, 0, 0), (-1, 0, 0), (0, 1, 0), (0, -1, 0), (0, 0, 1), (0, 0, -1))]
    for a, b, c in ((0, 2, 4), (2, 1, 4), (1, 3, 4), (3, 0, 4), (2, 0, 5), (1, 2, 5), (3, 1, 5), (0, 3, 5)):
        bmd.faces.new((vs[a], vs[b], vs[c]))
dme = bpy.data.meshes.new("dust")
bmd.to_mesh(dme)
bmd.free()
dust_mat = U.emissive("dust", U.hexc("#9FC8FF"), 2.2)
dust = U.new_obj("Dust", dme, dust_mat)
dust.rotation_euler = (0, 0, 0)

# ------------------------------------------------------------------ final text
def txt(name, body, size, weight, color, strength=0.0):
    m = U.emissive("txt_" + name, color, 1.0)
    U.ANIM_SOCKETS["txt_" + name] = m.node_tree.nodes["Emission"].inputs["Strength"]
    return O.make_text("T_" + name, body, size, m, None, rot=(math.pi / 2, 0, 0), weight=weight, spacing=1.0)


t_one = txt("one", "One platform.", 0.40, "SemiBold", U.WHITE)
t_every = txt("every", "Every learning journey.", 0.40, "Light", U.hexc("#9CC4FF"))
t_word = txt("word", "CanPlus", 0.80, "SemiBold", U.WHITE)
t_word.data.align_x = "LEFT"
bpy.context.view_layer.update()
WORD_W = t_word.dimensions.x
LOCK_S = 0.78
GAP = 0.38
TOTAL = MARK_W * LOCK_S + GAP + WORD_W
LOCK_MARK_X = -TOTAL / 2 + MARK_W * LOCK_S / 2
LOCK_WORD_X = -TOTAL / 2 + MARK_W * LOCK_S + GAP
print("lockup: mark_w", MARK_W, "word_w", WORD_W, "total", TOTAL)

# ------------------------------------------------------------------ timeline
HUB_S = [(0, 0.0), (0.25, 0.0), (1.5, 0.30), (3.0, 0.34), (4.7, 1.12), (5.9, 1.0), (12.0, 1.0),
         (13.4, 0.93), (14.0, 0.88), (14.35, 1.95), (15.0, 1.72), (16.2, 1.70),
         (17.35, LOCK_S), (18.3, LOCK_S), (19.2, LOCK_S), (20.0, LOCK_S)]
HUB_Z = [(0, 0.0), (14.0, 0.0), (16.2, 0.18), (17.35, 0.98), (18.3, 0.98), (19.2, 0.05), (20, 0.05)]
HUB_X = [(0, 0), (18.3, 0.0), (19.2, LOCK_MARK_X), (20, LOCK_MARK_X)]
CAM_D = [(0, 24.0), (3.0, 13.0), (6.0, 15.8), (12.0, 17.2), (14.0, 14.5), (14.4, 12.5), (16.0, 10.2), (18.4, 9.6), (20.0, 9.0)]
CAM_PHI = [(0, 0.0), (3.0, 0.0), (6.0, -0.30), (9.0, 0.18), (12.0, 0.38), (14.0, 0.10), (15.2, 0.0), (20, 0.0)]
CAM_E = [(0, 0.14), (3.0, 0.24), (6.0, 0.44), (12.0, 0.48), (14.0, 0.26), (16.0, 0.06), (20, 0.05)]
CAM_TZ = [(0, 0.0), (14.0, 0.0), (16.2, 0.12), (17.35, 0.40), (18.3, 0.40), (19.2, 0.0), (20, 0.0)]


def hub_gain(t):
    g = 1.7 * smooth(seg(t, 0.15, 1.3))
    g += 2.2 * bump(t - 3.6, 0.55)
    if t < T_IMPACT:
        g += 5.0 * in_cubic(seg(t, 12.4, T_IMPACT))
    else:
        g += 8.0 * math.exp(-(t - T_IMPACT) / 0.30)
    g += 1.6 * bump(t - 18.9, 0.35)
    return g


def orb_state(o, t):
    a = seg(t, o["t_app"], o["t_app"] + 1.15)
    u = seg(t, T_COL0, T_COL1)
    rf = out_cubic(a) * (1 - u ** 2.4)
    th = o["theta0"] + o["omega"] * max(0.0, t - 3.0) + 11.0 * u ** 3
    Rr = o["R"] * rf
    x, y = Rr * math.cos(th), Rr * math.sin(th)
    ct, st = math.cos(o["tilt"]), math.sin(o["tilt"])
    p = Vector((x, y * ct, y * st))
    p.z += 0.10 * math.sin(1.25 * t + o["phase"]) * (1 - u)
    s = o["size"] * out_back(a) * (1 - u ** 1.6)
    return p, max(s, 0.0), a, u


def logo_yaw(t):
    return (0.30 * math.sin(0.75 * t)) * (1 - smooth(seg(t, 13.5, 15.2))) + 0.9 * (1 - smooth(seg(t, 0.2, 3.6)))


def floor_params(t):
    rv = pchip(t, [(0, -1.5), (3.0, -1.0), (3.2, 0.0), (6.8, 17.0), (11.8, 17.0), (14.0, 0.5), (14.05, 0.0), (15.0, 6.0), (17.5, 10.0), (20, 10.0)])
    if t < 9.0:
        sR = (t - 3.3) * 5.5
        sI = 0.9 * math.exp(-(t - 3.3) * 0.6) * math.exp(-0.08 * max(sR, 0)) if t > 3.3 else 0.0
    else:
        sR = (t - T_IMPACT) * 11.0
        sI = 1.8 * math.exp(-(t - T_IMPACT) * 0.9) * math.exp(-0.07 * max(sR, 0)) if t > T_IMPACT else 0.0
    return rv, sR, sI


def update(t):
    S = pchip(t, HUB_S)
    hp = Vector((pchip(t, HUB_X), 0.0, pchip(t, HUB_Z)))
    logo.location = hp
    logo.scale = (S, S, S)
    logo.rotation_euler = (0, 0, logo_yaw(t))
    g = hub_gain(t)
    U.ANIM_SOCKETS["logo_blue"].default_value = 0.42 * g + 0.1
    U.ANIM_SOCKETS["logo_purple"].default_value = 0.30 * g + 0.05
    hub_light.location = hp + Vector((0, -1.4, 0.4))
    hub_ld.energy = 900.0 * S * (0.3 + 0.7 * g / 1.9) if S > 0.001 else 0.0
    hub_target.location = Vector((0, 0, pchip(t, CAM_TZ)))

    # camera
    d, phi, e, tz = pchip(t, CAM_D), pchip(t, CAM_PHI), pchip(t, CAM_E), pchip(t, CAM_TZ)
    shake = 0.06 * math.exp(-abs(t - T_IMPACT) * 4.0) * math.sin(t * 60)
    cam.location = Vector((d * math.sin(phi) * math.cos(e), -d * math.cos(phi) * math.cos(e), tz + d * math.sin(e) + shake))

    # orbs, spokes, labels
    pos = {}
    for k, o in enumerate(ORBS):
        p, s, a, u = orb_state(o, t)
        pos[o["key"]] = (hp + p, s, a, u)
        o["root"].location = hp + p
        o["root"].scale = (s, s, s) if s > 1e-4 else (1e-4,) * 3
        sway = 0.30 * math.sin(0.8 * t + o["phase"])
        o["root"].rotation_euler = (0.10 * math.sin(0.7 * t + o["phase"]), 0, phi * 0.9 + sway + 6.0 * u ** 3)
    for k, o in enumerate(ORBS):
        p, s, a, u = pos[o["key"]]
        direction = (p - hp)
        L = direction.length
        gro = out_cubic(seg(t, 6.0 + 0.22 * k, 6.9 + 0.22 * k)) * (1 - seg(t, 13.2, T_IMPACT + 0.2))
        start = hp + direction.normalized() * (0.95 * S) if L > 1e-4 else hp
        vec = p - start
        sp = o["spoke"]
        if L > 0.01 and gro > 0.001 and vec.length > 0.01:
            sp.location = start
            sp.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(vec.normalized())
            sp.scale = (1, 1, vec.length * gro)
        else:
            sp.location = start
            sp.scale = (1, 1, 1e-4)
        flash = 1.0 + (4.5 * bump(t - CHAIN[o["key"]], 0.38) if o["key"] in CHAIN else 0.0)
        U.ANIM_SOCKETS[o["spoke_mat"] + "_gain"].default_value = flash * (1 - seg(t, 12.6, 13.6)) * (1 if gro > 0.001 else 0.0)
        # labels
        fade = smooth(seg(t, 6.5 + 0.35 * k, 7.2 + 0.35 * k)) * (1 - smooth(seg(t, 11.3, 12.0)))
        lab = o["label_obj"]
        out_xy = Vector((direction.x, direction.y, 0.0))
        out_xy = out_xy.normalized() if out_xy.length > 1e-3 else Vector((0, 0, 0))
        dz = (0.82 * max(s, 0.3) + 0.10) if o["ring"] == "A" else -(0.78 * max(s, 0.3) + 0.30)
        lab.location = p + out_xy * 0.35 + Vector((0, 0, dz))
        ls = (0.75 + 0.25 * fade) * (1 if fade > 0.002 else 1e-4)
        lab.scale = (ls, ls, ls)
        U.ANIM_SOCKETS[o["label_mat"]].default_value = 5.0 * fade
    # constellation links
    for i, o in enumerate(ORBS):
        p0, s0, a0, u0 = pos[o["key"]]
        p1, s1, a1, u1 = pos[o["nlink_to"]["key"]]
        vec = p1 - p0
        gro = out_cubic(seg(t, 7.4 + 0.15 * i, 8.4 + 0.15 * i)) * (1 - seg(t, 11.6, 12.6))
        c = o["nlink"]
        c.location = p0
        if vec.length > 0.01 and gro > 0.001:
            c.rotation_quaternion = Vector((0, 0, 1)).rotation_difference(vec.normalized())
            c.scale = (1, 1, vec.length * gro)
        else:
            c.scale = (1, 1, 1e-4)
    U.ANIM_SOCKETS["ringlink_gain"].default_value = 0.85 * (1 - seg(t, 11.6, 12.4))
    for name in [o["spoke_mat"] for o in ORBS] + ["ringlink"]:
        U.ANIM_SOCKETS[name + "_time"].default_value = t   # cheap: node maths scales it

    # orbit rings
    for tag, r in RING.items():
        grow = out_cubic(seg(t, 3.3 if tag == "A" else 3.6, 4.9)) * (1 - in_cubic(seg(t, T_COL0, T_COL1)))
        sc_ = max(grow, 1e-4)
        r["empty"].scale = (sc_, sc_, sc_)
        r["empty"].location = hp
        U.ANIM_SOCKETS["orbit_" + tag].default_value = 0.9 * smooth(seg(t, 3.4, 5.0)) * (1 - seg(t, 12.6, 13.8))
        r["empty"].rotation_euler = (r["tilt"], 0, 0.2 * t)

    # floor + dust
    rv, sR, sI = floor_params(t)
    U.ANIM_SOCKETS["floor_reveal"].default_value = rv
    U.ANIM_SOCKETS["floor_shockR"].default_value = sR
    U.ANIM_SOCKETS["floor_shockI"].default_value = sI
    dust.rotation_euler = (0, 0, 0.012 * t)
    dust.location = Vector((0, 0.15 * t, 0))

    # final text
    dz = 0.10
    f1 = smooth(seg(t, 16.55, 17.15)) * (1 - smooth(seg(t, 18.15, 18.6)))
    f2 = smooth(seg(t, 17.1, 17.7)) * (1 - smooth(seg(t, 18.15, 18.6)))
    t_one.location = (0, -0.05, -0.55 + dz * (1 - smooth(seg(t, 16.55, 17.3))) + 0.08 * smooth(seg(t, 18.15, 18.6)))
    t_every.location = (0, -0.05, -1.12 + dz * (1 - smooth(seg(t, 17.1, 17.85))) + 0.08 * smooth(seg(t, 18.15, 18.6)))
    fw = smooth(seg(t, 18.85, 19.5))
    t_word.location = (LOCK_WORD_X + 0.35 * (1 - smooth(seg(t, 18.85, 19.6))), -0.05, 0.05)
    for tobj, f_, key in ((t_one, f1, "one"), (t_every, f2, "every"), (t_word, fw, "word")):
        U.ANIM_SOCKETS["txt_" + key].default_value = 1.5 * f_
        s_ = 1.0 if f_ > 0.002 else 1e-4
        tobj.scale = (s_, s_, s_)


# register what to keyframe
KEYED = []
for o in ORBS:
    for ob in (o["root"], o["label_obj"]):
        KEYED += [(ob, "location"), (ob, "scale")]
    KEYED += [(o["root"], "rotation_euler")]
    KEYED += [(o["spoke"], "location"), (o["spoke"], "rotation_quaternion"), (o["spoke"], "scale")]
    KEYED += [(o["nlink"], "location"), (o["nlink"], "rotation_quaternion"), (o["nlink"], "scale")]
for r in RING.values():
    KEYED += [(r["empty"], "location"), (r["empty"], "scale"), (r["empty"], "rotation_euler")]
KEYED += [(logo, "location"), (logo, "scale"), (logo, "rotation_euler"), (cam, "location"), (hub_target, "location"),
          (hub_ld, "energy"), (hub_light, "location"), (dust, "rotation_euler"), (dust, "location")]
for tobj in (t_one, t_every, t_word):
    KEYED += [(tobj, "location"), (tobj, "scale")]
SOCK_KEYS = list(U.ANIM_SOCKETS.values())

import time as _t
t0 = _t.time()
for f in range(1, NF + 1):
    t = (f - 1) / FPS
    update(t)
    for idb, path in KEYED:
        idb.keyframe_insert(path, frame=f)
    for s_ in SOCK_KEYS:
        s_.keyframe_insert("default_value", frame=f)
    if f % 60 == 0:
        print(f"keyed frame {f}/{NF}  ({_t.time() - t0:.0f}s)", flush=True)

sc.frame_set(1)
out = sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else os.path.join(HERE, "canplus_ecosystem.blend")
bpy.ops.wm.save_as_mainfile(filepath=out)
print("saved", out)
