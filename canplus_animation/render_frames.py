"""Render frames to linear half-float EXR (skips existing files so it can resume).
   python render_frames.py -- file.blend outdir start end [WxH] [samples]
"""
import sys, os, time
import bpy, addon_utils
addon_utils.enable("cycles")
a = sys.argv[sys.argv.index("--") + 1:]
blend, outdir, start, end = a[0], a[1], int(a[2]), int(a[3])
res = a[4] if len(a) > 4 else None
samples = int(a[5]) if len(a) > 5 else None
bpy.ops.wm.open_mainfile(filepath=blend)
sc = bpy.context.scene
if res:
    sc.render.resolution_x, sc.render.resolution_y = (int(v) for v in res.split("x"))
if samples:
    sc.cycles.samples = samples
sc.render.image_settings.file_format = "OPEN_EXR"
sc.render.image_settings.color_depth = "16"
sc.render.image_settings.exr_codec = "ZIP"
os.makedirs(outdir, exist_ok=True)
for f in range(start, end + 1):
    path = os.path.join(outdir, f"{f:04d}.exr")
    if os.path.exists(path):
        continue
    sc.frame_set(f)
    sc.render.filepath = path[:-4]
    t = time.time()
    bpy.ops.render.render(write_still=True)
    print(f"frame {f} {time.time() - t:.1f}s", flush=True)
