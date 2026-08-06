import { t } from "../i18n";
import { getDistanceUnit, type DistanceUnit } from "./index";

/**
 * "51,771 mi" / "83 317 km" — a distance, grouped for the reader's language and
 * labelled with the unit they chose.
 *
 * One function rather than a `{value} {unit}` template in every message, because
 * the two halves are never independent: the grouping separator comes from the
 * language and the unit from the setting, and a screen that interpolated the
 * number itself got "51.771 mi" in German or dropped the unit entirely.
 */
export function formatDistance(value: number, unit: DistanceUnit = getDistanceUnit()): string {
  return t(unit === "km" ? "unit.km" : "unit.mi", { value });
}

/** Just the unit, for a gauge whose value is rendered separately. */
export function distanceUnitLabel(unit: DistanceUnit = getDistanceUnit()): string {
  return t(unit === "km" ? "unit.km.label" : "unit.mi.label");
}

