import { parseNumber } from "../src/format";

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
