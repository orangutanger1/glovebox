import { getDb } from "./client";
import { defaultIntervals, mergeIntervals, inspectionMonthsFor, type Interval } from "../schedule";
import { getDistanceUnit } from "../units";
import { deviceRegion } from "../i18n/device";

/**
 * Custom service intervals — the second half of Pro.
 *
 * `service_intervals` has existed since migration 1 and nothing read it. It is
 * config rather than history: a row here is the user's current opinion about
 * how often a service is due, not a record of anything that happened, so unlike
 * service_records it is edited in place and a reset deletes the row. The
 * append-only rule protects the log; it does not apply to a settings table
 * whose entire content is reproducible from the UI.
 */
export function listIntervalOverrides(): Record<string, Interval> {
  const rows = getDb().getAllSync<{
    service_type: string;
    months: number | null;
    distance: number | null;
  }>("SELECT service_type, months, distance FROM service_intervals");
  const out: Record<string, Interval> = {};
  for (const row of rows) {
    out[row.service_type] = {
      months: row.months ?? undefined,
      distance: row.distance ?? undefined,
    };
  }
  return out;
}

/**
 * The shipped defaults for this phone: the user's unit, and the inspection
 * cadence of the market they are actually in.
 */
export function getDefaultIntervals(): Record<string, Interval> {
  return defaultIntervals(getDistanceUnit(), inspectionMonthsFor(deviceRegion()));
}

/**
 * What every screen should schedule against. Call this instead of reading the
 * defaults directly — a screen still reading the defaults is a screen that
 * quietly ignores what the user paid to change.
 */
export function getIntervals(): Record<string, Interval> {
  const defaults = getDefaultIntervals();
  try {
    return mergeIntervals(defaults, listIntervalOverrides());
  } catch {
    // A due date computed from the shipped defaults is wrong in the user's
    // terms but still useful. A crashed garage screen is not.
    return defaults;
  }
}

/**
 * Stores one service's interval. Passing neither figure clears the override
 * instead of storing a service that is never due — "no months and no distance"
 * is how the form says "put this back to normal", and it is the only way the
 * UI can express a reset.
 */
export function setInterval(serviceType: string, interval: Interval): void {
  if (interval.months === undefined && interval.distance === undefined) {
    clearInterval(serviceType);
    return;
  }
  getDb().runSync(
    `INSERT INTO service_intervals (service_type, months, distance) VALUES (?, ?, ?)
     ON CONFLICT(service_type) DO UPDATE SET months = excluded.months, distance = excluded.distance`,
    [serviceType, interval.months ?? null, interval.distance ?? null]
  );
}

export function clearInterval(serviceType: string): void {
  getDb().runSync("DELETE FROM service_intervals WHERE service_type = ?", [serviceType]);
}
