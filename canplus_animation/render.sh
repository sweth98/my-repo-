#!/usr/bin/env bash
# Usage: ./render.sh [width] [samples]
#   ./render.sh 1920 64     # 1080p
# Needs Blender 4.2+/5.x (or `pip install bpy` on Python 3.11) and ffmpeg.
set -euo pipefail
cd "$(dirname "$0")"
export CP_OUT="${CP_OUT:-$PWD/out}" CP_RES="${1:-1280}" CP_SAMPLES="${2:-24}" CP_RENDER=1
if command -v blender >/dev/null; then blender -b -P build_canplus.py; else python3.11 build_canplus.py; fi
ffmpeg -y -framerate 24 -i "$CP_OUT/frames/f_%04d.png" -c:v libx264 -pix_fmt yuv420p -crf 14 -preset slow \
       -movflags +faststart canplus_ecosystem.mp4
