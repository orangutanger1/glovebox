import { shouldRequestReview, REVIEW_ASKED_KEY } from "../src/review/state";

function store(initial: Record<string, string> = {}) {
  const map = new Map(Object.entries(initial));
  return (key: string) => map.get(key) ?? null;
}

test("asks once the user has logged a real service record", () => {
  expect(shouldRequestReview(store(), { recordCount: 1 })).toBe(true);
});

test("does not ask a user who has logged nothing", () => {
  expect(shouldRequestReview(store(), { recordCount: 0 })).toBe(false);
});

test("never asks twice, so replaying onboarding does not re-prompt", () => {
  const asked = store({ [REVIEW_ASKED_KEY]: "2026-08-01T00:00:00.000Z" });
  expect(shouldRequestReview(asked, { recordCount: 3 })).toBe(false);
});
