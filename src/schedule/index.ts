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
