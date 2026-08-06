import {
  nextDue,
  dueStatus,
  defaultIntervals,
  inspectionMonthsFor,
  SERVICE_TYPES,
  DUE_HOUR,
} from "../src/schedule";

/** A service performed on a given local day, at the noon-local time the app
 *  actually stores (see `dateFromParts`). */
function performedOn(year: number, month: number, day: number, hour = 12): string {
  return new Date(year, month - 1, day, hour, 0, 0, 0).toISOString();
}

/** Due dates are asserted as local calendar parts, never as raw UTC strings —
 *  the whole point of the change is that the local reading is what's correct. */
function local(iso: string) {
  const d = new Date(iso);
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate(), hour: d.getHours() };
}

test("adds months to the last service date", () => {
  const r = nextDue({ lastPerformedAt: performedOn(2026, 1, 15), interval: { months: 6 } });
  expect(local(r.dueAt!)).toEqual({ year: 2026, month: 7, day: 15, hour: DUE_HOUR });
});

test("due time is pinned to the morning, not inherited from the service time", () => {
  // The bug this covers: a job logged at 23:40 came due — and fired its
  // notification — at 23:40 six months later.
  const late = nextDue({ lastPerformedAt: performedOn(2026, 1, 15, 23), interval: { months: 6 } });
  const early = nextDue({ lastPerformedAt: performedOn(2026, 1, 15, 0), interval: { months: 6 } });
  expect(local(late.dueAt!)).toEqual({ year: 2026, month: 7, day: 15, hour: DUE_HOUR });
  expect(local(early.dueAt!)).toEqual({ year: 2026, month: 7, day: 15, hour: DUE_HOUR });
});

test("a record stored at midnight UTC still comes due on its own local day", () => {
  // Midnight UTC is the previous evening in New York. Doing the arithmetic in
  // UTC and reading it back locally moved the due date a day.
  const r = nextDue({ lastPerformedAt: "2026-01-15T00:00:00.000Z", interval: { months: 6 } });
  expect(local(r.dueAt!)).toEqual({ year: 2026, month: 7, day: 14, hour: DUE_HOUR });
});

test("crossing a DST boundary keeps the same local hour", () => {
  // January is EST, July is EDT. A fixed UTC offset would drift by an hour.
  const forward = nextDue({ lastPerformedAt: performedOn(2026, 1, 20), interval: { months: 6 } });
  const back = nextDue({ lastPerformedAt: performedOn(2026, 7, 20), interval: { months: 6 } });
  expect(local(forward.dueAt!).hour).toBe(DUE_HOUR);
  expect(local(back.dueAt!).hour).toBe(DUE_HOUR);
});

test("adds the interval distance to the last odometer reading", () => {
  const r = nextDue({
    lastPerformedAt: performedOn(2026, 1, 15),
    lastOdometer: 50000,
    interval: { distance: 5000 },
  });
  expect(r.dueOdometer).toBe(55000);
});

test("returns both when the interval specifies both", () => {
  const r = nextDue({
    lastPerformedAt: performedOn(2026, 1, 15),
    lastOdometer: 50000,
    interval: { months: 6, distance: 5000 },
  });
  expect(local(r.dueAt!)).toEqual({ year: 2026, month: 7, day: 15, hour: DUE_HOUR });
  expect(r.dueOdometer).toBe(55000);
});

test("omits dueOdometer when no odometer was recorded", () => {
  const r = nextDue({ lastPerformedAt: performedOn(2026, 1, 15), interval: { distance: 5000 } });
  expect(r.dueOdometer).toBeUndefined();
});

test("a distance-only interval produces no due date, so it never notifies", () => {
  const r = nextDue({
    lastPerformedAt: performedOn(2026, 1, 15),
    lastOdometer: 50000,
    interval: { distance: 60000 },
  });
  expect(r.dueAt).toBeUndefined();
});

test("month arithmetic clamps to the last valid day", () => {
  const r = nextDue({ lastPerformedAt: performedOn(2026, 1, 31), interval: { months: 1 } });
  expect(local(r.dueAt!)).toEqual({ year: 2026, month: 2, day: 28, hour: DUE_HOUR });
});

test("status is due when the date has passed", () => {
  expect(dueStatus({ dueAt: "2026-01-01T00:00:00.000Z", now: "2026-02-01T00:00:00.000Z" })).toBe("due");
});

test("status is due when the odometer has passed, even if the date has not", () => {
  expect(
    dueStatus({
      dueAt: "2027-01-01T00:00:00.000Z",
      dueOdometer: 55000,
      now: "2026-02-01T00:00:00.000Z",
      odometer: 56000,
    })
  ).toBe("due");
});

test("status is soon within 30 days of the due date", () => {
  expect(dueStatus({ dueAt: "2026-02-20T00:00:00.000Z", now: "2026-02-01T00:00:00.000Z" })).toBe("soon");
});

test("status is ok when far from due", () => {
  expect(dueStatus({ dueAt: "2027-01-01T00:00:00.000Z", now: "2026-02-01T00:00:00.000Z" })).toBe("ok");
});

test("the soon window before a distance-based service is a fortnight of driving in either unit", () => {
  // 500 mi and 800 km are the same amount of ordinary driving. Sharing one
  // number would have made the warning window 60% shorter for every metric
  // driver, so the two are asserted side by side rather than as one figure.
  const at = (odometer: number, unit: "mi" | "km") =>
    dueStatus({ dueOdometer: 55000, now: "2026-02-01T00:00:00.000Z", odometer, unit });

  // The window is inclusive at its edge, the same way the 30-day one is: the
  // last mile of it is still a warning, the first one past it is not.
  expect(at(54500, "mi")).toBe("soon");
  expect(at(54499, "mi")).toBe("ok");
  expect(at(54200, "km")).toBe("soon");
  expect(at(54199, "km")).toBe("ok");

  // 600 to go is soon in kilometres and still ok in miles: the same reading
  // must not produce the same word in both systems.
  expect(at(54400, "km")).toBe("soon");
  expect(at(54400, "mi")).toBe("ok");
});

test("an omitted unit reads as miles, the unit every pre-setting install stored", () => {
  // 600 to go: inside the kilometre window and outside the mile one, so a
  // caller that passed no unit and silently got kilometres would fail here.
  const input = { dueOdometer: 55000, now: "2026-02-01T00:00:00.000Z", odometer: 54400 };
  expect(dueStatus(input)).toBe("ok");
  expect(dueStatus({ ...input, unit: "mi" })).toBe("ok");
  expect(dueStatus({ ...input, unit: "km" })).toBe("soon");
});

test("every default interval specifies months or a distance, in both units", () => {
  for (const unit of ["mi", "km"] as const) {
    for (const [, iv] of Object.entries(defaultIntervals(unit))) {
      expect(iv.months !== undefined || iv.distance !== undefined).toBe(true);
    }
  }
});

test("the kilometre defaults are round metric numbers, not converted miles", () => {
  // 5,000 mi is 8,047 km and no garage has ever said 8,047. Asserted as a pair
  // so a future "simplification" into one table with a conversion fails here.
  expect(defaultIntervals("mi")["Oil Change"]).toEqual({ months: 6, distance: 5000 });
  expect(defaultIntervals("km")["Oil Change"]).toEqual({ months: 6, distance: 10000 });
  expect(defaultIntervals("mi")["Spark Plugs"]).toEqual({ distance: 60000 });
  expect(defaultIntervals("km")["Spark Plugs"]).toEqual({ distance: 100000 });
});

test("both unit tables offer the same services, in the same order", () => {
  expect(Object.keys(defaultIntervals("km"))).toEqual(Object.keys(defaultIntervals("mi")));
  expect(SERVICE_TYPES).toEqual(Object.keys(defaultIntervals("mi")));
  expect(SERVICE_TYPES).toContain("Oil Change");
});

test("the inspection interval follows the market, and a market with no test gets none", () => {
  expect(inspectionMonthsFor("US")).toBe(12);
  expect(inspectionMonthsFor("DE")).toBe(24);
  // Canada has no periodic roadworthiness test at all; shipping the US's 12
  // months there told owners their inspection was overdue when it did not exist.
  expect(inspectionMonthsFor("CA")).toBeNull();
  // An unknown or absent region falls back rather than dropping the service.
  expect(inspectionMonthsFor("ZZ")).toBe(12);
  expect(inspectionMonthsFor(null)).toBe(12);

  expect(defaultIntervals("km", inspectionMonthsFor("DE")).Inspection).toEqual({ months: 24 });
  expect(defaultIntervals("km", inspectionMonthsFor("CA")).Inspection).toEqual({});
});

test("a market with no inspection does not delete the interval for the next market asked", () => {
  // The table is module state shared by every caller. Mutating the inspection
  // row in place made one Canadian lookup poison every lookup after it.
  defaultIntervals("mi", null);
  expect(defaultIntervals("mi").Inspection).toEqual({ months: 12 });
});
