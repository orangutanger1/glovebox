# Vehicle Health — design

Date: 2026-09-15
Status: approved, ready for implementation planning

## Why

The onboarding flow computes a real maintenance plan from the quiz and shows it
as counts: three overdue, two soon, five on file. That is honest and it is the
right thing to argue from, but it reads as a list. Apps in the umax/FaceIQ
mould convert on a different shape: a grid of large numbers, each with a bar,
shown blurred behind the paywall and unblurred on purchase. The number is the
product; the blur is the ask.

Wrenchy can borrow the shape without borrowing the dishonesty. Every figure on
a umax grid is opaque. Every figure on this grid is a fraction the user can
trace to rows they entered ninety seconds earlier, or to a public NHTSA
lookup. That constraint is the same one `results.tsx` and `outlook.ts` already
enforce when they refuse to print a score, and this document revises that
decision on purpose: a score is acceptable when every point of it is
attributable.

Research done before this spec (2026-09-15) established that no free or
legally licensable source of shop service records exists for a consumer app
(Carfax is closed to non-reporting parties; NMVTIS vendors carry title and
odometer events only; the one vendor claiming service records is paid and
unverified). The health grid therefore scores what the app knows — the quiz,
the log, the intervals — plus one free public source, NHTSA recalls. It never
claims to have "found" history it does not have.

## Decisions

| Question | Decision |
|---|---|
| Name | **Vehicle Health**. Not "Ratings": the app diagnoses, it does not judge |
| Tiles | Six, 2×3: Overall, Potential, Engine, Brakes & Tires, Electrical & Cabin, Safety & Paperwork |
| Score basis | Fraction of services with a history that are current. Unlogged services excluded from the number and drawn as a gap |
| Potential | Overall recomputed with every currently due/soon item treated as done. Reads upward, as umax does |
| Recalls | NHTSA `recallsByVehicle`, free, no key. Feeds Safety & Paperwork. Absent (offline, unmatched make) → tile scores paperwork only and says so |
| Where it lives | Two places, one component: the onboarding `results` screen (blurred until Pro) and the top of the vehicle detail screen (unblurred, Pro) |
| Blur | Real numbers rendered under `expo-blur`, one tile clear as the teaser. No fake numbers |
| Third-party data | None paid. NHTSA only |
| VIN entry | Out of scope here; separate spec. Nothing in this design depends on it |

### Rejected alternatives

- **Weighted 0–100 health score with invented weights.** Maximum umax effect,
  but "your car is 62" is a number nobody can check. Rejected for the reason
  the codebase already documents.
- **Count tiles only (Overdue / Soon / Current / Unrecorded).** Keeps the old
  principle fully intact but is the existing results screen in a grid. Weaker
  hook, no reason to blur it.
- **Outlook instead of Potential** (score twelve months out with nothing
  done). Honest and it is the reminder argument, but it reads downward; a
  grid whose second number is worse than its first sells anxiety, not the
  product. `outlook` keeps its own screen.
- **Shop service history via a paid vendor.** Rejected on cost and on
  coverage: the reveal would too often reveal nothing, at the worst possible
  moment (after payment).

## The math — `src/health/`

Pure over a `Plan` and an optional recall count, so `tests/health.test.ts`
runs in Node and the onboarding screen and the vehicle screen cannot disagree.

### Groups

```ts
export const GROUPS = {
  engine: ["Oil Change", "Air Filter", "Spark Plugs", "Coolant Flush", "Transmission Fluid"],
  brakesTires: ["Brake Inspection", "Tire Rotation"],
  electricalCabin: ["Battery Check", "Wiper Blades", "Cabin Air Filter"],
  safetyPaperwork: ["Registration", "Inspection"],
} as const;
```

Every `SERVICE_TYPES` entry except `Other` appears in exactly one group; a
test asserts the partition so a new service type cannot be added without
being placed. `Inspection` is already dropped from the plan in markets with no
periodic test (`buildPlan`), and the group follows the plan.

### Item value

| `PlanItem.status` | `logged` | value |
|---|---|---|
| `ok` | true | 1 |
| `soon` | true | 0.5 |
| `due` | true | 0 |
| any | false | excluded |

`soon` at half is deliberate: it is neither fine nor late, and rounding it
either way makes the score jump on the day a service crosses the threshold.

### Tile

```ts
export type HealthTile = {
  key: "overall" | "potential" | "engine" | "brakesTires" | "electricalCabin" | "safetyPaperwork";
  /** 0–100, or undefined when nothing in the tile has a history. */
  score?: number;
  /** Items contributing to the score. */
  scored: number;
  /** Items in the tile with no record — the grey gap on the bar. */
  unknown: number;
  /** Total items in the tile, for "3 of 5" captions. */
  total: number;
  /** Safety & Paperwork only. Undefined when the lookup did not run or failed. */
  openRecalls?: number;
};

export type Health = {
  tiles: HealthTile[];           // in grid order
  band: "excellent" | "good" | "fair" | "poor" | "unknown"; // of overall
};
```

- `score = round(100 × mean(value) over scored items)`.
- `unknown = items in the tile with logged === false`.
- **Overall**: all groups' items pooled, same rule.
- **Potential**: Overall with every `due`/`soon` logged item valued at 1.
  Unlogged items stay excluded — doing the due services does not create a
  history for the ones with none. Potential ≥ Overall always; a test asserts it.
- **Safety & Paperwork**: paperwork items scored as above. If `openRecalls`
  is a number, each open recall is one more scored item at value 0, so two
  open recalls on a car with registration and inspection current gives
  2/4 → 50. `openRecalls: 0` adds nothing and the tile says "No open
  recalls". Undefined → tile scores paperwork only and the caption says
  "Recalls not checked".
- **Band** from Overall: ≥80 excellent, 60–79 good, 40–59 fair, <40 poor,
  undefined → unknown. The palette is two-tone by design
  (`docs/superpowers/specs/2026-09-10-glovebox-flat-dark-design.md`): no
  amber. Bar fill is `color.green` for excellent/good, `color.red` for
  fair/poor, `color.textMuted` for unknown. The band word beside the title
  carries the finer grade; the bar carries the verdict.

A tile with `score === undefined` renders "—" with an empty bar and the
caption "Nothing logged yet". It never renders 0.

### Recalls — `src/health/recalls.ts`

```ts
export async function fetchOpenRecalls(input: {
  make: string; model: string; year: number; signal?: AbortSignal;
}): Promise<number | undefined>
```

- `GET https://api.nhtsa.gov/recalls/recallsByVehicle?make=&model=&modelYear=`.
- Returns `Count`, or `undefined` on any failure: no network, non-200,
  timeout (4 s), malformed body, make/model not matched. Never throws.
- Make and model are the user's free text from the vehicle screen. Sent as
  typed after `trim()`; NHTSA matches case-insensitively on its own names.
  A make the user typed as "Chevy" will not match "CHEVROLET" — accepted for
  v1; the tile degrades to paperwork-only and says so. A small alias table is
  a follow-up if analytics show a large unmatched share.
- Result cached in `app_state` per vehicle as `{ count, at }` for 7 days so
  the vehicle screen does not hit the network on every focus.
- This is the app's first outbound request. `app.json` needs no ATS
  exception (HTTPS). The privacy label changes: year/make/model leave the
  device. No identifier, no VIN, no odometer is sent.

## Screens

### `HealthGrid` — `src/design/HealthGrid.tsx`

One component, both call sites.

```
┌──────────────────────────────────────────┐
│  Overall              Potential          │
│  78                   94                 │
│  ████████████░░░░     ██████████████░░   │
│  7 of 9 current       if 2 due are done  │
│                                          │
│  Engine               Brakes & Tires     │
│  60                   100                │
│  ██████████▒▒▒░░░     ████████████████   │
│  3 of 5 · 2 unlogged  2 of 2 current     │
│                                          │
│  Electrical & Cabin   Safety & Paperwork │
│  —                    50                 │
│  ░░░░░░░░░░░░░░░░     ████████░░░░░░░░   │
│  Nothing logged yet   2 open recalls     │
└──────────────────────────────────────────┘
```

- Inside a `Panel`. Title row above the grid: "Vehicle Health" in
  `text.legend`, band word at right in the bar colour ("Good").
- Numeral is `text.readout` (the Gauge readout), tabular. Bar is a new static
  `HealthBar`: track `color.sunken`, fill in band colour, and the unknown
  share drawn as a `color.unlitBulb` segment at the right end so the fill
  visibly stops short of a full track. Not `ProgressBar` — that one
  animates a wait; this one is a reading.
- Captions are the traceability line. Every tile has one, and it is always a
  count.
- Tapping a tile on the vehicle screen scrolls to / filters the service list
  to that group (v1: scroll to the service section; filter is a follow-up).
  In onboarding, tiles are not tappable.
- Reduced motion: no entrance animation in either case. The bars are static.

### Onboarding `results`

The screen keeps its title logic (overdue count / no baseline / clear) and
subtitle. The `Panel` body is replaced by `HealthGrid` in its **locked**
state:

- All six tiles render their real numbers. A `BlurView` (`expo-blur`,
  intensity 24, tint dark) covers the grid, with a cut-out for one teaser
  tile: **Overall**, always. The user sees their real score and five blurred
  ones.
- Lock affordance: a small lock glyph and "Unlock the full report" text
  centred over the blurred area. Not a button — the Continue button below
  already leads to the paywall through the existing ladder.
- The current three gauges (Due now / Soon / On file) and the top-`SHOWN`
  list rows move **below** the grid, unchanged, so the counts the rest of the
  flow argues from are still on this screen and still unblurred. The grid is
  an addition to the argument, not a replacement of the facts.
- `outlook`, `symptoms`, `compare`, `help`, `reviews` are untouched.
- When the user is already Pro (replay of onboarding, grandfathered), the
  grid renders unlocked.
- Analytics: `health_grid_shown { overall, potential, band, recalls: "n" | "none" | "unchecked" }`
  on results, once per plan build. No per-tile events.

### Vehicle detail — `app/vehicle/[id].tsx`

`HealthGrid` unlocked, above the existing gauges row, Pro only. For a free
garage the panel is not rendered at all — no locked grid on the home screen;
the paywall ladder is onboarding's job and the vehicle screen already has the
Pro affordances it has.

Built from `buildPlan` over the vehicle's records and intervals, with
`answers` reduced to the stored drive rate (the same call the reminder
scheduler makes), so the grid on the vehicle screen and the one the user saw
in onboarding are the same function of the same rows.

Recalls fetched on focus if the cached value is older than 7 days; the tile
renders paperwork-only immediately and updates in place when the count
arrives. No spinner: the caption goes from "Recalls not checked" to the
count, and the score changes with it.

## Gating

| Surface | Free | Pro |
|---|---|---|
| Onboarding results grid | Locked, Overall clear | Unlocked |
| Vehicle screen grid | Not rendered | Unlocked |
| Recall lookup | Runs (feeds the locked grid honestly) | Runs |

`useIsPro()` decides, as on `insights.tsx`. The null-entitlement beat
renders the locked state, never a flash of the unlocked one.

## Localization

New keys under `health.*` in every catalog: six tile names, band words,
caption templates (`{scored} of {total} current`, `{n} unlogged`, `Nothing
logged yet`, `No open recalls`, `{n} open recalls`, `Recalls not checked`,
`if {n} due are done`), lock text. Tile names are short in English and must
be checked for wrap in de/fr/pt at the 2-column width on a 375 pt screen —
"Electrical & Cabin" is the long one; the tile allows two lines.

## Testing

`tests/health.test.ts`, Node, no device:

- Partition: every `SERVICE_TYPES` entry except `Other` in exactly one group.
- Item values: ok/soon/due/unlogged → 1/0.5/0/excluded.
- Overall with mixed statuses gives the expected rounded score and counts.
- All-unlogged tile → `score` undefined, `unknown === total`.
- Potential ≥ Overall; Potential equals Overall when nothing is due or soon;
  Potential leaves unlogged items excluded.
- Recalls: 0 → no effect; 2 → two zero-valued items; undefined → paperwork
  only.
- Band thresholds at the boundaries (79/80, 59/60, 39/40).
- `fetchOpenRecalls`: mocked fetch — 200 with Count, non-200, network error,
  timeout, bad JSON → number / undefined, never throws.

Existing `tests/onboarding*` continue to pass; results screen title logic is
unchanged.

## Integration

- `src/health/index.ts` (pure), `src/health/recalls.ts` (fetch + cache),
  `src/design/HealthGrid.tsx`, `src/design/HealthBar.tsx`.
- `app/onboarding/results.tsx`: grid added above the existing panel body.
- `app/vehicle/[id].tsx`: grid added for Pro.
- `src/analytics`: one event.
- `src/i18n/catalog/*`: `health.*` keys.
- App Store privacy label: year/make/model sent to NHTSA is not linked to
  the user and is not one of Apple's declared data categories, so the label
  is unchanged. Confirm against the current App Privacy questionnaire at
  submission.
- Comments in `results.tsx` and `outlook.ts` that say "deliberately not a
  score" are rewritten to point here: the score exists now, and the rule is
  that every point of it is attributable.

## Out of scope

- VIN / plate entry and vPIC decode (separate spec).
- Per-tile drill-down filtering on the vehicle screen.
- Any paid data source; any shop service history.
- Make/model alias table for NHTSA matching.
- Trend over time ("health last month").
