import {
  monthOf,
  recentMonths,
  spendByMonth,
  spendByService,
  spendByVehicle,
  spendOf,
  type CostedRecord,
} from "../src/insights";

const at = (performed_at: string, cost?: number, extra: Partial<CostedRecord> = {}): CostedRecord => ({
  vehicle_id: "v1",
  service_type: "Oil Change",
  performed_at,
  cost,
  ...extra,
});

describe("spendOf", () => {
  test("adds the priced rows and counts the rest", () => {
    const spend = spendOf([at("2026-01-10", 80), at("2026-02-10"), at("2026-03-10", 45.5)]);
    expect(spend).toEqual({ total: 125.5, pricedCount: 2, unpricedCount: 1 });
  });

  test("an unpriced row is absent from the total, not a zero in it", () => {
    // The distinction the whole module exists to keep: two services, one of
    // which the user never priced, is a £80 total drawn from one row — not an
    // average of £40 across two.
    const spend = spendOf([at("2026-01-10", 80), at("2026-02-10")]);
    expect(spend.total).toBe(80);
    expect(spend.pricedCount).toBe(1);
  });

  test("nothing at all is a zero drawn from nothing", () => {
    expect(spendOf([])).toEqual({ total: 0, pricedCount: 0, unpricedCount: 0 });
  });

  test("a negative or non-finite cost does not enter a total", () => {
    // `cost` is a bare REAL and nothing at the boundary has ever bounded it.
    const spend = spendOf([at("2026-01-10", -50), at("2026-02-10", NaN), at("2026-03-10", 20)]);
    expect(spend).toEqual({ total: 20, pricedCount: 1, unpricedCount: 2 });
  });
});

describe("grouping", () => {
  test("by vehicle, biggest spender first", () => {
    const buckets = spendByVehicle([
      at("2026-01-10", 40, { vehicle_id: "a" }),
      at("2026-01-11", 900, { vehicle_id: "b" }),
      at("2026-01-12", 60, { vehicle_id: "a" }),
    ]);
    expect(buckets.map((b) => b.key)).toEqual(["b", "a"]);
    expect(buckets[1].total).toBe(100);
  });

  test("by service", () => {
    const buckets = spendByService([
      at("2026-01-10", 40, { service_type: "Oil Change" }),
      at("2026-01-11", 800, { service_type: "Tires" }),
    ]);
    expect(buckets[0]).toEqual({ key: "Tires", total: 800, pricedCount: 1, unpricedCount: 0 });
  });

  test("equal totals order by key, so the list cannot reshuffle between renders", () => {
    const rows = [
      at("2026-01-10", 50, { service_type: "Brakes" }),
      at("2026-01-11", 50, { service_type: "Air Filter" }),
    ];
    expect(spendByService(rows).map((b) => b.key)).toEqual(["Air Filter", "Brakes"]);
    expect(spendByService([...rows].reverse()).map((b) => b.key)).toEqual(["Air Filter", "Brakes"]);
  });
});

describe("the monthly series", () => {
  const now = new Date(2026, 8, 1); // September 2026

  test("months run oldest first and end with the current one", () => {
    expect(recentMonths(3, now)).toEqual(["2026-07", "2026-08", "2026-09"]);
  });

  test("the window crosses a year boundary", () => {
    expect(recentMonths(3, new Date(2026, 1, 15))).toEqual(["2025-12", "2026-01", "2026-02"]);
  });

  test("months with no spending are present as zeroes", () => {
    // Dense, not sparse: the empty months are the shape of the year.
    const series = spendByMonth([at("2026-09-02", 120)], 3, now);
    expect(series.map((b) => b.key)).toEqual(["2026-07", "2026-08", "2026-09"]);
    expect(series.map((b) => b.total)).toEqual([0, 0, 120]);
  });

  test("records older than the window are excluded", () => {
    const series = spendByMonth([at("2025-01-04", 500), at("2026-09-02", 120)], 3, now);
    expect(series.reduce((n, b) => n + b.total, 0)).toBe(120);
  });

  test("the month is read off the stored string, not a reparsed date", () => {
    expect(monthOf("2026-03-31T12:00:00.000Z")).toBe("2026-03");
  });
});
