# Wrenchy — decisions and conclusions

The one place to check before proposing a change. Each entry says what was
decided, the evidence behind it, and what new evidence would reopen it. If an
idea is listed under **Rejected**, don't re-propose it unless the "reopen if"
condition has been met.

What shipped and when, and how each release affects the funnel numbers, is in
`docs/superpowers/specs/2026-08-26-funnel-comparability-register.md` (the ship
log). Event names are in `docs/superpowers/specs/2026-08-29-onboarding-event-taxonomy.md`.
This file keeps only the conclusions.

Last updated: 2026-09-24 (A/B live in OTA `01a0d6ca`).

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

## Live experiments

All experiments are coin flips on the device at fresh install (`src/experiments/index.ts`). An install without an assignment gets the control. Count people through their `experiment_assigned` row.

| Experiment | Arms | Since | Read on | Notes |
|---|---|---|---|---|
| `onboarding_symptoms` | control / no_symptoms | 09-16 | ~10-03 | Split the read before and after 09-22 (TikTok). The early lead for no_symptoms didn't hold after 09-22. |
| `onboarding_payoff` | condensed / none | 09-19 (restored) | ~10-03 | Read each experiment on its own, not the four combined groups (too few per group). The difference between arms may have narrowed from 09-24, because the paywall preview also shows a schedule. |
| `paywall_preview` | points / preview | 09-24 | ~10-08 | Measures the tap rate on the main paywall. Split `preview` by `dated` / `undated`. It needs about 2 weeks at ~30 paywall views a day. |

- **Don't call a result early.** It takes about 80 people per arm to see a main effect. We get about 10–12 assigned installs a day.
- **Don't merge `onboarding_symptoms` and `onboarding_payoff` into one 3-arm test.** Proposed on 09-19 and rejected: as two separate tests, each gets the full sample.

## Pricing and offers

### Decided
- **The exit offer sells one yearly plan at $29.99** (the `discount` offering, `pro_annual_discount`), not a cheap first week. The old $0.99-first-week price also showed up on the first paywall, because Apple attaches an intro price to the product, and it renewed at the full weekly price. (09-17)
- **The exit offer leads with "$29.99 per year".** The standard yearly price is struck through beside it with "63% off", and the per-week figure is a small line underneath (09-24, OTA `01a0d5a2`). It used to lead with the per-week figure, and 9 in 10 buy taps then backed out at Apple's sheet. The saving is compared yearly against yearly, never against the weekly price. Read ~10-01: buy taps → paid, and time on the sheet.
- **The weekly plan stays in the default offering as a price anchor.** It is what makes the "Save N%" badges work (`plans.ts`). If it is removed, the savings have to be re-based on the monthly plan.
- **Billing grace period is on:** 16 days, all renewals (09-20).
- **Cancel feedback:** RevenueCat's Customer Center links to a Google Form.

### Rejected
- **Free trial (on the yearly plan, for everyone or as an A/B test):** rejected 09-24. The user's concern: people who bought cancelled within minutes, and people on the earlier free trial (there was a 3-day trial on `pro_annual` in August) cancelled a few days in. The data agrees. Short commitments churn: monthly has 3 of 6 set to cancel, and the old $0.99 first week has 2 of 2 gone. Yearly has 5 of 6 set to renew. A maintenance log shows nothing in its first week. The paywall preview answers "try it first" instead. *Reopen if:* the preview fails to move the tap rate by ~10-08 and there is a way to deliver value within a trial (for example, a reminder that fires inside it).
- **Save-50 promotional offers and win-back offers in App Store Connect:** built and then deleted on 09-20 by the user's choice. *Reopen if:* cancellations become a large share of revenue.
- **Removing the monthly plan:** it brings 3 of the 9 full-price sales, even though it churns. *Reopen after* the ~10-01 read.

## The main paywall

- **Decided:** the plans are drawn in the app itself, not RevenueCat's sheet (09-16). The close button appears after 4 s. There is no free option and no "Not now". Closing leads to the exit offer.
- **Decided:** under test, the three benefit rows are replaced by a preview of the car's plan. One service is shown with its real date, two more by name with "Date and reminder with Pro", then "+N more". Locked rows never show a blurred or made-up date (most services have no date on a fresh install).
- **Considered, not done:** show the yearly total in the plan rows as well as the per-week figure, and make the monthly plan quieter. Full-price taps pay at 42%, so the sheet surprise is small there.

## After purchase

- **The problem:** buyers don't come back. Only 4 of the 12 buyers from 09-18 to 09-22 opened the app on any later day. A monthly buyer can pay twice before their first reminder arrives.
- **The 2-minute cancel** (09-24, a TikTok monthly buyer): the cancel survey said "purchased by mistake". It came right after a rating ask 18 s after purchase. This was a problem with the buying moment, not with the product.
- **Shipped (don't rebuild):** rating ask moved to after the first saved record; a catch-up screen after purchase; NHTSA recalls (US only); a monthly odometer check-in (steps a month at a time, never nags daily); glovebox documents with expiry reminders (text only).
- **Stop adding retention features until ~10-02.** Five retention changes landed in two days, so their effects can't be told apart. Measure the day-2 and day-7 return rate of buyers, how many answer the check-in, and how many save a document.
- **Next, if the data supports it:** a home-screen widget, and photos of documents. Both need a native build, so bundle them. If fewer than 10% of buyers save a document, build the widget first.
- **Not built:** a week-1 summary notification.

## Constraints to remember

- **The app has no server.** The brand copy says "no server / nowhere else". The recall lookup sends make, model and year to api.nhtsa.gov; the user accepted this, but the marketing wording may need softening.
- **Guideline 5.6.3:** no rating asks during onboarding.
- **iOS allows 64 pending notifications.** The app uses 60: up to 30 document reminders and up to 5 check-ins, and service reminders get the rest.
- **Updates:** an OTA update is fine for JS-only changes; `npm run ota` prints "OTA SAFE". Anything native (widget, camera, image picker) needs an App Store build.
- **Measuring sales:** count `subscription_success` with `plan IS NOT NULL` and check it against RevenueCat's `actives_new`, in UTC days.
