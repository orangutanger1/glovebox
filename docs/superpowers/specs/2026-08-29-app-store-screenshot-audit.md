# The App Store screenshots do not show this app

**2026-08-29.** Two separate problems, one live and one staged. Neither is a
taste question; both are accuracy questions, and one of them is an App Review
risk.

## 1. The live listing is pre-rebrand and shows a flow that no longer exists

Version 1.0.2 is `READY_FOR_SALE`. Its en-US listing carries **six** screenshots
and they are not the set in `store/screenshots/` — all four shared filenames
have different checksums, and two live frames have no local counterpart at all.
The third-pass local set has never been applied.

Frame 6 of the live set (`06-ScreenShotAppStore5.png`, caption "Take your data
anywhere.") was pulled and read. It shows:

- The wordmark **"Glovebox"** in the device art — "Done. Here is what Glovebox
  knows." The app is called Wrenchy. **The App Store is currently showing
  customers a different product name than the one they are installing.**
- An onboarding step indicator reading **"STEP 4 / 5"**. The flow has sixteen
  routes and has not had five steps since well before 1.0.2.
- A caption about data portability over a screenshot of an onboarding summary.
  The caption and the art are about different things.

The live frame 5 (`05-ScreenShotAppStore4.png`) is the onboarding setup shot the
third pass deliberately retired on the grounds that "set up in under a minute"
was never a reason to install.

**This is the more urgent of the two.** It is live, it is off-brand, and it
misrepresents the flow.

## 2. The staged set fixes the branding and introduces a false claim

`store/screenshots/` holds a five-frame third-pass set: 1242×2688, all sixteen
locales present, five frames each, no dimension drift, no text overflow or
caption-geometry problems found on inspection of en-US and de-DE. Technically
it is clean and it is correctly branded.

Frames 1-4 are accurate to the product:

| # | Caption | Shows | Verdict |
| --- | --- | --- | --- |
| 1 | Never Miss an Oil Change. | Overdue card, LOG A SERVICE | Accurate |
| 2 | Every Car in One Garage. | Three vehicles, statuses | Accurate (Pro) |
| 3 | Complete Service History. | History list | Accurate |
| 4 | Log Service in 10 Seconds. | What/When chips | Accurate — matches `vehicleForms.log.*` |

**Frame 5, "Maximize Resale Value.", shows a product that does not exist.** Its
device art contains:

- **"Vehicle Health: Excellent"** with a shield badge
- **"100% On-Time Score"**
- **"0 Pending Issues"**
- **"Verified Digital Logbook"**
- **"EXPORT PDF REPORT"**
- an "OVERVIEW" screen

Checked against the source: there is no `pdf` anywhere in `src/` or `app/` —
`src/export/share.ts` writes a `.csv` with `mimeType: "text/csv"` and that is
the only export path. None of "health", "on-time", "pending issues", "verified"
or "overview" appears in the i18n catalogue or the code. There is no such
screen.

Worse than absent: **a health score is an explicitly rejected product
decision.** `app/onboarding/results.tsx` states it in the file — the results
screen is "deliberately not a score", because "Your car's health is 62" is "a
number the app cannot honestly compute and the kind of gamification the design
language rules out". Frame 5 advertises the exact thing the product refused to
build, on purpose, for stated reasons.

Applying this set as it stands would put a fabricated capability on the store
listing. Beyond the review risk (metadata must accurately reflect the app), it
is the same failure the onboarding research flagged in competitors and rejected:
claiming something the product cannot do.

## What was done

**The staged set is now four frames.** `05-ScreenShotAppStore5.png` was deleted
from all sixteen locales, dropped from `frames` in
`store/screenshot-captions.json`, and its caption removed from every locale's
`captions` map (retained under `notes.retiredCaptions` for the trail).
`stage-locales.py --check` passes. The four remaining frames are accurate to the
shipped app and correctly branded.

The raw is kept at `store/screenshots-raw/en-US/IPHONE_65/ScreenShotAppStore5.png`
because it is the source art and deleting it would only hide the mistake — but
**it must not be re-staged as it stands.** The fabrication is in the base art,
not the localisation, so re-rendering the locales was never going to fix it.

## What is still blocked, and why

**The live listing is not fixed and cannot be fixed from here.** Version 1.0.2
is `READY_FOR_SALE`, and a live version's screenshots are frozen — changing them
requires creating a new App Store version and putting it through review, even
with no binary change. That is an App Review submission, which is explicitly out
of scope without instruction.

So the "Glovebox" wordmark and the "STEP 4 / 5" onboarding shot remain on the
storefront until someone decides to ship a metadata update. The four-frame set
is staged and ready for whenever that happens.

Two ways forward, both requiring that decision:

1. **Metadata-only version.** Create 1.1.0 in App Store Connect, attach the four
   frames, submit for review with no binary change. Fixes the branding without
   waiting on the app.
2. **Ride along with the next release.** Whenever 1.1.0 ships for real, the
   screenshots go with it. Cheaper, but the wrong app name stays live longer.

If the resale angle is wanted back as a fifth frame, the honest version is the
CSV export and the complete service history — a full record genuinely is worth
money at resale, and the app genuinely produces one. That needs new device art
from the Figma source (`store/figma-geometry.json`); it cannot be authored from
the running app, because the frames are baked images rather than captures.

## Not checked

- Whether the other fifteen live locales match en-US's stale six-frame set.
  Only en-US was pulled. The local set is consistent across all sixteen, so the
  live set most likely is too, but it was not verified.
- The live frames 1-4 were not individually read; the checksum mismatch and
  frame 6's contents are enough to establish the set is pre-rebrand.
