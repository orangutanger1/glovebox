import { nextDue, dueStatus, DEFAULT_INTERVALS } from "../src/schedule";

test("adds months to the last service date", () => {
  const r = nextDue({
    lastPerformedAt: "2026-01-15T00:00:00.000Z",
    interval: { months: 6 },
  });
  expect(r.dueAt).toBe("2026-07-15T00:00:00.000Z");
});

test("adds miles to the last odometer reading", () => {
  const r = nextDue({
    lastPerformedAt: "2026-01-15T00:00:00.000Z",
    lastOdometer: 50000,
    interval: { miles: 5000 },
  });
  expect(r.dueOdometer).toBe(55000);
});

test("returns both when the interval specifies both", () => {
  const r = nextDue({
    lastPerformedAt: "2026-01-15T00:00:00.000Z",
    lastOdometer: 50000,
    interval: { months: 6, miles: 5000 },
  });
  expect(r.dueAt).toBe("2026-07-15T00:00:00.000Z");
  expect(r.dueOdometer).toBe(55000);
});

test("omits dueOdometer when no odometer was recorded", () => {
  const r = nextDue({
    lastPerformedAt: "2026-01-15T00:00:00.000Z",
    interval: { miles: 5000 },
  });
  expect(r.dueOdometer).toBeUndefined();
});

test("month arithmetic clamps to the last valid day", () => {
  const r = nextDue({
    lastPerformedAt: "2026-01-31T00:00:00.000Z",
    interval: { months: 1 },
  });
  expect(r.dueAt).toBe("2026-02-28T00:00:00.000Z");
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
  for (const [type, iv] of Object.entries(DEFAULT_INTERVALS)) {
    expect(iv.months !== undefined || iv.miles !== undefined).toBe(true);
  }
});
