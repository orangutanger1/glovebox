#!/usr/bin/env python3
"""Harvest App Store autocomplete suggestions across seed stems."""
import json
import re
import sys
import time
import urllib.parse
import urllib.request

HINTS = "https://search.itunes.apple.com/WebObjects/MZSearchHints.woa/wa/hints"
HEADERS = {
    "User-Agent": "iTunes-iPhone/12.0 (5; 16GB)",
    "X-Apple-Store-Front": "143441-1,29",
}


def hints(term):
    url = f"{HINTS}?{urllib.parse.urlencode({'clientApplication': 'Software', 'term': term, 'country': 'US'})}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            body = r.read().decode("utf-8", "replace")
    except Exception as e:
        print(f"  !! {term}: {e}", file=sys.stderr)
        return []
    # plist: pull <string> values that are terms (skip urls and the title)
    out = []
    for m in re.finditer(r"<key>term</key>\s*<string>(.*?)</string>", body, re.S):
        out.append(m.group(1).strip())
    return out


SEEDS = [
    # health
    "sleep t", "sleep tr", "habit t", "workout p", "food lo", "calorie s",
    "period t", "water re", "medicine r", "symptom t", "adhd", "anxiety t",
    # money
    "budget a", "subscription t", "bill re", "debt pa", "expense s",
    "net worth", "savings g", "receipt s", "split bi",
    # productivity
    "focus t", "pomodoro", "screen ti", "note a", "scanner p", "timer f",
    "reminder f", "checklist f", "password", "unit con",
    # home / life
    "grocery l", "meal pl", "chore t", "plant ca", "pet fe", "car mai",
    "moving ch", "packing l", "gift tr", "birthday r",
    # niche / odd
    "baby tr", "wedding p", "recipe s", "book tr", "movie tr",
    "gas mile", "tip cal", "shift w", "mood tr", "gratitude j",
    "dream j", "decision", "white noi", "stretch r", "posture r",
]


def main():
    seen = {}
    for s in SEEDS:
        got = hints(s)
        print(f"[{s}] -> {len(got)}", file=sys.stderr)
        for t in got:
            seen.setdefault(t, []).append(s)
        time.sleep(0.35)
    json.dump(seen, open("candidates.json", "w"), indent=1)
    print(f"\nTOTAL UNIQUE: {len(seen)}")
    for t in sorted(seen):
        print(t)


if __name__ == "__main__":
    main()
