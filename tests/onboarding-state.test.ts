import {
  readOnboardingState,
  parseAnswers,
  ONBOARDING_COMPLETE_KEY,
  ONBOARDING_STEP_KEY,
} from "../src/onboarding/state";

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

test("answers survive a round trip", () => {
  const answers = { drive: "high", tracking: "receipts", worries: ["bills", "upsell"] } as const;
  expect(parseAnswers(JSON.stringify(answers))).toEqual(answers);
});

test("a blob written by another version of the app degrades instead of throwing", () => {
  expect(parseAnswers(null)).toEqual({});
  expect(parseAnswers("not json")).toEqual({});
  expect(parseAnswers("[]")).toEqual({});
  expect(parseAnswers('{"drive":"teleport","tracking":42,"worries":"bills"}')).toEqual({});
  expect(parseAnswers('{"drive":"low","worries":["bills","carrier pigeon"]}')).toEqual({
    drive: "low",
    worries: ["bills"],
  });
});

test("worries come back in the question's order, whatever order they were tapped in", () => {
  expect(parseAnswers('{"worries":["upsell","bills","bills"]}').worries).toEqual([
    "bills",
    "upsell",
  ]);
});
