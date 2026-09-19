import { t } from "../i18n";
import { deviceRegion } from "../i18n/device";
import { getDistanceUnit } from "../units";
import {
  efficiencyStyleFor,
  volumeUnitFor,
  type EfficiencyStyle,
  type FuelUnits,
  type VolumeUnit,
} from "./units";

/**
 * A volume or an efficiency figure, formatted with its unit.
 *
 * One message per unit rather than a shared "{value} {unit}" template, for the
 * same reason src/units/format does it: the join is not universal. French puts
 * a non-breaking space before the unit and Japanese uses none, and a screen that
 * interpolated the halves itself would force English spacing on every reader.
 */
let cached: VolumeUnit | null = null;

/** The region's volume unit, read once — the region cannot change while the
 *  app is running, and this is called per rendered row. The style is derived
 *  on every call, because the distance unit it depends on can change in
 *  Settings, and a cached "mpg" over kilometres was the bug. */
export function currentFuelUnits(): FuelUnits {
  cached ??= volumeUnitFor(deviceRegion());
  const distance = getDistanceUnit();
  return { volume: cached, style: efficiencyStyleFor(cached, distance), distance };
}

/** Tests switch regions; nothing in the app does. */
export function resetFuelUnits(): void {
  cached = null;
}

/**
 * One decimal place, at most.
 *
 * A hand-typed odometer and a pump that stops on a round number do not support
 * more, and "32.456 mpg" claims a precision the inputs never had.
 *
 * Handed on as a number, not a string: `t` runs every number through
 * `formatNumber`, which is where the reader's decimal mark and grouping come
 * from. Stringified here, the figure skipped that and a German reader saw
 * "7.8 L/100km" under a "51.771 km" reading.
 */
function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export function formatVolume(value: number, unit: VolumeUnit = currentFuelUnits().volume): string {
  return t(unit === "gal" ? "unit.gal" : "unit.litre", { value: round(value) });
}

export function volumeUnitLabel(unit: VolumeUnit = currentFuelUnits().volume): string {
  return t(unit === "gal" ? "unit.gal.label" : "unit.litre.label");
}

export function formatEfficiency(
  value: number,
  style: EfficiencyStyle = currentFuelUnits().style
): string {
  return t(style.startsWith("l_per_100km") ? "unit.l100km" : "unit.mpg", { value: round(value) });
}

export function efficiencyUnitLabel(
  style: EfficiencyStyle = currentFuelUnits().style
): string {
  return t(style.startsWith("l_per_100km") ? "unit.l100km.label" : "unit.mpg.label");
}
