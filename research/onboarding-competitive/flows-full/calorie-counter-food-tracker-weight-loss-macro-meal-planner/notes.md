# Calorie Counter by Numify

Municorn · ~$850K/mo estimated · 90 captured steps · No Free Trial - Soft Paywall
Capture: 178 frames, all served free. `timeline.json` holds the labelled timings.

## Flow structure

```
splash (0.6s)
ATT permission prompt (3.4s)              ← before any value whatsoever
welcome: "Calorie and macro tracking. Simplified." + Get started + Sign In
~40 questions, interleaved with:
  · motivational interstitials (photo + headline + Next, no question)
  · mid-quiz computed payoffs (BMI at Q7, BMR at Q9)
  · a social-proof breather ("Join 1.8M happy users", world map)
  · a mechanism explainer (red restrictive-diet curve vs green tracking curve)
Apple Health pre-prompt screen → system sheet
"Analyzing your answers…" — four named bars + a testimonial
"Welcome to Calorie Counter"
four-tap sentence reveal on a peach shape
paywall #1 (340s) → success stories → plan sheet
paywall again at 693s and 818s
```

## What matters

**First paywall at 340 seconds.** The sample median is 61s. This is a
$850K/mo app asking nearly six times later than typical.

**Payoffs are interleaved, not saved to the end.** BMI is computed at question
seven inside a green card citing Mayo Clinic; BMR ("1324 kcal, your estimated
baseline energy") lands at question nine with an explanation. The user is paid
twice before question ten of forty.

**Every question carries its own justification.** "Biological sex can affect
many physical elements, like our metabolism, muscle mass, or hormones, so we
use it in our calculations." No question is asked bare.

**Every chip carries a definition.** "Sedentary — in many cases, this would
correspond to less than 5,000 steps a day." The label names the option; the
subtitle names the boundary.

**Validation praises rather than refuses.** A weight goal returns "Lose 12% of
Weight — Moderate Goal — a manageable challenge that delivers meaningful health
benefits." The screen never says no.

**The reveal is a sentence broken across four taps**, ending on the user's own
number and their own typed deadline: "designed to get you to 50 kg" / "and lose
7 kg by the Vacation!"

**The paywall sells a timeline, not features.** "Today: Get Instant Access / In
7 Days: Feel Your First Wins / In 4 Weeks: See Visible Results", over 4.8★ and
100K+ ratings, price framed as $0.16/day.

## What Wrenchy should learn

1. **Interleave the payoff.** Wrenchy banks everything for `analyzing` →
   `results` after seven questions. `drive` already does a small version — the
   projection caption updates the moment a range is picked — and it is the
   cheapest proof in the flow that the questions are not decorative. That
   device belongs on `odometer` and `service` too.
2. **Justify each question inline.** Wrenchy's questions are mostly bare. One
   line under `odometer` saying what the reading is used for is free.
3. **Definitions under chips.** `drive`'s four ranges and `tracking`'s options.
4. **Length is not the problem.** This app asks for money six times later than
   Wrenchy's median comparator and earns $850K/mo.

## What Wrenchy must not copy

- **ATT at 3.4 seconds.** Permission before value, and the worst beat here.
- **"60% Off sale · 9 spots remaining."** A fabricated limit on a digital good.
- **Before/after body photos and invented testimonials.** Wrenchy has no users
  to photograph; `reviews` uses real competitor-review tallies instead.
- **"Generating Your Action Plan 98%."** Wrenchy's loader computes real values
  and its bar runs for exactly the readout's duration, on purpose.
