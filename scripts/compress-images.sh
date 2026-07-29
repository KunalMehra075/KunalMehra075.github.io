#!/usr/bin/env bash
#
# compress-images.sh — convert raster images (.png/.jpg/.jpeg) in a directory
# tree to visually-lossless WebP, written to <src>/compressed/images/ with the
# original sub-paths preserved (extension becomes .webp).
#
# Per image it makes candidates and keeps the SMALLEST that's still visually
# lossless:
#   • lossy WebP at q90 (q95 retry if PSNR dips)         ← wins for photos
#   • lossless WebP (PNG only, -exact alpha)             ← wins for flat graphics
# A lossy candidate is accepted only if PSNR vs. the source ≥ PSNR_MIN (default
# 40 dB ≈ visually transparent); lossless is exact. If even the best WebP is
# larger than the source, the source is left as the winner (logged "kept").
#
# Robust to odd inputs: if cwebp can't read a file (e.g. an AVIF mislabelled
# .jpeg) it falls back to ImageMagick; a file that still fails is skipped, not
# fatal.
#
# Usage:
#   scripts/compress-images.sh <src-dir>
#   Q=90 PSNR_MIN=40 scripts/compress-images.sh apps/dashboard/public
#
set -uo pipefail
eval "$(/opt/homebrew/bin/brew shellenv 2>/dev/null || true)"
command -v cwebp  >/dev/null || { echo "cwebp not found (brew install webp)"        >&2; exit 1; }
command -v magick >/dev/null || { echo "magick not found (brew install imagemagick)" >&2; exit 1; }

SRC="${1:?usage: compress-images.sh <src-dir>}"
SRC="$(cd "$SRC" && pwd)"
Q="${Q:-90}"
PSNR_MIN="${PSNR_MIN:-40}"
OUTROOT="$SRC/compressed/images"

TMPD="$(mktemp -d)"; trap 'rm -rf "$TMPD"' EXIT
L="$TMPD/l.webp"; LL="$TMPD/ll.webp"

hr() { awk "BEGIN{b=$1; if(b>1048576)printf \"%.1f MB\",b/1048576; else printf \"%.0f KB\",b/1024}"; }

# PSNR (dB) of $2 vs $1; identical→999, unreadable→0
psnr() {
  local out v
  out="$({ magick compare -metric PSNR "$1" "$2" null: 2>&1 || true; })"
  v="$(printf '%s' "$out" | awk '{print $1; exit}')"
  case "$v" in
    inf|inf*|*INF*) echo 999 ;;
    ''|*[!0-9.]*)   echo 0 ;;
    *)              echo "$v" ;;
  esac
}
enc_lossy()    { cwebp -quiet -q "$3" -m 6 -mt -metadata none "$1" -o "$2" 2>/dev/null \
                 || magick "$1" -quality "$3" -define webp:method=6 "$2" 2>/dev/null; }
enc_lossless() { cwebp -quiet -lossless -z 9 -m 6 -mt -exact -metadata none "$1" -o "$2" 2>/dev/null \
                 || magick "$1" -define webp:lossless=true -define webp:method=6 "$2" 2>/dev/null; }

printf "%-42s %9s %9s %6s %8s  %s\n" "file" "before" "after" "saved" "psnr" "mode"
printf '%.0s─' $(seq 1 90); echo

tin=0; tout=0; n=0; kept=0; failed=0
while IFS= read -r -d '' f; do
  rel="${f#"$SRC"/}"
  ext="${f##*.}"; lext="$(printf '%s' "$ext" | tr 'A-Z' 'a-z')"
  out="$OUTROOT/${rel%.*}.webp"
  mkdir -p "$(dirname "$out")"
  inb="$(stat -f%z "$f")"

  if ! enc_lossy "$f" "$L" "$Q"; then
    printf "%-42s %9s %9s %6s %8s  %s\n" "${rel:0:42}" "$(hr "$inb")" "-" "-" "-" "SKIP (unreadable)"
    failed=$((failed+1)); continue
  fi
  sL="$(stat -f%z "$L")"; pL="$(psnr "$f" "$L")"
  best="$L"; bsize="$sL"; bq="${pL} dB"; mode="lossy q$Q"

  if [ "$lext" = "png" ] && enc_lossless "$f" "$LL"; then
    sLL="$(stat -f%z "$LL")"
    if awk "BEGIN{exit !($pL >= $PSNR_MIN && $sL <= $sLL)}"; then
      best="$L";  bsize="$sL";  bq="${pL} dB"; mode="lossy q$Q"
    else
      best="$LL"; bsize="$sLL"; bq="∞";        mode="lossless"
    fi
  elif [ "$lext" != "png" ] && awk "BEGIN{exit !($pL < $PSNR_MIN)}"; then
    enc_lossy "$f" "$L" 95 && { best="$L"; bsize="$(stat -f%z "$L")"; bq="$(psnr "$f" "$L") dB"; mode="lossy q95"; }
  fi

  if [ "$bsize" -lt "$inb" ]; then
    cp -f "$best" "$out"
    pct="$(awk "BEGIN{printf \"%.0f%%\",(1-$bsize/$inb)*100}")"
    tin=$((tin+inb)); tout=$((tout+bsize)); n=$((n+1))
    printf "%-42s %9s %9s %6s %8s  %s\n" "${rel:0:42}" "$(hr "$inb")" "$(hr "$bsize")" "$pct" "$bq" "$mode"
  else
    kept=$((kept+1))
    printf "%-42s %9s %9s %6s %8s  %s\n" "${rel:0:42}" "$(hr "$inb")" "$(hr "$inb")" "0%" "$bq" "kept (orig smaller)"
  fi
done < <(find "$SRC" -type f \( -iname '*.png' -o -iname '*.jpg' -o -iname '*.jpeg' \) -not -path "*/compressed/*" -print0)

printf '%.0s─' $(seq 1 90); echo
pcttot="$(awk -v a="$tout" -v b="$tin" 'BEGIN{ if(b>0) printf "%.0f%%",(1-a/b)*100; else printf "0%%" }')"
printf "converted %d  (%s -> %s, %s)   kept-as-is %d   skipped %d\n" \
  "$n" "$(hr "${tin:-0}")" "$(hr "${tout:-0}")" "$pcttot" "$kept" "$failed"
echo "output: $OUTROOT"
