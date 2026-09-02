import type { DistanceUnit } from "../units";

/**
 * Which units a fill-up is entered and read in, derived from the phone's region
 * exactly as `defaultUnitFor` derives the distance unit. No setting of its own:
 * a driver does not switch between gallons and litres, the pump does, and one
 * more toggle in Settings buys nothing but a way to get it wrong.
 */
export type VolumeUnit = "gal" | "L";

/** The three conventions drivers actually quote. `mpg_imp` exists because a
 *  British driver buys litres and talks in miles per imperial gallon, which is
 *  neither of the other two. */
export type EfficiencyStyle = "mpg_us" | "mpg_imp" | "l_per_100km";

export type FuelUnits = { volume: VolumeUnit; style: EfficiencyStyle; distance: DistanceUnit };

/** Exact by definition, both of them. The two gallons differ by 20%, which is
 *  the difference between a plausible figure and a wrong one. */
export const LITRES_PER_US_GALLON = 3.785411784;
export const LITRES_PER_IMPERIAL_GALLON = 4.54609;

export function fuelUnitsFor(region: string | null | undefined): FuelUnits {
  const r = region ? region.toUpperCase() : "";
  if (r === "US") return { volume: "gal", style: "mpg_us", distance: "mi" };
  if (r === "GB") return { volume: "L", style: "mpg_imp", distance: "mi" };
  return { volume: "L", style: "l_per_100km", distance: "km" };
}

/**
 * A figure, or nothing.
 *
 * Nothing rather than zero or Infinity for a non-positive distance or volume:
 * every caller would otherwise have to decide separately what a divide by zero
 * means on a screen, and a "0 MPG" tank reads as a broken car rather than a row
 * that cannot be judged.
 */
export function efficiencyOf(
  distance: number,
  volume: number,
  style: EfficiencyStyle
): number | null {
  if (!Number.isFinite(distance) || !Number.isFinite(volume)) return null;
  if (distance <= 0 || volume <= 0) return null;
  if (style === "mpg_us") return distance / volume;
  if (style === "mpg_imp") return distance / (volume / LITRES_PER_IMPERIAL_GALLON);
  return (volume * 100) / distance;
}

/**
 * Which way is good. L/100km inverts — 6 beats 9 — so anything comparing a tank
 * against the average has to ask rather than assume the bigger number wins.
 */
export function betterEfficiency(style: EfficiencyStyle): "higher" | "lower" {
  return style === "l_per_100km" ? "lower" : "higher";
}
