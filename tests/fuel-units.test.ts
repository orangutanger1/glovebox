import {
  betterEfficiency,
  efficiencyOf,
  fuelUnitsFor,
  LITRES_PER_IMPERIAL_GALLON,
  LITRES_PER_US_GALLON,
} from "../src/fuel/units";
import { setLanguage } from "../src/i18n";
import {
  efficiencyUnitLabel,
  formatEfficiency,
  formatVolume,
  volumeUnitLabel,
} from "../src/fuel/format";


describe("fuelUnitsFor", () => {
  test("the US pumps gallons and quotes MPG", () => {
    expect(fuelUnitsFor("US")).toEqual({ volume: "gal", style: "mpg_us", distance: "mi" });
  });

  test("the UK pumps litres, drives miles, and quotes imperial MPG", () => {
    // The case that breaks any naive rule: miles on the signs, litres on the
    // pump, imperial gallons in the figure drivers actually say out loud.
    expect(fuelUnitsFor("GB")).toEqual({ volume: "L", style: "mpg_imp", distance: "mi" });
  });

  test("everywhere else is litres, kilometres and L/100km", () => {
    expect(fuelUnitsFor("DE")).toEqual({ volume: "L", style: "l_per_100km", distance: "km" });
    expect(fuelUnitsFor(null)).toEqual({ volume: "L", style: "l_per_100km", distance: "km" });
  });

  test("the region is read case-insensitively, as elsewhere in the app", () => {
    expect(fuelUnitsFor("us").style).toBe("mpg_us");
  });
});

describe("efficiencyOf", () => {
  test("US MPG is miles over gallons, untouched", () => {
    expect(efficiencyOf(300, 10, "mpg_us")).toBeCloseTo(30, 6);
  });

  test("imperial MPG converts the litres the driver actually bought", () => {
    // 300 miles on 45.4609 L is exactly 10 imperial gallons.
    expect(efficiencyOf(300, LITRES_PER_IMPERIAL_GALLON * 10, "mpg_imp")).toBeCloseTo(30, 6);
  });

  test("L/100km inverts: it is litres per fixed distance, not distance per litre", () => {
    expect(efficiencyOf(500, 40, "l_per_100km")).toBeCloseTo(8, 6);
  });

  test("a zero or negative distance or volume yields nothing rather than Infinity", () => {
    expect(efficiencyOf(0, 10, "mpg_us")).toBeNull();
    expect(efficiencyOf(100, 0, "mpg_us")).toBeNull();
    expect(efficiencyOf(-100, 10, "l_per_100km")).toBeNull();
    expect(efficiencyOf(100, NaN, "mpg_us")).toBeNull();
  });
});

test("a US gallon is not an imperial one, and the app knows both", () => {
  expect(LITRES_PER_US_GALLON).toBeCloseTo(3.785411784, 9);
  expect(LITRES_PER_IMPERIAL_GALLON).toBeCloseTo(4.54609, 9);
});

test("which direction is good depends on the convention", () => {
  expect(betterEfficiency("mpg_us")).toBe("higher");
  expect(betterEfficiency("mpg_imp")).toBe("higher");
  expect(betterEfficiency("l_per_100km")).toBe("lower");
});

describe("formatting a fill", () => {
  beforeAll(() => setLanguage("en"));

  test("volume is labelled with the unit that was pumped", () => {
    expect(formatVolume(12.4, "gal")).toBe("12.4 gal");
    expect(formatVolume(48.2, "L")).toBe("48.2 L");
    expect(volumeUnitLabel("gal")).toBe("gal");
  });

  test("efficiency is rounded to one decimal, which is all a tank supports", () => {
    // A figure to three decimals implies a precision that a hand-entered
    // odometer and a pump that stops on a round number do not have.
    expect(formatEfficiency(32.456, "mpg_us")).toBe("32.5 mpg");
    expect(formatEfficiency(7.8123, "l_per_100km")).toBe("7.8 L/100km");
    expect(efficiencyUnitLabel("l_per_100km")).toBe("L/100km");
  });
});
