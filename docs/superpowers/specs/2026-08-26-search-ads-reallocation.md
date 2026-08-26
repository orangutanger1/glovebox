# Search Ads reallocation — 2026-08-26

Why $24 of $30/day was moved off objects that had never served an impression,
and the three diagnostics that are not recoverable from `snapshot.json`.

## Search Match was already off; the AUTO rows were history

`automatedKeywordsOptIn` is `false` on all 18 ad groups and has been since
2026-08-25T04:40. The toggle is traceable in the snapshot archive:
`snapshot-2026-08-24.json` has `DISC · US` at `true` (`mod 2026-08-24T14:18:18`),
`snapshot-2026-08-25.json` has it `false` (`mod 2026-08-25T04:40:09`).

The reason the account *looks* like Search Match is live is that the lifetime
search-term report still carries the pre-flip rows. Split by
`searchTermSource` **and** `granularity: DAILY` it resolves completely:

| date | campaign | AUTO imp / spend | TARGETED imp / spend |
| --- | --- | ---: | ---: |
| 08-23 | Discovery | 78 / $1.48 | 1 / $0.00 |
| 08-23 | Exact | 270 / $3.20 | — |
| 08-24 | Discovery | 76 / $0.52 | — |
| 08-25 | Discovery | 1 / $0.00 | 2 / $0.00 |
| 08-26 | Discovery | **0** | **132 / $3.08** |
| 08-26 | Exact | 0 | 2 / $0.00 |

$5.20 of $9.31 lifetime spend is dead Search Match money that cannot recur.
08-26 is the first clean day and it is the best one: 132 targeted impressions,
3 installs, $3.08 → **$1.03 CPI against a $1.10 target**, from `auto maintenance`
BROAD and `auto maintenance log` EXACT.

The 270 AUTO impressions in Exact on 08-23 came from `EX · maintenance intent · US`,
which reads `false` in the 08-24 snapshot. The flip happened *inside* 08-23 (all
15 EX ad groups carry `mod 2026-08-23T23:22:5x`) and the report is daily-granular,
so the AUTO spend precedes the flip within its own row. Apple did not ignore the
flag.

## Competitor and Brand: nothing was misconfigured

Every gate that can suppress delivery was clean before the change:
`ENABLED`/`RUNNING`, `servingStateReasons: null`, `adChannelType: SEARCH`,
`supplySources: [APPSTORE_SEARCH_RESULTS]`, all keywords `ACTIVE`/`deleted: false`,
Brand with **0** campaign negatives and Competitor with **1** (`wrenchy`, which
matches none of its own terms). A subset check of Exact's 116 negatives against
its 15 targeted terms found **no self-blocks**.

Four real causes, in order of size:

1. **Zero share of voice.** A SOV custom report (US, adamId 6797103341,
   `LAST_WEEK`) completes with a header row and **zero data rows** — the app has
   no ranked appearance against any US search term. `POST /custom-reports`
   accepts only `countryOrRegion` and `adamId` in its selector; filtering by
   `searchTerm` is rejected with `INVALID_CONDITION_INPUT`.
2. **Brand bids on a word nobody types.** 4 keywords, 3 days, 0 impressions,
   $3/day reserved, against 10 installs and 0 ratings. There is nothing to defend.
3. **12 of 15 Competitor ad groups were under 20 hours old** (`start 2026-08-26T02:28`).
   The three with tenure had 0 impressions in 3 days.
4. **Nine competitor names have no search volume**, and EXACT match on an obscure
   app name means the literal string or nothing.

And one structural bug: `vehicle maintenance tracker` EXACT was targeted twice for
the same app — `Competitor/COMP · vehicle maintenance tracker` at $0.75 and
`Exact/EX · vehicle maintenance tracker` at $0.77. Apple serves the higher bid, so
the Competitor copy could never win. It is not a competitor term anyway.

## The $2.00 Exact bid test never ran

The 2026-08-24 spec records "Exact ad-group bid $0.75 → $2.00". The object holding
$2.00 is `EX · maintenance intent · US` (2150494927) and it is **PAUSED**
(`AD_GROUP_PAUSED_BY_USER`). The 15 live EX ad groups are at $0.68–$0.78 and have
produced 3 targeted impressions in 4 days.

That ad group also holds duplicates of 8 keywords already live elsewhere in the
same campaign (`auto maintenance log`, `oil change reminder`, `car maintenance tracker`,
`auto maintenance tracker`, `vehicle maintenance log`, `car maintenance reminder`,
`free car maintenance tracker`, `car maintenance log`). **Enabling it as-is makes
the campaign bid against itself on all eight** — it has to be enable-one /
pause-the-other, never enable.

Shape of the evidence: one BROAD keyword at $0.75 produced 69 impressions, 4 taps
and 2 installs while 15 EXACT ad groups at the same bid produced 3 impressions.
At this app's volume, BROAD is where the auctions are.

## What was applied

| change | from | to |
| --- | ---: | ---: |
| Discovery daily budget | $6 | **$15** |
| Competitor daily budget | $9 | **$4** |
| Brand daily budget | $3 | **$1** |
| Brand ad-group + 5 keyword bids | $0.81 | **$0.30** |
| Competitor ad groups live | 15 | **6** (9 paused) |
| Kept Competitor bids (drivvo, fuelio, fuelly, autosist, simply auto, carfax car care) | $0.75 | **$1.50** |
| Discovery keywords | 15 | **18** (`car maintenance`, `service reminder`, `oil change`, all BROAD @ $0.75) |
| Discovery negatives | 44 | **47** (`auto clicker` EXACT, `autozoners` EXACT, `rockauto` BROAD) |

Exact was left alone deliberately: its problem is 15 single-keyword EXACT ad groups
against mid-tail volume, not its bids. Total authorised is $32/day, and budget has
never been the binding constraint — the best day spent $4.11 of $30.

The three new negatives had **38 impressions and $0.00 spend**, so
`ship ads mine` cannot find them: its waste line is statistical (2 × target CPI,
6 taps) and zero-spend leakage is under both thresholds. Same blind spot that hid
`segway-ninebot`.

**The competitor bid raise is a volume purchase at unknown CPT.** Break-even is
CPT ≤ $0.47 at the observed 43% tap→install (7 taps → 3 installs on 08-26). ASA is
second-price so realised CPT usually lands well under the maximum, but the $4/day
campaign cap is what actually bounds the risk. Kill it if CPT exceeds $0.60 over
the first 20 taps.

## Two levers with no API surface

- **0 ratings.** Suppresses TTR on every impression Apple does serve, independently
  of bid and keyword.
- **0 Custom Product Pages.** `GET /apps/6797103341/custom-product-pages` → 404.
  With `ads` count 0 in all four campaigns and one `DEFAULT_PRODUCT_PAGE` creative
  (4031850, `VALID`), there is no creative lever at all. Note that ads count 0 is
  *not* a delivery blocker — search-results campaigns auto-serve the default page,
  and Discovery proves it by delivering with zero ads.

## `ship ads sync` notes

`--adopt` records Apple object ids into `campaign-plan.json` but **does not adopt
live values**: after running it the plan still read Discovery $6 / Competitor $9 /
Brand $3 with all 15 COMP ad groups, so a later `--force` would have reverted
everything. The plan's desired values had to be edited directly. It also refuses to
run at all while a live keyword is missing from the plan ("3 live object(s) are not
in the plan"), which is correct and is why the three new BROAD keywords were added
to the plan first.

`campaign-plan.md` was stale, and the reason was a shipkit gap rather than a
choice: it is generated by `ship ads plan`, which rebuilds the whole plan from
`aso/en-US/scored.json` and would have discarded everything above, so there was
no way to refresh the document without destroying the state it documented. It was
briefly hand-edited, which is drift waiting to happen in a generated file.

**Fixed in shipkit** (`src/commands/ads.mjs`):

- `ship ads plan --render` rewrites `campaign-plan.md` from the
  `campaign-plan.json` on disk. No scores, no credentials, no replan.
- `ship ads plan` now **refuses** to overwrite a plan carrying Apple object ids
  (`planBindings()` — 71 of them here) and names `--render` / `--force` /
  `sync --dry-run` in the refusal. `--force` replans anyway and keeps the previous
  plan as `campaign-plan.prev.json`.
- The rendered summary is derived from the campaigns (`planTotals()`), not from the
  stamped `params`. The first `--render` run exposed the bug that motivated it: the
  header read `$30.00/day` above campaigns totalling `$32.00`, because a hand edit
  updates campaigns and never the params block. When the two disagree the document
  now says the params are historical.

So the Markdown is generated again, and accurate: `ship ads plan --render` produced
the current copy, and the hand-written narrative lives here instead — which is where
it belonged. `campaign-plan.json` was also renormalised to tab indent, the format
`writeArtifact` writes, after a `jq` pass had left it two-space.

`ship ads sync --dry-run` reports "nothing to do — the account already matches the
plan".
