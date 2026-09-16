# Onboarding Symptoms Experiment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A 50/50 A/B test in which half of fresh installs never see the `symptoms` and `help` onboarding screens, with the variant stamped on every analytics event.

**Architecture:** A new pure-ish module `src/experiments/` owns the registry, the coin flip, the `app_state` row and the analytics property bag. `src/onboarding/flow.ts` learns a `hidden` list that `nextRoute`/`previousRoute`/`resumeRoute` step over, defaulting to whatever the stored variant hides. `_layout.tsx` assigns once at boot for fresh installs; `analytics` merges `experimentProperties()` into PostHog app properties.

**Tech Stack:** Expo 57 / React Native 0.86, TypeScript, expo-sqlite `app_state` via `src/db/state.ts`, posthog-react-native, Jest (ts-jest `logic` project for `.test.ts`).

**Spec:** `docs/superpowers/specs/2026-09-15-onboarding-symptoms-experiment-design.md`

## Global Constraints

- Experiment name `onboarding_symptoms`; variants exactly `"control"` and `"no_symptoms"`.
- `app_state` key `experiment.onboarding_symptoms`; written once, never rewritten.
- Only a fresh install is assigned: `!isOnboarded() && getOnboardingStep() === null`.
- Event `experiment_assigned { experiment, variant }` fires once per assignment. Property `exp_onboarding_symptoms` carries `control` | `no_symptoms` | `unassigned` on every event.
- `no_symptoms` hides exactly `["symptoms", "help"]`. `FLOW`, `QUIZ`, `RETIRED`, `quizStep`, `OnboardingRoute` unchanged.
- Nothing in `src/experiments` or `src/analytics` may throw when the database is unavailable — analytics initialises before `getDb()`.
- `symptoms.tsx` and `help.tsx` are not edited.
- Logic tests that import `src/onboarding/flow` now transitively import `src/db/client`; they mock `../src/experiments` (Tasks 2, 3) rather than the database.
- Run one project with `npx jest --selectProjects logic --testPathPattern <name>`; the whole suite with `npx jest`.
- Commit after every task, Conventional Commits subject ≤ 50 chars.

---

### Task 1: The experiments module — `src/experiments/index.ts`

**Files:**
- Create: `src/experiments/index.ts`
- Test: `tests/experiments.test.ts`

**Interfaces:**
- Consumes: `getState(key): string | null`, `setState(key, value): void` from `src/db/state.ts`; `track(event, props)` from `src/analytics`.
- Produces:
  ```ts
  export const EXPERIMENTS: { readonly onboarding_symptoms: readonly ["control", "no_symptoms"] };
  export type ExperimentName = keyof typeof EXPERIMENTS;
  export type Variant<E extends ExperimentName> = (typeof EXPERIMENTS)[E][number];
  export function getVariant<E extends ExperimentName>(name: E): Variant<E> | null;
  export function assignExperiments(eligible: boolean, random?: () => number): Partial<Record<ExperimentName, string>>;
  export function experimentProperties(): Record<string, string>;
  ```

- [ ] **Step 1: Write the failing tests**

`tests/experiments.test.ts`:

```ts
// The same in-memory app_state the other logic tests use, so the row is
// written and read through the real SQL.
jest.mock("../src/db/client", () => {
  const Sqlite = require("better-sqlite3");
  const db = new Sqlite(":memory:");
  const { applyMigrations } = jest.requireActual("../src/db/schema");
  applyMigrations((sql: string) => db.exec(sql), 0);
  return {
    getDb: () => ({
      runSync: (sql: string, params: unknown[] = []) => db.prepare(sql).run(...params),
      getFirstSync: (sql: string, params: unknown[] = []) =>
        db.prepare(sql).get(...params) ?? null,
      getAllSync: (sql: string, params: unknown[] = []) => db.prepare(sql).all(...params),
    }),
  };
});

const tracked: { event: string; props?: Record<string, unknown> }[] = [];
jest.mock("../src/analytics", () => ({
  track: (event: string, props?: Record<string, unknown>) => {
    tracked.push({ event, props });
  },
}));

import {
  EXPERIMENTS,
  assignExperiments,
  experimentProperties,
  getVariant,
} from "../src/experiments";
import { getDb } from "../src/db/client";
import { getState, setState } from "../src/db/state";

beforeEach(() => {
  tracked.length = 0;
  getDb().runSync("DELETE FROM app_state", []);
});

test("the registry holds one experiment with two variants", () => {
  expect(EXPERIMENTS.onboarding_symptoms).toEqual(["control", "no_symptoms"]);
});

test("a fresh install is assigned once, persisted, and never re-flipped", () => {
  const first = assignExperiments(true, () => 0.99);
  expect(first).toEqual({ onboarding_symptoms: "no_symptoms" });
  expect(getState("experiment.onboarding_symptoms")).toBe("no_symptoms");
  expect(getVariant("onboarding_symptoms")).toBe("no_symptoms");
  expect(tracked).toEqual([
    {
      event: "experiment_assigned",
      props: { experiment: "onboarding_symptoms", variant: "no_symptoms" },
    },
  ]);

  // Same install, next launch, still on welcome: the coin is not tossed again.
  const second = assignExperiments(true, () => 0);
  expect(second).toEqual({});
  expect(getVariant("onboarding_symptoms")).toBe("no_symptoms");
  expect(tracked).toHaveLength(1);
});

test("the flip honours the random source", () => {
  assignExperiments(true, () => 0);
  expect(getVariant("onboarding_symptoms")).toBe("control");
  getDb().runSync("DELETE FROM app_state", []);
  assignExperiments(true, () => 0.5);
  expect(getVariant("onboarding_symptoms")).toBe("no_symptoms");
});

test("an ineligible install is left alone and reports unassigned", () => {
  expect(assignExperiments(false)).toEqual({});
  expect(getState("experiment.onboarding_symptoms")).toBeNull();
  expect(getVariant("onboarding_symptoms")).toBeNull();
  expect(experimentProperties()).toEqual({ exp_onboarding_symptoms: "unassigned" });
  expect(tracked).toHaveLength(0);
});

test("properties carry the stored variant", () => {
  setState("experiment.onboarding_symptoms", "control");
  expect(experimentProperties()).toEqual({ exp_onboarding_symptoms: "control" });
});

test("a stored value outside the variant list reads as unassigned", () => {
  // A variant a later build retired, or a hand-edited row.
  setState("experiment.onboarding_symptoms", "half_symptoms");
  expect(getVariant("onboarding_symptoms")).toBeNull();
  expect(experimentProperties()).toEqual({ exp_onboarding_symptoms: "unassigned" });
  // And it is not overwritten: the row is the record of what this install got.
  assignExperiments(true, () => 0);
  expect(getState("experiment.onboarding_symptoms")).toBe("half_symptoms");
  expect(tracked).toHaveLength(0);
});

test("properties never throw when the database is unavailable", () => {
  const client = jest.requireMock("../src/db/client") as { getDb: () => unknown };
  const real = client.getDb;
  client.getDb = () => {
    throw new Error("no database");
  };
  try {
    expect(experimentProperties()).toEqual({ exp_onboarding_symptoms: "unassigned" });
    expect(getVariant("onboarding_symptoms")).toBeNull();
  } finally {
    client.getDb = real;
  }
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest --selectProjects logic --testPathPattern experiments`
Expected: FAIL — `Cannot find module '../src/experiments'`.

- [ ] **Step 3: Write the module**

`src/experiments/index.ts`:

```ts
import { getState, setState } from "../db/state";
import { track } from "../analytics";

/**
 * A/B tests, assigned on the device.
 *
 * One registry, one row per experiment in `app_state`, one property per
 * experiment on every analytics event. That is the whole system, and it is
 * deliberately smaller than a feature-flag service: the split cannot be
 * changed without shipping code, and in exchange the assignment is
 * deterministic, works on a launch with no network, and cannot fall to
 * control because a fetch was slow.
 *
 * Only a fresh install is assigned — one that has not finished onboarding
 * and has no persisted step. An install already mid-flow when the experiment
 * ships would see its screens change under it, and an install that finished
 * under one build has already produced its outcome. Both report
 * "unassigned" and behave as control.
 *
 * The row is written once and read on every launch. It is never rewritten,
 * even when it holds a value this build does not recognise: the row is the
 * record of what the install was shown, and a later build that overwrote it
 * would count the same user in two arms.
 */

export const EXPERIMENTS = {
  onboarding_symptoms: ["control", "no_symptoms"],
} as const;

export type ExperimentName = keyof typeof EXPERIMENTS;
export type Variant<E extends ExperimentName> = (typeof EXPERIMENTS)[E][number];

const NAMES = Object.keys(EXPERIMENTS) as ExperimentName[];
const key = (name: ExperimentName) => `experiment.${name}`;

/** The stored variant, or null when this install was never assigned or holds
 *  a value this build does not know. Never throws. */
export function getVariant<E extends ExperimentName>(name: E): Variant<E> | null {
  let raw: string | null;
  try {
    raw = getState(key(name));
  } catch {
    return null;
  }
  const variants: readonly string[] = EXPERIMENTS[name];
  return raw !== null && variants.includes(raw) ? (raw as Variant<E>) : null;
}

/**
 * Coin-flips every registered experiment this install has no row for, when
 * the install is eligible. Returns what it assigned, which is empty on every
 * launch but the first.
 */
export function assignExperiments(
  eligible: boolean,
  random: () => number = Math.random
): Partial<Record<ExperimentName, string>> {
  const assigned: Partial<Record<ExperimentName, string>> = {};
  if (!eligible) return assigned;
  for (const name of NAMES) {
    // A row of any value means the question was already answered for this
    // install, even if the answer is one this build no longer recognises.
    if (getState(key(name)) !== null) continue;
    const variants = EXPERIMENTS[name];
    const variant = variants[Math.min(variants.length - 1, Math.floor(random() * variants.length))];
    setState(key(name), variant);
    assigned[name] = variant;
    track("experiment_assigned", { experiment: name, variant });
  }
  return assigned;
}

/** `exp_<name>` for every registered experiment, "unassigned" where there is
 *  no usable row. Read by analytics on every event, so it must never throw. */
export function experimentProperties(): Record<string, string> {
  const props: Record<string, string> = {};
  for (const name of NAMES) props[`exp_${name}`] = getVariant(name) ?? "unassigned";
  return props;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest --selectProjects logic --testPathPattern experiments`
Expected: PASS, 7 tests.

If ts-jest reports a circular import warning between `src/analytics` and `src/experiments`, it is only a warning here (the analytics side is wired in Task 3 and calls `experimentProperties` lazily, at event time).

- [ ] **Step 5: Commit**

```bash
git add src/experiments/index.ts tests/experiments.test.ts
git commit -m "feat(experiments): assign and persist A/B variants"
```

---

### Task 2: Hidden routes in the flow graph — `src/onboarding/flow.ts`

**Files:**
- Modify: `src/onboarding/flow.ts` (the `TRANSIENT` block at lines 119–132 and `resumeRoute` at the end of the file)
- Modify: `tests/onboarding-flow.test.ts:1-9` (imports, plus a mock)
- Test: `tests/onboarding-flow.test.ts`

**Interfaces:**
- Consumes: `getVariant("onboarding_symptoms")` from `src/experiments` (Task 1).
- Produces:
  ```ts
  export function hiddenRoutes(variant: string | null): readonly OnboardingRoute[];
  export function nextRoute(route: OnboardingRoute, hidden?: readonly OnboardingRoute[]): OnboardingRoute | null;
  export function previousRoute(route: OnboardingRoute, hidden?: readonly OnboardingRoute[]): OnboardingRoute | null;
  export function resumeRoute(step: string | null, hidden?: readonly OnboardingRoute[]): OnboardingRoute;
  ```
  `nav.ts` and `_layout.tsx` keep calling the one-argument forms unchanged.

- [ ] **Step 1: Add the mock and the failing tests**

At the very top of `tests/onboarding-flow.test.ts`, before the existing `import { FLOW, ... }`:

```ts
// The flow reads the stored variant for its default `hidden` list, and the
// store is the device database. These tests pass `hidden` explicitly, so the
// store is stubbed to "never assigned" rather than opened.
jest.mock("../src/experiments", () => ({ getVariant: () => null }));
```

Add `hiddenRoutes` to the import list:

```ts
import {
  FLOW,
  QUIZ,
  hiddenRoutes,
  nextRoute,
  previousRoute,
  quizStep,
  resumeRoute,
  isOnboardingRoute,
} from "../src/onboarding/flow";
```

Append at the end of the file:

```ts
describe("the no_symptoms variant", () => {
  const hidden = hiddenRoutes("no_symptoms");

  test("hides the pain beat and nothing else", () => {
    expect(hidden).toEqual(["symptoms", "help"]);
    expect(hiddenRoutes("control")).toEqual([]);
    expect(hiddenRoutes(null)).toEqual([]);
    expect(hiddenRoutes("half_symptoms")).toEqual([]);
  });

  test("walks forward through the flow minus the hidden screens", () => {
    const walked: string[] = ["welcome"];
    let at = nextRoute("welcome", hidden);
    while (at) {
      walked.push(at);
      at = nextRoute(at, hidden);
    }
    expect(walked).toEqual(FLOW.filter((r) => !hidden.includes(r)));
    expect(nextRoute("outlook", hidden)).toBe("compare");
  });

  test("walks back the same path", () => {
    expect(previousRoute("compare", hidden)).toBe("outlook");
    const walked: string[] = ["offer"];
    let at = previousRoute("offer", hidden);
    while (at) {
      walked.push(at);
      at = previousRoute(at, hidden);
    }
    // Back also steps over "analyzing", as it always has.
    expect(walked).toEqual(
      FLOW.filter((r) => !hidden.includes(r) && r !== "analyzing").reverse()
    );
  });

  test("a persisted step on a hidden screen resumes on the next visible one", () => {
    expect(resumeRoute("symptoms", hidden)).toBe("compare");
    expect(resumeRoute("help", hidden)).toBe("compare");
    expect(resumeRoute("outlook", hidden)).toBe("outlook");
  });

  test("with nothing hidden the graph is unchanged", () => {
    expect(nextRoute("outlook")).toBe("symptoms");
    expect(nextRoute("outlook", [])).toBe("symptoms");
    expect(previousRoute("compare")).toBe("help");
    expect(resumeRoute("symptoms")).toBe("symptoms");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest --selectProjects logic --testPathPattern onboarding-flow`
Expected: FAIL — `hiddenRoutes is not a function` (or a TS error that `hiddenRoutes` is not exported).

- [ ] **Step 3: Rewrite the navigation functions**

In `src/onboarding/flow.ts`, add the import at the top of the file:

```ts
import { getVariant } from "../experiments";
```

Find `export function nextRoute(route: OnboardingRoute): OnboardingRoute | null {` (with its one-line body) and the block from `/** Screens that move on by themselves.` through the end of `previousRoute`. Replace both with:

```ts
/**
 * Screens a variant does not show. The onboarding symptoms experiment hides
 * the pain beat: the three red cards and the reply to them. Anything that is
 * not a recognised variant — control, unassigned, a value this build does not
 * know — hides nothing, so the control flow is also the fallback.
 */
export function hiddenRoutes(variant: string | null): readonly OnboardingRoute[] {
  return variant === "no_symptoms" ? ["symptoms", "help"] : [];
}

/** What this install hides, from its stored variant. The default for every
 *  caller that is not a test. */
function activeHidden(): readonly OnboardingRoute[] {
  return hiddenRoutes(getVariant("onboarding_symptoms"));
}

export function nextRoute(
  route: OnboardingRoute,
  hidden: readonly OnboardingRoute[] = activeHidden()
): OnboardingRoute | null {
  let i = FLOW.indexOf(route) + 1;
  while (i < FLOW.length && hidden.includes(FLOW[i])) i += 1;
  return FLOW[i] ?? null;
}

/**
 * Screens that move on by themselves. Back has to step over them: "analyzing"
 * replaces itself with the results, so a Back from the results that landed on
 * it would be pushed straight forward again — the last quiz question would be
 * unreachable and the only way out of the loop would be force-quitting.
 */
const TRANSIENT: readonly OnboardingRoute[] = ["analyzing"];

export function previousRoute(
  route: OnboardingRoute,
  hidden: readonly OnboardingRoute[] = activeHidden()
): OnboardingRoute | null {
  let i = FLOW.indexOf(route) - 1;
  while (i >= 0 && (TRANSIENT.includes(FLOW[i]) || hidden.includes(FLOW[i]))) i -= 1;
  return i >= 0 ? FLOW[i] : null;
}
```

Then replace `resumeRoute` at the end of the file:

```ts
/** Where a relaunch resumes. Anything unrecognised restarts the flow; a step
 *  this install's variant does not show resumes on the next screen it does. */
export function resumeRoute(
  step: string | null,
  hidden: readonly OnboardingRoute[] = activeHidden()
): OnboardingRoute {
  if (!step) return "welcome";
  const route = isOnboardingRoute(step) ? step : RETIRED[step];
  if (!route) return "welcome";
  return hidden.includes(route) ? (nextRoute(route, hidden) ?? "welcome") : route;
}
```

- [ ] **Step 4: Run the flow tests to verify they pass**

Run: `npx jest --selectProjects logic --testPathPattern onboarding-flow`
Expected: PASS — the existing tests plus 5 new.

- [ ] **Step 5: Run every suite that renders the flow**

Run: `npx jest --testPathPattern 'onboarding|analytics'`
Expected: `tests/analytics.test.ts` FAILS with a module-load error mentioning `expo-sqlite` or `src/db/client` — it mocks `../src/onboarding` but `src/onboarding/flow` is now reached through `nav.ts` and pulls in `src/experiments` → `src/db`. Task 3 adds that mock; leave it red for now. Every other suite passes: the screen tests already mock `../src/db/client`.

- [ ] **Step 6: Commit**

```bash
git add src/onboarding/flow.ts tests/onboarding-flow.test.ts
git commit -m "feat(onboarding): let a variant hide flow screens"
```

---

### Task 3: Wire assignment at boot and the property on every event

**Files:**
- Modify: `src/analytics/index.ts:47` (`customAppProperties`) and the imports at lines 1–4
- Modify: `app/_layout.tsx:19-21` (imports) and the boot effect around line 219 (`const onboarded = isOnboarded();`)
- Modify: `tests/analytics.test.ts:57-86` (mocks)
- Test: `tests/analytics.test.ts`

**Interfaces:**
- Consumes: `experimentProperties()`, `assignExperiments(eligible)` from `src/experiments` (Task 1); `isOnboarded()`, `getOnboardingStep()` from `src/onboarding`; `boot(name, fn)` already defined in `_layout.tsx`.

- [ ] **Step 1: Add the mock and the failing test to the analytics suite**

In `tests/analytics.test.ts`, after the `jest.mock("expo-updates", () => mockUpdates);` line:

```ts
// The experiment bag rides beside the bundle identity on every event. Mutable
// so one test is an unassigned install and the next is in an arm.
let mockExperiments: Record<string, string> = { exp_onboarding_symptoms: "unassigned" };
jest.mock("../src/experiments", () => ({
  experimentProperties: () => mockExperiments,
  getVariant: () => null,
}));
```

Find the existing test that reads `constructedWith.customAppProperties` for the OTA identity (search the file for `ota_update_id`). Immediately after that test, add:

```ts
test("every event carries the experiment arm beside the bundle identity", () => {
  mockExperiments = { exp_onboarding_symptoms: "no_symptoms" };
  try {
    initAnalytics();
    const props = constructedWith!.customAppProperties!({ $os: "iOS" });
    expect(props).toMatchObject({
      $os: "iOS",
      ota_update_id: "embedded",
      exp_onboarding_symptoms: "no_symptoms",
    });
  } finally {
    mockExperiments = { exp_onboarding_symptoms: "unassigned" };
  }
});
```

If that file resets the module between tests with `jest.resetModules()` / a fresh `require`, follow the same pattern the neighbouring OTA test uses to obtain `initAnalytics` and `constructedWith`; the assertion is the same.

- [ ] **Step 2: Run the analytics suite to verify it fails**

Run: `npx jest --selectProjects logic --testPathPattern analytics`
Expected: the new test FAILS — `exp_onboarding_symptoms` is absent from the properties. (The module-load failure from Task 2 Step 5 is gone: the mock stops `src/experiments` from reaching the database.)

- [ ] **Step 3: Merge the experiment bag into the app properties**

`src/analytics/index.ts` — add the import after `import { identifyCrashUser } from "../crash";`:

```ts
import { experimentProperties } from "../experiments";
```

Change the `customAppProperties` line inside `initAnalytics`:

```ts
    customAppProperties: (native) => ({
      ...native,
      ...bundleIdentity(),
      // Read at event time, never stored: see `bundleIdentity` for why app
      // properties rather than `register`. "unassigned" until the boot
      // sequence has flipped the coin, and for every install it never does.
      ...experimentProperties(),
    }),
```

- [ ] **Step 4: Run the analytics suite to verify it passes**

Run: `npx jest --selectProjects logic --testPathPattern analytics`
Expected: PASS.

- [ ] **Step 5: Assign at boot**

`app/_layout.tsx` — add the import beside the other `src/onboarding` imports:

```ts
import { assignExperiments } from "../src/experiments";
```

In the boot effect, immediately after `const onboarded = isOnboarded();`:

```ts
    // The coin is tossed once, for a fresh install only, before anything
    // routes on it: `resumeRoute` below reads the variant to decide which
    // screens exist. An install already mid-flow or finished keeps the flow
    // it started on and reports "unassigned". `boot` swallows a throw, and
    // an install that could not be assigned is on the control flow.
    boot("experiments", () => assignExperiments(!onboarded && getOnboardingStep() === null));
```

- [ ] **Step 6: Type-check and run the whole suite**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npx jest`
Expected: PASS, both projects. If `tests/root-layout.test.tsx` renders `_layout` and fails on `assignExperiments`, add `jest.mock("../src/experiments", () => ({ assignExperiments: () => ({}), experimentProperties: () => ({}), getVariant: () => null }));` beside its other mocks.

- [ ] **Step 7: Commit**

```bash
git add src/analytics/index.ts app/_layout.tsx tests/analytics.test.ts
git commit -m "feat(experiments): assign at boot, stamp every event"
```

- [ ] **Step 8: Verify on a device**

Fresh install (delete the app first). Walk onboarding twice on two installs, or once and then edit the row: in a dev build, `setState("experiment.onboarding_symptoms", "no_symptoms")` from the debugger, kill, relaunch, delete `onboarding_step`. Expected: with `no_symptoms`, `outlook` → Continue lands on `compare`, Back from `compare` lands on `outlook`. In PostHog, the install's events carry `exp_onboarding_symptoms` and there is one `experiment_assigned`.

---

## Self-review

**Spec coverage.** Registry, `getVariant`, `assignExperiments` (eligibility, once-only, injected random, event), `experimentProperties` (unassigned, never throws) — Task 1. `hiddenRoutes`, the three navigation functions with a defaulted `hidden`, `resumeRoute` mapping a hidden step forward, `FLOW`/`QUIZ`/`RETIRED` untouched — Task 2. `customAppProperties` merge, boot assignment gated on fresh install via `boot` — Task 3. Analysis and kill switch need no code. Out-of-scope items are not planned.

**Placeholder scan.** None.

**Type consistency.** `assignExperiments(eligible: boolean, random?: () => number)`, `getVariant(name)`, `experimentProperties()`, `hiddenRoutes(variant: string | null)`, `nextRoute/previousRoute/resumeRoute(…, hidden?)` — same names and shapes in every task.
