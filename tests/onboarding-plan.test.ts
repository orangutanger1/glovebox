import {
  buildPlan,
  nextUp,
  odometerDaysAgo,
  planItemLine,
  MILES_PER_YEAR,
  UNSTATED_MILES_PER_YEAR,
} from "../src/onboarding/plan";

const INTERVALS = {
  "Oil Change": { months: 6, miles: 5000 },
  "Spark Plugs": { miles: 60000 },
  "Registration": { months: 12 },
  Other: { months: 12 },
};

const NOW = new Date("2026-08-03T12:00:00");

function daysAgo(n: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

test("a service with nothing on file is due, not unknown", () => {
  const plan = buildPlan({ odometer: 80000, records: [], intervals: INTERVALS, answers: {}, now: NOW });
  expect(plan.items.every((i) => i.status === "due" && !i.logged)).toBe(true);
  expect(plan.logged).toBe(0);
  expect(plan.dueNow).toBe(3);
});

test("Other is not a service and never appears in the plan", () => {
  const plan = buildPlan({ records: [], intervals: INTERVALS, answers: {}, now: NOW });
  expect(plan.items.map((i) => i.type)).not.toContain("Other");
  expect(plan.items).toHaveLength(3);
});

test("a recent oil change is ok, an old one is overdue", () => {
  const recent = buildPlan({
    odometer: 80100,
    records: [{ service_type: "Oil Change", performed_at: daysAgo(10), odometer: 80000 }],
    intervals: INTERVALS,
    answers: {},
    now: NOW,
  });
  expect(recent.items.find((i) => i.type === "Oil Change")?.status).toBe("ok");

  const stale = buildPlan({
    odometer: 80100,
    records: [{ service_type: "Oil Change", performed_at: daysAgo(400), odometer: 80000 }],
    intervals: INTERVALS,
    answers: {},
    now: NOW,
  });
  expect(stale.items.find((i) => i.type === "Oil Change")?.status).toBe("due");
});

test("only the newest record of a type decides its status", () => {
  const plan = buildPlan({
    odometer: 80100,
    records: [
      { service_type: "Oil Change", performed_at: daysAgo(400), odometer: 70000 },
      { service_type: "Oil Change", performed_at: daysAgo(10), odometer: 80000 },
    ],
    intervals: INTERVALS,
    answers: {},
    now: NOW,
  });
  expect(plan.items.find((i) => i.type === "Oil Change")?.status).toBe("ok");
});

test("how far the user drives changes when a mileage-only service comes due", () => {
  const records = [{ service_type: "Spark Plugs", performed_at: daysAgo(30), odometer: 40000 }];
  const args = { odometer: 40000, records, intervals: INTERVALS, now: NOW };

  const heavy = buildPlan({ ...args, answers: { drive: "very_high" } });
  const light = buildPlan({ ...args, answers: { drive: "low" } });

  const heavyPlugs = heavy.items.find((i) => i.type === "Spark Plugs")!;
  const lightPlugs = light.items.find((i) => i.type === "Spark Plugs")!;

  // 60,000 miles out from a 40,000-mile service either way; the date differs.
  expect(heavyPlugs.dueOdometer).toBe(100000);
  expect(lightPlugs.dueOdometer).toBe(100000);
  expect(heavyPlugs.projected).toBe(true);
  expect(new Date(heavyPlugs.dueAt!).getTime()).toBeLessThan(new Date(lightPlugs.dueAt!).getTime());
  expect(heavy.milesPerYear).toBe(MILES_PER_YEAR.very_high);
  expect(light.milesPerYear).toBe(MILES_PER_YEAR.low);
});

test("an unanswered drive question still produces dates", () => {
  const plan = buildPlan({
    odometer: 40000,
    records: [{ service_type: "Spark Plugs", performed_at: daysAgo(30), odometer: 40000 }],
    intervals: INTERVALS,
    answers: {},
    now: NOW,
  });
  expect(plan.milesPerYear).toBe(UNSTATED_MILES_PER_YEAR);
  expect(plan.projectedOdometer).toBe(40000 + UNSTATED_MILES_PER_YEAR);
  expect(plan.items.find((i) => i.type === "Spark Plugs")?.dueAt).toBeDefined();
});

test("a mileage projection never overrides an earlier calendar date", () => {
  // Oil change: due in six months by date, or in 5,000 miles. At 4,000 miles a
  // year the mileage date is over a year out, so the calendar wins.
  const plan = buildPlan({
    odometer: 80000,
    records: [{ service_type: "Oil Change", performed_at: daysAgo(0), odometer: 80000 }],
    intervals: INTERVALS,
    answers: { drive: "low" },
    now: NOW,
  });
  const oil = plan.items.find((i) => i.type === "Oil Change")!;
  expect(oil.projected).toBe(false);
  expect(new Date(oil.dueAt!).getMonth()).toBe(new Date("2027-02-03T09:00:00").getMonth());
});

test("worst first, and undated rows sink under dated ones", () => {
  const plan = buildPlan({
    odometer: 80100,
    records: [
      { service_type: "Oil Change", performed_at: daysAgo(400), odometer: 70000 },
      { service_type: "Registration", performed_at: daysAgo(10) },
    ],
    intervals: INTERVALS,
    answers: {},
    now: NOW,
  });
  expect(plan.items.map((i) => i.type)).toEqual(["Oil Change", "Spark Plugs", "Registration"]);
  expect(plan.items[0].status).toBe("due");
  expect(plan.items[2].status).toBe("ok");
});

test("the next one up is the soonest ahead, not the worst behind", () => {
  const plan = buildPlan({
    odometer: 80100,
    records: [
      // Overdue by a year, so it sorts to the top of the list and its date is
      // in the past. "Next up" printed that date for as long as it was taken
      // off the head of `plan.items`.
      { service_type: "Oil Change", performed_at: daysAgo(400), odometer: 70000 },
      { service_type: "Registration", performed_at: daysAgo(10) },
    ],
    intervals: INTERVALS,
    answers: {},
    now: NOW,
  });

  const ahead = nextUp(plan, NOW);
  expect(ahead?.type).toBe("Registration");
  expect(new Date(ahead!.dueAt!).getTime()).toBeGreaterThan(NOW.getTime());
});

test("nothing dated in the future means no next one, rather than a date behind us", () => {
  const plan = buildPlan({
    odometer: 80100,
    records: [{ service_type: "Oil Change", performed_at: daysAgo(400), odometer: 70000 }],
    intervals: INTERVALS,
    answers: {},
    now: NOW,
  });
  expect(nextUp(plan, NOW)).toBeUndefined();
});

test("mileage is counted back to when a service actually happened", () => {
  // Half a year at 12,500 a year is a little over 6,000 miles, and the reading
  // the user typed is today's.
  expect(odometerDaysAgo(84210, 12500, 180)).toBe(78046);
  expect(odometerDaysAgo(84210, 12500, 0)).toBe(84210);
  // A car with fewer miles on it than the rate would have put behind it cannot
  // have a negative odometer.
  expect(odometerDaysAgo(500, 12500, 365)).toBe(0);
});

test("the shared line marks a projection as an estimate and says when there is nothing", () => {
  expect(planItemLine({ type: "x", status: "due", logged: false, projected: false })).toBe(
    "Nothing on file"
  );
  const projected = planItemLine({
    type: "x",
    status: "soon",
    logged: true,
    projected: true,
    dueAt: "2027-02-03T09:00:00.000Z",
    dueOdometer: 100000,
  });
  expect(projected).toMatch(/^about /);
  expect(projected).toContain("100,000 mi");
});
