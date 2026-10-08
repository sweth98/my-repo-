"""Render a handful of preview frames:  python preview.py file.blend outdir WxH samples f1 f2 ..."""
import sys, os, time
import bpy, addon_utils
addon_utils.enable("cycles")
blend, outdir, res, samples, *frames = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else sys.argv[1:]
bpy.ops.wm.open_mainfile(filepath=blend)
sc = bpy.context.scene
w, h = (int(v) for v in res.split("x"))
sc.render.resolution_x, sc.render.resolution_y = w, h
sc.cycles.samples = int(samples)
sc.render.image_settings.file_format = "PNG"
sc.render.image_settings.color_depth = "8"
sc.view_settings.view_transform = "AgX"
os.makedirs(outdir, exist_ok=True)
for f in frames:
    sc.frame_set(int(f))
    sc.render.filepath = os.path.join(outdir, f"f{int(f):04d}.png")
    t = time.time()
    bpy.ops.render.render(write_still=True)
    print("frame", f, "%.1fs" % (time.time() - t), flush=True)
