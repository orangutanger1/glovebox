# Brainbuddy: Quit PMO

~$45K/mo estimated · 95 captured steps · Free Trial - Hard Paywall
Capture: 257 frames, all served free. First paywall at 343s.

Included for one reason: **it is the clearest post-purchase sequence in the
corpus**, which is the beat Wrenchy was missing entirely.

## Flow structure, from the paywall on

```
in-onboarding rewards: "Life tree planted!" toast, a tree that grows
authority beat: "Did you know? Tracking tools can enhance goal-directed
  behavior" — cited to Harvard University
Stories: long first-person testimonials
Benefits: "Imagine your life free from porn. What benefits motivate you?"
  → multi-select → CTA becomes "Track 4 improvements"
"Julia, you're all set" — a named completion checklist, 8 items
paywall: "Become the best version of you" · "Life-changing", 1M+ downloads
  · "7 day FREE trial! Then $12.99/month" · CTA "Start rewiring"
"How your free trial works" — 3-step timeline, "Trial reminder in 6 days 🔔,
  cancel any time in just 15 seconds"
App Store sheet → "You're all set. Your purchase was successful."
three celebration beats, confetti, TAP TO CONTINUE
```

## What matters

**The completion checklist is the strongest device in either flow.** "Julia,
you're all set" over: *Quiz complete. Awareness gained. / Tailored rewiring plan
created / First check-in complete / 1-day goal activated / Victory letter stored
/ First journal entry written / Life tree planted / Benefit tracking enabled.*

It converts questions the user just answered into assets they already hold,
immediately before asking them to pay to keep them. The user is not being sold
a future; they are being shown a present they might lose.

**The trial-mechanics screen defuses the real objection.** Not "cancel
anytime" in small print — a three-step timeline with the reminder date and how
long cancelling takes. Trial anxiety is answered before it is felt.

**The CTA is a product verb.** "Start rewiring", not "Subscribe" or "Continue".

**The purchase is not the end of the flow.** Three full-screen beats stand
between the receipt and the app.

## What Wrenchy should learn

1. **Something must stand between the receipt and the product.** Adopted:
   `app/subscribed.tsx`.
2. **Name what the flow already built.** Wrenchy creates a vehicle, an odometer
   reading, a service record, a twelve-item schedule and armed reminders, and
   never says so as a list. The checklist device is the natural fit for the
   screen before the paywall — deferred, because changing what is read
   immediately before the ask is exactly the comparison the first clean cohort
   is meant to make.
3. **A product verb on the CTA.** Wrenchy's is `offer.paywall.cta`.
4. **Answer the trial objection explicitly** if trial-first is ever tested.

## What Wrenchy must not copy

- **Confetti and three congratulation beats.** The design language rules out
  gamification, and a maintenance log that throws a party for taking your money
  reads as a different product than the one just sold. Wrenchy's equivalent is
  the panel coming up with the alarms accounted for.
- **In-onboarding reward objects** (the life tree). Same reason.
- **"Life-changing" + 1M downloads.** Wrenchy has neither and will not invent
  them.
