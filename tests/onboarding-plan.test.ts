import Database from "better-sqlite3";

/**
 * The plan formats its distances, and the formatter reads the stored unit, so
 * importing it reaches `src/db/client` and through it `expo-sqlite` — an ES
 * module this runner cannot parse. Every test below passes its unit in
 * explicitly; the database is here only to keep the import graph resolvable.
 */
jest.mock("../src/db/client", () => {
  const db = new Database(":memory:");
  const { applyMigrations } = jest.requireActual("../src/db/schema");
  applyMigrations((sql: string) => db.exec(sql), 0);
  return {
    getDb: () => ({
      runSync: (sql: string, params: unknown[] = []) => db.prepare(sql).run(...params),
      getFirstSync: (sql: string, params: unknown[] = []) => db.prepare(sql).get(...params) ?? null,
      getAllSync: (sql: string, params: unknown[] = []) => db.prepare(sql).all(...params),
    }),
  };
});

import {
  buildPlan,
  nextUp,
  odometerDaysAgo,
  planBadge,
  planItemLine,
  planRowStatus,
  distancePerYearFor,
  DISTANCE_PER_YEAR,
  UNSTATED_DISTANCE_PER_YEAR,
} from "../src/onboarding/plan";
import { getIntervals } from "../src/db/intervals";
import { setLanguage } from "../src/i18n";

// `planItemLine` is catalog copy and a formatted distance, so the strings
// asserted at the bottom of this file are English's only once English is set.
beforeAll(() => setLanguage("en"));

const INTERVALS = {
  "Oil Change": { months: 6, distance: 5000 },
  "Spark Plugs": { distance: 60000 },
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
  const plan = buildPlan({
    odometer: 80000,
    records: [],
    intervals: INTERVALS,
    answers: {},
    unit: "mi",
    now: NOW,
  });
  expect(plan.items.every((i) => i.status === "due" && !i.logged)).toBe(true);
  expect(plan.logged).toBe(0);
  expect(plan.dueNow).toBe(3);
});

test("Other is not a service and never appears in the plan", () => {
  const plan = buildPlan({
    records: [],
    intervals: INTERVALS,
    answers: {},
    unit: "mi",
    now: NOW,
  });
  expect(plan.items.map((i) => i.type)).not.toContain("Other");
  expect(plan.items).toHaveLength(3);
});

test("the plan carries the unit its numbers are in", () => {
  // Six screens read this plan and every one of them prints a distance. The
  // unit travelling with the numbers is what keeps a kilometre figure from
  // being labelled mi two screens later.
  const args = { odometer: 80000, records: [], intervals: INTERVALS, answers: {}, now: NOW };
  expect(buildPlan({ ...args, unit: "mi" }).unit).toBe("mi");
  expect(buildPlan({ ...args, unit: "km" }).unit).toBe("km");
});

test("a recent oil change is ok, an old one is overdue", () => {
  const recent = buildPlan({
    odometer: 80100,
    records: [{ service_type: "Oil Change", performed_at: daysAgo(10), odometer: 80000 }],
    intervals: INTERVALS,
    answers: {},
    unit: "mi",
    now: NOW,
  });
  expect(recent.items.find((i) => i.type === "Oil Change")?.status).toBe("ok");

  const stale = buildPlan({
    odometer: 80100,
    records: [{ service_type: "Oil Change", performed_at: daysAgo(400), odometer: 80000 }],
    intervals: INTERVALS,
    answers: {},
    unit: "mi",
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
    unit: "mi",
    now: NOW,
  });
  expect(plan.items.find((i) => i.type === "Oil Change")?.status).toBe("ok");
});

test("how far the user drives changes when a distance-only service comes due", () => {
  const records = [{ service_type: "Spark Plugs", performed_at: daysAgo(30), odometer: 40000 }];
  const args = { odometer: 40000, records, intervals: INTERVALS, unit: "mi" as const, now: NOW };

  const heavy = buildPlan({ ...args, answers: { drive: "very_high" } });
  const light = buildPlan({ ...args, answers: { drive: "low" } });

  const heavyPlugs = heavy.items.find((i) => i.type === "Spark Plugs")!;
  const lightPlugs = light.items.find((i) => i.type === "Spark Plugs")!;

  // 60,000 miles out from a 40,000-mile service either way; the date differs.
  expect(heavyPlugs.dueOdometer).toBe(100000);
  expect(lightPlugs.dueOdometer).toBe(100000);
  expect(heavyPlugs.projected).toBe(true);
  expect(new Date(heavyPlugs.dueAt!).getTime()).toBeLessThan(new Date(lightPlugs.dueAt!).getTime());
  expect(heavy.distancePerYear).toBe(DISTANCE_PER_YEAR.mi.very_high);
  expect(light.distancePerYear).toBe(DISTANCE_PER_YEAR.mi.low);
});

test("the annual-distance buckets are the metric question's own ranges, not converted miles", () => {
  // The kilometre question offers "under 8,000 km" because that is a round
  // number a European recognises; its midpoint has to be the number the plan
  // projects with, not 1.609 times the American one.
  const answers = { drive: "high" } as const;
  expect(distancePerYearFor(answers, "mi")).toBe(12500);
  expect(distancePerYearFor(answers, "km")).toBe(20000);
  expect(DISTANCE_PER_YEAR.mi).toEqual({ low: 4000, average: 7500, high: 12500, very_high: 18000 });
  expect(DISTANCE_PER_YEAR.km).toEqual({ low: 6000, average: 12000, high: 20000, very_high: 30000 });

  // Every bucket differs between the two systems, so no screen can be reading
  // one table and labelling it with the other unit.
  for (const drive of ["low", "average", "high", "very_high"] as const) {
    expect(DISTANCE_PER_YEAR.km[drive]).not.toBe(DISTANCE_PER_YEAR.mi[drive]);
  }
});

test("an unanswered drive question still produces dates", () => {
  const args = {
    odometer: 40000,
    records: [{ service_type: "Spark Plugs", performed_at: daysAgo(30), odometer: 40000 }],
    intervals: INTERVALS,
    answers: {},
    now: NOW,
  };

  const miles = buildPlan({ ...args, unit: "mi" });
  expect(miles.distancePerYear).toBe(UNSTATED_DISTANCE_PER_YEAR.mi);
  expect(miles.projectedOdometer).toBe(40000 + UNSTATED_DISTANCE_PER_YEAR.mi);
  expect(miles.items.find((i) => i.type === "Spark Plugs")?.dueAt).toBeDefined();

  // The fallback is a national average, so it is a different number in each
  // system rather than the mile figure relabelled.
  const km = buildPlan({ ...args, unit: "km" });
  expect(km.distancePerYear).toBe(UNSTATED_DISTANCE_PER_YEAR.km);
  expect(km.projectedOdometer).toBe(40000 + UNSTATED_DISTANCE_PER_YEAR.km);
  expect(km.items.find((i) => i.type === "Spark Plugs")?.dueAt).toBeDefined();
});

test("a distance projection never overrides an earlier calendar date", () => {
  // Oil change: due in six months by date, or in 5,000 miles. At 4,000 miles a
  // year the mileage date is over a year out, so the calendar wins.
  const plan = buildPlan({
    odometer: 80000,
    records: [{ service_type: "Oil Change", performed_at: daysAgo(0), odometer: 80000 }],
    intervals: INTERVALS,
    answers: { drive: "low" },
    unit: "mi",
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
    unit: "mi",
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
    unit: "mi",
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
    unit: "mi",
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
  expect(planItemLine({ type: "x", status: "due", logged: false, projected: false }, "mi")).toBe(
    "Nothing on file"
  );
  const item = {
    type: "x",
    status: "soon" as const,
    logged: true,
    projected: true,
    dueAt: "2027-02-03T09:00:00.000Z",
    dueOdometer: 100000,
  };
  const projected = planItemLine(item, "mi");
  expect(projected).toMatch(/^about /);
  expect(projected).toContain("100,000 mi");

  // The same row for a metric driver: the same reading, labelled in the unit
  // it was actually stored in. A line that always said "mi" was the bug.
  const metric = planItemLine(item, "km");
  expect(metric).toMatch(/^about /);
  expect(metric).toContain("100,000 km");
  expect(metric).not.toContain(" mi");
});

test("a line with no interval at all says so rather than coming out blank", () => {
  expect(
    planItemLine({ type: "x", status: "ok", logged: true, projected: false }, "mi")
  ).toBe("No interval set");
});

test("a service with no history is unrecorded, not overdue", () => {
  // The results screen printed "Nothing you have logged is overdue." above a
  // red 9. Both halves came from `dueNow`, which folds in every service the app
  // has never been told about — so the count and the sentence were describing
  // two different things.
  const plan = buildPlan({
    odometer: 60000,
    records: [
      {
        service_type: "Oil Change",
        performed_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
        odometer: 59800,
      },
    ],
    intervals: getIntervals(),
    answers: {},
    unit: "mi",
  });

  expect(plan.pastDue).toBe(0);
  expect(plan.noRecord).toBe(plan.items.length - 1);
  expect(plan.dueNow).toBe(plan.pastDue + plan.noRecord);

  const unlogged = plan.items.find((i) => !i.logged)!;
  // Red is the app saying something is wrong with the car. Nothing is wrong
  // with a car whose history for a service we simply do not have.
  expect(planBadge(unlogged)).toEqual({ state: "noRecord", tone: "ok" });
  expect(planRowStatus(unlogged)).toBe("ok");
});
