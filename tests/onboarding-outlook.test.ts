import { buildOutlook } from "../src/onboarding/outlook";
import type { Plan, PlanItem } from "../src/onboarding/plan";

const NOW = new Date("2026-09-10T12:00:00.000Z");

function at(days: number): string {
  return new Date(NOW.getTime() + days * 86400000).toISOString();
}

function item(type: string, dueAt?: string, status: PlanItem["status"] = "soon"): PlanItem {
  return { type, status, logged: true, dueAt, projected: false };
}

function plan(items: PlanItem[], extra: Partial<Plan> = {}): Plan {
  return {
    items,
    dueNow: 0,
    pastDue: 0,
    noRecord: 0,
    soon: 0,
    logged: items.length,
    unit: "mi",
    distancePerYear: 12500,
    ...extra,
  };
}

test("counts what lands inside twelve months and nothing beyond it", () => {
  const outlook = buildOutlook(
    plan([
      item("Oil Change", at(30)),
      item("Tire Rotation", at(200)),
      // Thirteen months out. Real, scheduled, and not this screen's business.
      item("Brake Inspection", at(400)),
    ]),
    NOW
  );
  expect(outlook.dueWithinYear).toBe(2);
});

test("a service with no due date is not a forecast", () => {
  // Mileage-only intervals produce no dueAt at all — there is no live odometer
  // to trigger from. Counting them would be inventing a date.
  const outlook = buildOutlook(plan([item("Air Filter"), item("Oil Change", at(10))]), NOW);
  expect(outlook.dueWithinYear).toBe(1);
});

test("already overdue still counts toward the year, but is never 'next up'", () => {
  // It is inside the window and it needs doing, so the count includes it. The
  // gauge beside the count says what is coming, and something three weeks late
  // is not coming.
  const outlook = buildOutlook(
    plan([item("Oil Change", at(-21), "due"), item("Tire Rotation", at(45))], { pastDue: 1 }),
    NOW
  );
  expect(outlook.dueWithinYear).toBe(2);
  expect(outlook.next?.type).toBe("Tire Rotation");
  expect(outlook.alreadyDue).toBe(1);
});

test("next up is the soonest ahead, not the first in the list", () => {
  // `plan.items` arrives sorted worst-first for the results screen. A forecast
  // read in that order names the wrong service.
  const outlook = buildOutlook(
    plan([item("Brake Inspection", at(120)), item("Oil Change", at(14))]),
    NOW
  );
  expect(outlook.next?.type).toBe("Oil Change");
});

test("a car with nothing dated has an honest empty forecast", () => {
  const outlook = buildOutlook(plan([item("Air Filter")]), NOW);
  expect(outlook.dueWithinYear).toBe(0);
  expect(outlook.next).toBeUndefined();
});

test("the projection and the rate come from the plan, not from a second guess", () => {
  const outlook = buildOutlook(
    plan([], { odometer: 112000, projectedOdometer: 124500, distancePerYear: 12500 }),
    NOW
  );
  expect(outlook.projectedOdometer).toBe(124500);
  expect(outlook.distancePerYear).toBe(12500);
});
