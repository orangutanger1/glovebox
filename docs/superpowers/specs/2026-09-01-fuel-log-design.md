# Fuel log — design

Date: 2026-09-01
Status: approved, ready for implementation planning

## Why

Wrenchy tracks what was done to a car and what it cost. It does not track the
one thing the owner does every week. Every competitor in the category
(Fuelly, Drivvo, MyAutoLog) is built around the fill-up, because the fill-up is
the only recurring moment when a driver already has their phone out and a number
in front of them.

What users open these apps to check, in order:

1. "Is this tank normal?" — this fill's efficiency against the average.
2. "What am I spending on fuel a month?"
3. Cost per mile.

All three fall out of the same three inputs: odometer, volume, total paid.
Choosing one metric would not reduce the build; it would only reduce what is
drawn.

The second-order benefit is the one that matters most to the rest of the app:
fuel is logged weekly, services yearly. A fill-up refreshes `vehicle.odometer`,
and every mileage-based due date in the app becomes accurate instead of stale.

## Decisions

| Question | Decision |
|---|---|
| Purpose | Both cost and efficiency; they share the same inputs |
| Placement | Vehicle detail screen. No new tab |
| History | Separate fuel section, **not** interleaved with service history |
| Units | Derived from region. No new setting |
| Partial fills | "Filled the tank" toggle, default on |
| Gating | Logging free; analysis (Insights fuel card) Pro |
| Insights | Separate fuel card; existing service totals untouched |
| Storage | Separate `fuel_entries` table; store what the user typed |

### Rejected alternatives

**Reuse `service_records` with `service_type = 'fuel'`.** One table and a free
timeline, but every existing query over `service_records` silently becomes
wrong and needs a `service_type != 'fuel'` filter — including `costedRecords()`,
the interval engine, and the schedule logic. Fuel rows are ~50x more frequent
than service rows, so they would numerically swamp everything downstream.

**Normalize storage to litres and kilometres.** Fights the convention
`src/units/index.ts` documents at length: the app stores what the user typed so
a history can never be relabelled later. Conversion matters only for imperial
vs US gallons, which is a display-time concern.

**Interleaved history.** Rejected during design review. After a few months it is
40 fill-ups with an oil change buried among them, and the service history is the
thing the app exists for.

**Assume every fill is full.** Every partial fill would silently produce a wrong
figure for that tank and the next, and users blame the app.

## Data model

Migration 7:

```sql
CREATE TABLE IF NOT EXISTS fuel_entries (
  id TEXT PRIMARY KEY NOT NULL,
  vehicle_id TEXT NOT NULL,
  filled_at TEXT NOT NULL,
  odometer INTEGER NOT NULL,
  volume REAL NOT NULL,
  cost REAL,
  full INTEGER NOT NULL DEFAULT 1,
  deleted_at TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fuel_vehicle
  ON fuel_entries (vehicle_id, odometer);
```

`odometer` and `volume` are NOT NULL — the opposite of `service_records`, and
deliberately so. A service with no odometer is still a useful record of work
done. A fill-up with no odometer can never produce a distance, and silently
corrupts the efficiency of the fill *after* it as well. Requiring them in the
schema means the math never has to ask whether a row is trustworthy.

`cost` stays nullable, matching the provenance rule `src/insights` is built on:
a fill nobody priced must not be summed as a zero.

The index is on `(vehicle_id, odometer)` rather than `filled_at` because
efficiency is computed over distance, so odometer order is the true order.
Someone logging yesterday's fill this morning is placed correctly by mileage.

`full` defaults to 1, matching the form's default-on toggle, so the column is
honest for any row written before a user touches it.

## The math — `src/fuel/`

Pure functions over rows with the query left to the caller, mirroring
`src/insights/`, so the whole module runs in plain Node under tests.

**Efficiency rule.** Sort by odometer ascending. A fill yields a figure only if
it is `full` and an earlier `full` fill exists. Then:

- distance = `odo(this) − odo(previous full)`
- volume = sum of every entry *after* the previous full fill, through this one

This is exact, not an approximation. Topping a tank back to full replaces
precisely the fuel burned since it was last full, and partials in between went
into the same distance. A partial fill therefore never produces its own figure
and is never discarded either — it is folded into the next full tank's.

Deliberately absent:

- **The first fill yields nothing.** Nobody knows how full the tank was before
  it, so any figure is invented. The form must say the second full tank is where
  the number appears, or the first fill reads as broken.
- **Non-advancing odometer yields nothing.** A typo or another car's number is
  skipped, never zeroed and never negative.

Exports:

```
mpgSeries(entries)      → { entryId, distance, volume, efficiency }[]
latestEfficiency(...)   → last tank's figure, or null
averageEfficiency(...)  → total distance ÷ total volume over qualifying tanks
fuelSpend(entries)      → Spend
costPerDistance(...)    → fuel cost ÷ distance, priced fills only
```

`fuelSpend` returns the existing `Spend` type from `src/insights` so the fuel
card inherits the same provenance discipline and can caption "from 9 of 11
fills" the way the costs screen already does.

## Units

Derived from the same region signal as `defaultUnitFor`, with no new setting:

| Region | Volume stored | Efficiency shown |
|---|---|---|
| US | US gallons | MPG (US) |
| UK | litres | MPG (imperial) |
| Everywhere else | litres | L/100km |

The UK is the case that breaks any naive rule: miles on the signs, litres on the
pump, and imperial gallons in the figure drivers actually quote.

L/100km inverts — lower is better — so any "is this tank good" comparison must
be direction-aware rather than assuming a bigger number wins.

## Screens

**Vehicle detail** gains, between the due-items block and the service history:

- A fuel summary: last tank's figure with the average beneath. With fewer than
  two full fills it states what is still needed rather than showing a dash.
- Up to 3 recent fills, then "See all" → `/vehicle/[id]/fuel`.
- A **Log fuel** button beside the existing Log service.

**Entry form** `/vehicle/[id]/fuel/new` — four controls, in pump order:

1. Odometer, prefilled from the vehicle's last known reading, keyboard on mount
2. Volume
3. Total paid, labelled optional
4. "Filled the tank", on

Date defaults to today, collapsed behind a tap, matching the service form.
Target is under 20 seconds; that is the entire retention argument.

**Insights** gains a fuel card below the existing sections, Pro-gated:
efficiency trend over the same 12-month window and bar treatment the costs
screen already uses, fuel spend per month, and cost per distance. Service
totals are untouched.

## Gating

Follows the two existing call sites (`app/index.tsx` add-vehicle,
`app/settings.tsx` intervals) exactly: `isPro()` checked *before* navigation,
`presentPaywall()` on refusal, `recordReviewEvent("purchase")` on success, and
the same try/catch that turns an unreachable store into a message rather than a
dead button.

Free users hit the paywall on tapping the Insights fuel card. Logging and the
vehicle-screen summary are never gated — logging must be free or the log never
fills up, and an empty log makes the Pro screen worth nothing. The data the user
has already entered is what sells the upgrade.

## Integration

**Odometer feedback loop.** A fill whose odometer exceeds `vehicle.odometer`
updates it, as logging a service does, and `rescheduleAll()` runs afterwards for
the same reason it runs after a service delete: reminders derived from mileage
must follow it.

**Delete + undo** reuses the `Swipeable` + 8-second undo pattern from the
service history, with `softDeleteFuelEntry` / `undoDelete` mirroring
`src/db/records`. Deleting a fill changes the next full tank's figure — inherent
to the math, and recomputation is automatic because nothing is cached.

**CSV export** gets a second file, `fuel.csv`, shared alongside the existing one
rather than merged into it. `src/export/csv.ts` documents that its column set is
a contract someone's spreadsheet keys off; adding columns would break exactly
the users that comment protects. Same rules inside the new file: English
headers, ISO dates, ungrouped numbers.

**i18n**: new catalog keys for the form, summary, fuel card, and empty states.
The "needs one more full tank" line and the fill-count captions are
plural-sensitive and go through `src/i18n/plural`. Unit labels come from the
region rule, never hardcoded.

**Analytics**: `fuel_logged` carrying `full` as a property — the partial rate
reports whether the toggle is understood — and `fuel_card_paywall`.

## Testing

TDD throughout.

- `tests/fuel.test.ts` — the math in plain Node: single fill yields nothing;
  two full fills; a partial between two fulls; consecutive partials;
  non-advancing odometer; an unpriced fill excluded from spend but not from
  volume; entries logged out of date order but in odometer order.
- `tests/fuel-form.test.tsx` and a vehicle-screen test, matching the existing
  component tests.
- A migration test that v6 → v7 preserves existing rows.

## Out of scope

Fuel type and octane, station or brand, per-vehicle tank sizes, price-per-unit
as an input (derived from volume and total, never entered), and efficiency-drop
alerting.

The last is a genuinely good follow-up: a sustained efficiency decline is a real
maintenance symptom and fits the app's existing framing. It needs a stable
baseline before it can avoid crying wolf, so it gets its own design once real
logs exist.
