import {
  parseNumber,
  parseDateInput,
  vehicleDisplayName,
  clampDateParts,
  dateFromParts,
  daysInMonth,
} from "../src/format";

describe("parseNumber", () => {
  it("accepts the grouped format the odometer placeholder itself shows", () => {
    // "84,210" is the literal placeholder on the onboarding odometer field.
    // Number() returns NaN for it, which SQLite stored as NULL — the reading
    // vanished without an error.
    expect(parseNumber("84,210")).toBe(84210);
  });

  it("accepts a currency-formatted cost", () => {
    expect(parseNumber("$1,299.50")).toBe(1299.5);
  });

  it("ignores stray whitespace", () => {
    expect(parseNumber("  50000 ")).toBe(50000);
  });

  it("treats empty input as absent, not zero", () => {
    expect(parseNumber("")).toBeUndefined();
    expect(parseNumber("   ")).toBeUndefined();
  });

  it("rejects text rather than returning NaN", () => {
    expect(parseNumber("about 80k")).toBeUndefined();
    expect(parseNumber("abc")).toBeUndefined();
  });

  it("never returns a non-finite number", () => {
    for (const input of ["Infinity", "-Infinity", "1e999"]) {
      const out = parseNumber(input);
      expect(out === undefined || Number.isFinite(out)).toBe(true);
    }
  });

  it("keeps plain integers intact", () => {
    expect(parseNumber("0")).toBe(0);
    expect(parseNumber("123456")).toBe(123456);
  });
});

describe("parseDateInput", () => {
  // Fixed "now" so the relative-year rules are testable.
  const today = new Date(2026, 7, 1, 9, 0, 0); // 2026-08-01, local

  function parts(d: Date | undefined) {
    return d && [d.getFullYear(), d.getMonth() + 1, d.getDate()];
  }

  it("reads the US format the field asks for", () => {
    expect(parts(parseDateInput("03/14/2026", today))).toEqual([2026, 3, 14]);
    expect(parts(parseDateInput("3/4/2026", today))).toEqual([2026, 3, 4]);
  });

  it("reads a two-digit year and an ISO date", () => {
    expect(parts(parseDateInput("3/14/25", today))).toEqual([2025, 3, 14]);
    expect(parts(parseDateInput("2025-11-09", today))).toEqual([2025, 11, 9]);
  });

  it("fills in the most recent year for a bare month/day", () => {
    expect(parts(parseDateInput("7/4", today))).toEqual([2026, 7, 4]);
    // Not yet reached in 2026, so it means the one that already happened.
    expect(parts(parseDateInput("12/28", today))).toEqual([2025, 12, 28]);
  });

  it("rejects a date that does not exist rather than rolling it forward", () => {
    // new Date("2/30/2026") silently becomes March 2nd.
    expect(parseDateInput("2/30/2026", today)).toBeUndefined();
    expect(parseDateInput("13/1/2026", today)).toBeUndefined();
    expect(parseDateInput("2026-02-31", today)).toBeUndefined();
  });

  it("rejects a future date — the work cannot have been done yet", () => {
    expect(parseDateInput("9/1/2026", today)).toBeUndefined();
    expect(parseDateInput("2027-01-01", today)).toBeUndefined();
  });

  it("accepts today itself", () => {
    expect(parts(parseDateInput("8/1/2026", today))).toEqual([2026, 8, 1]);
  });

  it("rejects text and empty input", () => {
    expect(parseDateInput("", today)).toBeUndefined();
    expect(parseDateInput("last tuesday", today)).toBeUndefined();
    expect(parseDateInput("3//2026", today)).toBeUndefined();
  });

  it("lands at noon so the UTC date the history shows is the day typed", () => {
    expect(parseDateInput("3/14/2026", today)!.getHours()).toBe(12);
  });
});

describe("vehicleDisplayName", () => {
  it("builds the name from the parts the user actually typed", () => {
    expect(vehicleDisplayName({ year: 2019, make: "Honda", model: "Civic" })).toBe(
      "2019 Honda Civic"
    );
  });

  it("drops the parts that were left blank", () => {
    expect(vehicleDisplayName({ make: "Honda", model: "Civic" })).toBe("Honda Civic");
    expect(vehicleDisplayName({ year: 2019 })).toBe("2019");
  });

  it("falls back to a usable label rather than an empty row", () => {
    expect(vehicleDisplayName({})).toBe("My car");
    expect(vehicleDisplayName({ make: "  ", model: "" })).toBe("My car");
  });

  it("lets a nickname win — a second car is 'the truck', not its spec sheet", () => {
    expect(vehicleDisplayName({ nickname: "The truck", year: 2014, make: "Ford" })).toBe(
      "The truck"
    );
  });

  it("ignores a nickname that is only whitespace", () => {
    expect(vehicleDisplayName({ nickname: "   ", make: "Honda" })).toBe("Honda");
  });
});

describe("clampDateParts", () => {
  const today = new Date(2026, 7, 1, 9, 0, 0); // Aug 1 2026

  it("pulls an impossible day back to the end of the month", () => {
    // The three wheels move independently: leaving the day on 31 and rolling
    // the month to February must land on the 28th, not on March 3rd.
    expect(clampDateParts({ year: 2026, month: 2, day: 31 }, today)).toEqual({
      year: 2026,
      month: 2,
      day: 28,
    });
    expect(clampDateParts({ year: 2024, month: 2, day: 30 }, today)).toEqual({
      year: 2024,
      month: 2,
      day: 29,
    });
  });

  it("caps a future date at today — the work cannot have been done yet", () => {
    expect(clampDateParts({ year: 2026, month: 12, day: 25 }, today)).toEqual({
      year: 2026,
      month: 8,
      day: 1,
    });
  });

  it("leaves today itself alone", () => {
    expect(clampDateParts({ year: 2026, month: 8, day: 1 }, today)).toEqual({
      year: 2026,
      month: 8,
      day: 1,
    });
  });

  it("leaves any past date alone", () => {
    expect(clampDateParts({ year: 2019, month: 11, day: 30 }, today)).toEqual({
      year: 2019,
      month: 11,
      day: 30,
    });
  });
});

describe("dateFromParts", () => {
  it("builds noon local, so the UTC string keeps the calendar day", () => {
    const d = dateFromParts({ year: 2026, month: 3, day: 14 });
    expect([d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours()]).toEqual([
      2026, 3, 14, 12,
    ]);
  });
});

describe("daysInMonth", () => {
  it("knows the leap year", () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2026, 4)).toBe(30);
  });
});
