#!/usr/bin/env bash
#
# compress-gifs.sh — turn animated GIFs into web video (VP9 WebM + H.264 MP4),
# written to <src>/compressed/video/ with the original sub-paths preserved.
#
# Why video and not WebP: GIF stores every frame as a full palettised image with
# no motion compensation, so a screen recording costs tens of megabytes. Animated
# WebP only re-packs those frames — on these sources it saves about 20%. A real
# video codec predicts each frame from the last, which is exactly what a screen
# recording is made of, and takes the same clip down by 90%+.
#
# Every ffmpeg call passes -nostdin: ffmpeg reads stdin by default, and inside
# this loop stdin IS the file list, so without it ffmpeg eats the next filename.
#
# Two outputs per GIF, because <video> picks the first source it can play:
#   • VP9 in WebM   — smallest; Chrome, Firefox, Edge, Safari 14.1+
#   • H.264 in MP4  — the universal fallback, plays everywhere
#
# Each output is measured against the source with SSIM (1.000 = identical), so
# the quality claim is a number rather than an opinion.
#
# Usage:
#   scripts/compress-gifs.sh <src-dir>
#   VP9_CRF=32 H264_CRF=24 scripts/compress-gifs.sh Images
#
set -uo pipefail
eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null || true)"
command -v ffmpeg  >/dev/null || { echo "ffmpeg not found (brew install ffmpeg)"  >&2; exit 1; }
command -v ffprobe >/dev/null || { echo "ffprobe not found (brew install ffmpeg)" >&2; exit 1; }

SRC="${1:?usage: compress-gifs.sh <src-dir>}"
SRC="$(cd "$SRC" && pwd)"
VP9_CRF="${VP9_CRF:-32}"
H264_CRF="${H264_CRF:-24}"
OUTROOT="$SRC/compressed/video"

hr() { awk "BEGIN{b=$1; if(b>1048576)printf \"%.1f MB\",b/1048576; else printf \"%.0f KB\",b/1024}"; }

# SSIM of encoded $2 against source $1. The reference is scaled to the encoded
# size first: h264 needs even dimensions, so a 720x407 GIF comes back 720x406
# and the ssim filter refuses to compare two different geometries.
ssim_of() {
  local ow oh
  IFS=, read -r ow oh < <(ffprobe -v error -select_streams v:0 \
    -show_entries stream=width,height -of csv=p=0 "$2")
  ffmpeg -nostdin -hide_banner -nostats -loglevel info -i "$2" -i "$1" -filter_complex \
    "[1:v]scale=${ow}:${oh}:flags=lanczos,format=yuv420p,settb=AVTB,setpts=PTS-STARTPTS[ref];[0:v]format=yuv420p,settb=AVTB,setpts=PTS-STARTPTS[dist];[dist][ref]ssim" \
    -f null - 2>&1 | grep -oE 'All:[0-9.]+' | tail -1 | cut -d: -f2
}

printf "%-34s %9s %9s %9s %6s %8s\n" "file" "gif" "webm" "mp4" "saved" "ssim"
printf '%.0s─' $(seq 1 82); echo

tin=0; tout=0; n=0; failed=0
while IFS= read -r -d '' f; do
  rel="${f#"$SRC"/}"
  webm="$OUTROOT/${rel%.*}.webm"
  mp4="$OUTROOT/${rel%.*}.mp4"
  mkdir -p "$(dirname "$webm")"
  inb="$(stat -f%z "$f")"

  # h264 requires even dimensions; GIFs are under no such constraint
  VF="scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p"

  if ! ffmpeg -nostdin -y -hide_banner -loglevel error -i "$f" -vf "$VF" \
        -c:v libvpx-vp9 -crf "$VP9_CRF" -b:v 0 -row-mt 1 -an "$webm" 2>/dev/null; then
    printf "%-34s %9s %9s %9s %6s %8s\n" "${rel:0:34}" "$(hr "$inb")" "-" "-" "-" "FAILED"
    failed=$((failed+1)); continue
  fi
  # +faststart puts the moov atom first so playback can start mid-download
  ffmpeg -nostdin -y -hide_banner -loglevel error -i "$f" -vf "$VF" \
    -c:v libx264 -preset slow -crf "$H264_CRF" -profile:v high -pix_fmt yuv420p \
    -movflags +faststart -an "$mp4" 2>/dev/null

  wb="$(stat -f%z "$webm")"; mb="$(stat -f%z "$mp4")"
  s="$(ssim_of "$f" "$webm")"
  # a visitor downloads one of the two, so count the one they will actually get
  tin=$((tin+inb)); tout=$((tout+wb)); n=$((n+1))
  pct="$(awk "BEGIN{printf \"%.0f%%\",(1-$wb/$inb)*100}")"
  printf "%-34s %9s %9s %9s %6s %8s\n" "${rel:0:34}" "$(hr "$inb")" "$(hr "$wb")" "$(hr "$mb")" "$pct" "${s:-n/a}"
done < <(find "$SRC" -type f -iname '*.gif' -not -path "*/compressed/*" -print0)

printf '%.0s─' $(seq 1 82); echo
pcttot="$(awk -v a="$tout" -v b="$tin" 'BEGIN{ if(b>0) printf "%.0f%%",(1-a/b)*100; else printf "0%%" }')"
printf "converted %d  (%s -> %s webm, %s)   failed %d\n" \
  "$n" "$(hr "${tin:-0}")" "$(hr "${tout:-0}")" "$pcttot" "$failed"
echo "output: $OUTROOT"
