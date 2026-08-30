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

## What to do

Both actions change a live storefront and are the user's call.

1. **Apply the staged set with frame 5 removed** — four frames, all accurate,
   correctly branded. This fixes the live "Glovebox" problem immediately and
   ships nothing false. Four screenshots is a complete listing.
2. **Or re-author frame 5 around something real.** The honest version of
   "Maximize Resale Value" is the CSV export and the complete history: a
   full service record is genuinely worth money at resale, and the app
   genuinely produces one. That claim needs no invented score. It requires
   device art this session cannot author faithfully — the frames are baked
   images from a Figma source (`store/figma-geometry.json`), not rendered from
   the running app.

**Do not apply `store/` as it stands.** `store/apply-when-ready.sh` will push
all sixteen locales, and the version is `READY_FOR_SALE`, so it lands on the
live listing.

## Not checked

- Whether the other fifteen live locales match en-US's stale six-frame set.
  Only en-US was pulled. The local set is consistent across all sixteen, so the
  live set most likely is too, but it was not verified.
- The live frames 1-4 were not individually read; the checksum mismatch and
  frame 6's contents are enough to establish the set is pre-rebrand.
