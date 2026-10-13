# Wrenchy redesign — research notes (2026-10-12)

Appllama MCP, 14 credits. Screens in `*/img/` (Appllama watermark top-left — ignore).

## Flow: Planta (app 1410126781, $300K/mo, 4.75★)
Plants ≈ cars. Same loop Wrenchy runs: add an item → it gets a care schedule → Today / Upcoming tasks → reminders.
- Home: greeting + one-line status ("all tasks checked off"), status summary cards, Today | Upcoming segmented pill, task cards, FAB add, 3-tab floating bar.
- Upcoming: tasks grouped by "in 10 days" / "in 22 days" cards, item thumbnail + task chip.
- Garden: item rows with health % + next-task chips, photo grid.
- Item detail: photo header, dark "Regular watering: in 10 days · Last: yesterday" banner, Todo | Care info | History tabs.
- "Schedule is based on" + pink "info 90% complete — fill in missing info to improve accuracy" card. → Wrenchy: intervals derived from odometer/drive answers; nudge to fill gaps.
Screen ids: oth_kqzby, oth_naq5n, oth_u3dyn, oth_s3bub, oth_aytq9, oth_7eg12.

## Design: Opal (1497465230, $500K/mo) — primary
Near-black, one glowing hero object per screen, glassy dark cards, floating pill tab bar, reward card ("First step taken … your future self is already thanking you"). Closest fit to Wrenchy's existing flat-dark tokens; adult, premium, $99/yr pricing.
Screen ids: oth_jsci1, oth_gbmxf.

## Design: Bevel (6456176249, $700K/mo) — data layer
Metric rings (Strain/Recovery/Sleep), metric cards with value + "Normal range" + range slider. → service health rows (oil life %, tire tread, next due).
Screen ids: oth_6h08m, oth_71k4y.

## Mascot references (clay wrench retired)
- Finch (1528595748): mascot owns the home scene, mood tied to user's progress, confetti + "Hooray! first completion" toast on task check.
- Catzy (6737681541): pet room header above task list.
- Rootd welcome (spl_n9uog): flat vector creature peeking out of a hole — simple shapes, 2–3 colours, animates cheaply.
- Olive welcome (spl_hzsqk): flat vector produce character, single colour field.
Takeaway (small sample: Rootd and Olive are flat, Finch and Catzy are shaded): the shared mechanic is a mascot whose state reflects the user's data. Flat blue was picked by eye from a style × colour grid (see Mascot decision). Finch/Catzy room scenes read too childish for a $30/yr adult utility; borrow the mechanic (mood = state, celebrate completion), not the toybox.

## Mascot decision (2026-10-12)
Picked: research/redesign/mascot-concepts/grid/flat-blue.png (kie.ai, gpt-image-2-5-flare, 1K, transparent). Flat 2D car, cool blue #4C7DFF.
Rejected: amber (reads as a dashboard warning light), white-grey (muddy on #0A0B0D), cel/soft-3D variants.
Mood map: happy = all on schedule, worried = overdue, sleepy = nothing logged; heads-up (due soon) and celebrating (service logged) still to be generated in the same style.
Known fix for the final set: the near-black wheels and "z" vanish on the app background.

## Mascot set — done (2026-10-12)
All five moods generated from the happy car (kie.ai `gpt-image-2-5-flare-image-to-image`, 2K, transparent), tyres lifted to slate #46506A and the "zzz" to pale periwinkle so both read on #0A0B0D. Sleepy regenerated once off the new happy (first pass drifted wider). Normalised by car-body width (not bbox, so the zzz/sparkles don't shrink the car) → `assets/mascot/car-<mood>{,@2x,@3x}.png` at 160pt, plus `glow.png`. Masters + `gen.sh`/`norm.py` in `design-source/mascot/`. Shipped behind `app_design` = `redesign` (see docs/DECISIONS.md).

## Reference pass on Appllama (2026-10-12)

Ten in-app screens studied: Planta Home Dashboard, Care Schedule, Plant Detail
Overview, Care Task List, Add Missing Data; Opal Score Analysis Home, Today
Dashboard; Bevel Home Dashboard, Summary Dashboard, Today Metrics.

Adopted, and where it lives in arm A:

- Planta's greeting + one-line status, Today | Upcoming segment, "Today's tasks"
  card with the "All tasks completed / New tasks will show up here" empty row
  → `Home.tsx` Today tab.
- Planta's upcoming row (icon in a disc, what, "in 10 days", chevron) → `UpcomingRow`
  in `icons.tsx`, used on Today › Upcoming and the vehicle's To-do.
- Planta's plant detail: hero, dark reminder banner, Todo / Care info / History
  chips, "Schedule is based on" + "Plant info 90% completed" → `VehicleScreen.tsx`
  (To-do / Care plan / History, "Plan N% complete").
- Opal's single glowing object on black with a pill row of metrics under it →
  the mascot hero card with Overdue / Due soon / On track.
- Opal's floating tab bar (icon over label) and Bevel's round "+" beside it →
  `FloatingTabBar`.
- Bevel's metric rings → the interval-left ring on Garage cards.

Not adopted: Planta's premium banners on Home (paywall placement is the
`exit_offer_plans` test's territory, see DECISIONS.md), Bevel's light theme
(the app is dark-only), Opal's gem score (a score was rejected; health here is
interval left).

Icons: no symbol library is installed and adding one is a native change, so
arm A draws its own line set (`design-source/icons/`, rendered to
`assets/icons/` at 1x–3x, tinted at runtime). Keeps the test OTA-shippable.

## Light pass (2026-10-12, after the user rejected the dark reskin)

Arm A moved from Opal-dark to Bevel's light page. Re-checked on Appllama
(2 credits): Bevel Home Dashboard oth_6h08m, Today Metrics oth_71k4y, Measures
List oth_ic5vh, Activity Type Picker oth_3an1u; Opal onboarding onb_5rl7x,
onb_tvdoy, onb_akxn1, onb_46zet. Images in `bevel/img/`, `opal/img/`.

- Bevel: `#F2F2F5` page, white cards on a soft shadow (no borders), "Today, July
  23" date header, a card of three rings split by hairlines, white round header
  buttons, a white floating tab bar (icon over label) with a separate white "+"
  disc, sheets end in a full-width black pill. → `ui.tsx`, Today hero in
  `Home.tsx`.
- Opal onboarding: one hero object at the top, the app speaking in short
  first-person lines ("I'll help protect your focus." → "Hi, Morris."), the
  answer echoed back by name, pill answers. → `ConvoStage` / `convoLine.ts`:
  the car and a speech bubble on every step, named lines once the name is
  known. Opal's black-and-gem look is not carried over; the conversation is.
