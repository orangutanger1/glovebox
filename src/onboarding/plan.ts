import { DUE_HOUR, dueStatus, nextDue, type Interval } from "../schedule";
import type { Answers, DriveAnswer } from "./state";

/**
 * The maintenance plan the second half of onboarding is built from.
 *
 * Pure over its inputs — vehicle mileage, the service rows already written by
 * the quiz, the intervals in force, and the answers — so every screen from
 * "analyzing" to the paywall shows the same numbers, and so those numbers can
 * be asserted in Node without a device.
 *
 * Nothing here is theatre. The flow shows the user a count of what is due, a
 * date for each service and a projection a year out; all three fall out of the
 * same `nextDue`/`dueStatus` pair the garage screen and the reminder scheduler
 * use. If the plan says three services are due, three services are due.
 */

/**
 * Miles a year behind each answer to "how much do you drive?". The buckets are
 * the midpoints of the ranges the question offers, except the open-ended top
 * one, which takes a figure just inside it rather than an invented maximum.
 */
export const MILES_PER_YEAR: Record<DriveAnswer, number> = {
  low: 4000,
  average: 7500,
  high: 12500,
  very_high: 18000,
};

/** Used when the question was never reached. Close to the US average. */
export const UNSTATED_MILES_PER_YEAR = 12000;

export type PlanItem = {
  type: string;
  status: "due" | "soon" | "ok";
  /** False when nothing of this type has ever been logged for this vehicle. */
  logged: boolean;
  dueAt?: string;
  dueOdometer?: number;
  /** `dueAt` came from the mileage projection rather than a months interval. */
  projected: boolean;
};

export type Plan = {
  /** Worst first: due, then soon, then ok; dated before undated inside each. */
  items: PlanItem[];
  dueNow: number;
  soon: number;
  /** How many of the tracked services have anything on file at all. */
  logged: number;
  milesPerYear: number;
  odometer?: number;
  /** Where the odometer lands twelve months out at the stated rate. */
  projectedOdometer?: number;
};

const RANK = { due: 0, soon: 1, ok: 2 };

export function buildPlan(input: {
  odometer?: number;
  records: { service_type: string; performed_at: string; odometer?: number }[];
  intervals: Record<string, Interval>;
  answers: Answers;
  now?: Date;
}): Plan {
  const now = input.now ?? new Date();
  const nowIso = now.toISOString();
  const milesPerYear = input.answers.drive
    ? MILES_PER_YEAR[input.answers.drive]
    : UNSTATED_MILES_PER_YEAR;

  const items: PlanItem[] = [];
  for (const [type, interval] of Object.entries(input.intervals)) {
    // "Other" is the bucket the log form drops anything unrecognised into. It
    // is a real interval for scheduling one specific record, but as a line in
    // a plan it reads as a service called Other, which is not a service.
    if (type === "Other") continue;

    let latest: { performed_at: string; odometer?: number } | undefined;
    for (const record of input.records) {
      if (record.service_type !== type) continue;
      if (!latest || record.performed_at > latest.performed_at) latest = record;
    }

    if (!latest) {
      // Nothing on file. Treated as due rather than unknown, which is the same
      // direction the quiz's "not sure" answer errs in: the cost of being told
      // to check something that is fine is a glance, and the cost of the
      // opposite is a repair.
      items.push({ type, status: "due", logged: false, projected: false });
      continue;
    }

    const due = nextDue({
      lastPerformedAt: latest.performed_at,
      lastOdometer: latest.odometer,
      interval,
    });
    const status = dueStatus({ ...due, now: nowIso, odometer: input.odometer });

    // A mileage interval has no date of its own, so a service like spark plugs
    // at 60,000 miles would otherwise appear in the plan with no when at all.
    // The user just told us how far they drive; that turns the remaining miles
    // into a date. This is the whole reason the question is asked.
    let projectedAt: string | undefined;
    if (due.dueOdometer !== undefined && input.odometer !== undefined) {
      const days = ((due.dueOdometer - input.odometer) / milesPerYear) * 365;
      const at = new Date(now);
      at.setDate(at.getDate() + Math.round(days));
      at.setHours(DUE_HOUR, 0, 0, 0);
      projectedAt = at.toISOString();
    }

    // Whichever comes first, date or mileage — the rule the app states on the
    // plan screen and schedules reminders by.
    const projected = projectedAt !== undefined && (due.dueAt === undefined || projectedAt < due.dueAt);
    items.push({
      type,
      status,
      logged: true,
      dueAt: projected ? projectedAt : due.dueAt,
      dueOdometer: due.dueOdometer,
      projected,
    });
  }

  items.sort((a, b) => {
    if (RANK[a.status] !== RANK[b.status]) return RANK[a.status] - RANK[b.status];
    // Undated items are the ones with no history. They belong under the dated
    // ones: "your brakes are 400 miles over" outranks "we have never seen a
    // brake inspection" as something to act on today.
    if ((a.dueAt ?? "") !== (b.dueAt ?? "")) return (a.dueAt ?? "\uffff").localeCompare(b.dueAt ?? "\uffff");
    return a.type.localeCompare(b.type);
  });

  return {
    items,
    dueNow: items.filter((i) => i.status === "due").length,
    soon: items.filter((i) => i.status === "soon").length,
    logged: items.filter((i) => i.logged).length,
    milesPerYear,
    odometer: input.odometer,
    projectedOdometer: input.odometer === undefined ? undefined : input.odometer + milesPerYear,
  };
}

/**
 * The one-line "when" under a service, shared by every screen that lists one
 * so that the results, the plan and the paywall summary cannot describe the
 * same row three different ways.
 *
 * A projected date is marked as an estimate. It is derived from the mileage
 * the user typed and the rate they picked, and presenting that with the same
 * confidence as a date computed from a logged service would be the app's first
 * piece of false precision.
 */
export function planItemLine(item: PlanItem): string {
  if (!item.logged) return "Nothing on file";
  const parts: string[] = [];
  if (item.dueAt) {
    const date = new Date(item.dueAt).toLocaleDateString();
    parts.push(item.projected ? `about ${date}` : date);
  }
  if (item.dueOdometer !== undefined) parts.push(`${item.dueOdometer.toLocaleString()} mi`);
  return parts.join(" · ") || "No interval set";
}
