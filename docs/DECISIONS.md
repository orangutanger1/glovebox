# Wrenchy — decisions and conclusions

The one place to check before proposing a change. Each entry says what was
decided, the evidence behind it, and what new evidence would reopen it. If an
idea is listed under **Rejected**, don't re-propose it unless the "reopen if"
condition has been met.

What shipped and when, and how each release affects the funnel numbers, is in
`docs/superpowers/specs/2026-08-26-funnel-comparability-register.md` (the ship
log). Event names are in `docs/superpowers/specs/2026-08-29-onboarding-event-taxonomy.md`.
This file keeps only the conclusions.

Last updated: 2026-10-01 (both onboarding tests ended; shorter flow for everyone, OTA `01a0f993`. 10-01 and 10-02 reads done).

---

## Where the money is lost (as of 2026-09-24)

Numbers from 09-19 to 09-24, counted per person, with the dev device excluded.

| Screen | Saw it | Tapped buy | Paid |
|---|---|---|---|
| Main onboarding paywall (`current`) | 264 | 19 (7%) | 8 (42% of taps) |
| Exit offer (`discount`, $29.99/yr) | 178 | 52 (29%) | 3 (6% of taps) |

- **Main paywall:** the problem is getting the tap. 184 of 279 viewers closed it, and 83 of those closed 5–8 s in, just after the close button appears at 4 s. They left without reading it.
- **Exit offer:** the problem is Apple's payment sheet. People who back out do so within 2–8 s; everyone who bought spent 10 s or more on the sheet. The cause was a per-week headline ($0.58/wk) followed by a sheet charging $29.99 up front. Fixed on 09-24; see below.
- **Objection survey** (since 09-22, asked when someone declines the offer or backs out of the sheet): price 14, skipped 9, try_first 7, browsing 4, other 3.
- **Traffic:** a TikTok spike started 09-22 (142 installs that day). TikTok users almost all land on the exit offer. They converted 0 of 53 until 09-24, when 3 paid.

## Status snapshot (2026-09-24 night, PT)

- **Sales by day:** 9/20 1, 9/21 2, 9/22 1 (142 installs, TikTok spike), 9/23 2, 9/24 5 (61 installs).
- **RevenueCat:** about 15 active subscriptions, $353 revenue over 28 days. Yearly 5 of 6 set to renew; monthly 3 of 6 set to cancel.
- **Onboarding tests** (people assigned since 09-16, paid):
  - symptoms: control 7/194 (3.6%), no_symptoms 10/214 (4.7%)
  - payoff: condensed 6/175 (3.4%), none 9/210 (4.3%)
  - Both gaps are 3–4 sales. No call yet.
- **Live update:** `01a0d6ca` (runtime 1.2.4) — the exit offer's yearly price, the `paywall_preview` A/B test, and every retention feature from 09-23 and 09-24.

## Read calendar (no onboarding or paywall changes before these)

| Date | What to read |
|---|---|
| ~~10-01~~ done | Exit offer: buy taps → paid **4/42 (10%)** after the 09-24 headline, vs 5/51 before (p=1.0). **The headline didn't fix people backing out at the sheet.** Main paywall since 09-24: 34/321 tapped buy, 7 of 34 paid. |
| ~~10-02~~ done 10-01 | Buyers since 09-18: day-1/2 return 6/25 (24%), day-6/7 6/17. Check-in answered 1. **Documents saved 0** → build the widget before document photos. |
| ~~10-03~~ done 10-01 | Onboarding tests ended; see below. |
| ~10-08 | Main paywall buy-tap rate for the first full week with benefit rows for everyone (OTA `01a0f442`); expect about 16%. |

## Live experiments

| Experiment | Arms | Since | Read on | Notes |
|---|---|---|---|---|
| `exit_offer_plans` | yearly / with_monthly | 10-01 | ~10-15, or earlier on a clear gap | The with_monthly arm adds "Or {price} per month, cancel anytime" under the exit offer's button; it buys the standard monthly plan (`plan=$rc_monthly`, `offering=discount`). Metric: exit-offer buy taps → paid, and paid per exit-offer viewer, per arm. Why: 4/42 buy taps paid after the 09-24 headline fix, unchanged; price is the top objection; monthly is the most-bought full-price plan. Watch: monthly churns (3/6 set to cancel on 09-24), so check renewals before shipping the winner. |

All experiments are coin flips on the device at fresh install (`src/experiments/index.ts`). An install without an assignment gets the control. Count people through their `experiment_assigned` row.

### Ended: `onboarding_symptoms` and `onboarding_payoff` (2026-10-01, two days before the planned 10-03 read)

| Test | Arms (paid / assigned since 09-16) | p | After 09-22 only |
|---|---|---|---|
| `onboarding_symptoms` | control 10/394 (2.5%), **no_symptoms 16/394 (4.1%)** | 0.32 | 7/323 vs 9/315 (p 0.62) |
| `onboarding_payoff` | condensed 10/369 (2.7%), **none 14/396 (3.5%)** | 0.54 | 7/312 vs 9/326 (p 0.80) |

- **Decided:** ship both shorter arms to everyone. The flow no longer shows `symptoms`, `help` or `schedule`; the loader goes straight to `compare` (`HIDDEN` in `src/onboarding/flow.ts`). The screens are kept but not used.
- **Why we stopped early:** each arm had ~390 people, about 5× the 80 that were planned. Proving a 2.5% vs 4% gap would take ~1,700 per arm, which is months at ~40 installs a day. Two more days could not decide it. Neither result is significant; the shorter arm led both the whole way, and fewer screens wins a tie.
- **What we learned:** at this volume, paid-per-install can only detect very large effects. Judge future tests on an earlier step with more events (buy taps, or taps → paid), as `paywall_preview` was.
- *Reopen if:* the pain beat or the plan page comes back in a different form. Don't restore the old screens as they were.

## Pricing and offers

### Decided
- **The exit offer sells one yearly plan at $29.99** (the `discount` offering, `pro_annual_discount`), not a cheap first week. The old $0.99-first-week price also showed up on the first paywall, because Apple attaches an intro price to the product, and it renewed at the full weekly price. (09-17)
- **The exit offer leads with "$29.99 per year".** The standard yearly price is struck through beside it with "63% off", and the per-week figure is a small line underneath (09-24, OTA `01a0d5a2`). It used to lead with the per-week figure, and 9 in 10 buy taps then backed out at Apple's sheet. The saving is compared yearly against yearly, never against the weekly price. Read 10-01: 4/42 buy taps paid (10%), the same as before the change (5/51). It stays, because the honest yearly headline costs nothing, but it is not the fix. Price is the top objection (36 of 96 since 09-24).
- **The weekly plan stays in the default offering as a price anchor.** It is what makes the "Save N%" badges work (`plans.ts`). If it is removed, the savings have to be re-based on the monthly plan.
- **Billing grace period is on:** 16 days, all renewals (09-20).
- **Cancel feedback:** RevenueCat's Customer Center links to a Google Form.

### Rejected
- **Free trial (on the yearly plan, for everyone or as an A/B test):** rejected 09-24. The user's concern: people who bought cancelled within minutes, and people on the earlier free trial (there was a 3-day trial on `pro_annual` in August) cancelled a few days in. The data agrees. Short commitments churn: monthly has 3 of 6 set to cancel, and the old $0.99 first week has 2 of 2 gone. Yearly has 5 of 6 set to renew. A maintenance log shows nothing in its first week. The paywall preview answers "try it first" instead. *Reopen if:* there is a way to deliver value within a trial (for example, a reminder that fires inside it). The paywall preview, the other answer to "try it first", lost its test on 09-30 (see The main paywall).
- **Save-50 promotional offers and win-back offers in App Store Connect:** built and then deleted on 09-20 by the user's choice. *Reopen if:* cancellations become a large share of revenue.
- **Removing the monthly plan:** it brings 3 of the 9 full-price sales, even though it churns. *Reopen after* the ~10-01 read.

## The main paywall

- **Decided:** the plans are drawn in the app itself, not RevenueCat's sheet (09-16). The close button appears after 4 s. There is no free option and no "Not now". Closing leads to the exit offer.
- **Decided (09-30):** the paywall shows the three benefit rows to everyone. The `paywall_preview` test ended early, a week before its planned 10-08 read. From 09-24 to 09-30, main-paywall buy taps were points 16/102 (16%) vs preview 6/109 (6%), p≈0.02. Sales on the main paywall were 4 vs 0. On 09-28 the gap was already p≈0.045, and it grew. Each extra day of the test was costing sales. `src/paywall/PlanPreview.tsx` and its strings are kept but not used.

### Rejected
- **Plan preview in place of the benefit rows** (one dated service, two locked by name, "+N more"): lost the 09-24 → 09-30 A/B test on buy taps (see above). *Reopen if:* it comes back in another form, such as a screen showing the real app before the paywall (see "Next test"), not in place of the rows.
- **Considered, not done:** show the yearly total in the plan rows as well as the per-week figure, and make the monthly plan quieter. Full-price taps pay at 42%, so the sheet surprise is small there.

## After purchase

- **The problem:** buyers don't come back. Only 4 of the 12 buyers from 09-18 to 09-22 opened the app on any later day. A monthly buyer can pay twice before their first reminder arrives.
- **The 2-minute cancel** (09-24, a TikTok monthly buyer): the cancel survey said "purchased by mistake". It came right after a rating ask 18 s after purchase. This was a problem with the buying moment, not with the product.
- **Shipped (don't rebuild):** rating ask moved to after the first saved record; a catch-up screen after purchase; NHTSA recalls (US only); a monthly odometer check-in (steps a month at a time, never nags daily); glovebox documents with expiry reminders (text only).
- **Stop adding retention features until ~10-02.** Five retention changes landed in two days, so their effects can't be told apart. Measure the day-2 and day-7 return rate of buyers, how many answer the check-in, and how many save a document.
- **Widget built 10-01** (0 of 25 buyers saved a document, so the widget came first): `NextService` in `src/widget/`, small/medium home screen plus lock screen, showing the first car's worst-then-soonest three services in the garage card's words. It is refreshed from `rescheduleAll`. It needs a native App Store build (`expo-widgets`, app group `group.com.idea6.carmaintenancelog`); it does nothing on OTA-only binaries. Document photos go in the same build or the next one. Measure: buyers' day-7 return before vs after the build.
- **Not built:** a week-1 summary notification.

## Constraints to remember

- **The app has no server.** The brand copy says "no server / nowhere else". The recall lookup sends make, model and year to api.nhtsa.gov; the user accepted this, but the marketing wording may need softening.
- **Guideline 5.6.3:** no rating asks during onboarding.
- **iOS allows 64 pending notifications.** The app uses 60: up to 30 document reminders and up to 5 check-ins, and service reminders get the rest.
- **Updates:** an OTA update is fine for JS-only changes; `npm run ota` prints "OTA SAFE". Anything native (widget, camera, image picker) needs an App Store build.
- **Measuring sales:** count `subscription_success` with `plan IS NOT NULL` and check it against RevenueCat's `actives_new`, in UTC days.

## Next test after the reads: show the real app before the paywall

Source: a founder's post shared 09-24, claiming 12%+ download→paid with the flow: app screen recording → goal → gender/age → graph vs competitors → name → 2 pain points → niche question → notification permission → loader → custom plan → reviews → 2 phone-mockup "transformation" screens → paywall, with the name used throughout and on the paywall title.

- **Already in our flow (don't rebuild):** name (asked on screen 2, used on the paywall title, notifications, reminders to finish setup), pain points (`worry`, `symptoms`), niche questions (the 6 car questions), notification permission, loader (`analyzing`), custom plan (`schedule`, under test), graph (`compare`), reviews. Having these hasn't got us to 12%, so the claim doesn't explain the gap (~4% for us). It's unverified, from an unknown niche and unknown traffic.
- **Missing, and the next candidate test:** a screen showing the real app, either an opening screen recording in a phone mockup or 1–2 mockup screens just before the paywall. It fits the "try_first" objection and the fast paywall closes. Reuse the App Store screenshot frames. Build it only after the ~10-03 read. The in-paywall preview lost (09-30), so showing the app has to happen on its own screen, before the paywall, not in place of the benefit rows.
- **Our data disagrees with one point:** "show their custom plan" is the post's key idea, but in our payoff test the group without the plan page is slightly ahead (9/210 vs 6/175, not significant).
- **Rejected:**
  - **Gender and age screens:** the app computes nothing from them, they add two screens of friction, and they cut against the privacy positioning.
  - **Graph against named competitors:** App Review risk, and claims we can't back up. The `compare` chart (keeping to the schedule vs fixing things late) stays.
