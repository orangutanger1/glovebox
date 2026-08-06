#!/usr/bin/env python3
"""Expand the per-locale listings in store/staged/ into asc's canonical layout.

`asc metadata` reads two files per locale: `app-info/<locale>.json` carries the
name and subtitle (they belong to the app, not to a version) and
`version/<v>/<locale>.json` carries the description, keywords and promo text.
The listings are authored as one file per locale because a listing is one piece
of writing - splitting it by which App Store Connect resource owns which field is
a detail of the API, not of the copy.

Every field is length-checked here as well as by the agent that wrote it: an
over-length field is rejected by App Store Connect at push time, after the other
fifteen locales have already been written, which is the worst moment to find out.

    python3 store/stage-locales.py            # write the canonical files
    python3 store/stage-locales.py --check    # validate only, write nothing
"""
import json
import os
import sys

ROOT = os.path.dirname(os.path.abspath(__file__))
VERSION = "1.0"
LIMITS = {
    "name": 30,
    "subtitle": 30,
    "keywords": 100,
    "promotionalText": 170,
    "description": 4000,
}
# Copied from the en-US listing rather than repeated per locale: the same policy
# and the same support form serve every market, and a typo in one of sixteen
# copies is a support URL nobody ever visits.
SHARED = json.load(open(os.path.join(ROOT, "app-info", "en-US.json")))
SHARED_VERSION = json.load(open(os.path.join(ROOT, "version", VERSION, "en-US.json")))


def check(locale, listing):
    problems = []
    for field, limit in LIMITS.items():
        value = listing.get(field, "")
        if not value:
            problems.append(f"{field} is empty")
        elif len(value) > limit:
            problems.append(f"{field} is {len(value)} chars, limit {limit}")
    if ", " in listing.get("keywords", ""):
        problems.append("keywords has a space after a comma, which wastes an index slot")
    if listing.get("locale") != locale:
        problems.append(f"declares locale {listing.get('locale')!r}")
    return problems


def main():
    check_only = "--check" in sys.argv
    staged_dir = os.path.join(ROOT, "staged")
    failed = False
    for filename in sorted(os.listdir(staged_dir)):
        if not filename.endswith(".json"):
            continue
        locale = filename[:-5]
        listing = json.load(open(os.path.join(staged_dir, filename)))
        problems = check(locale, listing)
        if problems:
            failed = True
            print(f"{locale}: " + "; ".join(problems), file=sys.stderr)
            continue
        print(
            f"{locale}: name {len(listing['name'])}, subtitle {len(listing['subtitle'])},"
            f" keywords {len(listing['keywords'])}, promo {len(listing['promotionalText'])},"
            f" description {len(listing['description'])}"
        )
        if check_only:
            continue
        app_info = {
            "name": listing["name"],
            "subtitle": listing["subtitle"],
            "privacyPolicyUrl": SHARED["privacyPolicyUrl"],
        }
        version = {
            "description": listing["description"],
            "keywords": listing["keywords"],
            "promotionalText": listing["promotionalText"],
            "supportUrl": SHARED_VERSION["supportUrl"],
        }
        for subdir, payload in (
            (os.path.join(ROOT, "app-info"), app_info),
            (os.path.join(ROOT, "version", VERSION), version),
        ):
            os.makedirs(subdir, exist_ok=True)
            with open(os.path.join(subdir, f"{locale}.json"), "w") as out:
                json.dump(payload, out, ensure_ascii=False, indent=2)
                out.write("\n")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
