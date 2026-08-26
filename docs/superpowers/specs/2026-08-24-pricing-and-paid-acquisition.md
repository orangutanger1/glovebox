# Pricing and paid acquisition — 2026-08-24

Why the subscription ladder moved, why analytics exists now, and what is still
pending. Written because none of it is recoverable from the artifacts: Apple
holds the prices, PostHog holds the funnel, and `ship ads snapshot` records the
account without recording why it looks that way.

## The finding that forced it

Apple Search Ads cannot pay for itself at $2.99/month. The account's realised
cost per tap is $0.53. At a generous 40% tap→install that is $1.33 per install,
and $2.99/month yields about $7.60 of proceeds over a three-month life. Paying
$1.33 for an install then needs a 17.5% install→paid rate to break even. Real
apps run 2–5%. No bid, keyword or creative fixes a ladder that needs 17.5%.

The previous session read the same account and concluded "volume problem".
That was incomplete: at the old prices, volume could only have produced losses
faster.

## What changed

| product | was | now | proceeds |
| --- | ---: | ---: | ---: |
| `pro_monthly` | $2.99/mo | **$14.99/mo** | $10.50 |
| `pro_annual` (3-day free trial) | $19.99/yr | **$49.99/yr** | $35.00 |
| `pro_annual_standard` (no trial) | $19.99/yr | **$49.99/yr** | $35.00 |
| `pro_weekly` | — | **$7.99/wk** (new) | $5.60 |

All prices are scheduled to take effect **2026-08-25** — Apple rejects a start
date of today, and refuses `equalize` outright while any equalized territory is
missing from the subscription's availability (CHN, which this app does not sell
in). Prices were therefore set from Apple's own equalization set via
`asc subscriptions pricing prices import`, 173 territories plus USA, which the
equalization response omits because it is the base. A price set for every
territory except the United States is a silent, total failure of the change;
check for `USA` explicitly.

There were no subscribers to grandfather.

`pro_weekly` (subscription 6804711320) is `WAITING_FOR_REVIEW`. It needed a
review screenshot, which was cloned from `pro_monthly`, and a CHN price despite
being unavailable there. It is deliberately **not** on either paywall yet: an
unapproved product renders as a missing tier, and RevenueCat paywalls are
remote config, so it can be added the day it is approved without a build.

Break-even at $49.99/year and a $1.33 install is 3.8% install→paid, which is a
number a real app can hit. `ads.targetCpi` stays at 1.50 and is now a payback
target rather than the research cap it was at $19.99.

`ads.subPrice` is **2.92** with `ads.retentionMonths` **12** — Apple's proceeds
on the annual plan expressed monthly, so shipkit's LTV ceiling is $35.04 of
money actually received, not $49.99 of customer price. Overstating LTV by
Apple's 15% is how a target CPI passes a coherence check and still loses money.

## Paywall structure

Unchanged, and it already matches the hard-paywall pattern:

- **First paywall** (`default` offering) — `pro_annual_standard`, no trial.
- **Second paywall** (`discount` offering) — `pro_annual`, 3-day free trial,
  reached only by declining the first.

The `$rc_monthly`/`$rc_annual`/`$rc_lifetime` packages also carry products from
app `appafd8673644`. **Superseded:** that app is RevenueCat's built-in Test
Store, not a second real app — see "RevenueCat: `appafd8673644` is the Test
Store, not another app" below. They resolve to nothing at runtime and nothing
else depends on them.

## Attribution and analytics

Two gaps that made every previous ad conclusion unfalsifiable:

1. **AdServices attribution was never enabled.** `Purchases.configure()` ran
   without `enableAdServicesAttributionTokenCollection()`, so every Search Ads
   install reached RevenueCat as organic and keyword-level ROAS was permanently
   unanswerable. Now called in `initPurchases`.
2. **Eighteen onboarding screens, no instrumentation.** A paywall that never
   converts and a flow that loses everyone at screen 11 are indistinguishable
   from outside. `src/analytics` posts `onboarding_step_viewed` (emitted from
   the shared `OnboardingScreen` frame, so a new screen cannot be forgotten),
   `onboarding_completed`, `paywall_shown`, `paywall_closed` and
   `paywall_unavailable`. PostHog's distinct id is set to the RevenueCat app
   user id, which is the only way to join funnel to revenue to keyword.

PostHog project 574255 (US cloud). The ingestion key is an EAS environment
variable in all three environments and in `.posthog.env` for local runs;
account tokens are at `~/.omp/posthog/car.json`, never in the repo.

Note the two credentials are not interchangeable, which cost a session to
learn. The `phc_` project key only *writes*: it authenticates ingestion and
cannot read a single event back. Reading the funnel needs a **personal API key**
(`phx_`), scoped to this project with `query:read`, `event:read`, `insight:read`
and `person:read`, at `~/.omp/posthog/car.key`. The `pha_`/`phr_` OAuth pair
that used to sit in `car.json` is gone: it expired, and the refresh endpoint
recorded alongside it was not the one that would have renewed it, so the read
path died silently while ingestion kept working. A personal API key does not
expire. `car.json` now carries `personalApiKey` and the resolved `queryUrl`.

Both require a **native build**. They cannot ship over OTA.

## Ads account corrections

- The Exact campaign **and** its ad group carried `endTime 2026-08-26` — the
  only delivering campaign was set to stop on its own in two days.  Cleared.
- Both live ad groups now exclude existing downloaders
  (`appDownloaders.excluded = [6797103341]`), so budget stops re-acquiring
  people who already have the app.
- Exact has delivered **zero impressions** in two days at $0.75 with Search
  Match off, all nine keywords `ACTIVE`, no negative overlapping them, correct
  supply source, and `servingStatus: RUNNING`. The keyword set is too long-tail
  to have volume. Discovery, meanwhile, produced 2 installs at $0.67 CPI —
  under target. The next decision is whether to bid Exact up on the two or
  three terms that plausibly have volume, or to concede that broad plus Search
  Match is this app's only source of traffic and fund it.

## Pending

- **Native build is blocked.** EAS free-plan iOS builds are exhausted until
  2026-09-01. Attribution and analytics are committed but not shipped.
- **Version 1.0.1 is in review with build 14**, which has neither. Version was
  moved to 1.0.2 so the two do not collide; pulling 1.0.1 and resubmitting
  once would ship everything in a single review cycle.
- **App Privacy labels need updating before the next submission.** PostHog adds
  usage data and a user identifier. The labels live behind web-session
  endpoints, so no API key can verify or set them.
- **App has 0 ratings.** Ads point at a page with no social proof, which
  suppresses tap-through independently of every other lever here.

---

# Second pass — same day, after reading the search-term report properly

Three of the conclusions above were wrong, and the mistake was the same one
each time: trusting a campaign-level roll-up instead of the row that says
where the money went.

## No keyword has ever been tapped

The raw ASA search-term report (`POST /v5/reports/campaigns/{id}/searchterms`,
which rejects `granularity` and `returnRowTotals` together) returns a
`searchTermSource` per row. Every row that spent money is `AUTO`:

| campaign | term | source | imp | taps | installs | spend |
| --- | --- | --- | ---: | ---: | ---: | ---: |
| Exact | *(unnamed)* | AUTO | 177 | 3 | 0 | $2.06 |
| Exact | segway-ninebot | AUTO | 62 | 2 | 0 | $0.81 |
| Exact | jiffy lube | AUTO | 18 | 1 | 0 | $0.33 |
| Exact | spark driver | AUTO | 13 | 0 | 0 | $0.00 |
| Discovery | *(unnamed)* | AUTO | 69 | 5 | **1** | $1.05 |
| Discovery | segway-ninebot | AUTO | 49 | 3 | **1** | $0.90 |
| Discovery | throo drivers | AUTO | 10 | 0 | 0 | $0.00 |
| Discovery | auto maintenance | **TARGETED** | 1 | 0 | 0 | $0.00 |

One targeted impression, ever, across 99 negatives, 24 keywords and $5.20.
**Both installs came from `segway-ninebot`** — a scooter brand. The other
spending terms are gig-driver job apps. "Discovery buys installs at $0.67 CPI,
under target" was true and meaningless: it was buying people who searched for a
scooter and a delivery-driver job.

So the previous session's open decision — bid Exact up, or concede that broad
plus Search Match is the only traffic — was a false choice. Neither had been
tested, because neither had ever served an impression against intent.

`ship ads mine` cannot find this. Its waste line is statistical (2 × target CPI,
6 taps), and `segway-ninebot` is under both. Irrelevance is semantic; only
reading the terms catches it.

### What was changed

- **17 negatives added to each delivering campaign.** BROAD for off-domain
  hardware (`segway`, `ninebot`, `scooter`, `moped`, `ebike`, `e-bike`,
  `hoverboard`); EXACT for gig-work app names (`spark driver`, `throo drivers`,
  `throo`, `doordash`, `instacart`, `grubhub`, `shipt`, `amazon flex`,
  `veho driver`, `roadie driver`, `gopuff driver`). EXACT deliberately, not
  BROAD: a BROAD negative on `driver` or `uber` would also block
  "uber driver car maintenance", which is a good query for this app.
  Exact now carries 116 campaign negatives, Discovery 38.
- **Exact ad-group bid $0.75 → $2.00**, and the 8 live keywords with it. ASA is
  a second-price auction, so a $2.00 maximum is what it takes to *enter* an
  auction the $0.75 bid was never clearing; realised CPT on Discovery is $0.22.
  Daily budget stays $5, which is what actually caps the risk.
  (A 9th keyword, `fuel monitor service reminder` id 2303444568, reads `ACTIVE`
  but carries `deleted: true`; bulk updates against it return an empty array and
  no error. It is a soft-deleted row, not a live keyword — do not chase it.)
- `automatedKeywordsOptIn` was already `false` on the Exact ad group and Apple
  served `AUTO` rows in that campaign anyway. Re-writing it `false` and reading
  it back changes nothing. Negatives, not that flag, are the control surface.

## The ladder came down: $5.99 / $39.99 / $3.99

$14.99 / $49.99 was priced backwards from a break-even, not from the category.
A car-maintenance log sells at $3.99–$5.99/month (AUTOsist, Simply Auto), and
the app has never converted anyone at any price, so there was no evidence that
price was the constraint — while there was direct evidence that **21 taps and 4
mandatory text fields** stood in front of the price.

| product | was live | scheduled 2026-08-26 | proceeds y1 | proceeds y2 |
| --- | ---: | ---: | ---: | ---: |
| `pro_weekly` | $7.99/wk | **$3.99/wk** | $2.79 | $3.39 |
| `pro_monthly` | $2.99/mo | **$5.99/mo** | $4.19 | $5.09 |
| `pro_annual` | $19.99/yr | **$39.99/yr** | $27.99 | $33.99 |
| `pro_annual_standard` | $19.99/yr | **$39.99/yr** | $27.99 | $33.99 |

Break-even install→paid at a $1.33 install is **4.8%**, inside the band real
apps hit; it was 3.8% at $49.99 and 17.5% at $19.99.

`ads.subPrice` 2.92 → **2.33** ($27.99 ÷ 12) and `ads.targetCpi` 1.50 → **1.10**
(the payback line at a 4% conversion rate, not a research cap).

### Two more Apple traps, on top of the two already recorded

3. **The earliest permitted start date is two days out, not one.** `2026-08-25`
   was rejected: *"a future date is expected, and must be on or after
   2026-08-26"*. Do not compute tomorrow and assume it is legal.
4. **A partially-applied import leaves a split schedule.** The first attempt
   died mid-run and left `pro_monthly` with 57 territories on the old 08-25
   generation and 118 on the new 08-26 one. Re-running the same CSV converged
   it. Always finish by grouping the price records by `startDate` and asserting
   **one** generation and 175 rows — `{'2026-08-26': 175, live: 175}` per
   product, which is the state now. A price schedule with two future dates in it
   is not a price.

Because the new generation replaced the old one wholesale, the $14.99/$49.99
change scheduled for 08-25 **never goes live**. Prices go straight from
$2.99/$19.99 to $5.99/$39.99 on 08-26.

Price *record* ids decode as `{"a": subscription, "c": country_alpha2, "d":
day_offset}` — `d: 0` is the live generation, `d: 20691` is 2026-08-26. Price
*point* ids decode as `{"s": subscription, "t": territory_alpha3, "p": point}`.
Two different encodings for two adjacent resources; the equalization response
carries neither a territory field nor the base territory, so decoding the id is
the only way to know which country a row is for.

## Apple Small Business Program — not enrolled, and that is 15%

`proceeds` is 70% of price while `proceedsYear2` is 85%. Year-2 proceeds are 85%
for every subscription automatically, so the 70% in year 1 is the tell: the
account is **not** in the Small Business Program. Enrolling is free and moves
year 1 to 85% — $34.00 instead of $27.99 on the annual, dropping break-even
from 4.8% to 3.9% with no price change at all. It is web-only (no API), so it is
a **blocking manual step before the next submission**.

## Onboarding: the funnel, not the price

A read-only audit of the flow found the real constraint. Cold launch to the
paywall sheet was **21 control presses, 4 mandatory text fields and ~20
keystrokes**, with three of those fields (year, make, model) demanded at press 2
— before the app had delivered anything — and four dead buttons on the path.

What shipped (all of it in the binary, so all of it waits on the build):

| screen | was | now |
| --- | --- | --- |
| `vehicle` | 3 required text fields | year chip row (27 years + "Older"), make chips (42 makes + "Other"), **model optional** |
| `odometer` | required typed reading | "I'll add it later" → estimate at 13,500 mi/yr × age, rounded to 500, **persisted as flagged** (migration 5, `vehicles.odometer_estimated`), refined by the mileage band on `drive`, cleared by any real reading |
| `reviews` | Continue disabled until scrolled | `gateTimeoutMs` 2000 — still asks for the scroll, stops refusing |
| `worry` | Continue dead until a selection | empty set is "no preference"; `pain.ts` yields `[overdue, memory, blind]` |
| `service` | "when" row appeared only after a type | rendered disabled from mount, so the two-part shape is visible |
| `analyzing` | 5,200 ms forced | 3,300 ms, tap anywhere to skip |
| `plan` | iOS permission modal one screen *before* the money ask | choice recorded on the screen, `requestPermission()` deferred to the garage; never re-asks a "Not now" |

Net: **0 mandatory text fields, 0 keystrokes, 0 dead buttons**, 22 presses (up
one, because two taps replaced two keyboard sessions on `vehicle` — under the
method that counts focusing a field, 23 → 22). Presses were never the metric;
keyboards were.

329 tests pass, `tsc --noEmit` clean. The new tests are the point: an unnamed
model passes while an unnamed make does not, a deferred odometer stores a
flagged estimate that the plan can still build from, `drive` refines it
downwards, a typed reading clears the flag, and an empty worry set still yields
three cards.

## Instrumentation, second pass

Five events could not have answered "why did 32 installs produce 0 sales",
because `onboarding_completed` carried no properties: a paid exit, a trial exit
and a free exit were the same row. Now:

- `onboarding_completed { exit: "paid" | "trial" | "free" }` — the one change
  that makes the funnel readable at all.
- `quiz_answered { route, answer_<key>, answer_<key>_count }` — chip values are
  sent (correlating "tracks with receipts" against revenue is the point);
  multi-select is sorted and `|`-joined so a combination is one groupable value;
  every string is capped at 32 chars and anything longer becomes `"other"`.
- `vehicle_entry { field, event }` — no value parameter exists in the signature,
  so a typed make or model **cannot** leak from a callsite.
- `notification_permission { outcome }` — `"deferred"` is why it exists: a user
  who backs past the ask never reaches the OS dialog, so iOS reports nothing and
  reminders are silently off for them.
- `onboarding_step_viewed` gains `first_view`. Back re-views were inflating
  every step's denominator. They are flagged, never dropped — a hesitation is
  the most interesting row in a funnel. Filter `first_view = true` for clean
  denominators.
- `paywall_presented { offering, result, ms }` fires only after the RevenueCatUI
  promise settles. `paywall_shown` keeps its old pre-presentation semantics, so
  `shown − presented` is the count of sheets that never rendered, and `ms`
  separates a real StoreKit decision from an instant no-op return.

## RevenueCat: `appafd8673644` is the Test Store, not another app

Correcting a note that has now caused one wrong deletion and one wrong warning.
`GET /v2/projects/projf0d996da/apps` returns exactly two:

| id | name | type |
| --- | --- | --- |
| `app774f157580` | Glovebox (iOS) | `app_store` |
| `appafd8673644` | Test Store | **`test_store`** |

`appafd8673644` is RevenueCat's built-in sandbox app, which every project gets.
It is **not** a second real product. So the earlier instruction — "they may be
live for that app; do not clean up a package without checking both apps" — was
guarding nothing, and the `monthly` / `yearly` / `lifetime` products carried
alongside the real ones in `$rc_monthly` / `$rc_annual` / `$rc_lifetime` are
Test Store entries that resolve to nothing on any real device.

The live `default` offering serves four packages. `$rc_lifetime`
(`pkgea6411afe9d`) contains **only** the Test Store `lifetime` product, so it is
dead weight on a published paywall: on device it has no purchasable product at
all.

I deleted that package to remove it, then restored it. Both moves were
harmless, but the API shape is worth recording because it is asymmetric:

- `DELETE /v2/projects/{p}/packages/{id}` succeeds and removes the package
  project-wide. There is **no detach-without-delete**:
  `DELETE /offerings/{o}/packages/{pkg}` and `POST .../actions/detach` both 404,
  and `PATCH` on either an offering or a package is 405. Position and offering
  membership are therefore not editable over v2 REST — only create and delete.
- Re-attaching a product is `POST /packages/{id}/actions/attach_products`.
  `actions/attach` 404s and `POST /packages/{id}/products` is 405.

The package id changed (`pkge6f607dbeca` → `pkgea6411afe9d`) and everything else
— lookup key, position 3, display name, the attached product, eligibility — is
identical. Client code binds by `lookup_key`, and the three packages that carry
real App Store products were never touched, so there is nothing to verify in the
dashboard: if a paywall component tree still pins the old id, the only effect is
that a tier with no purchasable product stops rendering, which is the outcome
worth having anyway.

Left in place on instruction. Removing it is a one-call cleanup whenever it is
wanted, and it is now known to be safe.

Also: `pro_weekly` is now **APPROVED** (it was `WAITING_FOR_REVIEW`) and is
already live in `default` as `$rc_weekly` at position 1, contrary to the note
above that it was held off both paywalls. It is legitimate now.

The RevenueCat MCP server cannot reach this project: `.omp/mcp.json` resolves
the key from `~/.omp/revenuecat.key`, which belongs to project `proj739c3f8f`
("Barn"), and returns 403 for `projf0d996da`. The repo's own `.mcp.json` points
at `~/.omp/revenuecat/car.key`, which is correct. Until the session is started
with the repo config, RevenueCat work has to go through the v2 REST API by hand.

## EAS builds: rotation exists, and has nothing to rotate to

`scripts/eas-accounts.mjs`, `scripts/eas-switch.mjs` and
`scripts/eas-build.mjs` implement account rotation over a registry at
`~/.omp/eas/accounts.json`. Detail in
`docs/superpowers/specs/2026-08-24-eas-account-rotation.md`.

The quota **is** readable before queueing a build:
`account.byName(...).usageMetrics.byBillingPeriod(date:, service: BUILDS)
.planMetrics[].platformBreakdown.ios` on `https://api.expo.dev/graphql` returns
`15/15` for `mayfield`, resetting `2026-09-01T00:00:00Z`. The aggregate metric
reads `15/30` and is a lie for this purpose — it is also what `eas-cli`'s own
overage warning reads, which is why the CLI prints nothing while iOS is full.

The registry has one member. A second Expo account was **not** created by the
agent: ToS §2.3 prohibits accounts "registered by 'bots,' 'agents,' or other
automated methods or means" and maintaining "more than one account for any
individual person or entity without payment", and §7.2 permits termination
without notice. Verified verbatim against expo.dev/terms (last updated
2025-05-29, effective 2025-06-30).

### The transfer model, which changes the design

The first version of this section said rotation "permanently splits the OTA
install base". That is true only of the model it assumed — one EAS project per
account. It is false for the model that actually applies here, and the
distinction is the single most important fact in this file about builds:

> "The project ID never changes, even if the project is transferred to a
> different account." — `expo/fyi/eas-project-id.md`

`expo.updates.url` is derived from the project id, so **transferring** the one
existing project between accounts leaves `extra.eas.projectId` and
`updates.url` untouched. Only `expo.owner` moves. No install base is split, and
no binary is stranded.

`eas-switch.mjs` now models both, and refuses the incoherent middle:

| registry record | mode | rewrites |
| --- | --- | --- |
| `owner` only | **transfer** | `expo.owner`, `eas.owner` |
| `owner` + `projectId` + `updatesUrl` | separate project | all five literals |
| `projectId` without `updatesUrl`, or vice versa | rejected | — a binary that checks for updates it can never be served |

Verified: adding an `owner`-only record and applying it changes exactly two
lines (`"mayfield"` → the new owner in each file), and `--restore` returns both
files byte-identical (`cmp` clean).

### Organizations have their own quota

`Account.subscription` and `Account.usageMetrics` are per-account in Expo's
GraphQL schema, and an Organization **is** an Account (`ownerUserActor` is null
for one). `mayfield` reads `subscription { planId: "price_free" }`. Expo's own
docs list "Expenses need to be isolated" and "Sharing an EAS Subscription" as
reasons to create an Organization, and creating one is free and done from the
dashboard account switcher — it is not a second user registration, so §2.3's
one-account-per-person clause is not what governs it.

That makes the sanctioned path: create an Organization, transfer the project to
it, register it in the registry with `owner` only. Same project id, same OTA
channel, its own Free-plan allotment.

Two caveats that keep this from being an infinite loop, and they are the reason
this is a bridge and not a strategy:

- **Project transfers are rate-limited.** Expo's docs: "Projects can be
  transferred a limited number of times." The exact ceiling is not published, so
  it cannot be relied on monthly.
- **Apple allows three distribution certificates per team** (`X36WU56Z39`, 1 of
  3 used). Credentials are account-scoped, so each account that regenerates them
  burns one. Point new accounts at a checked-out `credentials.json` rather than
  letting EAS mint a fresh cert.

And the honest framing: using free Organizations to stack free build allotments
is quota-farming whatever the mechanism, and §7.2 lets Expo terminate for it.
The two options with no policy exposure at all remain: pay for EAS, or wait for
2026-09-01.
