import { formatTread, latestTread, parseTread, treadStatus } from "../src/tires/tread";

test("32nds where the app counts miles, millimetres where it counts kilometres", () => {
  expect(parseTread("4", "mi")).toBeCloseTo(3.18, 2);
  expect(parseTread("3,5", "km")).toBe(3.5);
  expect(formatTread(parseTread("6", "mi")!, "mi")).toBe("6/32″");
  expect(formatTread(3.5, "km")).toBe("3.5 mm");
});

test("blank is no reading; nonsense and typos are refused", () => {
  expect(parseTread("  ", "mi")).toBeUndefined();
  expect(parseTread("abc", "mi")).toBeNull();
  expect(parseTread("-1", "km")).toBeNull();
  expect(parseTread("40", "mi")).toBeNull();
});

test("4/32 is replace soon, 2/32 is replace now", () => {
  expect(treadStatus(parseTread("5", "mi")!)).toBe("ok");
  expect(treadStatus(parseTread("4", "mi")!)).toBe("soon");
  expect(treadStatus(parseTread("2", "mi")!)).toBe("due");
  expect(treadStatus(3)).toBe("soon");
  expect(treadStatus(1.6)).toBe("due");
});

test("the newest reading wins, and records without one are ignored", () => {
  expect(latestTread([{ performed_at: "2026-01-01" }])).toBeUndefined();
  expect(
    latestTread([
      { performed_at: "2026-05-01", tread_mm: 5 },
      { performed_at: "2026-09-01", tread_mm: 3 },
      { performed_at: "2026-10-01" },
    ])
  ).toEqual({ mm: 3, at: "2026-09-01" });
});
