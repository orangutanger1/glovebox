# Onboarding symptoms experiment — design

Date: 2026-09-15
Status: approved, ready for implementation planning

## Why

The onboarding flow spends four taps between the twelve-month outlook and the
cost comparison on a pain/reply beat: `symptoms`, three red cards one at a
time ("A spreadsheet cannot tap you on the shoulder", "Unproven service is
unperformed service", "N of 12 services have nothing on file"), then `help`,
the same three cards with the lamps off and a fix line under each. The beat
was built on the argument that a user who has just read three complaints
about their own car is primed for the price. Nothing has measured whether
that is true, and four screens of narrative is also four places to quit.

This is the app's first A/B test. The question it answers is narrow: does
removing the pain/reply beat move install → `onboarding_completed`, and in
which direction. The plumbing it leaves behind — assignment, persistence,
one property on every event — is what the next test reuses.

## Decisions

| Question | Decision |
|---|---|
| Experiment name | `onboarding_symptoms` |
| Variants | `control` (flow as shipped), `no_symptoms` (skips `symptoms` and `help`) |
| Why both screens | `help` is titled "All three are the same problem." A reply to complaints nobody read is a feature list, which the flow was built to avoid. The unit under test is the beat, not one screen |
| Assignment | Local coin flip, 50/50, at first launch only |
| Who is eligible | A fresh install: onboarding not complete and no persisted step. An install already mid-flow or finished is left alone and reports `unassigned` |
| Persistence | `app_state` key `experiment.onboarding_symptoms`, value `control` or `no_symptoms`. Written once, never rewritten |
| Reporting | `experiment_assigned { experiment, variant }` once at assignment; `exp_onboarding_symptoms` on every event thereafter via PostHog app properties |
| Analysis | PostHog funnel `onboarding_step_viewed` (welcome) → `onboarding_completed`, broken down by `exp_onboarding_symptoms`. Secondary: `onboarding_completed` split by `exit` |
| Remote control | None. PostHog feature flags and experiments are not used; the split cannot be changed without an OTA |
| Kill switch | Remove the entry from `EXPERIMENTS`. Assigned installs keep their stored variant but `hiddenRoutes` no longer reads it, so everyone sees the control flow. JS-only, ships as an OTA |
| Forcing a variant | Not built. Tests pass the variant explicitly; on a device, edit the `app_state` row |

## Architecture

Three files change and one is new. Nothing about the screens themselves
changes: `symptoms.tsx` and `help.tsx` are untouched and still render when
routed to.

### `src/experiments/index.ts` (new)

```ts
export const EXPERIMENTS = {
  onboarding_symptoms: ["control", "no_symptoms"],
} as const;
export type ExperimentName = keyof typeof EXPERIMENTS;
export type Variant<E extends ExperimentName> = (typeof EXPERIMENTS)[E][number];

/** Stored variant, or null when this install was never assigned. */
export function getVariant<E extends ExperimentName>(name: E): Variant<E> | null;

/**
 * Coin-flips every registered experiment this install has no answer for.
 * Only a fresh install is eligible; returns what it assigned.
 */
export function assignExperiments(
  eligible: boolean,
  random?: () => number
): Partial<Record<ExperimentName, string>>;

/** `exp_<name>: <variant | "unassigned">` for every registered experiment. */
export function experimentProperties(): Record<string, string>;
```

- `assignExperiments` is called once per launch from `_layout`'s boot
  sequence, after `getDb()` succeeds and before the onboarding redirect, with
  `eligible = !isOnboarded() && getOnboardingStep() === null`. It reads before
  it writes, so a second launch of a fresh install that quit on `welcome`
  (step still null) keeps its variant rather than re-flipping.
- Every assignment fires `track("experiment_assigned", { experiment,
  variant })`. That event, not the stored row, is the record of when the
  install joined.
- `experimentProperties` reads `app_state` through `getState` inside a
  try/catch and returns `unassigned` for every experiment when the database
  is unavailable — analytics initialises before the database on purpose and
  must not throw because of it.
- A stored value that is not one of the experiment's variants (a variant
  retired by a later build) reads as `null` / `unassigned`.

### `src/analytics/index.ts`

`customAppProperties` becomes `{ ...native, ...bundleIdentity(),
...experimentProperties() }`. App properties are read off the client on
every event with no storage in the path, which is the same reason the OTA
identity lives there rather than in `register` (see the docblock on
`bundleIdentity`). `experiment_assigned` is the only new event name.

### `src/onboarding/flow.ts`

```ts
/** Routes a variant does not show. Empty for control and for unassigned. */
export function hiddenRoutes(variant: string | null): readonly OnboardingRoute[];

export function nextRoute(route, hidden = activeHidden()): OnboardingRoute | null;
export function previousRoute(route, hidden = activeHidden()): OnboardingRoute | null;
export function resumeRoute(step, hidden = activeHidden()): OnboardingRoute;
```

- `hiddenRoutes("no_symptoms")` is `["symptoms", "help"]`; anything else is
  `[]`.
- `activeHidden()` is `hiddenRoutes(getVariant("onboarding_symptoms"))`. It is
  a default argument so `nav.ts` and `_layout.tsx` call the two-argument
  functions unchanged and tests pass `hidden` explicitly.
- `nextRoute` and `previousRoute` step over hidden routes the way
  `previousRoute` already steps over `TRANSIENT`. `resumeRoute` maps a
  persisted step that is hidden to the next visible route, so an install
  cannot resume on a screen its variant does not show.
- `FLOW`, `QUIZ`, `RETIRED`, `quizStep` and `OnboardingRoute` are unchanged.
  The quiz counter is not affected: neither hidden screen is a quiz screen.

### `app/_layout.tsx`

One line in the boot effect, after the database is known to open and before
`resumeRoute` is read:

```ts
boot("experiments", () => assignExperiments(!onboarded && getOnboardingStep() === null));
```

`boot` already swallows a throw and hands back `undefined`, so a failure here
leaves the install unassigned and on the control flow.

## What a user sees

- **control**: the flow exactly as shipped.
- **no_symptoms**: … `outlook` → `compare` → `reviews` → `paywall` … Back from
  `compare` lands on `outlook`. Four fewer taps.
- Nothing announces the variant. No screen reads it except through
  `nextRoute`/`previousRoute`.

## Testing

`tests/experiments.test.ts` (logic, in-memory `app_state`):
- a fresh install is assigned once, persisted, and the second call returns
  the same variant without a new event
- an ineligible install (onboarded, or mid-flow) is not assigned and reports
  `unassigned`
- the flip honours the injected `random` (0 → first variant, 0.99 → second)
- a stored value outside the variant list reads as `null`
- `experimentProperties` returns `unassigned` when `getState` throws

`tests/onboarding-flow.test.ts` additions:
- `hiddenRoutes` is empty for `control`, `null` and unknown strings
- with `["symptoms", "help"]` hidden, walking `nextRoute` from `welcome`
  yields `FLOW` minus those two, and `previousRoute` walks it back
  symmetrically
- `resumeRoute("symptoms", hidden)` and `resumeRoute("help", hidden)` are
  `compare`

`tests/analytics.test.ts`: `experiment_assigned` is a known event name, if the
file enumerates them.

The existing screen tests mock `expo-router` and do not exercise the flow
graph; they need no change. `tests/onboarding-screens.test.tsx` walks the
control flow and keeps doing so, because its in-memory `app_state` has no
experiment row.

## Out of scope

- PostHog feature flags or the Experiments product
- A settings or debug switch to pick a variant
- Any change to the copy or layout of `symptoms` or `help`
- A second experiment. The registry can hold one; adding another is a one-line
  edit plus a `hiddenRoutes` case if it hides screens
