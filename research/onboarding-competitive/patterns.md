# Patterns, and which of them Wrenchy should take

**2026-08-29.** Ten patterns extracted from two kinds of evidence, which are
worth keeping apart because they support very different claims.

**The statistics** (`flow-statistics.md`) come from 1,800 captured iOS flows
with a revenue estimate attached to most of them. They answer questions of the
form "is this unusual". They are observational, the revenue figures are
third-party estimates, and the sample is apps a design library chose to capture
— so they can establish what is normal and can never establish what causes
money.

**The frame reads** come from flows whose entire capture is served free, walked
screen by screen in `flows-full/`. They answer questions of the form "how is
this actually built". Two are read in depth below; both are quiz-archetype
subscription apps of the kind Wrenchy was modelled on.

**Wrenchy's own analytics** are the third input, and the weakest. Twenty
genuine historical entrants, zero purchases, seven comparability breaks in six
days, four builds that crashed on launch, and — until today — seven controls
that could refuse a user without emitting an event. Nothing below is adopted
because Wrenchy's funnel says so. Where the funnel is cited it is to say what
cannot yet be concluded.

## The two flows read frame by frame

### Calorie Counter by Numify — $850K/mo, 90 steps, 178 free frames

`flows-full/calorie-counter-food-tracker-weight-loss-macro-meal-planner/`

110 onboarding frames. **First paywall at 340 seconds.** Structure: splash →
ATT prompt at 3.4s → welcome → roughly forty questions interleaved with
motivational interstitials and mid-quiz computed payoffs → a four-bar analysing
screen → a four-tap sentence reveal → paywall → success stories → plan sheet.
The paywall recurs at 693s and 818s.

### Brainbuddy — $45K/mo, 95 steps, 257 free frames

`flows-full/brainbuddy-quit-porn-now/`

First paywall at 343 seconds. Ends onboarding with a named completion checklist
("Julia, you're all set" over eight things the flow has already done for her),
then a hard paywall with a trial, then an explicit "how your free trial works"
timeline, then the App Store sheet, then three full-screen celebration beats.

Their post-purchase handling is the single most transferable thing in either
flow, and Wrenchy had none of it.

---

## Pattern 1 — Reduce cognitive load

**Evidence from research.** Every question in both flows is one question on one
screen with one control. Numify's numeric entries own the whole screen with the
keypad already up. Chip options carry a definition underneath them rather than
relying on the label: "Sedentary — in many cases, this would correspond to less
than 5,000 steps a day."

**Evidence from Wrenchy.** Already followed, and the history is instructive.
The vehicle screen once carried twenty-six year chips over forty-two make chips
over a filter box — three controls and about seventy tap targets for two
answers, on the first interactive screen in the product. It shed the install
base at a rate nothing else in the flow matched.

**Adopt: already done.** One addition worth making — Wrenchy's chip rows label
the option and not the boundary. `drive`'s four ranges and `tracking`'s options
would read better with the one-line definition Numify puts under every chip.

## Pattern 2 — Ask only what is necessary

**Evidence from research.** The statistics cut against the obvious reading
here. Median onboarding across 1,800 apps is 6 steps, but that median is
bimodal by kind: **11 steps for flows with a quiz (n=411), 3 without (n=560)**.
And length does not rise with revenue — the 500K+ band's median is 5, *lower*
than the <25K band's 6.5, and its share of 10+ step flows is 31% against 42%.
Long onboarding is a genre convention, not a revenue mechanism.

**Evidence from Wrenchy.** Seven quiz questions, of which six are consumed by
the product: year/odometer/drive drive every interval, service writes a real
record, tracking and worry each select downstream content. **`body_style` is
consumed by nothing** — the garage never reads the column and only
`app/onboarding/body.tsx` writes it.

**Adopt: partially.** Not as a mandate to shorten. Ask only what is necessary
means each question earns its place by being consumed, and by that test fifteen
of sixteen screens pass. `body` is the exception and is marked OPTIONAL in the
screen audit pending a clean cohort.

## Pattern 3 — Demonstrate value before asking for money

**Evidence from research.** Median time to first paywall across 1,660 captured
flows is **61 seconds**, p75 127s. Both deep-read flows sit far out in the tail
at ~340s. So the honest statement is that the distribution is wide and the
successful quiz apps sit at the long end of it.

**Evidence from Wrenchy.** Its paywall arrives after eleven screens of
argument, all built from the user's own answers. The two observed completions
took 1m25s and 10m41s. That is inside the normal range and past the median.

**Adopt: already done, and do not "fix" it.** The brief's hypothesis that
Wrenchy asks too late is not supported. The apps that convert best in this
sample ask later than Wrenchy does.

## Pattern 4 — Personalisation increases perceived relevance

**Evidence from research.** Numify computes BMI at question seven and BMR at
question nine, each in a card citing a source, and names the user's own target
in the reveal: "designed to get you to 50 kg", "and lose 7 kg by the Vacation!"
— the deadline is a word the user typed earlier. Brainbuddy uses the user's
name on its completion screen.

**Evidence from Wrenchy.** Strong and already central: `results`, `symptoms`,
`help` and `paywall` are all built from the user's own car and answers, and the
paywall names the vehicle, the count and the date.

**Adopt: already done.** The one gap was after the purchase, which is Pattern 9.

## Pattern 5 — Use progress and reward loops

**Evidence from research.** Numify shows a segmented progress bar on every quiz
screen and a persistent Back arrow. Brainbuddy grants rewards *during*
onboarding — a "Life tree planted!" toast, a tree that grows — so the flow has
already given the user something before it asks.

**Evidence from Wrenchy.** `StepLamps` and "QUESTION n / 7" on the quiz, and
deliberately not on the narrative screens after it, on the reasoning that a
progress counter on a story tells the user how much of it they can skim. That
reasoning is sound.

**Adopt: partially. Reject the reward loop.** Wrenchy's design language rules
out gamification, and a maintenance log that plants a tree is a different
product. The defensible half is what Brainbuddy's checklist does — see
Pattern 10.

## Pattern 6 — Make the result feel generated specifically for the user

**Evidence from research.** Numify's analysing screen runs four *named* bars —
Analyzing Body Parameters, Meals and Activity, Medical Conditions, Generating
Your Action Plan — with a testimonial underneath while it runs. Then a sentence
is broken across four taps on a full-bleed shape: "Based on your answers…" /
"we've created a personalized plan" / "designed to get you to 50 kg" / "and
lose 7 kg by the Vacation!"

**Evidence from Wrenchy.** `analyzing` is the same beat, executed with a
constraint the reference does not accept: every line is a value actually
computed, and the bar runs for exactly as long as the readout takes. Numify's
"98%" on the fourth bar is theatre.

**Adopt: already done, and keep the honesty.** The whole product asks the user
to believe computed numbers. A loader they can catch faking it discredits the
results screen one tap later. The four-tap sentence reveal is available as a
future experiment and is not free — it is four taps.

## Pattern 7 — Delay permissions until their value is obvious

**Evidence from research.** Split. Numify fires App Tracking Transparency at
**3.4 seconds**, before any value at all — that is monetisation infrastructure,
not user experience, and it is the worst thing in either flow. But its Apple
Health request is done properly: a dedicated screen explaining the value, a
Connect button, then the system sheet.

**Evidence from Wrenchy.** `notify` asks for notifications over this car's own
six dated services, and fires the system prompt on the tap that promised it.
This is the correct pattern executed well.

**Adopt: already done. Explicitly reject the ATT-at-3-seconds half.** Note also
that `Purchases.enableAdServicesAttributionTokenCollection()` is currently
commented out in `src/purchases/index.ts` from the crash investigation; if it
is restored, it must not move earlier in the boot path.

## Pattern 8 — Paywalls should sell an outcome, not a feature list

**Evidence from research.** Numify's first paywall is a **time-anchored
outcome timeline** — "Today: Get Instant Access / In 7 Days: Feel Your First
Wins / In 4 Weeks: See Visible Results" — over 4.8★ and 100K+ ratings, with
price framed per day ("$0.16/day") and per week, never per year alone.
Brainbuddy's CTA is "Start rewiring", a verb from the product rather than
"Subscribe".

The statistics: **Free Trial - Soft Paywall is 55% of the sample and has the
highest median revenue ($90K)**; hard paywalls are 11% combined and have the
lowest ($50K / $45K). Soft beats hard on both count and median.

**Evidence from Wrenchy.** The paywall sells three consequences, not features,
and the gauges above them are the user's own car. That is the pattern. Two
observations, neither yet actionable:

- Wrenchy's structure is **paywall without a trial first, trial only on
  dismissal**. The stated reasoning is that a trial shown first is given away
  to everyone who would have paid outright. That is a real argument. It is also
  the minority structure in this sample, and the majority structure has the
  higher median revenue. **This is the single best A/B test available once a
  cohort exists.** It is not a reason to change anything now.
- Price framing is RevenueCat-dashboard-side and was not inspected here.
  Per-day framing is nearly universal in the sample and is a dashboard edit,
  not a code change.

**Adopt: hold, then test.** And do not copy the scarcity device — Numify's
"60% Off sale / 9 spots remaining" is a fabricated limit on a digital good.

## Pattern 9 — Make the post-purchase transition immediate

**This is the pattern Wrenchy was missing, and it is now implemented.**

**Evidence from research.** Brainbuddy, after the App Store receipt clears:
"You're all set. Your purchase was successful." → three full-screen beats
("Well done for getting started" / "For committing to become your best self" /
"Whether your journey is easy…") → the app. Before the sheet it shows "how your
free trial works" as a three-step timeline with "Trial reminder in 6 days 🔔 —
cancel any time in just 15 seconds", which defuses the anxiety that kills trial
starts. Numify follows its purchase with the Daily Calorie Goal screen — the
user's own computed targets — and an "Adjust Goals" control.

Neither drops the user into a list.

**Evidence from Wrenchy.** It did exactly that. `finish("paid")` recorded the
exit and replaced the stack with the garage, so a new subscriber's last screen
was Apple's receipt and their first was one row in a list. Nothing named what
they had bought.

**Adopted.** `app/subscribed.tsx`: names the car, restates the two gauges the
paywall argued from, lists the two capabilities that were behind the Pro badge
in the same words the help screen used, and offers one action. The celebration
beats are deliberately not copied — the Wrenchy version of that moment is the
panel coming up, not confetti. Instrumented with `subscription_success` and
`first_core_action`.

## Pattern 10 — Give the user a clear first action after onboarding

**Evidence from research.** Brainbuddy's pre-paywall screen is the strongest
device in either flow: **"Julia, you're all set"** over eight completed items —
"Quiz complete. Awareness gained. / Tailored rewiring plan created / First
check-in complete / 1-day goal activated / Victory letter stored / First
journal entry written / Life tree planted / Benefit tracking enabled". It
converts the questions the user just answered into assets they already hold,
immediately before asking them to pay to keep them. Then one button.

**Evidence from Wrenchy.** The flow genuinely does build things — a vehicle
row, an odometer reading, a service record, a twelve-item schedule, armed
reminders — and never once says so as a list. It shows the *outputs* on
`results` and the *plan* on `notify`, but never "here is what you now have".

**Adopt: partially adopted, rest deferred.** The first action now exists: the
subscribed screen's single button opens the user's car, not the garage, because
a free garage is a list of one and the schedule lives a level down. The
completion-checklist device is a strong candidate for the pre-paywall slot and
is **not** being added now — it would change what the user reads immediately
before the ask, which is precisely the comparison the first clean cohort is
supposed to make.

---

## What was rejected, and why

| Device | Seen in | Rejected because |
| --- | --- | --- |
| Confetti / celebration beats | Brainbuddy | Design language rules out gamification. |
| "9 spots remaining" scarcity | Numify | A fabricated limit on a digital good. |
| ATT prompt at 3.4s | Numify | Permission before any value; the worst beat in either flow. |
| Before/after testimonial photos | Numify | Wrenchy has no users to photograph, and inventing them ends the product. |
| Invented review counts / star ratings | Both | Same. `reviews` uses 1,715 real reviews *of competitors*, tallied and unquoted, which is the honest substitute. |
| Fake progress percentages | Numify | `analyzing` computes real values; a loader caught faking discredits the results screen one tap later. |

## What the statistics cannot tell you

Repeating the caveats from `flow-statistics.md` because they are the difference
between a finding and a decoration:

- Revenue is estimated by a third party. The bands are an ordering.
- The sample is apps a design library chose to capture. Survivor bias runs in
  exactly the direction that flatters long onboardings.
- `onboarding_step_count` counts captured screens, not routes. Wrenchy's
  sixteen routes are not directly one of these units.
- Nothing here is causal. Apps that make money can afford long onboardings.

The one conclusion the statistics do support, and it is the one that matters
most for this brief: **a sixteen-screen quiz onboarding is not unusual, and
nothing in 1,800 flows suggests shortening it is how apps make money.**

## Where the automotive comparison went

Deliberately noted rather than quietly dropped. The ScreensDesign catalogue has
almost no car-maintenance apps — a keyword sweep over 1,800 entries returned
thirteen matches and every one was an AI photo or trail-tracking app. The
category is not captured.

So the automotive material in this directory is `habit-loop/` and the App Store
screenshot sets for AUTOsist, Drivvo, CARFAX Car Care, Simply Auto, My Car,
Fuelly, Jerry, Way, Zus, Axle, Carly and Car Scanner. Those are **marketing
frames chosen by their developers, not onboarding screens**, and must not be
read as flows. They are useful for one thing only: what the category claims
about itself in the storefront, which is positioning evidence for Wrenchy's own
App Store screenshots, and nothing at all about how those apps onboard.
