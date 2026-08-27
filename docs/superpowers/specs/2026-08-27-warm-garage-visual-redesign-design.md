# Warm Garage — the consumer visual system

**Status:** proposed 2026-08-27. Supersedes `2026-08-01-glovebox-instrument-panel-design.md`
in full. That document defined the material model, colour, and component depth system; every
part of it is replaced here. It stays in the repo as the record of why the metal existed and
what it fixed, because this document only makes sense against it.

Screen flow, copy, and onboarding order remain governed by
`2026-08-01-glovebox-ui-ux-and-onboarding.md` and `2026-08-03-onboarding-conversion-flow-design.md`,
with the single flow change in §5 of this document.

---

## Why this exists

Five pieces of unprompted tester feedback, from two people who were asked only "give me
feedback for my app":

- "not a bad idea" / "UI is a little old looking though" / "may want to reference a diff app"
- "try making the screenshots a lil more polished"
- "looks good overall" / "love the theme" / "if you're targeting mechanics or b2b garages then
  it's good to go" / "if you are doing b2c with average consumer then maybe needs a little
  visual treatment and illustrations"

Both testers converge on one finding: **the app reads as shop software.** Neither says the
instrument-cluster idea is wrong — one explicitly likes it. What they are reacting to is
execution that signals "tool" rather than "consumer product", and a store listing that does
not sell.

Four things in this repo produce that signal, and each is checkable:

1. **`src/design/tokens.ts` implements a named anti-pattern.** Depth is built from
   `borderTopColor`/`borderBottomColor` hairlines plus a 3px opaque `edgeSolid` band under
   every raised control. Current industry guidance names this exactly — thick borders around
   every element, cards stamped out with a cookie cutter, when real depth comes from soft
   shadow, backdrop blur, and layered translucency.
2. **The OS moved and the app did not.** Liquid Glass is the iOS 26 system material and Apple
   requires full support by September 2026. `expo-blur` is a dependency but glass is confined
   to sticky headers and footers; every other surface is opaque brushed metal. Against an
   iOS 26 home screen this is the loudest dated signal the app emits.
3. **There is no typography.** `grep -r "fontFamily\|useFonts" src app` returns nothing.
   `expo-font` is an installed dependency doing no work. The app runs on five system sizes
   plus an uppercase letterspaced `legend` and `tabular-nums` `readout` applied to every
   number on every screen. Uppercase legends over monospaced figures *is* the B2B tell.
4. **There is no imagery.** `assets/onboarding/` contains exactly two files, `light.jpeg` and
   `metal.jpg`, and both are textures. There is no vehicle art, no illustration, and no icon
   system beyond a wrench glyph and a gear. The B2C tester's "needs illustrations" is a
   literal description of an empty asset directory.

Separately, the store listing is technically stale: `store/screenshots/*/IPHONE_65/` at
1242×2688 is the legacy 6.5" size, which the App Store upscales; frame 1 is mocked in a
notched iPhone while frame 2 uses a Dynamic Island; and all six frames are the same layout
with no narrative order.

## Direction

**Light-first, warm, consumer. Modern materials. Dark retained as a mode.**

The instrument-cluster *thinking* survives — status colour, honest readouts, tabular figures,
magnitudes over dates. The instrument-cluster *material* does not. What the app looked like was
a 2013 skeuomorphic cluster; what it becomes is a calm warm-paper record book with three status
colours, which is the same information design in a consumer skin.

Light is the default and the state the store screenshots show. Dark is a mode, not the identity.
This is the compromise that keeps what the second tester liked while fixing what the first
disliked: a first-run that is bright, warm, and illustrated, and a night mode for the people who
want it.

### Non-goals

- No flow changes beyond the one step in §5. Copy, question order, paywall placement, pricing,
  and the funnel stay as they are.
- No new runtime dependencies for imagery. No `react-native-svg`, no vehicle-image API, no
  network call. The "nothing leaves your phone" promise is load-bearing and imagery must not
  touch it.
- No illustration on quiz screens. See §4.
- No RevenueCat paywall restyling. It is a native modal configured in the dashboard and is not
  stylable from here — unchanged from the previous spec.
- No icon set for the 13 service types. Rejected in §4.

---

## 1. Colour and the theme model

Two surfaces, three status colours, one warm accent. No gradient on any chrome.

| Role | Light | Dark |
| --- | --- | --- |
| `base` | `#F7F4EF` | `#101215` |
| `card` | `#FFFFFF` | `#191C20` |
| `cardSunken` | `#F2EEE8` | `#22262B` |
| `ink` | `#14161A` | `#F5F3EF` |
| `inkMuted` | `#5C6068` | `rgba(245,243,239,0.60)` |
| `inkFaint` | `#8A8E96` | `rgba(245,243,239,0.38)` |
| `hairline` | `rgba(20,22,26,0.08)` | `rgba(255,255,255,0.08)` |
| `accent` | `#C2611A` | `#E8933D` |
| `onAccent` | `#FFFFFF` | `#101215` |
| `soon` | `#E08A1E` | `#F0A73C` |
| `ok` | `#1F7A5C` | `#3E9B7A` |
| `overdue` | `#C1121F` | `#E0313D` |
| `overdueWash` | `rgba(193,18,31,0.08)` | `rgba(224,49,61,0.14)` |

`accent` is the brand and carries primary CTAs. The three status colours map 1:1 onto the
existing `dueStatus` return type (`due` / `soon` / `ok`) in `src/schedule` — no new state, and
the semantic reservation from the previous spec survives: **`overdue` red is never a primary
button.** `soon` amber replaces the bare orange dot in the Garage.

### How components read it

`tokens.ts` currently exports a frozen object read at module scope as `tokens.color.housing`.
Two themes make that a runtime lookup. The split:

- `tokens.space`, `tokens.radius`, `tokens.text`, `tokens.motion` stay static and keep their
  import sites unchanged.
- `tokens.color` and `tokens.material` are **deleted**. Colour comes from
  `useTheme(): Palette`, a hook over a `ThemeContext` provided in `app/_layout.tsx`.

Every consumer is already a function component using inline styles — there is no module-scope
`StyleSheet` holding a colour anywhere in `src/design` or `app` — so the hook is a mechanical
substitution with no restructuring.

Persistence: a `theme` row in the existing `app_state` table, values `system` | `light` | `dark`,
default `system`, read through the same accessor shape as `distance_unit`. Resolution uses
React Native `useColorScheme()` when the value is `system`.

## 2. Materials

Deleted outright from `tokens.ts`: `material.metalFace`, `material.edgeHeight`,
`material.edgePressed`, `material.pressTravel`, `color.housing`, `color.metal`, `color.metalHi`,
`color.metalLo`, `color.edge`, `color.edgeSolid`, `color.hairlineLit`, `color.redGlow`.
`assets/onboarding/metal.jpg` is deleted with them.

Three replacements, and nothing else:

| Was | Becomes |
| --- | --- |
| Metal gradient face + 3px hard bottom edge + flipped per-side borders | **Raised:** `card` fill, one `hairline` border, soft shadow (`y: 2, blur: 8, alpha: 0.06` light / `0.35` dark) |
| Inset well via flipped border colours | **Sunken:** `cardSunken` fill, one `hairline` border, no shadow |
| `expo-blur` on headers and footers only | **Glass:** `BlurView` for all floating chrome — headers, footers, sheets, modal scrims — following the iOS 26 material |

Press feedback moves from geometry to opacity plus haptics: `0.96` scale and `0.9` opacity on
press, with `expo-haptics` `impactAsync(Light)` on every primary action. `expo-haptics` is
already installed and the previous spec noted it was unused; this wires it.

Radius scale grows: `sm: 10, md: 16, lg: 22, xl: 28, pill: 999`. Spacing gains `card: 20` for
internal card padding. Both are the cheapest available "modern" signal — the flat-vs-dated
difference is almost always spacing.

**Nested containers are removed.** The Garage vehicle card currently contains an inner
"Open and log a service" pill with its own fill and border — a card inside a card inside a
dark screen. The whole card becomes the tap target with a single trailing chevron, and the
inner pill is deleted.

## 3. Typography

- **Display / headlines:** Instrument Sans, SIL Open Font License, Semibold (600) and Bold (700)
  only. Two static `.ttf` files in `assets/fonts/`, loaded via `expo-font` `useFonts` in
  `app/_layout.tsx` behind the existing splash hold. Applied to `text.hero`, `text.title`,
  `text.heading`.
- **Body, labels, controls:** system font. Unchanged.
- **Numbers:** system font with `fontVariant: ["tabular-nums"]`. Unchanged — this is the part of
  the old system that was right.
- **`text.legend`:** survives as a token but its application is cut to gauge readouts only. Every
  other uppercase letterspaced label becomes sentence-case `caption` in `inkMuted`. This is a
  per-call-site edit across the app, and it is the single highest-leverage change in this
  document for the "old looking" complaint.

Font loading failure must not blank the app: `useFonts` error falls through to system font and
the app renders. No splash-screen deadlock on a missing asset.

## 4. Imagery — four assets, and where each one goes

The first draft of this direction specified 40 assets. That was wrong. Reference onboarding
flows put art at the emotional bookends and leave the middle typographic — art on a quiz screen
competes with the question and slows the tap. The flow is 15 routes; art belongs on two of them,
and the in-app art must earn its place by being *functional* rather than decorative.

| Asset | Count | Size | Format |
| --- | --- | --- | --- |
| Vehicle body-style marks | 7 | 1200×640 | transparent PNG @3x, single flat ink colour |
| Welcome hero illustration | 1 | 1200×900 | transparent PNG @3x, full palette |
| App icon + splash mark | 1 | 1024×1024 | opaque PNG |
| Store screenshot panorama | 1 | 7740×2796 | opaque PNG, sliced to 6 |

The body-style marks are drawn as a **single flat ink colour on transparency**, so React Native
`tintColor` recolours them per theme from one file. Seven files, not fourteen.

### Usage map

| Route / surface | Asset | Rationale |
| --- | --- | --- |
| `onboarding/welcome` | Hero illustration (light); existing `light.jpeg` serves dark | The one screen whose job is mood, not information |
| `onboarding/body` (new, §5) | 7 body-style marks | Functional: they *are* the control |
| `onboarding/results` | The user's own mark, large | Already on disk from the previous step. Zero new assets, and it is *their* car |
| `onboarding/paywall`, `onboarding/offer` | Same mark, small, above the price | Consistent header art tied to the CTA |
| `app/index.tsx` Garage cards | Same mark at card scale | The payoff: cards stop being grey rectangles |
| `app/vehicle/[id].tsx` header | Same mark | Consistency |
| `onboarding/odometer`, `drive`, `service`, `tracking`, `worry`, `symptoms`, `help`, `reviews`, `notify`, `analyzing`, `vehicle` | **none** | Quiz and argument screens |

One asset family therefore carries the entire visual identity, and by the time the user reaches
the paywall it is a silhouette of the car they chose themselves.

### Rejected: a service icon set

A 17-icon set for the 13 service types plus utilities was specified and is rejected. The service
names are already text, already translated into 16 locales, and already scannable in a list. A
glyph for "Cabin Air Filter" is not universally legible, so the set would add per-icon ambiguity
risk across those locales while buying nothing at the log sheet.

### Rejected: per-make/model vehicle images

CarsXE and VinAudit both expose vehicle images by year/make/model with license rights included.
Rejected: it is a network call per vehicle in an app whose entire positioning is "no account,
nothing leaves your phone", plus a recurring bill, to replace a silhouette the user can pick in
one tap.

## 5. The one flow change: a body-style step

Vehicle identity is free text today — `vehicleForms.new.namePlaceholder` is `"2019 Civic"`, and
`app/onboarding/vehicle.tsx` collects a year drum plus make and model fields. Nothing in the
schema can key art off. Without a body style there is no vehicle art, and without vehicle art
this redesign is a palette swap.

**New route `app/onboarding/body.tsx`, placed immediately after `vehicle` and before
`odometer`.** Seven large tappable marks in a 2-column grid. **Tapping a mark records the answer
and advances** — no Continue button, no second interaction. A single-tap step is close to free on
drop-off and it is the most visual screen in the flow.

Deliberately its own step rather than a third control on `vehicle`: that screen's own file
comment records that it was cut back from a version with "three controls and about seventy tap
targets for two answers", and a seven-card grid would re-create exactly that.

- **Values:** `sedan` | `hatchback` | `coupe` | `wagon` | `suv` | `pickup` | `van`.
- **Schema:** migration 6, `ALTER TABLE vehicles ADD COLUMN body_style TEXT;`. Nullable, so
  every existing row reads as "unknown", which is what it is. Unknown falls back to the sedan
  mark everywhere art is shown, with no "unknown" state in the UI.
- **Editing:** `app/vehicle/[id].tsx` gains a body-style row so the fallback is correctable, and
  `updateVehicleIdentity` accepts the field.
- **i18n:** 9 new keys — `onboardingA.body.title` plus 7 labels plus `vehicle.body.label` — added
  to all 16 catalogs. The parity tests in `tests/i18n.test.ts` and
  `tests/localization-smoke.test.ts` assert key and placeholder parity across every locale, so a
  partial rollout fails the suite by design.
- **Analytics:** emits `onboarding_step_viewed { route: "body", quiz_step: null }` through the
  existing `OnboardingScreen` frame, plus `trackQuizAnswer` on selection.
- **Comparability:** this adds a step, so it breaks depth-in-flow comparisons. An entry must be
  appended to `docs/superpowers/specs/2026-08-26-funnel-comparability-register.md` **in the same
  commit**, per that document's rule 4.

Also in Settings: a Light / Dark / System row, alongside units and language.

## 6. Store assets

Independent of the art, three defects get fixed:

1. **Size.** Re-shoot at 6.9" / 1290×2796 (`IPHONE_69`). The current `IPHONE_65` 1242×2688 set is
   legacy and gets upscaled.
2. **Device frame.** One current-generation frame across all six. Frame 1 is presently notched
   while frame 2 has a Dynamic Island.
3. **Caption font.** Cambay-Bold moves to Instrument Sans so the store set and the app agree.
   `store/fonts/NotoSansJP.ttf` and `NotoSansKR.ttf` stay for ja and ko.

Then the narrative. Six frames in problem → solution → trust order: **1** overdue warning,
**2** garage, **3** log sheet, **4** history, **5** reminders, **6** export and privacy. The
panorama background runs light-to-dark across the set, so frames 1–3 carry dark caption ink and
frames 4–6 white.

The six calibrated captions across 16 locales survive untouched: `store/screenshot-captions.json`
keys copy to frame ids and the shipped order is the array order, not the key number — as that
file's own `setChanged` note records.

Apple requires actual in-app UI in screenshots, so the panorama is a backdrop the real screens
sit on. No mocked-up UI, no invented screens.

## 7. Implementation order

Each unit lands independently and leaves the app shippable.

1. **Theme plumbing.** `ThemeContext`, `useTheme`, `app_state.theme`, `tokens.ts` split. Both
   palettes defined; no visual change beyond colour values.
2. **Materials.** Rewrite `Surface`, `Card`, `Button`, `Chip`, `Field`, `ListRow`, `Badge`,
   `Glass`, `Panel`. Delete the bevel and hard-edge system. Wire haptics. Delete `metal.jpg`.
3. **Typography.** Load Instrument Sans; apply to display tokens; cut `legend` call sites to
   gauge readouts.
4. **De-nesting and spacing.** Garage card becomes one tap target; radius and padding scale
   applied.
5. **Body style.** Migration 6, `onboarding/body.tsx`, i18n keys ×16, detail-screen edit row,
   analytics, register entry.
6. **Art integration.** Body marks in picker / results / paywall / offer / Garage / detail.
   Welcome hero.
7. **Settings.** Theme row.
8. **Icon and splash.**
9. **Store set.** Re-shoot at 6.9", new order, panorama, Instrument Sans captions.

## 8. Test impact

The suite is 348 tests across 21 files. Expected work:

- `tests/onboarding-screens.test.tsx` — asserts rendered strings and control counts per route. A
  new route and the removed Garage inner pill both land here. New: `body` renders 7 options and
  advances on tap without a Continue press.
- `tests/onboarding-flow.test.ts`, `onboarding-run.test.ts`, `onboarding-state.test.ts` — route
  order and step count.
- `tests/migrations.test.ts` — migration 6 applies, is idempotent, and leaves existing rows with
  `body_style IS NULL`.
- `tests/i18n.test.ts`, `tests/localization-smoke.test.ts` — pass once all 9 keys exist in all 16
  catalogs. No change to the tests themselves.
- `tests/analytics.test.ts` — the new route event.

No test asserts a colour, a border, or a font, so §§1–4 are covered by render tests continuing to
pass rather than by new assertions. Adding snapshot tests over the palette is explicitly not
proposed: they would fail on every deliberate tweak and defend nothing.

Verification beyond the suite: this is a visual change, so it must be rendered and looked at, not
just tested. No iOS simulator is available in the current environment; the light and dark
palettes and every rebuilt component get exercised through the existing render tests, and the
store re-shoot in unit 9 is itself the visual verification pass — the frames cannot be produced
without running the app.

## 9. Risks

- **Light default is the biggest bet in this document.** The one tester who liked the current
  look liked a dark app. Dark mode is retained precisely so that preference is still available,
  but the default and the store screenshots change, and the store set is what non-users judge.
  This is measurable: install → `onboarding_step_viewed{route:welcome}` → trial start, compared
  post-boundary cohort against post-boundary cohort, never across the register line.
- **A new step costs drop-off.** Mitigated by tap-to-advance and by it being the most visual
  screen in the flow, but it is a real cost against a real benefit and it will show at
  `route:body` → `route:odometer`.
- **Instrument Sans is one more thing that can fail at launch.** Handled by falling through to
  system font rather than holding the splash.
- **Deleting the metal deletes the affordance argument the previous spec was built on.** That
  document's core claim was that unselected chips at ~1.3:1 contrast were invisible as controls.
  The replacement must not regress it: every control keeps a visible `hairline` border and a
  fill distinct from its background in both themes, and unselected chips specifically get
  `cardSunken` fill rather than transparency.

## 10. Acceptance criteria

1. `grep -rn "metalFace\|edgeSolid\|edgeHeight\|pressTravel\|color.housing\|color.metal" src app`
   returns nothing. `assets/onboarding/metal.jpg` is gone.
2. Light and dark both render every screen with no hardcoded colour outside the two palettes.
3. Settings offers Light / Dark / System and the choice survives a cold start.
4. `useFonts` loads Instrument Sans; display text uses it; a forced load failure still renders
   the app.
5. `text.legend` appears only on gauge readouts.
6. The Garage vehicle card is a single tap target with one chevron and no nested pill.
7. Migration 6 applied; existing vehicles show the sedan fallback; the detail screen can change
   it.
8. `onboarding/body` renders 7 marks, advances on a single tap, and emits its step event.
9. All 9 new keys exist in all 16 catalogs; `npx jest` and `npx tsc --noEmit` are clean.
10. A register entry for the added step is in the same commit as the step.
11. `store/screenshots/*/IPHONE_69/` holds 6 frames at 1290×2796 per locale, one device frame,
    problem→trust order, Instrument Sans captions, existing translated caption strings unchanged.
