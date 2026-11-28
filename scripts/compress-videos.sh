#!/usr/bin/env bash
# Compresses the hero intro videos for the web and makes poster frames.
# Run from the website folder:  bash scripts/compress-videos.sh
# Originals in videos/ are left untouched; results go to videos/out/.
set -euo pipefail

CRF="${CRF:-26}"   # quality: lower = better + bigger (23-28 is the useful range)
mkdir -p videos/out

encode() {
  local name="$1" scale="$2"
  echo "==> Encoding $name (crf $CRF)"
  ffmpeg -hide_banner -loglevel warning -stats -y \
    -i "videos/$name.mp4" \
    -vf "scale=$scale" \
    -c:v libx264 -preset slow -crf "$CRF" -profile:v high -pix_fmt yuv420p \
    -c:a aac -b:a 96k \
    -movflags +faststart \
    "videos/out/$name.mp4"

  echo "==> Poster for $name"
  ffmpeg -hide_banner -loglevel error -y \
    -ss 1 -i "videos/out/$name.mp4" -frames:v 1 -q:v 4 \
    "videos/out/$name.jpg"
}

encode intro-vertical   "720:-2"
encode intro-horizontal "1280:-2"

echo
ls -lh videos/out
