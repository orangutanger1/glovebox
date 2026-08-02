# Car Maintenance Log — Design

Date: 2026-08-01
Status: approved (design), pending implementation plan

## Summary

An iOS app that records car maintenance history and reminds the owner when the
next service is due. Its single differentiating property is that records cannot
be lost: the device is the only source of truth, there is no account, and there
is no server.

## Why this market

Keyword research ran against live Apple data, not vendor estimates:

- Harvested 500+ App Store autocomplete suggestions across 50 seed stems.
  Autocomplete only surfaces terms users actually search, so appearing there is
  itself a volume signal.
- Scored 253 medium-tail candidates (2-3 words) against live iTunes search
  results, measuring exact-phrase title saturation and the rating depth of the
  top 10.

Result for the target cluster:

| keyword | weak apps in top 10 | median ratings of top 10 | exact-title holders |
|---|---|---|---|
| car maintenance log | 8 | 49 | 3 |
| car maintenance reminder | 7 | 143 | 1 |
| car maintenance tracker | 8 | 49 | 3 |

The median top-10 competitor has 49 ratings. CARFAX Car Care holds 125k ratings
but is free dealer lead-generation, not a product with retained loyalty — its
reviews show the same failure as the rest.

Four autocomplete-confirmed entry points resolve to one app, so a single build
serves the whole cluster. Demand is recurring and non-seasonal, and car owners
already spend meaningfully on vehicles.

Raw data: `research/scored.json`, reproducible via `research/score.py`.

## Why this feature

1,400+ reviews were pulled across 7 competitors (`research/reviews.py`).
Frequency of themes in 1-3 star reviews put **data loss in the top three for all
seven apps**.

Representative verbatim quotes:

- Vehicle Maintenance Tracker (2,861 ratings): "ALL of the service dates went to
  Jan 1, 0001" — an unfixed bug repeated across dozens of reviews over months.
- CARFAX Car Care: "got logged out of the app and when I logged back in, all of
  my manual input maintenance logs were gone."
- Car Maintenance Reminders: "Literally paid to lose my data."
- Auto Care Kit: "Everything going back since 2019 ... completely gone."
- AUTOsist: "Lost my data. This app is garbage."

Secondary themes: forced account/login (top-5 in 6 of 7 apps), and manual setup
burden ("entirely manual, and that makes this app seem more like a simple
organizer").

The root cause is shared across all seven. Each is server-authoritative behind a
required account, so a server fault or an unexpected logout destroys records the
user spent years entering. The application treats durable history as disposable
cache.

The opportunity is therefore not a missing feature. It is an architecture where
that failure mode cannot occur.

## Scope

### The one feature

Log a completed service; the app schedules a reminder for when that service is
next due. One primary screen.

### Non-goals

Explicitly excluded from v1, and from marketing copy:

- Fuel / MPG tracking (a separate keyword cluster owned by Fuelly)
- Expense reports and cost analytics
- Receipt photo OCR
- VIN decode and dealer integrations
- Fleet or multi-user modes
- User accounts, social features, ads

## Architecture

### Durability model

This is the product, so it is specified before the UI.

- **On-device SQLite is the only source of truth.** No backend service exists.
  There is nothing to be logged out of.
- **No account, no login screen.** The app is usable within seconds of install,
  which also addresses the manual-setup complaint.
- **Append-only writes.** Service records are never mutated in place. An edit
  writes a new revision; a delete writes a tombstone. The full history remains
  recoverable.
- **Undo for every destructive-looking action**, backed by the revision history
  rather than by an in-memory stack.
- **Export is always available and never paywalled.** CSV and PDF, generated
  on-device. The user can leave with their data at any time. This is both the
  backup story and a trust signal the competitors cannot match.
- **Schema migrations are additive-only** and run inside a transaction against a
  pre-migration file copy. If a migration throws, the copy is restored. The
  "Jan 1, 0001" class of bug is a migration that corrupted data with no rollback.

### Sync

None in v1. Decided deliberately: every competitor's data loss traces to sync
with a server they own. Shipping without sync removes the entire failure class
and reduces build time.

New-phone migration is served by export/import rather than by live sync. iOS
encrypted device backup also carries the SQLite file. CloudKit private-database
sync is the candidate for v2 if export/import proves insufficient in practice —
CloudKit keeps data in the user's own iCloud, so it does not reintroduce a
server we operate.

### Components

Each unit below has one purpose and is testable in isolation.

- **`db`** — SQLite access, migrations, append-only write primitives. Exposes
  typed read/write functions. No UI knowledge.
- **`schedule`** — pure functions mapping (service type, last performed at,
  odometer, interval) to a next-due date/mileage. No I/O, fully unit-testable.
- **`notify`** — wraps OS notification scheduling. Consumes `schedule` output.
  Isolated so notification permission state never leaks into business logic.
- **`export`** — serializes the record set to CSV and PDF. Depends on `db` reads
  only.
- **`ui`** — screens. Depends on all of the above; nothing depends on it.

### Data model

Two tables plus revisions:

- `vehicles` — id, name, make, model, year, current odometer
- `service_records` — id, vehicle_id, service_type, performed_at, odometer,
  cost, notes, revision, superseded_by, deleted_at
- `service_intervals` — service_type, months, miles (seeded with defaults, user
  editable)

### Stack

Expo / React Native (iOS first), `expo-sqlite`, `expo-notifications`. No
backend, no auth provider, no analytics SDK in v1.

## Testing

- `schedule` is pure — exhaustive unit tests on interval math, including
  odometer-based vs date-based due dates and whichever comes first.
- `db` — migration tests that assert data survives every schema version
  transition, plus an explicit test that a throwing migration restores the
  pre-migration copy intact.
- Append-only invariant — property test asserting no operation reduces the count
  of recoverable revisions.
- `export` — round-trip test: export to CSV, re-import, assert record equality.
- Device testing on physical hardware before submission; notification delivery
  and SQLite behavior differ from simulator.

## Error handling

- Any write failure surfaces inline and retains the user's input. Entered data is
  never discarded on error — that is the exact behavior being displaced.
- Notification permission denial degrades to in-app due badges rather than
  blocking the core loop.
- A corrupt database file triggers restore from the most recent pre-migration
  copy, with the user informed.

## App name

**Glovebox.** Chosen over a generic keyword-string title because it's the one
place car owners already kept paper service records before this app existed —
the metaphor sells the durability pitch on its own, and it's memorable enough
to survive word-of-mouth ("just use Glovebox") where
`Car Maintenance Log Reminder` isn't. Live in ASC as the app name (app id
`6797103341`) and in RevenueCat as the app display name (`app774f157580`,
project `car` / `projf0d996da`). Bundle ID is unchanged
(`com.idea6.carmaintenancelog`) — not customer-visible, not worth the churn.

## App Store metadata

Character counts verified against Apple limits. Competitor set drawn from
`research/scored.json` (live iTunes search, not vendor estimates): CARFAX Car
Care (125k ratings, free/dealer-lead-gen), Vehicle Maintenance Tracker (2,861,
the "Jan 1, 0001" bug app), Car Maintenance Reminders (171), Fuelly: MPG &
Service Tracker (29,298, owns the fuel-tracking cluster we deliberately don't
compete in).

- **Title** (29/30): `Glovebox: Car Maintenance Log` — brand + the
  highest-volume exact-match keyword pair (`car maintenance`, `log`). Live in
  ASC.
- **Subtitle** (30/30): `Service Reminders & Repair Log` — covers `service`,
  `reminders`, `repair` without repeating title terms (Apple indexes title,
  subtitle, and keywords separately; duplicating wastes budget). Live in ASC.
- **Keywords** (97/100), zero duplication of title/subtitle terms:
  `tracker,vehicle,auto,oil,change,mileage,odometer,tire,rotation,due,history,records,mechanic,brake`
  — recovers `tracker` (owned by the `car maintenance tracker` cluster, 6 weak
  apps in top 10) since it lost its slot in the title rework.
  **Not yet pushed** — version-localization fields (`keywords`, `description`,
  `promotionalText`) require an App Store *version* to exist, and none does
  until the Task 1 EAS build lands. Push via
  `asc metadata keywords import` / `asc metadata apply` once the first version
  is created; this file is the source of truth until then.
- **Promotional text** (160/170): `Your maintenance records, on your phone,
  that never disappear. No account, no server, no login — just a permanent log
  of every oil change, rotation, and repair.`
- **Description** (1292/4000):

  ```
  Your service records, kept forever — on your phone, not someone else's server.

  Every other car maintenance app is one bad login away from losing years of
  history. Glovebox never asks for an account, never talks to a server, and
  never loses a record. Everything you log stays on your device, permanently.

  WHAT IT DOES
  • Log oil changes, tire rotations, brake jobs, inspections — anything
  • Get a reminder exactly when the next service is due, by date or mileage,
    whichever comes first
  • See every vehicle's full history at a glance
  • Export your entire log to CSV or PDF anytime — never paywalled, never
    locked away

  WHY IT'S DIFFERENT
  No account. No login. No server. No sync required, no sync to break. Your
  maintenance history can't disappear because there's nothing to disappear
  from — it's saved right here, on your phone, the same way you'd keep a paper
  logbook in the glovebox.

  BUILT FOR REAL OWNERS
  • Multiple vehicles supported
  • Custom service intervals for oil, tires, brakes, filters, coolant, and more
  • Odometer- and date-based due tracking — whichever comes first
  • Dark, glare-friendly design for reading in the driveway or garage

  Free to start with one vehicle. Upgrade to Glovebox Pro for unlimited
  vehicles and custom intervals — export always stays free, for everyone.
  ```

Post-launch, the App Store Connect Analytics Reports API supplies real
search-term impression data for our own listing, which replaces these estimates
with ground truth. Metadata updates ship via the `asc` CLI rather than the web
UI.

## Open risks

- No sync is a real limitation for multi-device users. Mitigated by export, and
  revisited in v2 only if users ask.
- CARFAX is free. Pricing must therefore be justified by durability and the
  absence of an account, not by feature count.
- The interval defaults must be sane per vehicle without manual setup, or the app
  inherits the tedious-setup complaint it is trying to avoid.
