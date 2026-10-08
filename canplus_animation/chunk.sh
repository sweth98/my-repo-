#!/bin/bash
SP=/tmp/claude-0/-home-user-my-repo-/245a5abb-af99-545a-8f38-e3c57d0f91ce/scratchpad; PY=$SP/venv/bin/python; export CP_FPS=24
timeout 520 $PY render_frames.py -- $SP/work/canplus_ecosystem.blend $SP/work/exr 1 480 >/dev/null 2>&1
$PY post.py $SP/work/exr $SP/work/png >/dev/null
echo "exr: $(ls $SP/work/exr | wc -l)  png: $(ls $SP/work/png | wc -l)"
