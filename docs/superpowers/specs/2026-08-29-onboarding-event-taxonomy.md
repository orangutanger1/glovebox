# The onboarding event taxonomy

**2026-08-29.** What the app emits, what the redesign brief asked for, and why
the two lists are not identical.

Read alongside `2026-08-26-funnel-comparability-register.md`. The register says
when a number stopped meaning what it meant; this says what the numbers are.

## The rule that shapes everything below

**Renaming an existing event is a comparability break, and a break with no
upside.** The register already carries seven of them in six days, and the app
has never had a cohort run one unchanged bundle end to end. An event renamed
for tidiness costs the whole history of that event and buys a nicer name.

So where the brief's requested name and the shipped name differ but mean the
same thing, **the shipped name stays** and the mapping is recorded here.

## What ships

| Event | Fires | Key properties |
| --- | --- | --- |
| `onboarding_step_viewed` | Every onboarding screen, on mount | `route`, `quiz_step`, `first_view` |
| `onboarding_step_blocked` | A greyed-out Continue is tapped | `route`, `reason` |
| `quiz_answered` | A quiz question is answered | `route`, `answer_*`, `answer_*_count` |
| `vehicle_entry` | Vehicle/odometer field focused or skipped | `field`, `event` |
| `notification_permission` | The reminder ask resolves | `outcome` |
| `paywall_shown` | The paywall route is reached | — |
| `paywall_presented` | The RevenueCat sheet actually appeared | — |
| `paywall_closed` | The sheet was dismissed | — |
| `paywall_unavailable` / `paywall_unconfigured` | The sheet could not present | — |
| `paywall_stalled` | 8s after the CTA with the sheet neither up nor failed | `offering`, `ms` |
| `onboarding_completed` | The flow ends, however it ends | `exit` = `paid` \| `trial` \| `free` |
| `subscription_success` | The post-purchase screen is reached | `due_now`, `scheduled`, `has_vehicle` |
| `first_core_action` | The first product action after the flow | `source`, `action` |
| `home_first_view` | First garage view in a process | `vehicles`, `onboarded` |
| `js_error`, `boot_failed`, `render_error` | Failures | `message`, `stack`, `step` |

Every event also carries the bundle identity — `ota_update_id`,
`ota_is_embedded`, `ota_channel`, `ota_runtime_version`, `ota_created_at` —
through `customAppProperties`, plus PostHog's `$app_version` / `$app_build`.
That is what makes a funnel segmentable by bundle, which is rule 1 of the
register and was impossible before build 21.

## The brief's list, mapped

| Requested | Status | Where it lives |
| --- | --- | --- |
| `onboarding_started` | **Covered** | `onboarding_step_viewed` with `route=welcome`, `first_view=true` |
| `onboarding_step_viewed` | Ships | — |
| `onboarding_step_completed` | **Covered** | The next step's view, and `quiz_answered` for the quiz. A separate event would double every row to say the same thing twice. |
| `onboarding_step_skipped` | **Not applicable** | No step is skippable; every screen is mandatory. `vehicle_entry` `skipped` covers the two optional *fields*. |
| `vehicle_setup_started` | **Covered** | `onboarding_step_viewed` `route=vehicle` |
| `vehicle_setup_completed` | **Covered** | `quiz_answered` `route=vehicle`, carrying `has_make` / `has_model` |
| `vehicle_validation_error` | **Gone, deliberately** | There is no validation left to fail. The year is a drum that cannot be out of range; make and model are optional. This event existing again would mean the bug came back. |
| `vehicle_setup_skipped` | **Not applicable** | The step cannot be skipped; the fields can, and are reported. |
| `personalization_started` / `_completed` | **Covered** | The quiz *is* the personalisation: `quiz_answered` per route, `route=worry` is the last. |
| `analysis_started` / `_completed` | **Covered** | `route=analyzing` view, then `route=results` view. The loader is ~3.2s and self-advancing; a paired event would measure a constant. |
| `value_reveal_viewed` | **Covered** | `onboarding_step_viewed` `route=results` |
| `paywall_shown` | Ships | — |
| `paywall_plan_selected` | **Unavailable** | Inside RevenueCat's native sheet. The app cannot see which row was tapped. |
| `paywall_purchase_started` | **Unavailable** | Same. |
| `trial_started` | **Covered** | `onboarding_completed` `exit=trial` |
| `purchase_completed` | **Covered** | `onboarding_completed` `exit=paid`, plus `subscription_success` |
| `paywall_dismissed` | **Covered** | `paywall_closed` |
| `onboarding_completed` | Ships | — |
| `home_first_view` | **Added** | — |
| `first_core_action` | **Added** | Two sources: `subscribed` / `open_vehicle`, `garage` / `log_service` |
| `subscription_success` | **Added** | — |

Three genuinely new, three genuinely unavailable, the rest already answered
under a name that has history behind it.

## `onboarding_step_blocked`, and why it is the important one

Seven controls in the flow grey Continue out until their question is answered.
React Native's `Pressable` fires no `onPress` when `disabled`, so until build 22
every one of those refusals emitted **nothing**: a user who tapped a dead
Continue and quit left one `onboarding_step_viewed` behind, which is the same
row a user who read the question and lost interest leaves.

The two are opposite problems. One is a broken control; the other is a
disinteresting question. They were indistinguishable, and that is very likely
why the funnel reads as bimodal rather than leaky — the only early drop with a
receipt was the vehicle screen's, and only because that screen happened to emit
`year:invalid` on every refused tap.

`reason` vocabulary, fixed per screen and never user text:

| Route | Reasons |
| --- | --- |
| `drive`, `tracking`, `worry` | `unanswered` |
| `odometer` | `empty`, `unparseable` |
| `service` | `type_unanswered`, `when_unanswered` |
| `symptoms` | `dwell` |
| `reviews` | `scroll` |

**Read it per person per session, never as a total.** Repeats are deliberately
not collapsed — the count on one device is the signal, exactly as it was for
the vehicle field, where one device produced forty events in 112 seconds.
`odometer` `unparseable` is a bug report, not a preference: it means
`parseNumber` refused something a person typed off their dash.

## Excluding development traffic

The brief requires QA devices to be identifiable. Two mechanisms exist and
neither is yet a clean flag:

- **No key, no events.** The client is created lazily and every call is a no-op
  without `EXPO_PUBLIC_POSTHOG_KEY`. A dev build, a simulator run and the test
  suite post nothing and cannot throw.
- **RevenueCat identity.** `identifyFromPurchases` joins each PostHog timeline
  to its RevenueCat app user id, which is how a known device is excluded today
  — by id, by hand.

**This is the weakest part of the taxonomy.** Excluding by remembered id is how
"20 genuine entrants after excluding a known development device" was arrived at,
and it does not survive a second tester or a reinstall. A build-time
`is_internal` property driven by the EAS profile is the right fix and is not
done.

## Open

- `paywall_plan_selected` and `paywall_purchase_started` need RevenueCat's own
  events joined on the app user id, not app-side instrumentation.
- No event distinguishes the two `first_core_action` sources reaching the same
  destination by different routes; `source` carries it, so this is a query
  concern rather than a gap.
- Everything above ships in **1.1.0 build 22**, which is the first binary
  carrying `onboarding_step_blocked`, `subscription_success`,
  `first_core_action` and `home_first_view`. Build 21 has none of them and is
  the crash-fix baseline only.
