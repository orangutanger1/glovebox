#!/usr/bin/env bash
# Generate A v2's four new service stickers on KIE (gpt-image-2.5 flare,
# image-to-image, 1K, transparent), styled on the intro's oil and battery
# stickers (assets/intro/). The other five stickers are the intro's own.
# usage: gen.sh <out_dir> <name>...   (reads KIE_API_KEY from env)
set -euo pipefail
OUT="$1"; shift
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

upload() {
  curl -s -X POST 'https://kieai.redpandaai.co/api/file-stream-upload' \
    -H "Authorization: Bearer $KIE_API_KEY" \
    -F "file=@$1" -F "uploadPath=images/wrenchy-stickers" -F "fileName=$(basename "$1")" \
    | python3 -c 'import json,sys;print(json.load(sys.stdin)["data"]["downloadUrl"])'
}
OIL_URL="$(upload "$ROOT/assets/intro/oil.png")"
BAT_URL="$(upload "$ROOT/assets/intro/battery.png")"

STYLE='Draw one new sticker in exactly the same flat 2D vector style as the two attached stickers: same cool blue body colour #4C7DFF, pale periwinkle #D6E0FF panels, slate #3A4256 details, same simple chunky shapes and rounded corners, the same white sticker border if they have one. No outline beyond that, no glow, no drop shadow, no gradient, no texture, no 3D, no text. One object only, centred, filling about 80% of the frame, transparent background, nothing else in the frame. The object:'

prompt_for() {
  case "$1" in
    brake) echo "$STYLE a car brake disc with its caliper." ;;
    filter) echo "$STYLE an engine air filter (a flat pleated panel filter)." ;;
    wiper) echo "$STYLE a windscreen wiper blade." ;;
    coolant) echo "$STYLE a coolant bottle with a small thermometer mark on its label." ;;
    # Second tries: the first coolant read as the oil jug, the first brake as the tyre.
    brake2) echo "$STYLE a car brake seen from the side at a three-quarter angle: a thin flat disc with a row of drilled holes, and a big chunky slate caliper clamped over its top edge. It must not look like a wheel or a tyre." ;;
    coolant2) echo "$STYLE a car coolant expansion tank: a squat translucent pale periwinkle reservoir with a round slate pressure cap on top, a wavy coolant level line inside, and a small snowflake and flame pair on its side. It must not look like a jug or an oil can." ;;
  esac
}

for name in "$@"; do
  body=$(python3 -c 'import json,sys;print(json.dumps({"model":"gpt-image-2-5-flare-image-to-image","input":{"prompt":sys.argv[1],"input_urls":[sys.argv[2],sys.argv[3]],"aspect_ratio":"1:1","resolution":"1K","background":"transparent"}}))' "$(prompt_for "$name")" "$OIL_URL" "$BAT_URL")
  curl -s -X POST 'https://api.kie.ai/api/v1/jobs/createTask' \
    -H "Authorization: Bearer $KIE_API_KEY" -H 'Content-Type: application/json' \
    -d "$body" -o "$OUT/$name.task.json"
  echo "$name $(cat "$OUT/$name.task.json")"
done
