#!/usr/bin/env python3
"""
Download the onboarding screens ScreensDesign serves without authentication.

The distinction this file is built around: every replay frame in the catalogue
carries `is_blurry`. A false means the site serves the real screen to anyone; a
true means the frame is behind their paid tier and the URL returns a blurred
placeholder. **Only the false ones are fetched.** Nothing here logs in, and
nothing reaches for the `play_720p.mp4` the app page embeds.

Most apps expose four frames, which is enough to see how a flow opens and no
more. A few expose their whole capture, and those are the ones worth reading
screen by screen — a complete, real onboarding, in order, with timestamps.

Frames are named by their position and timestamp so the flow reads in `ls`
order: `03-011.6s.webp`.
"""
import json
import pathlib
import sys
import time

import requests

ROOT = pathlib.Path(__file__).parent / "onboarding-competitive"
DATA = ROOT / "_data"
H = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
    "Referer": "https://screensdesign.com/",
}


def clear_frames(app):
    """The free frames, in capture order."""
    frames = [f for f in (app.get("replays") or []) if not f.get("is_blurry")]
    return sorted(frames, key=lambda f: float(f["timestamp"]))


def fetch(app, dest_root, limit=None):
    frames = clear_frames(app)
    if limit:
        frames = frames[:limit]
    if not frames:
        return 0
    dest = dest_root / app["slug"]
    dest.mkdir(parents=True, exist_ok=True)
    got = 0
    for i, f in enumerate(frames, 1):
        ts = float(f["timestamp"])
        out = dest / f"{i:03d}-{ts:07.1f}s.webp"
        if out.exists():
            got += 1
            continue
        try:
            r = requests.get(f["screen"], headers=H, timeout=30)
            if r.status_code == 200 and len(r.content) > 500:
                out.write_bytes(r.content)
                got += 1
            else:
                print(f"    !! {r.status_code} {f['screen']}", file=sys.stderr)
        except Exception as e:
            print(f"    !! {type(e).__name__}", file=sys.stderr)
        time.sleep(0.15)
    # The timeline, including the frames that were not downloadable, so the
    # notes can say what the capture contained rather than only what is here.
    (dest / "timeline.json").write_text(json.dumps({
        "name": app["name"],
        "slug": app["slug"],
        "developer": (app.get("developer") or {}).get("name"),
        "revenue_monthly_estimate": app.get("revenue"),
        "downloads_estimate": app.get("downloads"),
        "released": app.get("released"),
        "onboarding_step_count": (app.get("avs") or {}).get("onboarding_step_count"),
        "has_onboarding_with_quiz": (app.get("avs") or {}).get("has_onboarding_with_quiz"),
        "paywall_type": (app.get("avs") or {}).get("paywall_type"),
        "frames": [
            {
                "timestamp": float(f["timestamp"]),
                "labels": f.get("labels") or [],
                "free": not f.get("is_blurry"),
            }
            for f in sorted(app.get("replays") or [], key=lambda x: float(x["timestamp"]))
        ],
    }, indent=1))
    return got


def main():
    apps = json.loads((DATA / "catalogue.json").read_text())
    by_slug = {a["slug"]: a for a in apps}

    # Apps whose whole capture is free. These are the ones that can be read as
    # a flow rather than as an opening.
    full = sorted(apps, key=lambda a: -len(clear_frames(a)))
    full = [a for a in full if len(clear_frames(a)) >= 20][:8]

    print("full flows:", file=sys.stderr)
    for a in full:
        n = fetch(a, ROOT / "flows-full")
        print(f"  {a['name'][:40]:42} {n} frames", file=sys.stderr)

    # Named comparators: the quiz-archetype apps the brief calls out, plus the
    # highest-revenue quiz onboardings in the sample. Four frames each, which
    # is the opening and nothing more — recorded because how a flow opens is
    # the part of it Wrenchy's own funnel says is failing.
    wanted = [
        "cal-ai-calorie-tracker", "impulse-brain-training",
        "inflow-adhd-cbt-based-program", "arise-ai-gamified-workouts",
        "mindflow-ai-overcome-adhd", "riseguide-top-expert-insights",
        "simple-habit-sleep-meditation", "melba-couples-intimacy",
    ]
    print("openings:", file=sys.stderr)
    for slug in wanted:
        app = by_slug.get(slug)
        if not app:
            print(f"  -- {slug} not in catalogue", file=sys.stderr)
            continue
        n = fetch(app, ROOT / "flows-opening")
        print(f"  {app['name'][:40]:42} {n} frames", file=sys.stderr)


if __name__ == "__main__":
    main()
