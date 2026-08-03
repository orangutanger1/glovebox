import { readOnboardingState, ONBOARDING_COMPLETE_KEY, ONBOARDING_STEP_KEY } from "../src/onboarding/state";

function store(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return (key: string) => map.get(key) ?? null;
}

test("a fresh install is not onboarded and has no recorded step", () => {
  const state = readOnboardingState(store());
  expect(state.isOnboarded).toBe(false);
  expect(state.step).toBeNull();
});

test("reads the recorded step for a mid-flow resume", () => {
  const state = readOnboardingState(store({ [ONBOARDING_STEP_KEY]: "vehicle" }));
  expect(state.isOnboarded).toBe(false);
  expect(state.step).toBe("vehicle");
});

test("is onboarded once the completion key is set", () => {
  const state = readOnboardingState(store({ [ONBOARDING_COMPLETE_KEY]: "true" }));
  expect(state.isOnboarded).toBe(true);
});
