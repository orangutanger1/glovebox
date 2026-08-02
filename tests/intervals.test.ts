import { mergeIntervals, nextDue, DEFAULT_INTERVALS, type Interval } from "../src/schedule";

const DEFAULTS: Record<string, Interval> = {
  "Oil Change": { months: 6, miles: 5000 },
  "Wiper Blades": { months: 12 },
};

test("with no overrides the shipped defaults are what is in force", () => {
  expect(mergeIntervals(DEFAULTS, {})).toEqual(DEFAULTS);
});

test("an override replaces one service and leaves the rest alone", () => {
  const merged = mergeIntervals(DEFAULTS, { "Oil Change": { months: 12, miles: 10000 } });
  expect(merged["Oil Change"]).toEqual({ months: 12, miles: 10000 });
  expect(merged["Wiper Blades"]).toEqual({ months: 12 });
});

test("dropping the month figure means by mileage only, not the default months", () => {
  const merged = mergeIntervals(DEFAULTS, { "Oil Change": { miles: 10000 } });
  expect(merged["Oil Change"]).toEqual({ miles: 10000 });
  expect(merged["Oil Change"].months).toBeUndefined();
});

test("an empty override is ignored rather than making a service never due", () => {
  expect(mergeIntervals(DEFAULTS, { "Oil Change": {} })["Oil Change"]).toEqual(
    DEFAULTS["Oil Change"]
  );
});

test("a service the app ships no opinion about can still be given one", () => {
  const merged = mergeIntervals(DEFAULTS, { "Timing Belt": { miles: 90000 } });
  expect(merged["Timing Belt"]).toEqual({ miles: 90000 });
});

test("merging never mutates the defaults", () => {
  const before = JSON.parse(JSON.stringify(DEFAULT_INTERVALS));
  mergeIntervals(DEFAULT_INTERVALS, { "Oil Change": { months: 99 } });
  expect(DEFAULT_INTERVALS).toEqual(before);
});

test("a custom interval actually moves the due date", () => {
  const custom = mergeIntervals(DEFAULTS, { "Oil Change": { months: 12, miles: 10000 } });
  const due = nextDue({
    lastPerformedAt: "2026-01-15T12:00:00.000Z",
    lastOdometer: 50000,
    interval: custom["Oil Change"],
  });
  expect(due.dueAt).toBe("2027-01-15T12:00:00.000Z");
  expect(due.dueOdometer).toBe(60000);
});
