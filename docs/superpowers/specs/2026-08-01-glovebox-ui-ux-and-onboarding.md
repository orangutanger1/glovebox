# Glovebox — UI/UX Design and Onboarding Flow

Date: 2026-08-01
Status: proposed
Depends on: `2026-08-01-car-maintenance-log-design.md` (product spec), `plans/2026-08-01-car-maintenance-log.md` (Task 2 design system, Task 8 purchases, Task 9 screens)

---

## 0. Design read

**Reading this as:** a native iOS single-purpose utility for car owners, used one-handed in a driveway or garage, with a dark instrument-cluster language, leaning toward Apple HIG plus a small owned token set.

The taste skill's own Section 13 puts native mobile out of scope and points at Apple HIG. That is the system here. What carries over from the taste skill: the anti-default rules (no AI-blue accent, no decorative dots, no fake precision, no em-dashes), the state-completeness rules (empty / loading / error), the contrast rules, and the layout-repetition discipline.

**Dials:** `DESIGN_VARIANCE 3` · `MOTION_INTENSITY 3` · `VISUAL_DENSITY 5`

Reasoned, not baseline. This is a utility, not a landing page. Variance is low because iOS users navigate by convention and the app's promise is "usable within seconds." Motion is low because every animation is time between the user and a logged oil change, and because the product's credibility is durability, not flair. Density is mid because a service history is a list of facts and the user is scanning for one.

**The design constraint that overrides taste:** competitor reviews name *forced setup* as a top complaint alongside data loss. Every screen and every onboarding step must produce a real record. No screen exists purely to build a mood.

---

## 1. Design language

### 1.1 Palette (revises Task 2 Step 1 tokens)

The planned accent `#3B82F6` is the generic default blue and it also lands close in hue to nothing the app needs. Worse, with red / amber / green already spoken for by due status, a fourth saturated hue makes every screen a traffic light.

Replacement: the ground is neutral near-black, the accent is **bone** — a warm off-white used for primary actions. Maximum contrast in daylight through a windshield, zero hue competition with status color, and unmistakably not a template.

```ts
export const tokens = {
  color: {
    bg:         "#0D0E0F",  // near-black, neutral, not pure #000
    surface:    "#17181A",
    surfaceAlt: "#202225",
    border:     "#2C2E32",
    text:       "#F4F2EE",  // warm off-white
    textMuted:  "#9A9AA0",
    accent:     "#EDE3D2",  // bone — primary button fill
    onAccent:   "#0D0E0F",  // text on bone
    due:        "#E5484D",
    soon:       "#E8A33D",
    ok:         "#6FA98A",  // text only, never a filled badge
  },
  space:  { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius: { sm: 8, md: 12, lg: 16, pill: 999 },
};
```

Rules that go with it:
- **One accent, whole app.** Bone is the only non-semantic color. Red / amber / green mean exactly one thing each: overdue, due soon, healthy.
- **Status color is never decorative.** No colored dot before a nav item or a list row. A badge appears only for `due` and `soon`. An `ok` vehicle shows plain muted text ("Next: oil change, Feb 2027"), not a green pill. Three green badges in a row is noise that trains the user to stop reading badges.
- **Shape lock:** buttons `radius.md`, cards `radius.lg`, inputs `radius.sm`, chips `radius.pill`. No exceptions.
- **Dark only, deliberately.** Not a taste-skill dark-mode violation: this is a native app declaring `userInterfaceStyle` and the product spec already commits to "dark, glare-friendly design" in App Store copy. Light mode is a v2 item, not a v1 gap.

### 1.2 Type

System font (SF Pro) at platform sizes, honoring Dynamic Type. Do not ship a custom typeface: SF is what an iOS utility should read as, and a webfont on a native app is a download the user pays for and gains nothing from.

```ts
text: {
  hero:    { fontSize: 34, fontWeight: "700", lineHeight: 40 },  // onboarding only
  title:   { fontSize: 28, fontWeight: "700", lineHeight: 34 },
  heading: { fontSize: 20, fontWeight: "600", lineHeight: 25 },
  body:    { fontSize: 17, fontWeight: "400", lineHeight: 22 },  // iOS default body, not 16
  caption: { fontSize: 13, fontWeight: "400", lineHeight: 18 },
  numeric: { fontSize: 17, fontVariant: ["tabular-nums"] },      // odometer, cost, dates
}
```

`tabular-nums` on every mileage and cost figure. A history list where `9,000` and `112,480` shift column position looks broken at a glance.

Every screen supports Dynamic Type up to XXL without clipping. Test at the largest accessibility size before submission: a garage app has an older-than-average audience.

### 1.3 Touch, motion, feedback

- **Minimum hit target 44x44pt.** The user may be wearing gloves. The primary action on every screen is a full-width button at `paddingVertical: 16`.
- **Motion budget:** navigation push/pop (system default), list rows fade in on first load, button `scale: 0.98` on press. Nothing else. No parallax, no shimmer, no infinite loops.
- **Haptics carry the weight instead.** `Haptics.notificationAsync(Success)` on a saved service record. `impactAsync(Light)` on chip selection. This is the one place the app should feel physical, because "did that save?" is the exact anxiety the competitors created.
- **Reduced motion:** the only motion above the system default is the list fade. Gate it on `AccessibilityInfo.isReduceMotionEnabled`.

### 1.4 Required states (all screens)

| State | Rule |
|---|---|
| Empty | Composed, tells the user the one next action. Never "No data." |
| Loading | SQLite reads are synchronous and sub-millisecond. There is no loading state for local data, and no skeleton should be invented. The only async surface is the paywall. |
| Error | Inline, adjacent to the field, and **the entered values stay on screen**. Never a toast that discards input. This is the displaced behavior; getting it wrong is shipping the competitor's bug. |
| Offline | Everything works except purchase. Say so in that one place; do not put a global offline banner on an app that has no network. |

### 1.5 Anti-defaults applied

Explicitly not doing: gradient headers, glassmorphic cards over a photo, an illustrated mascot, a bottom tab bar for three screens, a circular progress ring around a car icon, a "your car's health score" gamification number the app cannot honestly compute.

---

## 2. Screen inventory

Five screens plus onboarding. Navigation is a plain stack. No tab bar: two of the five screens are modal forms and one is settings.

### 2.1 Garage (`app/index.tsx`) — home

Purpose: answer "does anything need doing?" in under one second.

```
Garage                                    ⚙︎
────────────────────────────────────────────
 ┌────────────────────────────────────────┐
 │  Civic                        [ DUE ]  │
 │  84,210 mi · Oil change, 400 mi over   │
 ├────────────────────────────────────────┤
 │  Tacoma                                │
 │  31,905 mi · Next: tire rotation, Mar  │
 └────────────────────────────────────────┘

 ┌────────────────────────────────────────┐
 │            Log a service               │  ← primary, bone
 └────────────────────────────────────────┘
              Add vehicle                     ← text button
```

- The **primary action is "Log a service", not "Add vehicle."** The plan's Task 9 Step 1 has it the other way around. Logging is the recurring loop and the reason for retention; adding a vehicle happens once. On a single-vehicle account, "Log a service" jumps straight to that vehicle's log form with no picker.
- Row subtitle is a sentence, not a data dump: worst-status service and its magnitude. "400 mi over" is more useful than a date the user has to subtract.
- Settings is a gear in the nav bar, not a centered text link at the bottom of the scroll (the plan's current `<Link>` at the end of the page is easy to miss and looks unfinished).
- **Empty state** applies only to a user who deleted their last vehicle, since onboarding guarantees one. Copy: "No vehicles. Add one to start logging." plus the add button.

### 2.2 Vehicle detail (`app/vehicle/[id].tsx`)

Two zones, separated by whitespace and one hairline, not by two card containers.

```
‹ Garage        Civic                  Edit
────────────────────────────────────────────
84,210 mi
2019 Honda Civic

DUE NOW
  Oil change            400 mi over    [DUE]
  Tire rotation         due in 12 days [SOON]

HISTORY
  Oil change            Mar 2, 2026 · 79,100 mi
  Tire rotation         Mar 2, 2026 · 79,100 mi
  Brake inspection      Nov 14, 2025 · 71,050 mi
  ...
 ┌────────────────────────────────────────┐
 │            Log a service               │
 └────────────────────────────────────────┘
```

- "DUE NOW" section is omitted entirely when nothing is due. No "All caught up ✓" card: absence is the message, and the section header returning is itself the signal.
- History rows: swipe-left to delete, which soft-deletes and shows an **undo snackbar for 8 seconds**. The undo is backed by clearing `deleted_at`, per the product spec, so it survives an app kill mid-window; the snackbar is only the affordance.
- Long history uses `FlatList`, not the plan's `ScrollView` inside `Screen`. A five-year log is hundreds of rows.

### 2.3 Log a service (`app/vehicle/[id]/log.tsx`) — the core action

Target: **under 15 seconds, two taps and one number, from cold.**

```
Cancel        Log a service            Save
────────────────────────────────────────────
WHAT
 (Oil change) (Tire rotation) (Brakes)
 (Air filter) (Inspection)    (Other…)

WHEN
 (Today) (Yesterday) (Pick a date…)

ODOMETER
 [  84,210          ] mi

Cost (optional)          Notes (optional)
```

- Service type is a chip grid, not a picker wheel. The six most-used types are one tap; "Other…" opens the full list with a search field.
- Date defaults to **Today**, preselected. Most people log the service on the day it happened.
- Odometer prefills with the vehicle's last known reading so the user edits three digits instead of typing six. Numeric keypad. This field, not the type, gets autofocus.
- Cost and Notes are collapsed behind their labels and never block Save.
- Save is enabled from the first render because every required field has a valid default. A disabled primary button on a form the user has not touched teaches them the form is work.
- On save: success haptic, dismiss, and the Garage/detail row updates with the new next-due line visible. The user sees the consequence of the log immediately, which is the whole product in one interaction.

### 2.4 Add vehicle (`app/vehicle/new.tsx`)

One required field: nickname. Year / make / model / odometer are optional and shown in one group below it. Do not build a VIN decoder or a make/model dropdown tree; the product spec lists VIN decode as a non-goal and a three-level dropdown is exactly the setup burden being displaced.

When the free user already has one vehicle, the paywall is presented **before** this screen opens, not after the form is filled. Making someone fill a form then telling them it costs money is the worst version of this interaction.

### 2.5 Settings (`app/settings.tsx`)

Grouped list, in this order:

1. **Export** — "Export all records (CSV)". Directly under it, in caption: "Free forever, for everyone." This is the trust claim; it belongs at the top of settings where a skeptical user goes looking.
2. **Reminders** — notification permission state, and a link to iOS Settings when denied.
3. **Glovebox Pro** — status, or upgrade, plus **Restore purchases**.
4. **About** — version, privacy policy, terms, "Your data never leaves this phone."

---

## 3. Onboarding research

### 3.1 What onboarding is for

Onboarding's job is to move a new user to first realized value (the "aha moment") before they lose interest, and to be measured against an activation metric rather than a completion rate. The consistent finding across current sources: value must be evident inside roughly the **first 60 seconds**, users must be able to skip, the flow should lead with what the user can *do* rather than a feature tour, and progressive disclosure beats a full feature walkthrough because a new user is trying to solve one problem, not learn a product. ([Plotline](https://www.plotline.so/blog/mobile-app-onboarding-examples), [Adapty](https://adapty.io/blog/how-to-fix-your-onboarding-flow/), [Appcues](https://www.appcues.com/blog/best-user-onboarding-examples), [UXCam](https://uxcam.com/blog/10-apps-with-great-user-onboarding/))

### 3.2 Key elements of flows that convert

Drawn from the sources above plus the subscription-specific breakdowns:

| Element | What it does | Applies to Glovebox? |
|---|---|---|
| Problem → outcome framing | Names the pain before the product | **Yes.** The pain is documented in 1,400 competitor reviews. |
| Goal / personalization question | Segments the user, raises investment | **Adapted.** Only if the answer produces real data. No throwaway quiz. |
| Progressive, do-it-now steps | Learning by doing beats a tour | **Yes.** Setup is the tutorial. |
| Early aha moment | First realized value inside the flow | **Yes.** A computed real due date from the user's own car. |
| Social proof | Ratings, testimonials, counts | **Limited.** A brand-new app has no honest numbers. Do not fake them. |
| Notification priming (soft-ask first) | iOS opt-in collapses below 30% when the system prompt fires with no context | **Yes.** Critical: reminders are half the product. |
| Pre-paywall "we built your plan" loader | Manufactures anticipation | **No.** A fake loading bar on an app whose entire pitch is honesty is a self-inflicted wound. Replaced by a genuine computed result. |
| Skippable everything | Prevents hard bounce | **Yes.** |
| Paywall at the end, with trial | Highest-converting placement | **Yes.** |

### 3.3 Paywall placement evidence

RevenueCat's benchmark data: **onboarding paywalls with a trial convert at 1.35% on average, the highest of any placement-and-trial combination.** Roughly 50% of paid conversions and 90% of trial starts happen on Day 0, and 44.5% of all purchases happen on Day 0. Practitioner reports put onboarding at around half of all trial starts. The framing that matters: the onboarding and the paywall are **one funnel**, and the screens before the paywall determine whether it converts more than the paywall design does. ([RevenueCat: State of Subscription Apps](https://www.revenuecat.com/state-of-subscription-apps), [RevenueCat: guide to mobile paywalls](https://www.revenuecat.com/blog/growth/guide-to-mobile-paywalls-subscription-apps), [Adapty](https://adapty.io/blog/high-performing-paywall-2026/))

This confirms the requested placement. It also produces one action item in §6.

### 3.4 Similar apps

Competitor onboarding, from the research already in the product spec plus current reviews:

- **AUTOsist** — account required, then a virtual garage; free tier is one vehicle. Same gate as ours, worse first minute (login before value).
- **Drivvo** — opens to a vehicle overview; broad feature surface (fuel, expenses, business use) means the first screen asks the user to care about several things at once.
- **Fuelly** — fuel-first, community MPG comparison. Different job entirely; we deliberately do not compete on that cluster.
- **CARFAX Car Care** — free, account-gated, dealer lead generation. Its onboarding optimizes for capturing the user, not for logging a service.

The pattern across all four: **onboarding is account creation, and value comes after.** Glovebox has no account, so its onboarding can be pure setup and can reach value first. That inversion is the flow's structural advantage, and it should be visible to the user within the first two taps.

The non-competitor pattern worth borrowing is the personalization-question flow used by consumer subscription apps (goal selection, then a result screen, then the paywall). Borrow the *shape*: escalating small commitments, a payoff screen, then the offer. Reject the *content*: their questions are often decorative. Ours each write a row to SQLite.

---

## 4. Glovebox onboarding flow

**Principles**
1. **Every screen produces a durable record.** Nothing exists to build mood. This is what keeps a 6-screen flow from becoming the setup burden the reviews complain about.
2. **No account, and say so out loud on screen 1.** It is the differentiator and it is also a reason to keep going.
3. **Skippable throughout.** Skip advances; it never dead-ends and never re-asks later with a modal.
4. **No fabricated numbers, no fake loading, no invented social proof.** The product is credibility.
5. **Target: first service logged inside 60 seconds.**

Runs once, on first launch, before the Garage. Completion is recorded in a new `app_state` table (additive migration v2), not in memory. A user who force-quits mid-flow resumes where they left off with their partial vehicle intact.

---

### Screen 1 — Value

```
                Glovebox

    Your service records,
    kept forever.

    On this phone. No account, no server,
    nothing to log out of.

 ┌────────────────────────────────────────┐
 │            Set up my car               │
 └────────────────────────────────────────┘
```

- Full-bleed dark, one real photograph or nothing. If no image asset exists at build time, ship type-only rather than a stock car photo that reads as a template. Do not build a div-illustration of a car.
- Headline is the outcome. Subline is the mechanism and the differentiator, 12 words.
- One button. No "Log in" (there is none), no "Skip" (there is nothing to skip yet), no version badge.

### Screen 2 — The car

```
‹                                      Skip

  What are you driving?

  Name it
  [ Civic                              ]

  Optional
  [ Year ] [ Make ] [ Model ]

 ┌────────────────────────────────────────┐
 │               Continue                 │
 └────────────────────────────────────────┘
```

Writes a real `vehicles` row. Nickname autofocuses; keyboard is up on arrival. Optional fields are one row of three small inputs, visually subordinate. Skip creates a vehicle named "My car" and moves on, because a user with a vehicle row can use the app and a user without one cannot.

### Screen 3 — The odometer

```
‹                                      Skip

  How many miles on it?

        [  84,210  ] mi

  Used to work out what is due by mileage,
  not just by date.

 ┌────────────────────────────────────────┐
 │               Continue                 │
 └────────────────────────────────────────┘
```

Large numeric input, keypad up on arrival, `tabular-nums`. The one-line explanation earns the question; an unexplained number field mid-onboarding is where people quit. Skip is honest about the consequence in caption text: "Then reminders will use dates only."

### Screen 4 — Last service

```
‹                                      Skip

  What did you last get done?

  (Oil change) (Tire rotation) (Brakes)
  (Air filter) (Inspection)   (Something else)

  Tap one. You can log the rest anytime.
```

Selecting a chip advances immediately to a one-tap date question, no Continue button:

```
  When was the oil change?

  (Just now) (Last month) (3 months ago)
  (6 months ago) (Pick a date…) (Not sure)
```

- This is the personalization question, and unlike the pattern it borrows from, the answer becomes a `service_records` row.
- Approximate answers are allowed and normalized to a date. "Not sure" skips the record and the flow still works; the app then treats the service as due now, which is the safe direction to be wrong in.
- Odometer for this record defaults to the reading from screen 3.

### Screen 5 — The aha

```
  Done. Here is what Glovebox knows.

  Civic · 84,210 mi

  Oil change          due Sep 2, 2026 · 89,210 mi
  Tire rotation       not logged yet
  Brake inspection    not logged yet

  Whichever comes first, date or mileage.
```
```
 ┌────────────────────────────────────────┐
 │               Continue                 │
 └────────────────────────────────────────┘
```

- The payoff, and it is real: `nextDue()` computed from data the user just entered, 40 seconds after install.
- It also demonstrates the dual date/mileage model, which no competitor communicates clearly, without a tutorial screen.
- The unlogged services are shown deliberately. They show the shape of the thing and invite the next log without nagging.
- **No fake progress bar, no "analyzing your vehicle."** The computation is genuinely instant and pretending otherwise contradicts the product.

### Screen 6 — Reminder permission (soft-ask)

```
  Want a reminder when it is due?

  One notification per service, on the day
  it comes due. Nothing else, ever.

 ┌────────────────────────────────────────┐
 │           Remind me                    │
 └────────────────────────────────────────┘
              Not now
```

- Soft-ask first; the OS prompt fires only after "Remind me." A denied OS prompt is permanent, and firing it cold is the documented failure mode.
- "Not now" is a real option and does not re-prompt on the next launch. Degrades to in-app due badges per the product spec. Settings offers it again whenever the user wants it.
- Copy states the exact frequency, because "will this app spam me" is why people decline.

### Screen 7 — Paywall (RevenueCat, remote)

Presented immediately after screen 6 resolves, with `presentPaywall()`, not `presentPaywallIfNeeded()`. The latter is correct at the add-vehicle gate in Task 9, but here the intent is to always show the offer once.

Dismissal lands in the Garage with the vehicle and the first service record already there. **The free tier is fully usable and export is never gated**; the paywall is an offer, not a wall.

---

## 5. Paywall specification

Built in the RevenueCat dashboard so copy and price change without a review cycle. This is the content spec for that editor.

```
✕                                    Restore

  Glovebox Pro

  Unlimited vehicles.
  Service intervals set your way.

  ✓  Every car you own, in one garage
  ✓  Custom intervals per service
  ✓  Records stay on your phone, always

  ┌──────────────────────────────────────┐
  │  Yearly        $19.99/yr   BEST VALUE│  ← preselected
  │  3 days free, then $1.67/mo          │
  ├──────────────────────────────────────┤
  │  Monthly       $2.99/mo              │
  └──────────────────────────────────────┘

 ┌────────────────────────────────────────┐
 │             Start free trial           │
 └────────────────────────────────────────┘

  Export is free forever, with or without Pro.

  Terms · Privacy · Cancel anytime in Settings
```

Rules:
- **Close button visible on arrival**, top-left, standard size. A hidden or delayed dismiss is an App Review 3.1.2 risk and it converts worse anyway.
- **Outcomes, not features.** "Every car you own, in one garage" beats "Multiple vehicle support."
- Annual preselected with the per-month equivalent shown. Two options only.
- **No countdown timer, no "3 spots left," no invented user counts, no five-star quotes from people who do not exist.** An app whose pitch is that competitors lie about durability cannot open with fake scarcity.
- The export line is the trust anchor and stays on the paywall permanently.
- Restore, Terms, Privacy all present and tappable. Required, and Task 0 still has the privacy/terms URLs unchecked.

---

## 6. Actions this creates

1. ~~Add a free trial to `pro_annual`.~~ **Done.** 3-day free trial created via `asc` across all 174 availability territories on 2026-08-01. The benchmark justifying end-of-onboarding placement is specifically *onboarding paywall plus trial*; without an introductory offer the flow would have shipped missing the thing that makes the placement work.
2. **Migration v2: `app_state` table** (`key TEXT PRIMARY KEY, value TEXT`) for the onboarding-complete flag and resume point. Additive, per the migration constraint.
3. **Revise Task 2 Step 1 tokens** to §1.1 of this document before any screen is written, per the plan's own "design system exists before any screen" constraint.
4. **Revise Task 9 Step 1**: Garage primary action becomes "Log a service"; "Add vehicle" becomes the secondary; settings moves to a nav-bar gear.
5. **New plan task: onboarding.** Files: `app/onboarding/_layout.tsx`, `welcome.tsx`, `vehicle.tsx`, `odometer.tsx`, `service.tsx`, `ready.tsx`, `reminders.tsx`, plus `src/onboarding/state.ts`. Consumes `db`, `schedule`, `notify`, `purchases`. Route guard in `app/_layout.tsx` redirects to onboarding when the flag is unset.
6. **Vehicle detail switches to `FlatList`**, and drops the `Screen` wrapper with it — a `FlatList` inside `Screen`'s `ScrollView` does not virtualize.

**Status: all six are applied to `plans/2026-08-01-car-maintenance-log.md`.** Onboarding landed as Task 9.5, after the screens rather than before them, because the flow ends by landing the user in the Garage and the Garage has to exist first. Item 1 is the only one that is not a code change: the trial has to be created in App Store Connect and it needs review time, so it sits in Task 0 with the other lead-time items.

## 7. What is not being measured

There is no analytics SDK in v1, by design. That means the onboarding funnel is not instrumented and step-level drop-off is unknown. RevenueCat's own paywall events give paywall-view-to-purchase and nothing upstream of it. This is an accepted trade for the no-network promise. If onboarding needs tuning later, the honest options are an on-device counter exported with the CSV, or accepting App Store Connect's install-to-purchase ratio as the only signal. Do not quietly add an SDK.

## 8. Open questions

- Screen 1 needs one real photographic asset (dark garage or dashboard, 1290x2796). Generate or source before build; ship type-only rather than stock-template imagery.
- Interval defaults for screen 5 come from `DEFAULT_INTERVALS`, which are generic rather than per-make. The product spec already flags this as an open risk. Onboarding makes it visible on screen 5, sooner than anywhere else, so the defaults need to be defensible before launch.

**Sources:** [Plotline](https://www.plotline.so/blog/mobile-app-onboarding-examples) · [Adapty: fixing onboarding](https://adapty.io/blog/how-to-fix-your-onboarding-flow/) · [Adapty: high-performing paywalls](https://adapty.io/blog/high-performing-paywall-2026/) · [Appcues](https://www.appcues.com/blog/best-user-onboarding-examples) · [UXCam](https://uxcam.com/blog/10-apps-with-great-user-onboarding/) · [RevenueCat: State of Subscription Apps](https://www.revenuecat.com/state-of-subscription-apps) · [RevenueCat: paywall guide](https://www.revenuecat.com/blog/growth/guide-to-mobile-paywalls-subscription-apps) · [Airbridge](https://www.airbridge.io/en/blog/5-steps-app-onboarding-before-the-paywall)
