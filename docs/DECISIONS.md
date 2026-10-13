# Wrenchy — decisions and conclusions

The one place to check before proposing a change. Each entry says what was
decided, the evidence behind it, and what new evidence would reopen it. If an
idea is listed under **Rejected**, don't re-propose it unless the "reopen if"
condition has been met.

What shipped and when, and how each release affects the funnel numbers, is in
`docs/superpowers/specs/2026-08-26-funnel-comparability-register.md` (the ship
log). Event names are in `docs/superpowers/specs/2026-08-29-onboarding-event-taxonomy.md`.
This file keeps only the conclusions.

Last updated: 2026-10-13 (`app_design` A/B shipped; `exit_offer_plans` ended, the exit offer sells the yearly alone). Before that 2026-10-12: `app_design` A/B built. Before that 2026-10-01: both onboarding tests ended; shorter flow for everyone, OTA `01a0f993`. 10-01 and 10-02 reads done.

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
| ~~10-15~~ done 10-13 | `exit_offer_plans` (since 10-02): yearly **1/99** viewers paid (20 tapped), with_monthly **0/73** (16 tapped; 9 monthly taps, 0 paid). p=1.0, nowhere near a read, but the monthly link sold nothing. **Ended by the user: the exit offer is yearly-only for everyone.** |
| ~11-03 | `app_design` first check: main-paywall buy taps per viewer, A vs B. Stop on a clear gap; otherwise run on (~12-29 at current traffic). |
| ~10-08 | Main paywall buy-tap rate for the first full week with benefit rows for everyone (OTA `01a0f442`); expect about 16%. |

## Live experiments

| Experiment | Arms | Since | Read on | Notes |
|---|---|---|---|---|
| `app_design` | **A = `redesign`** / **B = `classic`** (control) | **shipped 10-13**, OTA `01a133f8` (same update ended `exit_offer_plans`) | first check **~11-03**; run to **~12-29** if no clear gap (see below) | The whole look. B is the app as it is (dark). A is a light app: Bevel's grey page with white shadowed cards, one blue accent `#4C7DFF`, orange for due soon, red for overdue, black pill buttons. Planta's loop (Today / Upcoming tasks, a Garage tab, a white floating tab bar with a separate "+" that logs a service; the vehicle screen split into To-do / Care plan / History). Today leads with the date, the greeting, the car speaking the status line, and Bevel's ring row (interval left on the three most used-up services). Onboarding is a conversation: the animated car and a speech bubble on every screen, a thin progress line on the quiz, white option pills; both paywalls end in a white plan sheet, and the main one shows its three benefit rows as Opal's timeline. Every step, price, plan, timer, benefit, copy line under test and event is the same in both arms. OTA-safe (no native change). |

All experiments are coin flips on the device at fresh install (`src/experiments/index.ts`). An install without an assignment gets the control. Count people through their `experiment_assigned` row.

### `app_design` (A redesign / B classic), built 2026-10-12

- **Asked for by the user:** the redesign ships as an A/B test against the current design rather than to everyone.
- **Assignment:** fresh installs only, like every test here. Installs from before the build have no row and stay `classic`, so no paying user's app changes under them. The arm is read at render time (`src/design/theme.ts`), never at import, so a fresh install's onboarding is already in its arm.
- **What does not differ between arms:** every onboarding step and its order, every paywall's plans, prices, offering, close-button timer, benefit rows and copy, the exit offer (yearly only since 10-13), every analytics event. A tests the look, not the funnel's logic. `exp_app_design` is on every event.
- **Overlap with `exit_offer_plans`:** none. That test ended 10-13, before `app_design` shipped.
- **Metric** (the 10-01 lesson: judge on an earlier step with more events): main-paywall buy taps per viewer, per arm (B runs ~16%). Secondary: `first_core_action` and `service_logged` per install, buyers' day-7 return, paid per install. At ~40 installs a day, telling 16% from 21% buy taps takes ~900 paywall viewers per arm, about 6 weeks; a gap that size or bigger shows sooner. *Re-estimated 10-13:* installs fell to ~20 a day (10-08 → 10-13), ~18 main-paywall viewers a day, ~9 per arm, and the tap rate ran nearer 10% than 16%. At that volume a big gap (10% vs 20%) needs ~200 viewers per arm, about 3 weeks; a modest one (10% vs 15%) ~700 per arm, about 11 weeks. Check at 3 weeks, stop there on a clear gap; otherwise run to ~11 weeks or until traffic picks up. The main-paywall monthly A/B queues behind it.
- **Mascot:** `research/redesign/mascot-concepts/grid/flat-blue.png` was the reference; five moods (`happy` all on schedule, `heads-up` due soon, `worried` overdue, `sleepy` nothing logged, `celebrating` just logged) generated on kie.ai (gpt-image-2.5 flare, image-to-image) (the tyres were first lifted to slate for the dark page; A is now light, and the loops are graded to `#F4F4F7`). Masters and the generation script are in `design-source/mascot/`. The old clay wrench (`design-source/mascot/wrenchy-*.png` and its `design-source/icon/` layers) is deleted; it is in git at `6470784` if ever needed.
- **Device checks:** the `redesign-check` EAS profile (ad-hoc, internal) sets `EXPO_PUBLIC_APP_DESIGN=redesign`, which pins arm A regardless of the install's row and turns analytics off for that build, so a tester's taps never reach `app_design` (or, before 10-13, `exit_offer_plans`). Store builds never set it (`tests/experiments.test.ts` checks the production profile).
- **Animated mascot:** each mood is a 4-second loop made from its still with Seedance 2 Mini on kie.ai (chosen by the user over Seedance 1.5 Pro, Kling, Wan and the rest on cost against quality; ~165 credits for all five), then graded back to the stills' colours and the light page colour by `design-source/mascot/anim/grade.py` and shipped as GIFs (`assets/mascot/car-*.gif`, ~2 MB together; React Native's `Image` plays GIF on iOS with no native module). The loops have the page colour baked in, so only a car standing on the page animates; cards, lists and Reduce Motion get the still. Happy, heads-up and celebrating were regenerated on 2026-10-12 (~100 credits) as idle loops with the wheels kept on the ground (blink, glance, sway): the user rejected the first set's hop on the suspension. Worried and sleepy never left the ground and were kept.
- **App icon: unchanged, deferred (2026-10-12).** The gauge icon stays for both arms while `app_design` runs: the icon is native and shared, so changing it would alter arm B and muddy the read, and per-arm alternate icons need a native module plus an iOS system alert mid-onboarding. A car-face icon in the mascot style is the likely next step; revisit after the `app_design` read (switch icon and native splash together if A wins, or test the icon on its own via App Store product page optimization). The user chose to test the app design first.
- **Launch intro (arm A only):** modelled on the opening the reference apps share (egglu, Eden, karen): the car arrives on a plain page, nine car-care stickers burst out from behind it and drift, the `wrenchy` wordmark lands under it, then the unchanged welcome headline and button. Stickers and wordmark were generated with gpt-image-2.5 (20 credits) from the happy still, sources in `design-source/intro/`. The native splash is shared by both arms, so it stays the classic dark gauge; `src/redesign/LaunchCurtain.tsx` takes over its exact picture and opens it onto the light page with a disc of the page colour (every cold start in arm A; a cross-fade under Reduce Motion). Arm B launches exactly as before. Nothing about the welcome step's copy, button, privacy line or `onboarding_step_viewed` event changed.
- **Conversation copy** (`redesign.convo.*`, `src/onboarding/convoLine.ts`) is new text in A only, translated into every catalog; titles, subtitles and buttons are the existing keys.
- **"Health" is not a score.** The rings and bars are the share of the user's own interval left (months or distance, whichever runs out first), which the 08-01 spec's "a health score the app cannot honestly compute" rule allows.
- *Reopen if:* A loses buy taps clearly — then keep the Today/Garage screens behind the paywall only (post-purchase) and test the paywall reskin separately.

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
- **The exit offer leads with "$29.99 per year".** The standard yearly price ($39.99) is struck through beside it with "25% off", and the per-week figure is a small line underneath (09-24, OTA `01a0d5a2`). It used to lead with the per-week figure, and 9 in 10 buy taps then backed out at Apple's sheet. The saving is compared yearly against yearly, never against the weekly price. Read 10-01: 4/42 buy taps paid (10%), the same as before the change (5/51). It stays, because the honest yearly headline costs nothing, but it is not the fix. Price is the top objection (36 of 96 since 09-24). *Correction 10-13:* earlier notes said "63% off at $79.99". That price was never live: App Store Connect shows every live US price unchanged since 08-26 (yearly $39.99, monthly $5.99, weekly $3.99, exit offer $29.99). `$79.99` is `pro_annual_direct`, which was never submitted.
- **86% vs 25% headline, compared 10-13 (before and after, never run side by side).** Users on the weekly-framed headline ("86% off": $0.58/wk against the $3.99 weekly, 09-19 → 09-24, with stragglers on old updates to 10-02): 195 viewers, 54 buy taps (28%), 3 paid (1.5% of viewers, 6% of taps). Users on the yearly headline ("25% off": $29.99 against $39.99, 09-25 → 10-13): 391 viewers, 84 buy taps (21%), 7 paid (1.8% of viewers, 8% of taps). Paid per viewer p=1.0; tap rate p≈0.10. The bigger number got more taps but no more sales, and the periods differ (the TikTok spike fell in the 86% period). Not a reason to go back to the weekly framing.
- **The weekly plan stays in the default offering as a price anchor.** It is what makes the "Save N%" badges work (`plans.ts`). If it is removed, the savings have to be re-based on the monthly plan.
- **Billing grace period is on:** 16 days, all renewals (09-20).
- **Cancel feedback:** RevenueCat's Customer Center links to a Google Form.

### Rejected
- **Free trial (on the yearly plan, for everyone or as an A/B test):** rejected 09-24. The user's concern: people who bought cancelled within minutes, and people on the earlier free trial (there was a 3-day trial on `pro_annual` in August) cancelled a few days in. The data agrees. Short commitments churn: monthly has 3 of 6 set to cancel, and the old $0.99 first week has 2 of 2 gone. Yearly has 5 of 6 set to renew. A maintenance log shows nothing in its first week. The paywall preview answers "try it first" instead. *Reopen if:* there is a way to deliver value within a trial (for example, a reminder that fires inside it). The paywall preview, the other answer to "try it first", lost its test on 09-30 (see The main paywall).
- **Save-50 promotional offers and win-back offers in App Store Connect:** built and then deleted on 09-20 by the user's choice. *Reopen if:* cancellations become a large share of revenue.
- **Removing the monthly plan (main paywall):** it brings 3 of the 9 full-price sales, even though it churns. Since 09-24 it made 7 of 17 main-paywall sales, 7 of 18 tappers paid (39%, vs yearly 7/58). Removed and reverted on 10-13 at the user's call. *Reopen as an A/B test after the `app_design` read*, not as a switch for everyone.
- **Monthly on the exit offer:** tested 10-02 → 10-13 (`exit_offer_plans`), 0 sales from 9 monthly buy taps, and ended. The exit offer sells the $29.99 yearly alone.

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
- **Widget built 10-01** (0 of 25 buyers saved a document, so the widget came first): `NextService` in `src/widget/`, small/medium home screen plus lock screen, showing the first car's worst-then-soonest three services in the garage card's words. It is refreshed from `rescheduleAll`. It needs a native App Store build (`expo-widgets`, app group `group.com.idea6.carmaintenancelog`); it does nothing on OTA-only binaries. Document photos (front and back, on-device only) and tire tread depth ship in the same build. Measure: buyers' day-7 return before vs after the build, `document_saved.photos > 0`, `service_logged.has_tread`.
- **Not built:** a week-1 summary notification.

## Versus CARFAX Car Care (reviewed 10-01)

CARFAX is free, rated 4.8★ from 128K ratings, redesigned for Liquid Glass in v5.4 (June), and fills in service history from its network of shops. That network is a moat we can't copy.
- **Positioning, decided:** Wrenchy is the log for everything CARFAX can't see: DIY work, any mechanic, your own intervals, data with no account. These are its top complaints (non-network shops refused, wrong mileage that can't be corrected, records that can't be edited, account lockouts, fixed intervals).
- **Taken from CARFAX (10-01):** document photos and tire tread depth. UI rule: no new sections. Tread appears as one optional field, only when logging a Tire Rotation. It shows in the history row, and only worn tread (≤4/32″ or 3 mm) adds a due row.
- **Rejected:** car value, shop reviews and repair cost estimates (all need a server and outside data, against "no server"); naming CARFAX in App Store metadata (trademark).

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
