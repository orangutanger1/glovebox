#!/usr/bin/env python3
"""Score candidate keywords: competition strength from live iTunes search API."""
import json
import re
import statistics
import sys
import time
import urllib.parse
import urllib.request

SEARCH = "https://itunes.apple.com/search"

BRAND_NOISE = re.compile(
    r"readdle|tempur|apple watch|virtuox|sleeper|sleep number|company|game|puzzle|"
    r"academy|police|legacy|chess|singing|whiskey|pro for vendors|"
    r"^[a-z]+:|—|·", re.I)

STOP_SUFFIX = re.compile(r"\b(free|pro|app|apps)\b\s*$", re.I)


def api(term):
    url = f"{SEARCH}?{urllib.parse.urlencode({'term': term, 'country': 'us', 'entity': 'software', 'limit': 10})}"
    for attempt in range(3):
        try:
            with urllib.request.urlopen(url, timeout=25) as r:
                return json.loads(r.read().decode("utf-8", "replace"))["results"]
        except Exception as e:
            if attempt == 2:
                print(f"  !! {term}: {e}", file=sys.stderr)
                return None
            time.sleep(4)
    return None


def pick_candidates(raw):
    out = []
    for t in raw:
        t = t.replace("&amp;", "&").strip().lower()
        if BRAND_NOISE.search(t):
            continue
        if "&" in t or ":" in t or "-" in t:
            continue
        words = t.split()
        if not (2 <= len(words) <= 3):
            continue
        if STOP_SUFFIX.search(t):
            continue
        out.append(t)
    return sorted(set(out))


def score(term, results):
    """Competition metrics for a keyword."""
    if not results:
        return None
    titles = [r.get("trackName", "").lower() for r in results]
    exact = sum(1 for x in titles if term in x)
    counts = [r.get("userRatingCount", 0) or 0 for r in results]
    weak = sum(1 for c in counts if c < 1000)
    paid = sum(1 for r in results if (r.get("price") or 0) > 0)
    return {
        "keyword": term,
        "exact_title_matches": exact,
        "median_ratings": int(statistics.median(counts)),
        "max_ratings": max(counts),
        "weak_apps_top10": weak,
        "paid_top10": paid,
        "top3": [
            {
                "name": r.get("trackName"),
                "id": r.get("trackId"),
                "ratings": r.get("userRatingCount", 0) or 0,
                "stars": r.get("averageUserRating"),
                "seller": r.get("sellerName"),
            }
            for r in results[:3]
        ],
    }


def main():
    raw = list(json.load(open("candidates.json")).keys())
    cands = pick_candidates(raw)
    print(f"filtered {len(raw)} -> {len(cands)} candidates", file=sys.stderr)
    scored = []
    for i, t in enumerate(cands):
        res = api(t)
        if res is None:
            continue
        s = score(t, res)
        if s:
            scored.append(s)
        print(f"{i+1}/{len(cands)} {t}: exact={s['exact_title_matches']} "
              f"med={s['median_ratings']} weak={s['weak_apps_top10']}", file=sys.stderr)
        time.sleep(1.1)
    json.dump(scored, open("scored.json", "w"), indent=1)
    print(f"\nwrote {len(scored)} scored keywords")


if __name__ == "__main__":
    main()
