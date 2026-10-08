#!/bin/bash
# Full pipeline: render EXR frames, grade them, encode MP4.  usage: ./run_all.sh PYTHON WORKDIR
PY=${1:-python}; W=${2:-work}; export CP_FPS=24 CP_RES=1280x720 CP_SAMPLES=16
mkdir -p $W
$PY build_scene.py -- $W/canplus_ecosystem.blend
$PY render_frames.py -- $W/canplus_ecosystem.blend $W/exr 1 480 &
R=$!
while kill -0 $R 2>/dev/null; do $PY post.py $W/exr $W/png >/dev/null; sleep 20; done
$PY post.py $W/exr $W/png >/dev/null
ffmpeg -y -framerate 24 -i $W/png/%04d.png -c:v libx264 -preset slow -crf 15 -pix_fmt yuv420p -movflags +faststart $W/canplus_ecosystem.mp4
