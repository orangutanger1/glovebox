export const DEFAULT_INTERVALS: Record<string, { months?: number; miles?: number }> = {
  "Oil Change": { months: 6, miles: 5000 },
  "Tire Rotation": { months: 6, miles: 6000 },
  "Brake Inspection": { months: 12, miles: 12000 },
  "Air Filter": { months: 12, miles: 15000 },
  "Cabin Air Filter": { months: 12, miles: 15000 },
  "Wiper Blades": { months: 12 },
  "Battery Check": { months: 12 },
  "Coolant Flush": { months: 24, miles: 30000 },
  "Transmission Fluid": { months: 36, miles: 60000 },
  "Spark Plugs": { miles: 60000 },
  "Registration": { months: 12 },
  "Inspection": { months: 12 },
  "Other": { months: 12 },
};

export type Interval = { months?: number; miles?: number };

/**
 * The intervals actually in force: the shipped defaults, with the user's own
 * numbers laid over them.
 *
 * Pure over its inputs so the merge is testable in Node — only the reading of
 * the overrides is device-bound.
 *
 * An override replaces a service's interval outright rather than merging field
 * by field. Someone who sets an oil change to 10,000 miles and clears the month
 * figure means "by mileage only"; a field-wise merge would leave the default
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
    if (interval.months === undefined && interval.miles === undefined) continue;
    out[type] = interval;
  }
  return out;
}

function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  const day = d.getUTCDate();
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)
  ).getUTCDate();
  target.setUTCDate(Math.min(day, lastDay));
  target.setUTCHours(
    d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds()
  );
  return target.toISOString();
}

export function nextDue(input: {
  lastPerformedAt: string;
  lastOdometer?: number;
  interval: { months?: number; miles?: number };
}): { dueAt?: string; dueOdometer?: number } {
  const out: { dueAt?: string; dueOdometer?: number } = {};
  if (input.interval.months !== undefined) {
    out.dueAt = addMonths(input.lastPerformedAt, input.interval.months);
  }
  if (input.interval.miles !== undefined && input.lastOdometer !== undefined) {
    out.dueOdometer = input.lastOdometer + input.interval.miles;
  }
  return out;
}

const SOON_DAYS = 30;
const SOON_MILES = 500;

export function dueStatus(input: {
  dueAt?: string;
  dueOdometer?: number;
  now: string;
  odometer?: number;
}): "due" | "soon" | "ok" {
  const states: ("due" | "soon" | "ok")[] = [];

  if (input.dueAt) {
    const days = (new Date(input.dueAt).getTime() - new Date(input.now).getTime()) / 86400000;
    states.push(days <= 0 ? "due" : days <= SOON_DAYS ? "soon" : "ok");
  }
  if (input.dueOdometer !== undefined && input.odometer !== undefined) {
    const left = input.dueOdometer - input.odometer;
    states.push(left <= 0 ? "due" : left <= SOON_MILES ? "soon" : "ok");
  }

  if (states.includes("due")) return "due";
  if (states.includes("soon")) return "soon";
  return "ok";
}
