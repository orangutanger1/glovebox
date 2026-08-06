import type { DistanceUnit } from "../units";

export type Interval = { months?: number; distance?: number };

/**
 * How often a car is legally inspected, by storefront region.
 *
 * This is the localization that matters most in this app and it is not a string:
 * a British car needs an MOT every year from its third, a German one an HU every
 * two, a Japanese one 車検 every two after the first three, and a Canadian one
 * needs nothing at all on a schedule. Shipping the US's 12 months everywhere
 * would have told a German owner his TÜV was a year overdue when it was not,
 * which is worse than saying nothing.
 *
 * `null` means the market has no periodic test, so the service ships with no
 * default interval and only appears if the owner sets one. The display name for
 * each market lives in the catalog under `service.Inspection`.
 */
const INSPECTION_MONTHS: Record<string, number | null> = {
  US: 12,
  GB: 12,
  IE: 12,
  AU: 12,
  NZ: 12,
  CA: null,
  BR: null,
  DE: 24,
  AT: 12,
  CH: 24,
  FR: 24,
  IT: 24,
  ES: 24,
  NL: 12,
  PL: 12,
  SE: 24,
  JP: 24,
  KR: 24,
  MX: 12,
};

export function inspectionMonthsFor(region: string | null | undefined): number | null {
  if (!region) return 12;
  const months = INSPECTION_MONTHS[region.toUpperCase()];
  return months === undefined ? 12 : months;
}

/**
 * The shipped opinion about how often each service is due, in the unit the user
 * reads.
 *
 * The kilometre column is not a conversion of the mile column — 5,000 mi is
 * 8,047 km, and no manufacturer, garage or owner in a metric country has ever
 * said 8,047. They say 10,000. Converting the numbers would have produced a
 * default schedule that looked machine-translated in exactly the way the copy
 * is not.
 */
const DEFAULTS_MI: Record<string, Interval> = {
  "Oil Change": { months: 6, distance: 5000 },
  "Tire Rotation": { months: 6, distance: 6000 },
  "Brake Inspection": { months: 12, distance: 12000 },
  "Air Filter": { months: 12, distance: 15000 },
  "Cabin Air Filter": { months: 12, distance: 15000 },
  "Wiper Blades": { months: 12 },
  "Battery Check": { months: 12 },
  "Coolant Flush": { months: 24, distance: 30000 },
  "Transmission Fluid": { months: 36, distance: 60000 },
  "Spark Plugs": { distance: 60000 },
  Registration: { months: 12 },
  Inspection: { months: 12 },
  Other: { months: 12 },
};

const DEFAULTS_KM: Record<string, Interval> = {
  "Oil Change": { months: 6, distance: 10000 },
  "Tire Rotation": { months: 6, distance: 10000 },
  "Brake Inspection": { months: 12, distance: 20000 },
  "Air Filter": { months: 12, distance: 25000 },
  "Cabin Air Filter": { months: 12, distance: 25000 },
  "Wiper Blades": { months: 12 },
  "Battery Check": { months: 12 },
  "Coolant Flush": { months: 24, distance: 50000 },
  "Transmission Fluid": { months: 36, distance: 100000 },
  "Spark Plugs": { distance: 100000 },
  Registration: { months: 12 },
  Inspection: { months: 12 },
  Other: { months: 12 },
};

/**
 * Defaults for one unit and one market.
 *
 * Pure over both, so the same call the app makes with the phone's region is the
 * call the tests make with "GB" and "CA" and no device in sight. The inspection
 * row is rebuilt rather than mutated: `DEFAULTS_MI` is module state shared by
 * every caller, and a market with no test would otherwise delete the inspection
 * interval for the next one that asks.
 */
export function defaultIntervals(
  unit: DistanceUnit,
  inspectionMonths: number | null = 12
): Record<string, Interval> {
  const base = unit === "km" ? DEFAULTS_KM : DEFAULTS_MI;
  const out = { ...base };
  if (inspectionMonths === null) out.Inspection = {};
  else out.Inspection = { months: inspectionMonths };
  return out;
}

/** The service types the app ships an opinion about, in the order they are
 *  offered. Stable identifiers, never shown to the user — `serviceName` turns
 *  each one into the reader's own words. */
export const SERVICE_TYPES = Object.keys(DEFAULTS_MI);

/**
 * The intervals actually in force: the shipped defaults, with the user's own
 * numbers laid over them.
 *
 * Pure over its inputs so the merge is testable in Node — only the reading of
 * the overrides is device-bound.
 *
 * An override replaces a service's interval outright rather than merging field
 * by field. Someone who sets an oil change to 10,000 and clears the month
 * figure means "by distance only"; a field-wise merge would leave the default
 * 6 months underneath and keep marking the car due on a date the user
 * deliberately removed.
 *
 * Overrides may name a service that has no default. That is the point of
 * "and more" — a type the app never shipped an opinion about still gets one
 * once the user gives it a number.
 */
export function mergeIntervals(
  defaults: Record<string, Interval>,
  overrides: Record<string, Interval>
): Record<string, Interval> {
  const out: Record<string, Interval> = { ...defaults };
  for (const [type, interval] of Object.entries(overrides)) {
    if (interval.months === undefined && interval.distance === undefined) continue;
    out[type] = interval;
  }
  return out;
}

/** The local hour a service falls due, and therefore the hour any reminder for
 *  it fires. Early enough that the day is still useful, late enough not to wake
 *  anyone. */
export const DUE_HOUR = 9;

/**
 * Walks forward whole months on the *local* calendar and lands at 9am local.
 *
 * Local, not UTC, because the day a service was performed is the day the user
 * saw on the wheel — records are stored at noon local for exactly this reason
 * (see `dateFromParts`). Doing the arithmetic in UTC and reading the result
 * back locally moved the due date a day either way depending on the timezone.
 *
 * The time of day is pinned rather than inherited. A due date carried the clock
 * time of the original service, so a job logged at 23:40 came due — and fired
 * its notification — at 23:40 six months later.
 */
function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  const target = new Date(d.getFullYear(), d.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d.getDate(), lastDay));
  target.setHours(DUE_HOUR, 0, 0, 0);
  return target.toISOString();
}

export function nextDue(input: {
  lastPerformedAt: string;
  lastOdometer?: number;
  interval: Interval;
}): { dueAt?: string; dueOdometer?: number } {
  const out: { dueAt?: string; dueOdometer?: number } = {};
  if (input.interval.months !== undefined) {
    out.dueAt = addMonths(input.lastPerformedAt, input.interval.months);
  }
  if (input.interval.distance !== undefined && input.lastOdometer !== undefined) {
    out.dueOdometer = input.lastOdometer + input.interval.distance;
  }
  return out;
}

const SOON_DAYS = 30;

/**
 * How close to a distance-based service counts as "soon", per unit.
 *
 * 500 miles and 800 kilometres are both "about a fortnight of ordinary
 * driving". Using one number for both would have made the warning window 60%
 * shorter for every metric driver, which is the sort of detail that makes a
 * localized app feel subtly broken without ever being wrong on screen.
 */
const SOON_DISTANCE: Record<DistanceUnit, number> = { mi: 500, km: 800 };

export function dueStatus(input: {
  dueAt?: string;
  dueOdometer?: number;
  now: string;
  odometer?: number;
  unit?: DistanceUnit;
}): "due" | "soon" | "ok" {
  const states: ("due" | "soon" | "ok")[] = [];

  if (input.dueAt) {
    const days = (new Date(input.dueAt).getTime() - new Date(input.now).getTime()) / 86400000;
    states.push(days <= 0 ? "due" : days <= SOON_DAYS ? "soon" : "ok");
  }
  if (input.dueOdometer !== undefined && input.odometer !== undefined) {
    const left = input.dueOdometer - input.odometer;
    states.push(left <= 0 ? "due" : left <= SOON_DISTANCE[input.unit ?? "mi"] ? "soon" : "ok");
  }

  if (states.includes("due")) return "due";
  if (states.includes("soon")) return "soon";
  return "ok";
}
