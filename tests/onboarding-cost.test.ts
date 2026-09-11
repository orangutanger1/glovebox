import { OVERDUE } from "../src/onboarding/cost";

/**
 * The cited-statistics screen is the one place the flow prints a number that is
 * not the user's own, so this is about the citation surviving an edit. A figure
 * that quietly drifts away from the release it came from is worse than no
 * figure at all — the screen goes on naming CARFAX underneath it.
 *
 * There used to be arithmetic here as well: AAA's rate per mile, the money it
 * produced for this user's mileage, and the kilometre conversion that kept the
 * currency out of it. The screen no longer prices anything, so `cost.ts` no
 * longer computes anything, and those tests went with the constants they were
 * about.
 */
test("the published figures are the ones the screen claims to be quoting", () => {
  // CARFAX, 18 November 2025: "roughly 41% of vehicles nationwide" are behind
  // on at least one major service, with almost 30% behind on tire rotations and
  // nearly 20% on oil changes. Change these only with a newer release in hand,
  // and move `publishedAt` beside them when you do — the screen prints its year.
  expect(OVERDUE.behindPct).toBe(41);
  expect(OVERDUE.tireRotationPct).toBe(30);
  expect(OVERDUE.oilChangePct).toBe(20);
  expect(OVERDUE.year).toBe(2025);
  expect(OVERDUE.source).toBe("CARFAX");
  expect(OVERDUE.publishedAt).toBe("2025-11");
  expect(OVERDUE.url).toContain("carfax");
});

test("the headline outranks the two figures under it", () => {
  // The screen leads on the share of cars behind on *any* major service, so it
  // has to be the largest of the three or the headline is not the headline.
  expect(OVERDUE.behindPct).toBeGreaterThan(OVERDUE.tireRotationPct);
  expect(OVERDUE.behindPct).toBeGreaterThan(OVERDUE.oilChangePct);
});
