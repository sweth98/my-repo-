#!/usr/bin/env bash
# Encode a PNG sequence (npm run frames) into an MP4, optionally muxing the soundtrack WAV.
#   W=1080 npm run frames        # renders out/frames/f_00000.png … f_01049.png (needs the dev server)
#   npm run encode               # -> out/the-infinite-ascent.mp4
set -euo pipefail
cd "$(dirname "$0")/.."
AUDIO=${AUDIO:-}
ARGS=(-y -framerate 30 -i out/frames/f_%05d.png)
if [[ -n "$AUDIO" && -f "$AUDIO" ]]; then ARGS+=(-i "$AUDIO" -c:a aac -b:a 192k -shortest); fi
ffmpeg "${ARGS[@]}" -c:v libx264 -preset slow -crf 14 -pix_fmt yuv420p -movflags +faststart out/the-infinite-ascent.mp4
echo "wrote out/the-infinite-ascent.mp4"
