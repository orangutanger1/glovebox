import Database from "better-sqlite3";

/**
 * `src/onboarding/cost` reads `KM_PER_MILE` out of `src/units`, which owns the
 * stored unit and so reaches `src/db/client` and `expo-sqlite` behind it. Same
 * in-memory stand-in the other logic tests use; nothing here reads from it.
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

import { MAINTENANCE_RATE, ROADSIDE, maintenanceCost } from "../src/onboarding/cost";
import { KM_PER_MILE } from "../src/units";

/**
 * The cited-statistics screen is the one place the flow prints a number that is
 * not the user's own, so these tests are about two things: the arithmetic, and
 * the citation surviving an edit. A rate that quietly drifts away from the
 * figure in the source is worse than no figure at all — the screen goes on
 * naming AAA underneath it.
 */

test("the published rate is the one this screen claims to be quoting", () => {
  // AAA Your Driving Costs 2025, category table: "Maintenance, Repair & Tires —
  // 11.04¢/mile", over five years and 75,000 miles. Change these only with the
  // next edition in hand, and change the `edition` beside them when you do.
  expect(MAINTENANCE_RATE.centsPerMile).toBe(11.04);
  expect(MAINTENANCE_RATE.years).toBe(5);
  expect(MAINTENANCE_RATE.edition).toBe("2025");
  expect(MAINTENANCE_RATE.url).toContain("aaa.com");

  // AAA Car Care Month, 1 April 2025.
  expect(ROADSIDE.calls).toBe(27_000_000);
  expect(ROADSIDE.year).toBe(2024);
  expect(ROADSIDE.towingAndBatteryPct).toBe(74);
  expect(ROADSIDE.url).toContain("aaa.com");
});

test("the money is the user's own mileage at the published rate", () => {
  // AAA's own assumption, so this is the figure their brochure implies.
  const cost = maintenanceCost(15000, "mi");
  expect(cost.miles).toBe(15000);
  // 15,000 × $0.1104 = $1,656, rounded to the nearest ten.
  expect(cost.perYear).toBe(1660);
  expect(cost.overFiveYears).toBe(8300);
});

test("kilometres are converted, not repriced", () => {
  // The rate is per mile, so a metric driver's distance converts and the money
  // does not: inventing an exchange rate is the thing this screen exists not
  // to do.
  const km = maintenanceCost(15000 * KM_PER_MILE, "km");
  expect(km.miles).toBe(15000);
  expect(km.perYear).toBe(maintenanceCost(15000, "mi").perYear);
  expect(MAINTENANCE_RATE.currency).toBe("USD");
});

test("a low-mileage driver gets a smaller number, not a floor", () => {
  const low = maintenanceCost(4000, "mi");
  const high = maintenanceCost(18000, "mi");
  expect(low.perYear).toBeLessThan(high.perYear);
  // 4,000 × $0.1104 = $441.60 → $440.
  expect(low.perYear).toBe(440);
});
