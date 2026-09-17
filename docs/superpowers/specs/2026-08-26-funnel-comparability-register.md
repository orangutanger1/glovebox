# What the funnel numbers mean, and when they stopped meaning it

**2026-08-26.** A register of every change that breaks comparability in PostHog
project 574255, newest last. Read it before any funnel analysis. A rate quoted
across one of these lines is two different measurements averaged together, and
the average describes neither.

This exists because the flow is being changed faster than data accumulates.
Every entry below moved a step, changed a question, or silenced ingestion —
none of them are visible in the event stream itself, which reports the same
event names on both sides of the boundary and so looks continuous when it is
not.

## How to use it

1. **Segment by app version and, past 1.0.2, by update.** `Application Opened`
   carries the version; the OTA id is the only thing that separates two
   populations running the same binary. Two installs both reporting 1.0.2 can
   be running bundles a week and three flow changes apart. From 1.1.0 build 17
   the id is on every event as `ota_update_id`, with `ota_is_embedded`
   distinguishing the bundle inside the binary from a downloaded one; before
   that build the split is not recoverable at all. See the 2026-08-28 entry.
2. **Never quote a rate that spans a boundary.** Compare post-boundary cohorts
   to each other. If the question is "did the change help", that is an
   experiment, not a date filter.
3. **A step count is not a step name.** `onboarding_step_viewed` carries
   `route`, so use the route. Depth-in-flow comparisons are meaningless across
   any entry that added or removed a screen.
4. **Append to this file in the same commit that causes the break.** An entry
   written later is an entry written from memory.

## The register

### 2026-08-24 — instrumentation begins (1.0.2, build 14)

Before this there is nothing. `src/analytics` existed but had emitted one
`wiring_check` event, because the native build carrying PostHog had not
shipped. Any apparent activity before this date is that check, not users.

### 2026-08-25 23:51 UTC — the blackout (OTA, since reverted)

An update published without `--environment` shipped a bundle with no ingestion
key. Every install that took it stopped reporting entirely and crashed on the
paywall button until the corrected republish at 00:54 UTC. See
`2026-08-26-ota-environment-incident.md`.

Two consequences for analysis, both easy to read backwards:

- **The gap is not churn.** Between 00:27 and 00:54 UTC on 26 August, silence
  from a crashing install is indistinguishable from a user who left. Do not
  count those sessions as drop-off; they cannot be counted at all.
- **The paywall was unreachable for that window.** `paywall_shown` with no
  following `paywall_presented` in that range is the crash, not a rejection.

### 2026-08-26 — OTA `01a0416c-8108-76b6-808d-8c11d35e5eaf`

Four commits, one boundary. `c5a1bd2` was the last thing published before it
("dwell before Continue on the symptoms cards"), so everything from `8b5a0a8`
through `d16d6de` reached users in this single update and cannot be told apart
in the data. Confirmed against `eas update:list --branch production`, which is
the only record of what was actually served; the git log is not, because a
commit is not a release.

**The gates came off.** The vehicle step is optional, the odometer can be
deferred, the quiz is answerable with no keystroke, the reviews screen nudges
instead of refusing. Drop-off on those routes before this update was partly the
app arguing with the user, so per-route drop is not comparable across it.

**The reminders question changed.** `plan` now draws the actual notification —
this car, this service, the real date, the scheduler's own strings — above the
ask. `notification_permission` `granted` / `denied` / `deferred` are now
answered by someone who read the message they were agreeing to. That is a
different question from the one the previous bundle asked, and it can move the
rate in either direction: some who would have agreed vaguely now decline
specifically. Old and new opt-in rates share an event name and nothing else.

**A screen was removed.** `features` is gone; its Free/Pro rows moved onto
`help`. So:

- The flow is 15 routes, not 16. Depth-based funnels re-baseline here.
- `help` inherits the drop that used to belong to `features`. It will look
  worse than it did. That is the merge, not a regression.
- `route=features` stops appearing in `onboarding_step_viewed` from this
  update forward. Its absence in a recent cohort is not a tracking failure.
- Completion should rise slightly from removing one tap, independently of
  whether the argument got better.

### 2026-08-26 — OTA `01a0418b-4b87-7ef6-a905-f4ea56d8bd49`

One commit, one boundary, and the smallest of the three so far: no route was
added or removed, so depth-based funnels do not re-baseline here.

**The reminders question changed again, in the same direction.** The still card
on `plan` is now the notification arriving — it drops in, holds, lifts, and
cycles up to three of this car's real reminders, each labelled with when it
would actually arrive ("Tomorrow", "In 9 days") rather than with a date. The
previous entry already made `notification_permission` incomparable across the
`01a0416c` boundary; this makes it incomparable across this one too. Two
consecutive updates have changed what the user knows at the moment they answer,
which means the opt-in rate has no baseline at all yet. The first cohort that
can be quoted is the one that runs this bundle unchanged.

**`help` was rebuilt, not moved.** The six Free/Pro rows are tiles, two to a
row, badge leading, and the screen is roughly half as tall. `help` still
inherits the drop that used to belong to `features`, so it remains
non-comparable to anything before `01a0416c` — but its drop is now also not
comparable to the single update in between, because the price boundary is being
read differently: above the fold instead of after a scroll.

**The symptoms dwell went 1200ms to 800ms.** `c5a1bd2` introduced the dwell and
`01a0416c` shipped it; this shortens it. Time-on-screen for `route=symptoms`
drops by construction and says nothing about attention. Any per-card drop-off
comparison has now crossed three different dwell values in four days.

### 2026-08-27 — a seventh quiz question

`body` was inserted between `vehicle` and `odometer`, asking the body style in
one tap. The quiz went from six questions to seven, so:

- Every `QUESTION n / 6` label became `n / 7`. Any analysis keyed on the
  printed step count is comparing two different denominators.
- Depth-in-flow comparisons across this line are meaningless. Use `route`.
- `vehicle` → `odometer` is no longer an adjacent pair. A funnel defined on
  those two steps silently measures a three-step span after this date and will
  read as a drop-off that did not happen.
- The new step's own drop-off is `route:body` → `route:odometer`. It costs one
  tap and no typing, so a large fall there is a signal that the seven labels
  are not legible, not that the question is unwelcome.

### 2026-08-28 — the update id starts being sent (1.1.0, build 17)

Not a flow break. The opposite: the first build on which rule 1 above can
actually be followed.

Every event now carries five super properties registered at init —
`ota_update_id`, `ota_is_embedded`, `ota_channel`, `ota_runtime_version`,
`ota_created_at`. A native build reports its version and build number, and
PostHog already sent both; an OTA replaces the JavaScript inside that same
binary and changes neither, so nothing in the data distinguished two bundles.
`ota_update_id` reads `"embedded"` rather than null for the bundle shipped
inside the binary, because a null in PostHog cannot be told apart from a
property that was never sent.

What this does not do is fix the past, and the gap is total rather than partial:

- Every install from 2026-08-24 to this build reports exactly `1.0.2` /
  build `15` — 21 people, one row, no variation. Those populations cannot be
  separated retroactively by any means. Every cross-day rate before build 17
  is unfalsifiable and stays that way.
- The specific open contradiction is not resolvable: `route=features` was
  recorded as removed by OTA `01a0416c` on 08-26, and 8 distinct people viewed
  it afterwards, most recently 08-28. Either the removal never reached those
  devices or the entry is wrong, and the field that would settle it did not
  exist yet. Do not resolve it by guessing; treat pre-17 route presence as the
  proxy it always was.
- `runtimeVersion` policy is `appVersion`, so 1.1.0 is a new OTA train. No
  1.0.2 install can take a 1.1.0 update, which is itself a population boundary.

Also recorded late, in breach of rule 4: `welcome` first appears 08-27 and
`notify` on 08-28, and no entry named either. They are onboarding routes that
landed without a boundary being written down. The dates are from event data,
not from a commit, which is exactly the memory-written entry rule 4 exists to
prevent — treat both as approximate.

### 2026-08-28 — correction to the entry above, and OTA `01a04bcc-4588-7cae-aa54-ee610e2da666`

Two things in the entry above were wrong or premature.

**The update id was not actually being sent.** It was registered as PostHog
super properties in the client's constructor tick. `register` writes through the
persisted `props` key, and the SDK fills that same key from disk when its
storage preload resolves, merging per key — so on every launch but the very
first, the previous session's copy overwrites the fresh one, and
`Application Opened`, which the SDK captures after that preload, reports the
bundle the phone was running *last* launch. It now goes through
`customAppProperties`, which the client reads for every event with no storage
in the path. Treat any `ota_*` value from before this OTA as lagging by one
launch; there are none, because of the next paragraph.

**Build 17 never ran.** It crashes on launch: a JavaScript fatal inside the
launch window makes `expo-updates` wait for a remote update, find none for
runtime 1.1.0, and call `ErrorRecovery.crash()` — the process aborts ~470ms in
and the iOS report names only expo-updates. Zero events of any kind exist for
`1.1.0` / build `17`. Native config is byte-identical to the working build 15
(same frameworks, same `Expo.plist`, every embedded manifest asset present,
both `EXPO_PUBLIC_` keys inlined), so the fault is in JavaScript and this OTA
can carry the fix.

This update is the diagnostic: the analytics client and the fatal handler now
install before anything else in the boot effect, each boot step reports
`boot_failed` with its own name instead of killing the launch, a render throw
lands in an expo-router `ErrorBoundary` as `render_error`, and fatals flush
immediately rather than waiting for a next launch that never comes.

For the register's purpose: **1.1.0 is a two-bundle train already**. The
embedded build-17 bundle is not a population — nobody completed a launch on it.
Any 1.1.0 data begins with `ota_update_id = 01a04bcc-…`.

### 2026-08-29 — correction: build 17 did reach analytics, and the fatal is after first paint

Two corrections to the entry above, from the full crash log and the event data.

**The crashing launch did reach `initAnalytics`.** `Application Updated` and
`Application Opened` exist for `$app_version 1.1.0` / `$app_build 17`, captured
2026-08-29T04:05:44Z (21:05:44 PT), `$sent_at` 04:34:58Z — flushed by one more
open at roughly 21:34:50 PT, seconds before the entry above was committed. That
is why it recorded zero events for 1.1.0; it lost a race with ingestion.
`Application Opened` carries fresh `ota_*`: `ota_update_id
18ec39bf-4fce-401a-bb0f-b3b4e8677bf1`, `ota_is_embedded true`,
`ota_runtime_version 1.1.0`. Two consequences: the inlined keys worked, and
`getDb()` with the v6 migration plus `initPurchases` — both ahead of
`initAnalytics` in the boot effect — did not throw. Also note for every query
that segments on bundle identity: on a device, the embedded launch reports its
own manifest UUID in `ota_update_id`; `updateId` is never null there, so the
`"embedded"` sentinel does not fire and `ota_is_embedded` is the real signal.

**The stack says after first paint.** The submitted report aborts through
`ErrorRecovery.notify → runNextTask → crash` with the `launchCached` task
already removed, which only happens when the launched update's
`successfulLaunchCount > 0` — some open of the embedded bundle rendered content
first. So on a first open the boot effect ran to completion, content appeared,
and the fatal hit inside the 10-second recovery window; a later open died
pre-paint at 472ms. Every sync step after `initAnalytics` is guarded or pure
(`recordReviewEvent` catches, `shouldOfferWinback` is null-safe, the rest are
async), which points at a render or effect throw in the first screen on real
device data. `body_style` is not it: the garage never reads the column, and
only `app/onboarding/body.tsx` does — never mounted on an onboarded device.

Next datum is one device open. The diagnostic OTA (`01a04bcc…`) is live for
runtime 1.1.0, and `expo-updates`' recovery starts a real check and waits five
seconds for it — with an update on the server it relaunches into the
instrumented bundle, and a download that outlives the wait persists on disk for
the launch after. The first open that gets far enough reports `boot_failed`
with the step, `render_error`, or `js_error` with the stack.

### 2026-08-29 — build 21, and a gate that was never being counted

**Build 21 is the crash fix in the binary.** Builds 17-20 aborted on launch
(`app/_layout.tsx` returned `null` until `useFonts` resolved; see
`2026-08-29-launch-crash-handoff.md`), and build 20 only survived because
`updates.fallbackToCacheTimeout: 10000` made it pull OTA `01a04e95` before
starting JS. Build 21 drops that config and embeds the fix instead. Its
`main.jsbundle` was checked directly rather than assumed: the new vehicle
screen's keys are present and all nine of the old validation keys
(`vehicle.yearMissing`, `vehicle.yearDigits`, `vehicle.yearMin`,
`vehicle.yearMax`, `vehicle.required`, `vehicle.makeNone`,
`vehicle.makeSearch`, `vehicle.makeOther`, `vehicle.yearOlder`) are absent.

For analysis this means **1.1.0 build 21 is the first bundle on which a
first-launch cohort exists at all.** Everything on builds 17-20 is a crashed or
OTA-rescued launch and is not a population.

**`onboarding_step_blocked` is new, and its absence before now is not zero.**
Five quiz screens — `odometer`, `drive`, `service`, `tracking`, `worry` — plus
the `symptoms` dwell and the `reviews` scroll gate grey out Continue until
their question is answered. React Native's `Pressable` does not fire `onPress`
when `disabled`, so every one of those refusals emitted nothing: a user who
tapped a dead Continue and quit produced a lone `onboarding_step_viewed`, which
is the same row a user who read the question and lost interest produces.

That blind spot is the reason the funnel reads as bimodal rather than leaky.
The early deaths at `vehicle` and `odometer` were the only ones with a receipt,
and only because the old vehicle screen happened to emit `year:invalid` on
every refused tap — one device left forty of them in 112 seconds. The other
gates had no equivalent.

Consequences, all in the "do not compare" direction:

- The event does not exist before this bundle. A query returning no
  `onboarding_step_blocked` rows for an earlier cohort means the event was not
  being sent, **not** that nobody was blocked. There is no way to recover the
  earlier counts.
- `reason` is a fixed per-screen vocabulary: `unanswered` (drive, tracking,
  worry), `empty` / `unparseable` (odometer), `type_unanswered` /
  `when_unanswered` (service), `dwell` (symptoms), `scroll` (reviews).
- Repeats are deliberately not collapsed. The count on one device in one
  session is the signal, exactly as it was for the vehicle field, so this event
  must be read per-person-per-session and never as a raw total.
- One dead code path was removed with it: `odometer`'s
  `trackVehicleEntry("odometer", "invalid")` sat behind `if (!valid) return`
  inside an `onPress` that a disabled button never called. It has never fired
  on a device. Any analysis that treated its absence as "nobody mis-typed a
  reading" was reading a bug.

No screen was added, removed or reordered, so depth-based funnels do not
re-baseline here — but see the point above about `route=odometer`'s
`vehicle_entry` rows, which change meaning.

## The standing caveat that outlives every entry

As of this date the paywall has converted a sample of one. Nothing in this
register is a reason to act on a rate; it is a reason not to believe one. No
A/B test, no price move, and no further flow surgery justified by "the numbers"
until a real cohort has reached the paywall on a single unchanged bundle.

### 2026-08-29 (second entry) — the quiz is six questions, and the copy is shorter

**A screen was removed, so depth-based funnels re-baseline here.** `body` is
gone from `FLOW` and from `QUIZ`. Consequences for anything that reads the
event stream:

- The quiz counter is now `QUESTION n / 6`, not `n / 7`. Any chart keyed on
  that string splits at this build.
- `route=body` stops appearing. A cohort spanning this change has two different
  step-index-to-screen mappings, so index-based funnels must be segmented, not
  pooled. Route-name funnels survive it; `vehicle → odometer` is now one hop
  where it was two.
- `quiz_answer` with `body_style` stops being emitted. The `body_style` column,
  its migration and `setBodyStyle` all stay — the data is not dropped, it is
  simply no longer written by onboarding.

It was cut rather than restyled because nothing downstream read the answer: the
garage never queried the column and only that screen wrote it. This is trigger
item 3 from `2026-08-29-onboarding-screen-audit.md`, executed on the owner's
call ahead of the cohort rather than from blocked-press data. That is a
decision, not a measurement, and it should be recorded as one.

**Onboarding body copy was shortened across all sixteen locales.** Every
`pain.*.body` and `pain.*.fix` went from a sentence pair to one line, and the
three `offer.paywall.impact.*` bullets were cut to a clause each. No key was
added or removed, so nothing about the event stream changes — but the screens
named in any before/after read of `symptoms` dwell, `help` time-on-screen or
paywall conversion are not the same screens they were, and a dwell comparison
across this build is comparing different amounts of text.

**Chip layout changed on `worry` and `tracking`.** Both wrapped, and with
labels of unequal width a five-option list wrapped 3 + 2 with the fourth option
sitting beside the third — a list with no reading order. Both now stack one
chip per line. Presentation only; the options, their order and their events are
unchanged.

**Fuel logging shipped (2026-09-01), adding two events.** `fuel_logged`
carries `full` (whether the tank was filled) and `priced` (whether a cost was
entered); `fuel_card_paywall` fires when a free user taps the locked fuel card
on the costs screen. Neither renames nor replaces an existing event, so every
onboarding funnel is unaffected and nothing here needs segmenting.

What does change is the population behind the retention numbers from this build
on. Fuel is logged weekly where a service is logged yearly, so sessions per
user and log-writes per user are both expected to rise for reasons that have
nothing to do with the flow that precedes them. A retention or engagement read
spanning this build is comparing an app with one weekly reason to open it
against an app with none.

`fuel_card_paywall` is also the app's third paywall entry point, alongside the
add-vehicle and intervals gates. Any paywall-conversion figure pooled across
entry points is now pooled across three, and the fuel one reaches users who
have already entered data of their own — a different intent from the other two,
and worth segmenting rather than averaging.

### 2026-09-04 — the watchdog guard, the odometer error, and the cohort clock restarting

**Two onboarding-adjacent changes shipped together (`4d37965`, `752180e`,
merged as `4828261`), so the cohort clock restarts here.** Anything reading
`paywall_stalled` or `onboarding_step_blocked` on `odometer` must segment at
this bundle, not pool across it.

**`paywall_stalled` changed meaning.** Before this build the event fired on a
bare 8-second timer with no knowledge of whether the app was still in the
foreground. StoreKit will not present a sheet over a backgrounded app, so a
user who switched away mid-wait produced a `paywall_stalled` and then a
perfectly normal `paywall_presented` on their return. The watchdog now samples
`AppState` at the tap and suppresses the report if the app leaves the
foreground before the timer fires.

Consequences:

- **Every `paywall_stalled` before this build is an upper bound, not a count.**
  Pre-boundary and post-boundary stall rates are not the same measurement and
  must never be divided into one another.
- The correct pre-boundary reconstruction is to pair each `paywall_shown` with
  the `paywall_presented` that follows it for the same distinct id, and ignore
  the stall event entirely. Done that way, OTA `01a05fab` (02 Sep) presents for
  4 of 4 tappers through 04 Sep 18:12Z, and `01a05f4b` for 1 of 1. The last
  build on which the bug is real is `c8bc1771`, at 2 of 4.

**This is the second time an instrument, not the product, produced the
finding.** The 08-29 entry records seven controls that could refuse a user
while emitting nothing; this one records an event that fired when nothing was
wrong. Both were read as product failures first. The budget freeze of 31 Aug
(`faae312`) was held three days past the fix on the strength of a single false
positive, which is the cost of the error and is worth stating as one.

**`odometer` gained an inline error message.** A refused Continue now renders
"Enter the reading to continue." (and its equivalent in all eleven catalog
languages) where it previously gave a haptic and nothing else. The screen is
still mandatory and the gate is unchanged — what changed is what the user reads
at the moment of refusal, so `onboarding_step_blocked` counts on `odometer`
are not comparable across this build. Expect the refused-tap count per user to
fall without the drop-off changing, and do not read that fall as a funnel
improvement.

**A recorded finding, not a break: there is no odometer parser bug.** Across
31 Aug – 4 Sep the screen produced 22 refusals from 8 users and **every one
carried `reason=empty`; `unparseable` did not fire once.** Trigger item 2 in
`2026-08-29-onboarding-screen-audit.md` — "fix `parseNumber` immediately, at
any volume" — has therefore been checked and has nothing to act on. It is
resolved by measurement rather than by a fix, and is marked so in that file.

**The symptoms screen's 82 blocked presses are not 82 impatient users.** They
come from 3 distinct ids against an 800ms dwell timer, which counts its own
ticks. Trigger item 1 (ungate any route refusing more than ~30% of its viewers)
must be evaluated on distinct users per route, never on raw event counts, or
`symptoms` will fail it every time on three devices.

### 2026-09-04 — the onboarding freeze, and what it is waiting for

Not a break. Recorded here so the absence of changes is as legible as the
changes, and so the next session does not re-derive it.

**Onboarding structure is frozen from this build until the trigger in
`2026-08-29-onboarding-screen-audit.md` is met.** The trigger is ~40 installs
reaching `route=vehicle` on one unchanged bundle, segmented by
`ota_update_id`. The state as of today:

| | |
| --- | --- |
| Unique users at `route=vehicle`, 31 Aug – 4 Sep | 19, pooled across 3 OTA builds |
| Largest single-bundle paywall cohort | 4, on `01a05fab` |
| Arrival rate at `vehicle` | ~3.8/day |
| Paid installs | ~1.4/day |
| Subscriptions, per Apple and per RevenueCat | **0** — 0 active trials, 0 active subs, $0.00 over 28 days against 71 new customers |

At the observed rate the trigger is roughly ten days out from this bundle, and
only if nothing ships into onboarding in the meantime. The two deferred devices
from `research/onboarding-competitive/patterns.md` — the pre-paywall completion
checklist (Pattern 10) and trial-first vs trial-on-dismissal (Pattern 8) — are
precisely the changes that would destroy the baseline they are meant to be
measured against, so neither ships before the trigger.

**The two `subscription_success` events in PostHog are not sales.** They belong
to one device in Anaheim on builds 22 and 23, the same geography as the
`entry-bootstrap` crash reports, and both stores report zero. Treat
install→paid as 0 and do not let the event count contradict the ledger.

### 2026-09-17 — `subscription_success` moved to the transaction

**`subscription_success` before this build is not a count of sales, and the
two series do not join.** RevenueCat reports 2 subscribers ever (both on the
trial paywall; the default paywall is 0 for 168 viewers). PostHog reported 7
persons and 13 events. Two inflators, both in `app/subscribed.tsx`:

1. The event was a mount effect on `/subscribed`, and `useFinish("paid")` was
   also the restore path from both onboarding paywalls. Every successful
   restore — a reinstall, a family share, a sandbox tester — booked a sale.
   53 persons attempted a restore in the 14 days to today.
2. The effect's deps were `[plan.dueNow, plan.items.length, vehicle]`, so one
   arrival fired again whenever the plan recomputed.

From this build:

| event | fires from | meaning |
| --- | --- | --- |
| `subscription_success` | `buy()` in `src/purchases/plans.ts`, after StoreKit honours the purchase | one sale; carries `offering`, `plan`, `pro` |
| `subscription_restored` | `restore()` in `src/purchases/index.ts`, when the receipt holds Pro | an entitlement handed back; not a sale |
| `subscribed_screen_viewed` | `/subscribed`, once per mount | the denominator for `first_core_action`; the old props ride here |
| `onboarding_completed {exit:"restored"}` | `useFinish` | was `exit:"paid"` for a restore; `paid` now means paid |

Read `subscription_success` from `ota_update_id` of this build onward only, and
treat the ledger as the count for everything before it. `paywall_purchase_started`
is unchanged and was honest throughout: 3 persons tapped Buy against 153
paywall viewers, and 2 of the 3 paid. The loss is at the tap, not at checkout.

### 2026-09-17 — the payoff pair becomes one page, under a second experiment

**`route=results` and `route=outlook` end with this build; `route=schedule`
begins.** On a fresh install the two screens read "12 services have no record
yet" and then projected twelve months from that nothing. They are folded into
one page — what the app watches from today, what it has on file, and where the
odometer lands in a year at the stated rate — and the page itself is under
test:

| `exp_onboarding_payoff` | flow after `analyzing` |
| --- | --- |
| `condensed` | `schedule` → `symptoms` … |
| `none` | `symptoms` … (no payoff screen) |
| `unassigned` (mid-flow when this build arrived) | `schedule`, behaves as `condensed` |

Assigned independently of `exp_onboarding_symptoms`, by the same
fresh-install rule. Read each on its own margin; the 2×2 is too thin at ~40
installs/day. Installs parked on `results` or `outlook` resume on `schedule`.

**The offer screen's price is stated once per fact.** Card: the standard price
struck, the intro price as the figure. Footer: `paywall.legal.week`, the
renewal. Gone: the subtitle with both prices, the card's "then {price} per
week" line, `paywall.legal.intro`. `paywall_shown`/`paywall_closed` on
`offering=discount` are unchanged in meaning.

**`default/$rc_weekly` moves to `pro_weekly_standard`, no intro.** It sold
`pro_weekly`, the product the $0.99 intro is attached to, so StoreKit applied
the intro on the first paywall and the second had nothing left to offer.
`paywall_plan_selected {plan:"$rc_weekly", offering:"current"}` before the
switch is a different price than after it.

### 2026-09-17 — the exit offer is a cheaper yearly, not a cheaper week

**`offering=discount` sells a different product from this build.** It was
`$rc_weekly` → `pro_weekly` with a $0.99 introductory week; it is now
`$rc_annual` → `pro_annual_discount` at $29.99/yr flat (US base, equalised),
renewing at that price. The weekly package is off the offering. `paywall_shown`,
`paywall_closed`, `paywall_purchase_started` and `subscription_success` on
`offering=discount` keep their names and change their meaning: `plan` goes from
`$rc_weekly` to `$rc_annual`, and a sale is worth $29.99 rather than $0.99.

Copy: `offer.trial.title` → `offer.deal.title` ("The same Pro, for less."),
the how-it-runs panel is gone, the winback caption and the Try Pro quick action
no longer name a week. `INTRO_DAYS` is gone from the code.

The comparison the screen draws — the standard yearly struck through, the
saving beside it — is `compareAt`, read off the `default` offering at fetch
time. A store that returns `discount` without `default` shows a plain price and
the plain title.
