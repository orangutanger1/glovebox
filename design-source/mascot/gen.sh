#!/usr/bin/env bash
# Generate the Wrenchy car mascot mood set on KIE (gpt-image-2.5 flare, image-to-image).
# usage: gen.sh <out_dir> <mood>...   (reads KIE_API_KEY from env)
set -euo pipefail
OUT="$1"; shift
DIR="$(cd "$(dirname "$0")" && pwd)"
REF="$DIR/ref0.png"

if [ ! -s "$DIR/ref_url.txt" ]; then
  curl -s -X POST 'https://kieai.redpandaai.co/api/file-stream-upload' \
    -H "Authorization: Bearer $KIE_API_KEY" \
    -F "file=@$REF" -F "uploadPath=images/wrenchy-mascot" -F "fileName=ref0.png" \
    -o "$DIR/upload.json"
  python3 -c 'import json,sys;print(json.load(open(sys.argv[1]))["data"]["downloadUrl"])' "$DIR/upload.json" > "$DIR/ref_url.txt"
fi
REF_URL="$(cat "$DIR/ref_url.txt")"

STYLE='Redraw the attached character: the same flat 2D vector car mascot seen from the front, same proportions, same cool blue body colour #4C7DFF, same pale periwinkle windshield and bumper, same big round cartoon eyes with white sclera and a single white highlight, same thick-but-simple shapes, no outlines, no gradients, no shading, no texture, no 3D. Fix one thing: the tyres must be a mid slate grey-blue (#46506A) with a slightly lighter hubcap, never near-black, so they stay visible on a near-black app background. Centered, the whole car visible with generous empty margin, transparent background, nothing else in the frame, no text, no ground shadow.'

prompt_for() {
  case "$1" in
    happy) echo "$STYLE Expression: happy and content — open eyes, a wide friendly open smile, relaxed brows. Mood: everything is on schedule." ;;
    headsup) echo "$STYLE Expression: alert heads-up — eyes slightly wider, eyebrows raised, small closed 'o' mouth, one small pale-blue exclamation mark floating just above the right mirror. Mood: a service is coming up soon, nothing wrong yet." ;;
    worried) echo "$STYLE Expression: worried — eyebrows tilted up in the middle, small wavy frown, one pale-blue sweat drop beside the right eye. Mood: a service is overdue." ;;
    sleepy) echo "$STYLE Expression: sleepy — eyes closed as soft downward curves with pale periwinkle eyelids, small content smile, and three small 'z' letters rising from the top right drawn in pale periwinkle (#B9C8FF) so they stay visible on a dark background. Mood: nothing logged yet." ;;
    celebrating) echo "$STYLE Expression: celebrating — eyes closed in happy upward arcs, big open smile with a little tongue, the car tilted a few degrees and bouncing, with four or five small flat pale-periwinkle and white sparkle/star shapes around it (simple 4-point stars, not confetti). Mood: a service was just logged." ;;
  esac
}

for mood in "$@"; do
  body=$(python3 -c 'import json,sys;print(json.dumps({"model":"gpt-image-2-5-flare-image-to-image","input":{"prompt":sys.argv[1],"input_urls":[sys.argv[2]],"aspect_ratio":"1:1","resolution":"2K","background":"transparent"}}))' "$(prompt_for "$mood")" "$REF_URL")
  curl -s -X POST 'https://api.kie.ai/api/v1/jobs/createTask' \
    -H "Authorization: Bearer $KIE_API_KEY" -H 'Content-Type: application/json' \
    -d "$body" -o "$OUT/$mood.task.json"
  echo "$mood $(cat "$OUT/$mood.task.json")"
done
