#!/usr/bin/env python3
"""Pull App Store reviews for competitor apps, isolate complaints."""
import json
import re
import sys
import time
import urllib.request
from collections import Counter

RSS = ("https://itunes.apple.com/us/rss/customerreviews/"
       "id={aid}/sortBy=mostRecent/page={page}/json")

APPS = {
    "CARFAX Car Care": 552472249,
    "Vehicle Maintenance Tracker": 1315913699,
    "Car Maintenance Reminders": 1617869280,
    "Fuelly: MPG & Service Tracker": 295905460,
    "Drivvo - Vehicle management": 1206041425,
    "My Car - Vehicle Manager": 1165749302,
    "Simply Auto: Mileage Tracker": 893278325,
    "Auto Care Kit": 1453344602,
    "AUTOsist Fleet Management": 897916520,
}


def fetch(aid, page):
    try:
        req = urllib.request.Request(RSS.format(aid=aid, page=page),
                                     headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=25) as r:
            data = json.loads(r.read().decode("utf-8", "replace"))
    except Exception as e:
        print(f"  !! {aid} p{page}: {e}", file=sys.stderr)
        return []
    entries = data.get("feed", {}).get("entry", [])
    if isinstance(entries, dict):
        entries = [entries]
    out = []
    for e in entries:
        if "im:rating" not in e:
            continue
        out.append({
            "rating": int(e["im:rating"]["label"]),
            "title": e.get("title", {}).get("label", ""),
            "body": e.get("content", {}).get("label", ""),
            "version": e.get("im:version", {}).get("label", ""),
        })
    return out


THEMES = {
    "price/paywall": r"\b(paywall|subscription|expensive|price|pricey|pay|charge|"
                     r"\$\d|per month|per year|free trial|scam|refund)\b",
    "ads": r"\b(ads?|advertis|popup|pop-up)\b",
    "data loss/sync": r"\b(lost|lose|deleted|disappear|sync|backup|restore|"
                      r"wiped|gone|export)\b",
    "reminders broken": r"\b(remind|notification|alert|notify|due)\b",
    "manual entry burden": r"\b(manual|tedious|type in|typing|enter every|"
                           r"time consuming|cumbersome|clunky|too many steps)\b",
    "multi-vehicle": r"\b(multiple (cars|vehicles)|second car|two cars|fleet|"
                     r"per vehicle|more than one)\b",
    "login/account": r"\b(log ?in|sign ?in|account|password|register|sign ?up)\b",
    "crash/bugs": r"\b(crash|freeze|froze|bug|broken|won'?t open|glitch|error)\b",
    "UI confusing": r"\b(confusing|complicated|hard to|not intuitive|"
                    r"can'?t figure|unclear|clunky)\b",
    "fuel/mpg": r"\b(mpg|fuel|gas|mileage|odometer)\b",
    "receipts/cost": r"\b(receipt|cost|expense|spend|invoice|record of)\b",
}


def main():
    all_rev = {}
    for name, aid in APPS.items():
        revs = []
        for p in range(1, 9):
            got = fetch(aid, p)
            if not got:
                break
            revs.extend(got)
            time.sleep(0.5)
        if not revs:
            print(f"SKIP {name} (no data)", file=sys.stderr)
            continue
        all_rev[name] = revs
        print(f"{name}: {len(revs)} reviews", file=sys.stderr)

    json.dump(all_rev, open("reviews.json", "w"), indent=1)

    for name, revs in all_rev.items():
        low = [r for r in revs if r["rating"] <= 3]
        print(f"\n{'='*70}\n{name}: {len(revs)} pulled, {len(low)} are 1-3 star "
              f"({100*len(low)//max(len(revs),1)}%)")
        c = Counter()
        for r in low:
            txt = (r["title"] + " " + r["body"]).lower()
            for theme, pat in THEMES.items():
                if re.search(pat, txt):
                    c[theme] += 1
        for theme, n in c.most_common():
            print(f"   {n:3}  {theme}")


if __name__ == "__main__":
    main()
