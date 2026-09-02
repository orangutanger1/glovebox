import { t } from "../i18n";
import { deviceRegion } from "../i18n/device";
import {
  fuelUnitsFor,
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
let cached: FuelUnits | null = null;

/** Read once. The region cannot change while the app is running, and this is
 *  called per rendered row. */
export function currentFuelUnits(): FuelUnits {
  cached ??= fuelUnitsFor(deviceRegion());
  return cached;
}

/** Tests switch regions; nothing in the app does. */
export function resetFuelUnits(): void {
  cached = null;
}

/**
 * One decimal place, always.
 *
 * A hand-typed odometer and a pump that stops on a round number do not support
 * more, and "32.456 mpg" claims a precision the inputs never had.
 */
function round(value: number): string {
  return (Math.round(value * 10) / 10).toString();
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
  return t(style === "l_per_100km" ? "unit.l100km" : "unit.mpg", { value: round(value) });
}

export function efficiencyUnitLabel(
  style: EfficiencyStyle = currentFuelUnits().style
): string {
  return t(style === "l_per_100km" ? "unit.l100km.label" : "unit.mpg.label");
}
