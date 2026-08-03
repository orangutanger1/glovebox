import {
  happinessScore,
  shouldRequestReview,
  EVENT_WEIGHTS,
  SCORE_THRESHOLD,
  COOLDOWN_DAYS,
  MAX_ASKS,
  type ReviewEvent,
  type ReviewEventKind,
} from "../src/review/state";

const NOW = new Date("2026-08-01T12:00:00.000Z");

function daysAgo(n: number): string {
  return new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000).toISOString();
}

function events(...spec: [ReviewEventKind, number][]): ReviewEvent[] {
  return spec.map(([kind, age]) => ({ kind, at: daysAgo(age) }));
}

function state(overrides: Partial<Parameters<typeof shouldRequestReview>[0]> = {}) {
  return { events: [], lastAskedAt: null, askCount: 0, ...overrides };
}

test("a fresh event is worth its full weight", () => {
  expect(happinessScore(events(["log_service", 0]), NOW)).toBeCloseTo(5);
});

test("one half-life halves an event's contribution", () => {
  const { points, halfLifeDays } = EVENT_WEIGHTS.log_service;
  expect(happinessScore(events(["log_service", halfLifeDays]), NOW)).toBeCloseTo(points / 2);
});

test("a purchase still counts a week later, an app open does not", () => {
  expect(happinessScore(events(["purchase", 7]), NOW)).toBeGreaterThan(5);
  expect(happinessScore(events(["app_open", 7]), NOW)).toBeLessThan(0.1);
});

test("a clock rolled back cannot amplify an event beyond its weight", () => {
  const future = [{ kind: "purchase" as const, at: daysAgo(-30) }];
  expect(happinessScore(future, NOW)).toBeCloseTo(EVENT_WEIGHTS.purchase.points);
});

test("no single action can reach the threshold", () => {
  for (const kind of Object.keys(EVENT_WEIGHTS) as ReviewEventKind[]) {
    expect(happinessScore(events([kind, 0]), NOW)).toBeLessThan(SCORE_THRESHOLD);
  }
});

test("does not ask a user who has only opened the app", () => {
  const only = state({ events: events(["app_open", 0], ["app_open", 1], ["app_open", 2]) });
  expect(shouldRequestReview(only, NOW)).toBe(false);
});

test("asks once a combination of real use clears the threshold", () => {
  const engaged = state({
    events: events(["purchase", 0], ["log_service", 0], ["export", 0], ["app_open", 0]),
  });
  expect(happinessScore(engaged.events, NOW)).toBeGreaterThanOrEqual(SCORE_THRESHOLD);
  expect(shouldRequestReview(engaged, NOW)).toBe(true);
});

test("engagement that has gone stale does not trigger an ask", () => {
  const stale = state({
    events: events(["purchase", 60], ["log_service", 60], ["export", 60]),
  });
  expect(shouldRequestReview(stale, NOW)).toBe(false);
});

test("stays silent inside the cooldown even when the user is delighted", () => {
  const recent = state({
    events: events(["purchase", 0], ["log_service", 0], ["export", 0]),
    lastAskedAt: daysAgo(COOLDOWN_DAYS - 1),
    askCount: 1,
  });
  expect(shouldRequestReview(recent, NOW)).toBe(false);
});

test("asks again once the cooldown has elapsed", () => {
  const elapsed = state({
    events: events(["purchase", 0], ["log_service", 0], ["export", 0]),
    lastAskedAt: daysAgo(COOLDOWN_DAYS + 1),
    askCount: 1,
  });
  expect(shouldRequestReview(elapsed, NOW)).toBe(true);
});

test("stops asking after the number of prompts iOS will actually show", () => {
  const exhausted = state({
    events: events(["purchase", 0], ["log_service", 0], ["export", 0]),
    lastAskedAt: daysAgo(365),
    askCount: MAX_ASKS,
  });
  expect(shouldRequestReview(exhausted, NOW)).toBe(false);
});
