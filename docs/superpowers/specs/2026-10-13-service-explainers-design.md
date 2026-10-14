# Service explainers — design

Date: 2026-10-13
Status: built 2026-10-13, not shipped (OTA-safe). Copy approved by the user.

## Why

Buyers don't come back (DECISIONS.md, After purchase: 4 of 12 buyers from
09-18 to 09-22 opened the app on a later day). Between services there is no
reason to open the app. Many owners also don't know what half the schedule
means: "Transmission Fluid" is due, but they have no idea what it is or whether
the shop is upselling them.

Explainers answer "what is this, and does it matter?" right where the service
appears. It is a **retention feature first**: the goal is buyers opening the
app and understanding their schedule, not a new thing to sell.

## Decided (by the user, 2026-10-13)

- Short explainer cards, one per shipped service, opened from wherever the
  service already shows up.
- **No Learn tab, no streaks, no XP.** No daily anything.
- **Personalized lessons come later, and only if people engage.** Optional
  lessons fitted to the user's car and mileage (for example "your car at
  60,000 mi") are phase 2. They are built only if the phase-1 gate below is
  met.
- Measure explainer engagement and buyers' day-7 return.

## Scope, phase 1

### Where a card opens

| Source (`source` prop) | Trigger |
|---|---|
| `service_row` | Tapping a history row, on either arm's vehicle screen; in arm A also tapping an on-schedule row of the Care plan's interval bars. These rows had no tap action before, so nothing they did is lost. |
| `due_row` | Tapping a "Due now" row on the classic vehicle screen, or a due or due-soon row of arm A's Care plan bars. |
| `notification` | Tapping a due-service reminder opens the card over the app (the reminder's data carries the URL). Reminders scheduled before the update carry none until `rescheduleAll` runs on the next launch. |
| `log_form` | A "What's this?" link under the service chips on the log form, for the selected service. "Log it" on that card just goes back to the form. |

Rows that already do something (arm A's to-do checks, its Upcoming rows, the untracked rows that open the log form) are left alone, and so is the garage card on the home screen. The card is a route (`/explain`, a form sheet) so a notification can open it by URL.

Nothing changes in onboarding or on any paywall. That keeps `app_design` clean:
both arms get the same cards behind the paywall, and its read (main-paywall buy
taps) never sees them. Arm A shows the car mascot at the top of the card (the
mood follows the service's status); arm B shows the card in the classic look
with no mascot.

### The card

A sheet, about half the screen tall, scrolls if needed. The same five parts
every time, in this order:

1. **Title**: the service name (`serviceName(type)`).
2. **Your schedule**, built from the user's own interval and last record,
   never hardcoded: "Every 6 months or 5,000 mi · last done Mar 2026 at
   41,200 mi · due in 2 months". If there is no record: "Not logged yet".
3. **What it is**: one or two sentences.
4. **Why it matters**: what goes wrong if it's skipped, in plain words.
5. **DIY or shop**: one line, with a difficulty tag: `Easy DIY`, `Doable DIY`
   or `Shop job`.
6. **Footer**: "Log it" (opens the log form for this service) and "Change
   interval" (opens the intervals screen). Below them, in small grey type:
   "General guidance. Your owner's manual has your car's exact schedule."

No prices in phase 1. Shop prices vary by country and car, and wrong numbers
cost trust. Revisit after the gate.

### Copy rules

- 70 words or fewer across "what", "why" and "DIY", so it fits without
  scrolling on an iPhone SE.
- No torque numbers, no fluid specs, no part numbers. Point to the manual.
- No fear words ("dangerous", "catastrophic"). State the cost of skipping it
  plainly.
- The intervals in the copy come from the user's settings, never from the
  text, so metric markets and owners who changed their intervals read the
  right number.
- Every card is translated into all 16 locales, like the rest of the
  catalog (`explain.<type>.what|why|diy`).

## Draft copy (English)

The shipped wording is in `src/i18n/catalog/en/explain.ts`. It differs from
the draft below in one way: every number was taken out ("about 30 minutes",
"3 to 5 years", "thousands of miles"), so the copy can't contradict the
owner's own interval or unit. `tests/explain.test.ts` holds the copy to that.

The "Your schedule" line is generated, so it isn't written here.

**Oil Change** · `Doable DIY`
- *What:* Fresh oil and a new filter. Oil keeps the engine's metal parts from
  grinding against each other and carries heat away.
- *Why:* Old oil thickens into sludge and stops protecting. Skipping changes
  is the most common way engines wear out early.
- *DIY:* Doable with a jack, a drain pan and a filter wrench. Most people use
  a quick-lube shop, which takes about 30 minutes.

**Tire Rotation** · `Shop job`
- *What:* Moving each tire to a different corner of the car so they wear
  evenly.
- *Why:* Front tires wear faster. Rotating them makes a set last thousands of
  miles longer and keeps the grip even.
- *DIY:* Possible with jack stands, but most tire shops do it quickly, often
  free if you bought the tires there.

**Brake Inspection** · `Shop job`
- *What:* A check of the pads, rotors and brake fluid for wear.
- *Why:* Pads are cheap. Worn-out pads grind into the rotors, which turns a
  small job into a big one. Squealing or grinding means book it now.
- *DIY:* Leave it to a shop unless you've done brakes before.

**Air Filter** · `Easy DIY`
- *What:* The filter that cleans the air going into the engine.
- *Why:* A clogged filter starves the engine of air, which costs power and
  fuel. It matters more if you drive on dusty roads.
- *DIY:* Usually a few clips and no tools, about 5 minutes. Shops often charge
  a lot for it.

**Cabin Air Filter** · `Easy DIY`
- *What:* The filter for the air you breathe inside the car, usually behind
  the glovebox.
- *Why:* A dirty one makes the vents weak and musty and lets pollen in. It
  doesn't affect the engine.
- *DIY:* Usually you just empty the glovebox and unclip it, about 10 minutes.

**Wiper Blades** · `Easy DIY`
- *What:* The rubber blades that clear the windshield.
- *Why:* Sun and cold harden the rubber. Streaks and chatter in the rain
  mean you can't see well.
- *DIY:* They clip on. Most auto parts stores will fit them for free.

**Battery Check** · `Easy DIY`
- *What:* A test of how much charge the battery holds, plus a look at the
  terminals for corrosion.
- *Why:* Batteries last about 3 to 5 years and often die without warning,
  usually on the first cold morning. A test tells you before that happens.
- *DIY:* Many auto parts stores test batteries free in a few minutes.

**Coolant Flush** · `Shop job`
- *What:* Replacing the fluid that carries heat from the engine to the
  radiator.
- *Why:* Old coolant stops protecting against corrosion inside the engine.
  An engine that overheats can be badly damaged.
- *DIY:* Leave it to a shop. Never open the radiator cap on a hot engine.

**Transmission Fluid** · `Shop job`
- *What:* The fluid that lubricates and cools the gearbox.
- *Why:* Worn fluid leads to rough or slipping shifts. A transmission is
  one of the most expensive parts of a car to replace.
- *DIY:* A shop job. Some cars are labelled "lifetime fluid". Your manual
  says whether yours really is.

**Spark Plugs** · `Doable DIY`
- *What:* The parts that make the spark that burns fuel in each cylinder.
- *Why:* Worn plugs cause rough idling, misfires and worse fuel economy. Most
  last a long time, so this job comes up rarely.
- *DIY:* Easy on some engines and hard on others. Check a video for your
  model before deciding. Electric cars don't have spark plugs.

**Registration** · no tag
- *What:* The yearly renewal that keeps your car legal to drive.
- *Why:* Driving with an expired registration can mean fines, and in some
  places the car can be towed.
- *DIY:* Usually done online in a few minutes. Save the confirmation in
  Glovebox documents.

**Inspection** · no tag (title follows the market: MOT, HU, 車検…)
- *What:* The government safety check (and emissions check, where required)
  your car needs to stay on the road.
- *Why:* Missing it can mean fines, and some insurers won't pay out on a car
  without a valid one.
- *DIY:* Done at a licensed test center. Fix any warning lights first, since
  an active warning light can fail the test in many places.

**Other**: no card. Its rows stay untappable, as do rows for any type the
user typed themselves.

The Inspection copy needs a per-market check before translation (TÜV/HU, MOT,
車検 differ in what they cover and how they're enforced). Owners in Canada and
Brazil only see it if they set an interval.

## Events

Added to the event taxonomy:

| Event | When | Properties |
|---|---|---|
| `explainer_opened` | A card opens | `service_type`, `source` (`service_row` / `due_row` / `notification` / `log_form`), `status` (`ok` / `due_soon` / `overdue` / `never_logged`). Buyers are found by joining on `subscription_success`, so there is no `subscribed` flag. |
| `explainer_closed` | A card closes | `service_type`, `seconds` (time open, capped at 300) |
| `explainer_action` | A footer button is tapped | `service_type`, `action` (`log_service` / `change_interval`) |

`exp_app_design` is already on every event, so the cards can also be split by
arm.

## How it's measured

Per person, dev device excluded, buyers identified as in DECISIONS.md
(`subscription_success` with `plan IS NOT NULL`, checked against RevenueCat).

- **Engagement, the main read** (count `explainer_opened` per person):
  - The share of buyers who open at least one card within 14 days of buying.
  - Cards per engaged buyer.
  - The share of opens that lead to a `service_logged` for the same service
    within 10 minutes.
  - The split across `source` values.
- **Day-7 return:** buyers' day-6/7 return, compared before and after the
  update (baseline: 6/17 from the 10-01 read). At about 1 to 2 buyers a day,
  this needs about 4 weeks for even a rough before/after. It is the outcome
  that matters, but it won't settle anything quickly. Engagement is the
  earlier signal.
- **Confounds:** 1.3.0 (widget, document photos, tread) is in review and may
  land in the same weeks. Record both ship dates in the register and split
  day-7 return by `has_widget` where possible.

## Gate to phase 2 (personalized lessons)

Read four weeks after the update ships. Build phase 2 only if **both** hold:

- At least 30% of buyers open a card within 14 days, **and**
- at least 10% of buyers open 3 or more cards, or the `notification` source
  makes up at least 20% of opens (a sign the cards bring people back, not
  just answer one question).

If it misses: keep the cards (they cost nothing to keep) and drop the lessons.

### Phase 2 sketch (not to build now)

- 5 to 10 short lessons, chosen by car age, mileage band and the services on
  file, for example "Coming up at 60,000 mi", "Your first winter with this
  car", "Buying used: what to check first".
- Shown as one optional row on the vehicle screen ("1 tip for your car"),
  never a tab.
- No streaks or XP. At most one lesson notification a month, and it counts
  toward the iOS budget of 64 pending notifications (60 are used today).

## Build notes

- OTA-safe: JS and copy only, no native change.
- The cards are static text in the catalog. No server and no outside lookup.
- Code: `src/explain/index.ts` (which services have a card, the schedule
  lines), `app/explain.tsx` (the sheet), `src/i18n/catalog/en/explain.ts`
  plus every catalog (10 full translations; the UK, Australia, Canada,
  Quebec and Mexico overlays rewrite the registration and inspection cards
  for their own documents). Tests: `tests/explain.test.ts`,
  `tests/explain-sheet.test.tsx`.
- Translations were written by Claude and have not been checked by native
  speakers. The registration and inspection cards make legal claims (fines,
  towing, insurance) per market and are the ones most worth a check.
