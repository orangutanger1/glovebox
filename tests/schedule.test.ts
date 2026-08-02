import { nextDue, dueStatus, DEFAULT_INTERVALS, DUE_HOUR } from "../src/schedule";

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

test("adds miles to the last odometer reading", () => {
  const r = nextDue({
    lastPerformedAt: performedOn(2026, 1, 15),
    lastOdometer: 50000,
    interval: { miles: 5000 },
  });
  expect(r.dueOdometer).toBe(55000);
});

test("returns both when the interval specifies both", () => {
  const r = nextDue({
    lastPerformedAt: performedOn(2026, 1, 15),
    lastOdometer: 50000,
    interval: { months: 6, miles: 5000 },
  });
  expect(local(r.dueAt!)).toEqual({ year: 2026, month: 7, day: 15, hour: DUE_HOUR });
  expect(r.dueOdometer).toBe(55000);
});

test("omits dueOdometer when no odometer was recorded", () => {
  const r = nextDue({ lastPerformedAt: performedOn(2026, 1, 15), interval: { miles: 5000 } });
  expect(r.dueOdometer).toBeUndefined();
});

test("a miles-only interval produces no due date, so it never notifies", () => {
  const r = nextDue({
    lastPerformedAt: performedOn(2026, 1, 15),
    lastOdometer: 50000,
    interval: { miles: 60000 },
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

test("every default interval specifies months or miles", () => {
  for (const [, iv] of Object.entries(DEFAULT_INTERVALS)) {
    expect(iv.months !== undefined || iv.miles !== undefined).toBe(true);
  }
});
