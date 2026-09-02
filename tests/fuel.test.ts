import {
  averageEfficiency,
  costPerDistance,
  fuelSpend,
  fuelSpendByMonth,
  latestEfficiency,
  mpgSeries,
  type FuelEntry,
} from "../src/fuel";

let seq = 0;
const fill = (
  odometer: number,
  volume: number,
  extra: Partial<FuelEntry> = {}
): FuelEntry => ({
  id: `f${(seq += 1)}`,
  vehicle_id: "v1",
  filled_at: "2026-03-01T12:00:00.000Z",
  odometer,
  volume,
  full: 1,
  ...extra,
});

describe("mpgSeries", () => {
  test("the first fill yields nothing at all", () => {
    // Nobody knows how full the tank was before it, so any figure is invented.
    expect(mpgSeries([fill(1000, 10)], "mpg_us")).toEqual([]);
  });

  test("two full fills yield one figure, for the second", () => {
    const entries = [fill(1000, 10), fill(1300, 10)];
    const series = mpgSeries(entries, "mpg_us");
    expect(series).toHaveLength(1);
    expect(series[0].entryId).toBe(entries[1].id);
    expect(series[0].distance).toBe(300);
    expect(series[0].volume).toBe(10);
    expect(series[0].efficiency).toBeCloseTo(30, 6);
  });

  test("a partial between two fulls is folded into the next full tank", () => {
    // Topping back to full replaces exactly the fuel burned since it was last
    // full, and the partial went into the same distance. So the tank is 300
    // miles on 5 + 5, not two separate figures.
    const entries = [fill(1000, 10), fill(1150, 5, { full: 0 }), fill(1300, 5)];
    const series = mpgSeries(entries, "mpg_us");
    expect(series).toHaveLength(1);
    expect(series[0].entryId).toBe(entries[2].id);
    expect(series[0].distance).toBe(300);
    expect(series[0].volume).toBe(10);
  });

  test("consecutive partials all fold into the following full tank", () => {
    const entries = [
      fill(1000, 10),
      fill(1100, 3, { full: 0 }),
      fill(1200, 3, { full: 0 }),
      fill(1300, 4),
    ];
    const series = mpgSeries(entries, "mpg_us");
    expect(series).toHaveLength(1);
    expect(series[0].volume).toBe(10);
    expect(series[0].distance).toBe(300);
  });

  test("a partial never produces a figure of its own", () => {
    const entries = [fill(1000, 10), fill(1150, 5, { full: 0 })];
    expect(mpgSeries(entries, "mpg_us")).toEqual([]);
  });

  test("a non-advancing odometer is skipped, never zeroed and never negative", () => {
    // A typo, or another car's number. The tank after it still measures from
    // the last trustworthy full fill.
    const entries = [fill(1000, 10), fill(1000, 10), fill(1300, 10)];
    const series = mpgSeries(entries, "mpg_us");
    expect(series.every((f) => f.efficiency > 0)).toBe(true);
    expect(series.map((f) => f.distance)).toEqual([300]);
  });

  test("entries out of date order are placed by odometer, which is the true order", () => {
    // Logging yesterday's fill this morning must not invert the two.
    const first = fill(1000, 10, { filled_at: "2026-03-02T12:00:00.000Z" });
    const second = fill(1300, 10, { filled_at: "2026-03-01T12:00:00.000Z" });
    const series = mpgSeries([second, first], "mpg_us");
    expect(series).toHaveLength(1);
    expect(series[0].entryId).toBe(second.id);
    expect(series[0].distance).toBe(300);
  });

  test("the input array is not mutated", () => {
    const entries = [fill(1300, 10), fill(1000, 10)];
    const before = entries.map((e) => e.id);
    mpgSeries(entries, "mpg_us");
    expect(entries.map((e) => e.id)).toEqual(before);
  });
});

describe("latestEfficiency", () => {
  test("is the last qualifying tank, by odometer", () => {
    const entries = [fill(1000, 10), fill(1300, 10), fill(1700, 10)];
    expect(latestEfficiency(entries, "mpg_us")).toBeCloseTo(40, 6);
  });

  test("is nothing until a second full tank exists", () => {
    expect(latestEfficiency([fill(1000, 10)], "mpg_us")).toBeNull();
    expect(latestEfficiency([], "mpg_us")).toBeNull();
  });
});

describe("averageEfficiency", () => {
  test("is total distance over total volume, not the mean of the tank figures", () => {
    // A 100-mile tank and a 500-mile tank do not weigh the same, and averaging
    // the two figures pretends they do.
    const entries = [fill(1000, 10), fill(1100, 5), fill(1600, 20)];
    expect(averageEfficiency(entries, "mpg_us")).toBeCloseTo(600 / 25, 6);
  });

  test("is nothing when no tank qualifies", () => {
    expect(averageEfficiency([fill(1000, 10)], "mpg_us")).toBeNull();
  });
});

describe("fuelSpend", () => {
  test("adds the priced fills and counts the rest", () => {
    const spend = fuelSpend([
      fill(1000, 10, { cost: 40 }),
      fill(1300, 10),
      fill(1600, 10, { cost: 42.5 }),
    ]);
    expect(spend).toEqual({ total: 82.5, pricedCount: 2, unpricedCount: 1 });
  });

  test("an unpriced fill is absent from the total but still counted as volume", () => {
    // The two obligations differ: a total must not invent a price, and the
    // efficiency math must not lose fuel that was actually burned.
    const entries = [fill(1000, 10, { cost: 40 }), fill(1300, 10)];
    expect(fuelSpend(entries).total).toBe(40);
    expect(mpgSeries(entries, "mpg_us")[0].volume).toBe(10);
  });
});

describe("costPerDistance", () => {
  test("is fuel cost over the distance those priced fills covered", () => {
    const entries = [fill(1000, 10, { cost: 40 }), fill(1300, 10, { cost: 50 })];
    // 300 miles covered by the second tank, 50 of fuel in it.
    expect(costPerDistance(entries)).toBeCloseTo(50 / 300, 6);
  });

  test("an unpriced tank is excluded rather than costed at zero", () => {
    const entries = [fill(1000, 10, { cost: 40 }), fill(1300, 10), fill(1600, 10, { cost: 50 })];
    // Only the last tank is both priced and measurable across its distance.
    expect(costPerDistance(entries)).toBeCloseTo(50 / 300, 6);
  });

  test("is nothing when no priced tank has a distance", () => {
    expect(costPerDistance([fill(1000, 10, { cost: 40 })])).toBeNull();
  });
});

describe("fuelSpendByMonth", () => {
  test("is dense: every month in the window, including the empty ones", () => {
    const now = new Date(2026, 2, 15);
    const series = fuelSpendByMonth(
      [fill(1000, 10, { cost: 40, filled_at: "2026-03-04T12:00:00.000Z" })],
      12,
      now
    );
    expect(series).toHaveLength(12);
    expect(series[11]).toEqual({ key: "2026-03", total: 40, pricedCount: 1, unpricedCount: 0 });
    expect(series[0].total).toBe(0);
  });
});
