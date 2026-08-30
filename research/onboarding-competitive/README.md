# Competitive onboarding research

Read `patterns.md` first. It is the synthesis; everything else is its evidence.

## What is in here, and what each thing can be used for

| Path | What it is | What it supports |
| --- | --- | --- |
| `patterns.md` | Ten patterns, each with a verdict for Wrenchy | The conclusions |
| `flow-statistics.md` | Aggregates over 1,800 captured flows | "Is this unusual" |
| `_data/catalogue.json` | The raw harvest | Re-analysis |
| `flows-full/` | Apps whose whole capture is free, read frame by frame | "How is this built" |
| `flows-opening/` | First four frames of named comparators | How a flow opens |
| `habit-loop/`, `quiz-archetype/`, `paywall-and-post-purchase/` | **App Store screenshots** | Storefront positioning only |

## The distinction that matters

`flows-full/` and `flows-opening/` hold **real onboarding screens** — frames
from a capture of someone walking the actual installed app, with timestamps and
labels.

`habit-loop/`, `quiz-archetype/` and `paywall-and-post-purchase/` hold **App
Store screenshots**: the marketing frames a developer chooses for the store
listing. They are not onboarding and must never be read as a flow. They were
collected in an earlier pass under that misapprehension and are kept because
they are genuinely useful for one thing — what this category claims about
itself in the storefront, which is positioning evidence for Wrenchy's own
screenshots.

## Provenance and limits

Everything was read from `api.screensdesign.com`, which serves this catalogue
without authentication. Each replay frame carries an `is_blurry` flag: false
means the site serves the real screen to anyone, true means it is behind their
paid tier. **Only the free frames were downloaded** — `research/fetch_screens.py`
filters on that flag, nothing logs in, and the full-length videos the app pages
embed were not touched. Most apps expose four frames; a handful expose their
whole capture, and those are what `flows-full/` contains.

Frames are watermarked by the source and are 288×623 — enough to read layout and
headlines, not always enough for body copy.

## Reproducing

```sh
python3 research/harvest_flows.py    # catalogue → _data/catalogue.json
python3 research/analyse_flows.py    # → flow-statistics.md
python3 research/fetch_screens.py    # → flows-full/, flows-opening/
```

The catalogue harvest rate-limits at roughly 40 requests/minute and answers 429
with no `Retry-After`; the script backs off and checkpoints, and re-running it
resumes. The last run held **1,800 of 2,633** apps — it gives up after six
consecutive 429s rather than hammering. Re-run to extend.
