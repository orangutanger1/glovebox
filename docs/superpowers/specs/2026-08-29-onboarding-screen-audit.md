# Every onboarding screen, and what it is worth

**2026-08-29.** Sixteen routes, audited one at a time against the ten questions
in the redesign brief. The verdict column is deliberately conservative: read
the standing caveat in the funnel comparability register first, because most of
what follows is an argument about design and only some of it is an argument
from data.

## The state this audit was written in

Three facts bound every conclusion below.

1. **No cohort has ever run one unchanged bundle end to end.** The register
   records seven comparability breaks in six days. Builds 17-20 crashed on
   launch. Build 21, uploaded today, is the first binary on which a first-run
   population can exist at all.
2. **The paywall has converted a sample of one.** Zero purchases across ~20
   genuine historical entrants is not evidence about price, copy or position;
   it is a sample too small to reject any hypothesis.
3. **Until today, seven of the sixteen screens could refuse a user silently.**
   Five quiz screens plus the symptoms dwell and the reviews scroll gate greyed
   Continue out, and a disabled `Pressable` fires no `onPress`, so a refused tap
   emitted nothing at all. The apparent bimodality of the funnel — users either
   leave near the start or walk almost to the paywall — is exactly the shape a
   silent gate produces. `onboarding_step_blocked` now reports it.

Point 3 is why this audit recommends far fewer cuts than the brief anticipated.
The brief's premise is that the flow is too long. The measurement that would
establish that has not been taken, and the one screen that provably shed users
was doing so through a bug, not through its length.

## The flow as it stands

```text
welcome
  vehicle  body  odometer  drive  service  tracking  worry     ← the quiz, 7
analyzing → results → symptoms → help → reviews → notify       ← the payoff, 6
paywall → offer                                                ← the ask, 2
```

This is the quiz-archetype structure — question set, computed result, cost of
the problem, answer to it, evidence, plan, offer — and it is executed with more
discipline than most of the apps it was modelled on. Two things it does that
the archetype usually fakes: the analyzing screen computes real values from
real answers rather than animating a fake progress ring, and the reviews screen
declines to invent social proof for an app that has none.

## The screens

### welcome — KEEP

Purpose: land the problem before anything is asked. Collects nothing.

Full-bleed photograph, one 38px headline, one button, a privacy line demoted
out of the headline slot. It is the only route outside the shared
`OnboardingScreen` frame, so it emits its own `onboarding_step_viewed` by hand
— without which install → first screen is unmeasurable.

No change. A quiz flow needs one screen that is not a question, and this is a
cheap one.

### vehicle — KEEP (already repaired)

Purpose: create the car. Collects year (wheel), make and model (both optional).

This is the screen the brief is about, and the repair already shipped. The
implementation at `8c47c70` embedded in build 15 printed twenty-six year chips
over forty-two make chips over a filter box, required the make, and refused
Continue with four distinct validation messages — emitting `year:invalid` and
`make:invalid` on every refusal. 54 `year:invalid` events across 10 people; 37
`make:invalid` across 9; one device produced ~40 vehicle events in 112 seconds
and never reached question two.

The current screen has a year drum that cannot be out of range, so the four
messages have nothing left to say; make and model are optional; nothing gates
Continue; a car with no make is named by `system.vehicle.fallback`. Verified
absent from build 21's embedded bundle: all nine old validation keys.

The brief asks whether make/model/year are all genuinely necessary. They are
not, and the code already agrees — only the year is required, and it is
required by being unskippable rather than by being validated. Every interval is
driven by year, odometer and drive rate. The make is a label.

### body — OPTIONAL, pending data

Purpose: body style, one tap, no Continue. Inserted 08-27.

Nothing downstream reads `body_style`. The garage never queries the column;
only this screen writes it. So it is a question asked for personalisation that
does not yet personalise anything.

That is not automatically a cut. A one-tap question with no keyboard costs
almost nothing and contributes to the sense that the app is building something
specific. But it is the cheapest screen to remove if `route:body → route:odometer`
shows real drop, and it is the only screen in the quiz whose answer the product
does not consume. **Decide from the first clean cohort.** Do not remove it
blind: it went in eight days ago and has never been measured on a stable bundle.

### odometer — KEEP, now instrumented

Purpose: the reading that dates every distance-based service. Required.

The hard gate here is defensible — the reading is what half the schedule is
computed from, and an "add it later" produced a completed flow whose findings
were the app's own arithmetic presented back as the user's car.

What was not defensible was the silence. `trackVehicleEntry("odometer",
"invalid")` sat behind `if (!valid) return` inside an `onPress` that a disabled
button never called; it has never fired on a device. Any reading of the data
that took its absence for "nobody mis-typed a reading" was reading a bug. The
refusal now reports `empty` or `unparseable`, which separates "has not been out
to the car" from "typed something `parseNumber` rejected" — a grouped reading
copied off the dash, a decimal comma, a unit suffix. The second is a bug report.

**This is the screen to watch in the first cohort.** It is the highest-friction
question in the flow (a number the user may have to physically go and read) and
it sits second among the typed questions, which is exactly where the historical
funnel thins: vehicle 20 → odometer 14.

### drive — KEEP

Purpose: annual mileage as four ranges. Feeds `DISTANCE_PER_YEAR`, refines an
estimated odometer, and drives the projection shown on the same screen.

Ranges rather than a slider, because nobody knows their annual mileage to the
mile. The caption shows the answer doing its job immediately — a projection the
user can check against their own sense of the car, which is the cheapest
available proof the questions are not decorative. Genuinely load-bearing.

### service — KEEP, watch the second question

Purpose: last service type and roughly when. Writes a real record, or writes
none for "Not sure", which makes the app treat the service as due now.

One screen, two questions. The second chip row renders dimmed from mount rather
than appearing after the first is answered — a fix for a real bug where the
user answered the visible question, reached for Continue, and found a new
question in the space the button had been. The blocked reason now separates
`type_unanswered` from `when_unanswered`, so if people stall on the second row
it is the staged reveal failing, not the question.

### tracking — KEEP

Purpose: how they track maintenance today. Every option has its own finding on
`symptoms` and its own answer on `help`. Someone with a spreadsheet is told a
spreadsheet cannot notify them; someone tracking nothing is told something else.

The answer is consumed twice downstream. Not a survey question.

### worry — KEEP

Purpose: what they are worried about, multi-select. Selects which three
findings the flow shows. Costs one tap.

### analyzing — KEEP

Purpose: the pause between the last question and the answer. ~3.2s, four lines,
each a value actually computed from the user's input, over a bar that runs for
exactly as long as the readout takes.

The archetype's version of this screen is a fake progress ring counting to 100%
over eight seconds. This app cannot ship that: the whole pitch is that the
numbers are real, and a user who works out the loader was theatre has been
handed a reason to distrust the results on the very next screen. Keeping it
honest is a product decision, not a performance one, and it is right.

`replace`, not `push`, so Back from the results reaches the last question
rather than bouncing forward off a screen that only advances.

### results — KEEP

Purpose: the payoff. The first time the app tells the user something they did
not already know, computed from what they typed ninety seconds ago.

A count of what is overdue, not a health score. "Your car's health is 62" is a
number the app cannot honestly compute. Four rows above the fold; the full plan
appears three screens later, once earned.

### symptoms — KEEP, dwell now measured

Purpose: three findings from the user's own answers, one card at a time, on the
app's only red screens. One route with an index, so Back moves between cards.

The 800ms dwell before Continue goes live exists because three fast taps used
to skip two findings before either was readable. It has crossed three different
values in four days (1200 → 800), which the register flags as making any
per-card timing comparison meaningless. Its blocked presses now report `dwell`
— the count per device is the only way to tell whether the dwell is absorbing
impatience or manufacturing it.

### help — KEEP

Purpose: answers the three findings in the same order from the same objects,
with every lamp out — the same panel as `symptoms` with the alarms cleared,
which is the argument made without a sentence. Carries the Free/Pro boundary as
six tiles, two to a row.

This screen already absorbed `features` (removed 08-26). Do not split it again.
The tap between a promise and its price bought nothing, and the boundary is
better read here than discovered at the paywall — the most common complaint in
the review corpus after data loss is price, and almost all of it is people
finding the boundary after committing.

### reviews — KEEP

Purpose: the social-proof beat, with no invented social proof. 1,715 real
reviews of competing apps, tallied by theme, nothing quoted.

The restraint is correct and worth stating plainly: an app whose entire flow
asks the user to believe computed numbers cannot afford one fabricated
testimonial. The scroll gate nudges rather than refuses — a disabled button on
the one screen whose job is to earn trust taught the most impatient users that
the app argues back. Blocked presses now report `scroll`.

### notify — KEEP

Purpose: the notification soft-ask over this car's own dated schedule.

iOS grants exactly one system prompt, and opt-in collapses when it fires
without context. Here the user is looking at six real dated services when asked
whether they want to be told about them. The prompt fires on the tap that
promises it. Correct by construction.

Note for analysis: `notification_permission` has no baseline at all. Two
consecutive updates changed what the user knows at the moment they answer.

### paywall — KEEP structure, revisit copy after a cohort

Purpose: the ask. Headline, then the user's own car by name with the count and
date the quiz computed, then three consequences. The sheet itself is a native
RevenueCat paywall configured in the dashboard.

It is a route rather than a modal for a real reason: a user who closes the
sheet has to land somewhere, and landing in the garage means the second offer
can never be made.

The brief asks whether zero conversions indicts the price, the position, the
copy or the preview. **The honest answer is that the data cannot distinguish
them, and the first cohort on build 21 is the first chance to.** Do not move
price. The single highest-value change available is not on this screen at all —
it is knowing how many of the eight historical paywall viewers had actually
understood what they were buying, which the blocked-press and step events can
now begin to answer.

### offer — KEEP

Purpose: the one retry, reached only from a dismissed paywall, and only when a
`discount` offering actually exists in the dashboard — checked before
navigation, so it never promises a trial that cannot be started.

The split is the whole reason there are two paywalls: a trial shown first is
given away to everyone who would have paid outright; a trial shown to someone
walking out is the cheapest conversion in the funnel. Declining ends onboarding
in the garage with the car and plan already built.

## Verdict table

| Screen | Verdict | Basis |
| --- | --- | --- |
| welcome | KEEP | Design. Cheap, and a quiz needs a non-question opener. |
| vehicle | KEEP | Data. The bug is fixed and verified in build 21's bundle. |
| body | OPTIONAL | Data pending. Nothing downstream reads `body_style`. |
| odometer | KEEP | Design. Gate justified; silence was not, and is now fixed. |
| drive | KEEP | Design. Load-bearing and shows its own work. |
| service | KEEP | Design. Watch `when_unanswered`. |
| tracking | KEEP | Design. Answer consumed twice downstream. |
| worry | KEEP | Design. Selects the findings. One tap. |
| analyzing | KEEP | Design. Honest loader; do not fake it. |
| results | KEEP | Design. The payoff. |
| symptoms | KEEP | Design. Dwell now measured. |
| help | KEEP | Design. Already a merge; do not re-split. |
| reviews | KEEP | Design. Restraint is the point. |
| notify | KEEP | Design. Permission asked next to its evidence. |
| paywall | KEEP | Data cannot yet distinguish the failure modes. |
| offer | KEEP | Design. Trial shown last is the cheap conversion. |

One OPTIONAL, fifteen KEEP, nothing REMOVED, nothing MOVED.

## Why this audit cuts almost nothing

The brief instructs: do not retain screens simply because they already exist.
It also instructs: fix bugs before interpreting their behaviour as UX
preference, and do not optimise the middle of a funnel when the problem is at
the beginning. Those two instructions point in opposite directions here, and
the second wins.

Every provable loss in this funnel so far has a mechanical cause, not a length
cause:

- The vehicle screen refused legitimate input. Fixed; verified in the binary.
- Builds 17-20 crashed on launch, so four builds' worth of "drop-off" is a
  process abort.
- Seven controls could refuse a user without emitting anything, which is
  precisely the shape that makes a leaky funnel look bimodal.

Cutting screens now would replace a flow whose problems are known and fixed
with a flow whose problems are unknown, and would burn the one thing the
project does not have — a cohort on a stable bundle — to measure it. The
sixteen screens are not obviously too many for this archetype; Cal AI, Noom and
Flo all run longer. What the flow has never had is a clean read.

**The recommendation is: ship build 21, hold the structure, read the first
cohort, and cut from evidence.** `body` is the first candidate and the cut is a
one-line edit in `src/onboarding/flow.ts` when the data arrives.
