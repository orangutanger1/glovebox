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
   be running bundles a week and three flow changes apart.
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

## The standing caveat that outlives every entry

As of this date the paywall has converted a sample of one. Nothing in this
register is a reason to act on a rate; it is a reason not to believe one. No
A/B test, no price move, and no further flow surgery justified by "the numbers"
until a real cohort has reached the paywall on a single unchanged bundle.
