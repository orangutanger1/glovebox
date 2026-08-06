import Database from "better-sqlite3";

/**
 * `src/units` owns the stored unit, so importing it reaches `src/db/client`
 * and, through it, `expo-sqlite` — an ES module this project's Node runner
 * cannot parse. The same in-memory database the other logic tests stand up
 * keeps the import graph resolvable; nothing below actually reads from it.
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
  KM_PER_MILE,
  convertDistance,
  defaultUnitFor,
  type DistanceUnit,
} from "../src/units";
import { defaultIntervals, dueStatus, inspectionMonthsFor } from "../src/schedule";
import {
  DISTANCE_PER_YEAR,
  UNSTATED_DISTANCE_PER_YEAR,
  distancePerYearFor,
  planItemLine,
} from "../src/onboarding/plan";
import { setLanguage } from "../src/i18n";

describe("which unit a phone starts in", () => {
  test("the three markets that read miles get miles", () => {
    for (const region of ["US", "GB", "MM", "us", "gb"]) {
      expect(defaultUnitFor(region)).toBe("mi");
    }
  });

  test("everywhere else gets kilometres", () => {
    for (const region of ["DE", "FR", "JP", "AU", "CA", "BR"]) {
      expect(defaultUnitFor(region)).toBe("km");
    }
  });

  test("an unknown region gets the unit most of the world drives in", () => {
    expect(defaultUnitFor(null)).toBe("km");
    expect(defaultUnitFor(undefined)).toBe("km");
    expect(defaultUnitFor("")).toBe("km");
  });
});

describe("converting a reading", () => {
  test("uses the exact definition of a mile", () => {
    expect(KM_PER_MILE).toBe(1.609344);
    expect(convertDistance(50000, "mi", "km")).toBe(80467);
    expect(convertDistance(80467, "km", "mi")).toBe(50000);
  });

  test("is a no-op in the same unit, so nothing drifts on a re-save", () => {
    expect(convertDistance(51771, "mi", "mi")).toBe(51771);
  });

  test("returns whole units, because an odometer has no fraction", () => {
    expect(Number.isInteger(convertDistance(12345, "mi", "km"))).toBe(true);
  });
});

describe("the inspection every market runs on its own clock", () => {
  test("names the cadence the law actually sets", () => {
    expect(inspectionMonthsFor("GB")).toBe(12);
    expect(inspectionMonthsFor("DE")).toBe(24);
    expect(inspectionMonthsFor("JP")).toBe(24);
    expect(inspectionMonthsFor("NL")).toBe(12);
  });

  test("says nothing where there is no periodic test", () => {
    // Canada and Brazil have no general roadworthiness test for private cars.
    // Claiming a 12-month one would invent a deadline the owner does not have.
    expect(inspectionMonthsFor("CA")).toBeNull();
    expect(inspectionMonthsFor("BR")).toBeNull();
  });

  test("falls back to a year for a market we have not looked up", () => {
    expect(inspectionMonthsFor("ZA")).toBe(12);
    expect(inspectionMonthsFor(null)).toBe(12);
  });
});

describe("the shipped intervals", () => {
  test("are round numbers in each system, not conversions of each other", () => {
    expect(defaultIntervals("mi")["Oil Change"]).toEqual({ months: 6, distance: 5000 });
    expect(defaultIntervals("km")["Oil Change"]).toEqual({ months: 6, distance: 10000 });
    // 5,000 mi is 8,047 km, which no garage in a metric country has ever said.
    expect(defaultIntervals("km")["Spark Plugs"]).toEqual({ distance: 100000 });
  });

  test("carry the market's inspection cadence", () => {
    expect(defaultIntervals("km", 24).Inspection).toEqual({ months: 24 });
    expect(defaultIntervals("mi", 12).Inspection).toEqual({ months: 12 });
  });

  test("leave the inspection untracked where no test exists", () => {
    expect(defaultIntervals("km", null).Inspection).toEqual({});
  });

  test("hand out a fresh table, so one market cannot edit the next one's", () => {
    const canadian = defaultIntervals("km", null);
    expect(canadian.Inspection).toEqual({});
    expect(defaultIntervals("km", 24).Inspection).toEqual({ months: 24 });
    // And a caller mutating what it was given must not reach module state.
    canadian["Oil Change"] = { months: 99 };
    expect(defaultIntervals("km")["Oil Change"]).toEqual({ months: 6, distance: 10000 });
  });
});

describe("how close counts as soon", () => {
  const soonAt = (left: number, unit: DistanceUnit) =>
    dueStatus({ dueOdometer: 50000, odometer: 50000 - left, now: "2026-01-01T12:00:00.000Z", unit });

  test("is a fortnight of driving in either system, not one number for both", () => {
    expect(soonAt(400, "mi")).toBe("soon");
    expect(soonAt(700, "mi")).toBe("ok");
    expect(soonAt(700, "km")).toBe("soon");
    expect(soonAt(900, "km")).toBe("ok");
  });

  test("past the reading is due, whatever the unit", () => {
    expect(soonAt(0, "mi")).toBe("due");
    expect(soonAt(-100, "km")).toBe("due");
  });

  test("defaults to miles when no unit is given", () => {
    // The signature has to stay callable from the pure paths that predate units.
    expect(dueStatus({ dueOdometer: 50000, odometer: 49600, now: "2026-01-01T12:00:00.000Z" })).toBe(
      "soon"
    );
  });
});

describe("the annual distance behind every projection", () => {
  test("matches the ranges the question offers in that unit", () => {
    expect(DISTANCE_PER_YEAR.mi.average).toBe(7500);
    expect(DISTANCE_PER_YEAR.km.average).toBe(12000);
    expect(distancePerYearFor({ drive: "high" }, "mi")).toBe(12500);
    expect(distancePerYearFor({ drive: "high" }, "km")).toBe(20000);
  });

  test("has a national-average answer for a quiz that never got there", () => {
    expect(distancePerYearFor({}, "mi")).toBe(UNSTATED_DISTANCE_PER_YEAR.mi);
    expect(distancePerYearFor({}, "km")).toBe(UNSTATED_DISTANCE_PER_YEAR.km);
  });
});

describe("the line under a service", () => {
  beforeAll(() => setLanguage("en"));

  test("prints the reading in the unit it was asked for", () => {
    const item = { type: "Spark Plugs", status: "ok" as const, logged: true, dueOdometer: 100000, projected: false };
    expect(planItemLine(item, "mi")).toBe("100,000 mi");
    expect(planItemLine(item, "km")).toBe("100,000 km");
  });

  test("marks a projected date as an estimate", () => {
    const item = {
      type: "Oil Change",
      status: "soon" as const,
      logged: true,
      dueAt: "2026-09-14T09:00:00.000Z",
      projected: true,
    };
    expect(planItemLine(item, "mi")).toContain("about");
  });

  test("says nothing on file rather than inventing a date", () => {
    expect(
      planItemLine({ type: "Air Filter", status: "due", logged: false, projected: false }, "mi")
    ).toBe("Nothing on file");
  });
});
