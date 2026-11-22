#!/usr/bin/env bash
# Render the Iris layout as a PNG wallpaper sized for the main display.
#
# Usage: iris-make-wallpaper.sh [-s WxH] [-t dark|light] [-o out.png] [--set]
#   -s     canvas size (default: the main display's native resolution)
#   -t     colour theme (default: dark)
#   -o     output file (default: iris-wallpaper-<theme>-<W>x<H>.png next to this script)
#   --set  also make it the desktop picture
set -euo pipefail

here=$(cd "$(dirname "$0")" && pwd)
size="" theme=dark out="" set_wallpaper=0
while (($#)); do
    case $1 in
        -s) size=$2; shift 2 ;;
        -t) theme=$2; shift 2 ;;
        -o) out=$2; shift 2 ;;
        --set) set_wallpaper=1; shift ;;
        -h|--help) sed -n '2,9p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
        *) echo "unknown option: $1" >&2; exit 2 ;;
    esac
done

if [[ -z $size ]]; then
    # The "Resolution:" line in the main display's block, e.g. "3440 x 1440".
    size=$(system_profiler SPDisplaysDataType | awk '
        /Resolution:/ { res = $2 "x" $4 }
        /Main Display: Yes/ { print res; exit }')
    [[ -n $size ]] || { echo "couldn't detect the main display; pass -s WxH" >&2; exit 1; }
fi
out=${out:-$here/iris-wallpaper-$theme-$size.png}
w=${size%x*} h=${size#*x}

chrome="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
[[ -x $chrome ]] || { echo "needs Google Chrome to rasterize the SVG" >&2; exit 1; }

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# Wide screens fit all four layers in a 2x2 grid; tall ones stack them.
columns=$(( w > h ? 2 : 1 ))
"$here/iris-layout-to-svg.py" "$here/iris-layout.json" -o "$tmp/layout.svg" \
    --columns "$columns" --size "$size" --theme "$theme" >/dev/null

# Headless Chrome's viewport can come out shorter than --window-size, leaving
# the bottom unpainted, so render into a taller window and crop to size.
"$chrome" --headless --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --user-data-dir="$tmp/profile" --window-size="$w,$((h + 200))" \
    --screenshot="$tmp/out.png" "file://$tmp/layout.svg" 2>/dev/null
# Keep the top $h rows (sips -c only crops around the centre). Each PNG
# scanline is filtered against the one above it, so a prefix stays valid.
python3 - "$tmp/out.png" "$h" <<'PY'
import struct, sys, zlib
path, h = sys.argv[1], int(sys.argv[2])
data = open(path, "rb").read()
chunks, pos = [], 8
while pos < len(data):
    n, kind = struct.unpack(">I4s", data[pos:pos + 8])
    chunks.append((kind, data[pos + 8:pos + 8 + n]))
    pos += 12 + n
ihdr = chunks[0][1]
w, _, depth, color = struct.unpack(">IIBB", ihdr[:10])
bpp = {0: 1, 2: 3, 4: 2, 6: 4}[color] * depth // 8
rows = zlib.decompress(b"".join(c for k, c in chunks if k == b"IDAT"))[:h * (1 + w * bpp)]
def chunk(kind, body):
    return struct.pack(">I", len(body)) + kind + body + struct.pack(">I", zlib.crc32(kind + body))
out = data[:8] + chunk(b"IHDR", ihdr[:4] + struct.pack(">I", h) + ihdr[8:])
out += chunk(b"IDAT", zlib.compress(rows, 9)) + chunk(b"IEND", b"")
open(path, "wb").write(out)
PY

mkdir -p "$(dirname "$out")"
mv "$tmp/out.png" "$out"
echo "$out ($size, $theme)"

if ((set_wallpaper)); then
    osascript -e "tell application \"System Events\" to tell every desktop to set picture to POSIX file \"$out\""
fi
