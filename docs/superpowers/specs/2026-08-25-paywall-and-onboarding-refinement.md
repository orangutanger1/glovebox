# Prompt — refine the Wrenchy paywall and the onboarding ladder that feeds it

Hand this whole file to the implementing agent. It is self-contained.

## Context you need before touching anything

Wrenchy (`com.idea6.carmaintenancelog`, ASC app `6797103341`) is a car-maintenance
log with a hard paywall. It has **32 customers, 0 trials, 0 subscriptions, $0
revenue, $0 MRR**. Apple Search Ads is live at $10/day across four US campaigns
and has bought 2 installs. Install→paid is 0.00%, so nothing currently knows what
an install is worth.

There is **no funnel telemetry yet**. `src/analytics` is wired to PostHog
(project 574255) but has only ever emitted one `wiring_check` event, because the
native build carrying it has not shipped. Do not claim any conversion diagnosis
is data-backed; it is not. Everything below is reasoning from a reference
standard plus code reading.

The reference standard is a published breakdown of a paywall that converted at
~10%. Its five sections, in its own words:

1. **Social proof** — reviews, testimonials. *Only if you have it.*
2. **Sell the vision, not the product** — this is lifestyle advertising. People
   only care how it makes them **feel**.
3. **Explain key product features** — the **IMPACT** of the product.
4. **Pricing** — research your niche. Defaults $49.99/y, $14.99/m, $7.99/w.
   A/B test your paywalls.
5. **Motivational CTA** — *don't waste this on "Continue"*. If running a trial:
   "Try 7 days Free".

Its reference layout puts **yearly first and pre-selected**, badged
`Save 88% vs Weekly`, above monthly then weekly — three options, no more.

## Where things live

| thing | location |
|---|---|
| Pre-sheet argument screen | `app/onboarding/paywall.tsx` |
| Trial screen (2nd ask) | `app/onboarding/offer.tsx` |
| Free landing (3rd ask) | `app/onboarding/free.tsx` |
| Free/Pro boundary rows | `app/onboarding/help.tsx` (was its own `features` screen) |
| Ladder order | `src/onboarding/flow.ts` |
| English copy | `src/i18n/catalog/en/offer.ts` |
| RevenueCat project | `projf0d996da`, app `app774f157580`, entitlement `pro` |
| Default offering | `ofrng04c048e8ea` (current) |
| Discount offering | `ofrng18f692614a` (trial, annual only) |
| Paywall (default) | `pwd0fac0c9949848e4`, revision 31, published |
| Paywall (discount) | `pwff4d86dae7df4f4e`, revision 4, published |

The paywall itself is a **native RevenueCat sheet configured in the dashboard**.
The app screen in front of it is the argument; the sheet is the price list. Copy
that names a price must not live in the app — RevenueCat renders price and the
Apple-required disclosure, and hardcoding a number goes stale the moment someone
edits the offering.

Current live package order in `ofrng04c048e8ea`:

```
0  $rc_monthly    pro_monthly           $5.99/mo
1  $rc_weekly     pro_weekly            $3.99/wk
2  $rc_annual     pro_annual            $39.99/yr
3  $rc_lifetime   lifetime              one-time
```

Current English copy:

```
offer.paywall.title    "Your garage is ready."
offer.paywall.subtitle "The plan below is yours either way, and Pro is the rest
                        of the garage plus your own intervals."
offer.paywall.cta      "See Wrenchy Pro"
offer.paywall.caption  "One car, unlimited history and CSV export are free
                        forever, including after a cancelled subscription."
gauges                 Vehicle / Scheduled / Due now / Next up
```

## Findings to act on

**1. Social proof — absent, and that is fine.** The app is new and has few
ratings. Do **not** fabricate testimonials, invent user counts, or write "join
10,000 drivers". Leave section 1 out until real ratings exist. This is a
correctness constraint, not a stylistic one.

**2. Sell the vision, not the product — currently fails.** "Your garage is
ready. / The plan below is yours either way, and Pro is the rest of the garage
plus your own intervals." is a **feature-boundary explanation**: it tells the
user what they don't get. It is scoping, not desire.

The niche has strong feelings available and the copy uses none of them: never
getting talked into a repair you didn't need; the car making 200k; the resale
conversation where you hand over a complete log instead of a shrug; the 2am
"when did I last do the brakes" blank. **The user is not buying a database. They
are buying not being the person who ruined their engine.**

Direction, not final copy — write better if you can:

```
title:    "Cars don’t warn you. This does."
subtitle: "Every service, every mile, on record. The mechanic sees a log,
           not a guess."
```

**3. Features → impact — partial.** The four gauges show *data*, not
consequence. "Scheduled: 12" is a count; "3 services overdue" is impact.
Reframe each gauge so it names what it means for the user, while staying
factually derived from their own onboarding answers. Never invent a number.

**4. Pricing — structurally wrong and roughly half-priced.**

Three defects against the reference: annual is buried at position 2 with **no
anchor**, so nothing frames yearly as the deal; there are **four** options where
the reference uses three, and `$rc_lifetime` both adds decision friction and
caps LTV at a single payment; and the prices are far under
($5.99/mo vs $14.99, $3.99/wk vs $7.99, $39.99/yr vs $49.99).

Required: **reorder to annual-first and pre-selected, add a savings badge
computed against weekly, and remove or hide `$rc_lifetime` from the default
offering.** This is a dashboard change and ships without a build or a review —
it is the highest-leverage change available today, so do it first and
independently of the code work.

Price increases are a **separate decision with real refund and rating
consequences**; the reference itself warns against pushing yearly above $50.
Propose the new price ladder and the `store/pricing/*.csv` + ASC changes it
implies, but **do not change prices without explicit sign-off**. Note that
`ship.config.json` carries `ads.subPrice: 2.33`, which is what the bid model
uses to value an install; it must move in lockstep with any price change or
every future CPI target is computed against the wrong number.

**Signed off 2026-08-25 and applied.** The four ASC subscriptions were moved to
the ladder above from the equalization tables already committed under
`store/pricing/`, via `asc subscriptions pricing prices import`, 175 territories
each. The two annual products both moved: `pro_annual_standard` is the first
paywall and `pro_annual` is the trial offering behind the second, and leaving
one behind would have priced the same year at two numbers. The increases went in
with `--preserved` so any existing subscriber keeps their price and Apple never
has to ask for consent; the weekly *decrease* went in without it, because
preserving someone at the old, higher weekly price is not a kindness. Apple
schedules price changes on APPROVED subscriptions for the next day, so these
take effect 2026-08-26 and `asc subscriptions pricing summary` reports the new
number before RevenueCat's live read does.

`ads.subPrice` needed no change, and the lockstep warning above was answered
before it was written: 2.33 is $27.99 ÷ 12, and $27.99 is Apple's **70%** of
$39.99, not of the old $19.99. This app is not on the Small Business Program —
`asc subscriptions pricing summary` reports year-1 proceeds of $28.00 against
$33.99 in year two — so the bid model was already valuing an install at the new
price while the store was still charging the old one. `ads.targetCpi` 1.10 is
the same figure at the spec's 4% conversion rate and also stands.

What the increase fixed beyond the numbers: weekly was $7.99 against a $2.99
monthly, so the "cheap" plan cost 2.7× the middle one and the badge on the
annual row was computing its saving against the *cheapest* per-month option in
the list. At $3.99/wk against $5.99/mo the ladder is monotonic again and the
anchor means what it says.

**Alignment defect found in the shipped reorder, fixed in revision 37.** The
annual row's label stack carried `width: fixed 130` where monthly and weekly
carry `fill`, and the rows are horizontal stacks distributed `space_between`, so
the slack was distributed and "Yearly Pro" sat a few points right of the two
labels under it. Both that stack and the savings-badge text inside it are now
`fill`; the published diff against revision 36 is those two properties and
nothing else. Worth knowing for the next time this is inspected from a
dashboard: RevenueCat's paywall preview renders the *other* app in this project
(`appafd8673644`, products `monthly` / `yearly` / `lifetime`, which are attached
to the same packages), so previews and `get_offering_prices` report that app's
prices, not Wrenchy's. On device the SDK resolves by app and gets the right
ones. Only `asc subscriptions pricing summary` is authoritative here.

**5. Motivational CTA — currently fails.** `"See Wrenchy Pro"` describes
navigation, which is exactly the "don't waste this on Continue" failure the
reference names. It must name an outcome the user wants. On the trial screen,
lead with the free trial. Do not write a trial length into copy — read it from
the offering, or the copy lies the moment the offer changes.

**6. One contradiction to resolve.** `offer.paywall.caption` advertises the free
tier *on the paywall*: "One car, unlimited history and CSV export are free
forever…". But `app/onboarding/free.tsx` documents, in its own header comment,
that the free door was deliberately moved off the paywall because "a free
alternative printed next to a price [is] read by everybody who had not already
decided to pay." The caption re-opens the door the ladder closed. **The
reasoning in `free.tsx` is correct; the caption undercuts it.** Resolve in
favour of the ladder — but keep the app honest: free must stay genuinely
reachable by declining both asks, and nothing may imply the free tier is
time-limited or that data is held hostage.

## Two workstreams

**A. RevenueCat dashboard — no build, ships immediately.**
Reorder `ofrng04c048e8ea` to annual-first-preselected, badge the annual against
weekly, drop `$rc_lifetime`, and rewrite the sheet's CTA to an outcome. Keep the
`discount` offering's trial paywall consistent with the new voice.

**B. App copy and onboarding — needs the next native build.**
`src/i18n/catalog/en/offer.ts` plus the screens listed above.

## Hard constraints

- **16 locales, enforced by tests.** `src/i18n/catalog/` has 10 full catalogs
  (`de fr it es pt-BR nl sv pl ja ko`) and 5 regional overlays
  (`en-GB en-AU en-CA fr-CA es-MX`). `tests/i18n.test.ts` asserts key parity
  **and placeholder parity** against English. Any key you add, rename or remove
  must be mirrored everywhere, with real translations — not English copied into
  a `de.ts`. Captions overlay a phone mockup, so keep translated lengths near
  the English source.
- **Typographic apostrophe U+2019**, not ASCII `'`. An ASCII quote renders as a
  straight tick in Cambay and reads as a typo.
- **NO EM DASHES OR EN DASHES, ANYWHERE.** `tests/onboarding-screens.test.tsx`
  has a test named "no screen in the flow prints an em or en dash" that renders
  all 15 onboarding screens and fails on `—` or `–`. Use a colon, a full stop,
  or a comma. Note that the suggested subtitle in the Findings section below
  is written without one for this reason.
- **Three tests pin the current paywall copy and will fail until updated:**
  `tests/onboarding-screens.test.tsx:173` asserts
  `texts(render(OnboardingPaywall))).toContain("See Wrenchy Pro")` — changing
  the CTA requires changing this assertion. Line 172 asserts the paywall does
  **not** match `/free app/i`, which is the ladder rule from finding 6
  encoded as a test; keep it passing. Update these assertions to match the new
  copy, do not weaken or delete them.
- **Never write a price, a trial length, or a discount percentage into app
  copy.** RevenueCat renders those.
- **Nothing that would not survive being checked.** The existing paywall screen
  comment states the rule: no countdowns, no "87% of users choose annual", no
  fake scarcity. Apple rejects apps that trick users, and the whole ToS reduces
  to that. Keep every claim true.
- **Do not add a fourth ask** or trap the user. The ladder is
  `plan → paywall → offer → free`; the sheet closes on a swipe and every
  dismissal path continues the flow.
- Do not touch the ASA campaigns, the screenshots, or `src/analytics`.

## Acceptance criteria

1. `npx tsc --noEmit` clean.
2. `npx jest` green — currently 20 suites / 329 tests. `tests/i18n.test.ts`,
   `tests/localization-smoke.test.ts`, `tests/onboarding-screens.test.tsx` and
   `tests/onboarding-run.test.ts` all exercise this surface.
3. The default offering serves annual first and pre-selected, badged against
   weekly, with `$rc_lifetime` absent, verified by re-reading the offering from
   the API rather than by assertion.
4. Paywall copy contains no price, no trial length, no percentage, no invented
   social proof, and no free-tier advertisement.
5. Every changed key present in all 16 locales with genuine translations.
6. A short written diff of the copy — old line, new line, and which of the five
   sections it serves — so the argument can be reviewed without reading TSX.
7. State explicitly that conversion impact is **unmeasured**, and that the first
   real read arrives only once the analytics build is live and has traffic.

## Non-goals

Price changes without sign-off. New paywall variants or A/B experiments before
any baseline exists. Touching ads, screenshots, or the icon. Adding a
paywall-analytics layer — `src/analytics` already covers the funnel.
