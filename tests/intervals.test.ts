import { mergeIntervals, nextDue, defaultIntervals, type Interval } from "../src/schedule";

const DEFAULTS: Record<string, Interval> = {
  "Oil Change": { months: 6, distance: 5000 },
  "Wiper Blades": { months: 12 },
};

test("with no overrides the shipped defaults are what is in force", () => {
  expect(mergeIntervals(DEFAULTS, {})).toEqual(DEFAULTS);
});

test("an override replaces one service and leaves the rest alone", () => {
  const merged = mergeIntervals(DEFAULTS, { "Oil Change": { months: 12, distance: 10000 } });
  expect(merged["Oil Change"]).toEqual({ months: 12, distance: 10000 });
  expect(merged["Wiper Blades"]).toEqual({ months: 12 });
});

test("dropping the month figure means by distance only, not the default months", () => {
  const merged = mergeIntervals(DEFAULTS, { "Oil Change": { distance: 10000 } });
  expect(merged["Oil Change"]).toEqual({ distance: 10000 });
  expect(merged["Oil Change"].months).toBeUndefined();
});

test("an empty override is ignored rather than making a service never due", () => {
  expect(mergeIntervals(DEFAULTS, { "Oil Change": {} })["Oil Change"]).toEqual(
    DEFAULTS["Oil Change"]
  );
});

test("a service the app ships no opinion about can still be given one", () => {
  const merged = mergeIntervals(DEFAULTS, { "Timing Belt": { distance: 90000 } });
  expect(merged["Timing Belt"]).toEqual({ distance: 90000 });
});

test("merging never mutates the defaults", () => {
  // Both unit tables, because each is a separate module-level object and a
  // merge that wrote through would corrupt whichever one the user reads in.
  for (const unit of ["mi", "km"] as const) {
    const defaults = defaultIntervals(unit);
    const before = JSON.parse(JSON.stringify(defaults));
    mergeIntervals(defaults, { "Oil Change": { months: 99 } });
    expect(defaults).toEqual(before);
    // And the next caller still gets the shipped table, not the merged one.
    expect(defaultIntervals(unit)).toEqual(before);
  }
});

test("a custom interval actually moves the due date", () => {
  const custom = mergeIntervals(DEFAULTS, { "Oil Change": { months: 12, distance: 10000 } });
  const due = nextDue({
    lastPerformedAt: "2026-01-15T12:00:00.000Z",
    lastOdometer: 50000,
    interval: custom["Oil Change"],
  });
  // Asserted as a local date: due times are pinned to 9am local, so the UTC
  // string moves with the offset while the day the user sees does not.
  const dueLocal = new Date(due.dueAt!);
  expect([dueLocal.getFullYear(), dueLocal.getMonth() + 1, dueLocal.getDate()]).toEqual([2027, 1, 15]);
  expect(dueLocal.getHours()).toBe(9);
  expect(due.dueOdometer).toBe(60000);
});
