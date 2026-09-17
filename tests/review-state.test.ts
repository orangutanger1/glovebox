import {
  happinessScore,
  shouldRequestReview,
  shouldRequestFirstActionReview,
  EVENT_WEIGHTS,
  SCORE_THRESHOLD,
  COOLDOWN_DAYS,
  MAX_ASKS,
  ASK_WINDOW_DAYS,
  spentAsks,
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
    lastAskedAt: daysAgo(30),
    askCount: MAX_ASKS,
  });
  expect(shouldRequestReview(exhausted, NOW)).toBe(false);
});

test("the ask count is per year, not per install", () => {
  // iOS's three-per-year quota renews; a count that never reset meant three
  // asks in the first month and silence for the life of the install.
  const renewed = state({
    events: events(["purchase", 0], ["log_service", 0], ["export", 0]),
    lastAskedAt: daysAgo(ASK_WINDOW_DAYS),
    askCount: MAX_ASKS,
  });
  expect(spentAsks(renewed, NOW)).toBe(0);
  expect(shouldRequestReview(renewed, NOW)).toBe(true);
  expect(spentAsks({ lastAskedAt: daysAgo(ASK_WINDOW_DAYS - 1), askCount: 2 }, NOW)).toBe(2);
  expect(spentAsks({ lastAskedAt: null, askCount: 2 }, NOW)).toBe(0);
});

describe("the subscriber's first-action ask", () => {
  const first = (over: Partial<Parameters<typeof shouldRequestFirstActionReview>[0]> = {}) =>
    ({ ...state(), asked: false, ...over });

  test("asks a subscriber on a single tap, below the happiness threshold", () => {
    const paid = first({ events: events(["purchase", 0]) });
    expect(shouldRequestReview(paid, NOW)).toBe(false);
    expect(shouldRequestFirstActionReview(paid, NOW)).toBe(true);
  });

  test("never asks an install that has not paid", () => {
    expect(shouldRequestFirstActionReview(first({ events: events(["log_service", 0], ["export", 0]) }), NOW)).toBe(false);
  });

  test("is spent once, whatever iOS drew", () => {
    expect(shouldRequestFirstActionReview(first({ events: events(["purchase", 0]), asked: true }), NOW)).toBe(false);
  });

  test("shares the engine's cooldown and yearly budget", () => {
    const paid = events(["purchase", 0]);
    expect(shouldRequestFirstActionReview(first({ events: paid, lastAskedAt: daysAgo(1), askCount: 1 }), NOW)).toBe(false);
    expect(shouldRequestFirstActionReview(first({ events: paid, lastAskedAt: daysAgo(30), askCount: MAX_ASKS }), NOW)).toBe(false);
    expect(shouldRequestFirstActionReview(first({ events: paid, lastAskedAt: daysAgo(30), askCount: 1 }), NOW)).toBe(true);
  });
});
