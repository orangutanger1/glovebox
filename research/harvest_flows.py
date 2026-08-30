#!/usr/bin/env python3
"""
Harvest the ScreensDesign public catalogue.

Why this file exists: the first pass at competitive research collected App
Store screenshots, which are marketing frames chosen by the developer and not
the onboarding a user actually walks through. This reads the public
api.screensdesign.com catalogue instead, which records, per app, the real
captured flow: how many onboarding steps it has, whether those steps are a
quiz, what kind of paywall ends them, and a timestamped replay timeline whose
each screen carries a label ("onboarding", "paywall", ...).

Only what the site serves without authentication is read. Screens flagged
`is_blurry` are the site's paid tier and are recorded as metadata but never
downloaded.
"""
import json, sys, time, pathlib, urllib.parse
import requests

API = "https://api.screensdesign.com/v1"
H = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
    "Origin": "https://screensdesign.com",
    "Referer": "https://screensdesign.com/",
}
OUT = pathlib.Path(__file__).parent / "onboarding-competitive" / "_data"


def get(path, **params):
    """
    One GET, with the backoff the endpoint actually needs.

    It rate-limits at roughly forty requests a minute and answers 429 with no
    `Retry-After`, so the wait is exponential and generous: a 429 that is
    retried too eagerly extends the ban rather than clearing it. Everything
    else — a timeout, a reset connection — gets the same ladder, because at
    this size a slow harvest that finishes beats a fast one that has to start
    over.
    """
    url = f"{API}/{path}?{urllib.parse.urlencode(params)}"
    for attempt in range(6):
        try:
            r = requests.get(url, headers=H, timeout=45)
            if r.status_code == 200:
                return r.json()
            if r.status_code == 429:
                wait = 8 * (attempt + 1)
                print(f"  .. 429, sleeping {wait}s", file=sys.stderr)
                time.sleep(wait)
                continue
            print(f"  !! {r.status_code} {url} {r.text[:120]}", file=sys.stderr)
            return None
        except Exception as e:
            print(f"  !! {type(e).__name__} {url}", file=sys.stderr)
        time.sleep(3 * (attempt + 1))
    return None


def catalogue():
    """
    Every app, one page at a time.

    `page_size` is advisory: the endpoint returns 15 rows on page 1 and 6
    thereafter no matter what is asked for, so the page count cannot be
    computed up front and `next` is the only reliable terminator. `order` is
    left alone deliberately — every interesting sort (`-revenue`) answers 403
    "available to Pro workspaces", and the default order is stable enough to
    resume from.
    """
    out, seen = [], set()
    resume = OUT / "catalogue.json"
    if resume.exists():
        out = json.loads(resume.read_text())
        seen = {row["id"] for row in out}
        print(f"  resuming with {len(out)} apps already held", file=sys.stderr)
    page = 1
    while True:
        d = get("app-replays/", page=page)
        if not d:
            break
        for row in d["results"]:
            if row["id"] not in seen:
                seen.add(row["id"])
                out.append(row)
        if page % 25 == 0 or not d.get("next"):
            print(f"  page {page}: {len(out)}/{d['count']}", file=sys.stderr)
            # Checkpoint, so a ban or a Ctrl-C costs one page and not an hour.
            (OUT / "catalogue.json").write_text(json.dumps(out, indent=1))
        if not d.get("next"):
            break
        page += 1
        time.sleep(1.4)
    return out


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    apps = catalogue()
    (OUT / "catalogue.json").write_text(json.dumps(apps, indent=1))
    print(f"wrote {len(apps)} apps -> {OUT / 'catalogue.json'}", file=sys.stderr)


if __name__ == "__main__":
    main()
