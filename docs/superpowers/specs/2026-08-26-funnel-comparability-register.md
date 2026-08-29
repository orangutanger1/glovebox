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

## The standing caveat that outlives every entry

As of this date the paywall has converted a sample of one. Nothing in this
register is a reason to act on a rate; it is a reason not to believe one. No
A/B test, no price move, and no further flow surgery justified by "the numbers"
until a real cohort has reached the paywall on a single unchanged bundle.
