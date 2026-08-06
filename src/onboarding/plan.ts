import { formatDate, t } from "../i18n";
import { formatDistance } from "../units/format";
import { DUE_HOUR, dueStatus, nextDue, type Interval } from "../schedule";
import type { DistanceUnit } from "../units";
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
 * Distance a year behind each answer to "how much do you drive?", per unit.
 *
 * The buckets are the midpoints of the ranges the question offers, except the
 * open-ended top one, which takes a figure just inside it rather than an
 * invented maximum. The kilometre column is a set of European ranges, not a
 * conversion of the American ones: the question offers "under 8,000 km" to a
 * metric driver because that is a round number people recognise, and its
 * midpoint has to match the label the user actually tapped.
 */
export const DISTANCE_PER_YEAR: Record<DistanceUnit, Record<DriveAnswer, number>> = {
  mi: { low: 4000, average: 7500, high: 12500, very_high: 18000 },
  km: { low: 6000, average: 12000, high: 20000, very_high: 30000 },
};

/** Used when the question was never reached. Close to the national average in
 *  each system. */
export const UNSTATED_DISTANCE_PER_YEAR: Record<DistanceUnit, number> = { mi: 12000, km: 15000 };

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
  /** The unit every distance in this plan is expressed in. */
  unit: DistanceUnit;
  distancePerYear: number;
  odometer?: number;
  /** Where the odometer lands twelve months out at the stated rate. */
  projectedOdometer?: number;
};

/** The rate every projection in the flow is made at, from the one answer that
 *  states it. Shared so the quiz and the plan cannot pick different numbers. */
export function distancePerYearFor(answers: Answers, unit: DistanceUnit): number {
  return answers.drive
    ? DISTANCE_PER_YEAR[unit][answers.drive]
    : UNSTATED_DISTANCE_PER_YEAR[unit];
}

/**
 * What the odometer read `daysAgo` days ago, at the stated rate.
 *
 * The quiz asks for today's reading and then asks when the last service was.
 * Filing that service at today's reading says a car serviced six months ago
 * has not moved since, which pushes its next distance-due point a full interval
 * past where it actually falls: an oil change logged "6 months ago" on a
 * 12,500 mi/year car came due 5,000 miles from today instead of ~1,750.
 *
 * Never negative, and never above the reading it is counted back from.
 */
export function odometerDaysAgo(
  odometer: number,
  distancePerYear: number,
  daysAgo: number
): number {
  const driven = (distancePerYear * Math.max(0, daysAgo)) / 365;
  return Math.max(0, Math.round(odometer - driven));
}

const RANK = { due: 0, soon: 1, ok: 2 };

export function buildPlan(input: {
  odometer?: number;
  records: { service_type: string; performed_at: string; odometer?: number }[];
  intervals: Record<string, Interval>;
  answers: Answers;
  unit: DistanceUnit;
  now?: Date;
}): Plan {
  const now = input.now ?? new Date();
  const nowIso = now.toISOString();
  const distancePerYear = distancePerYearFor(input.answers, input.unit);

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
    const status = dueStatus({ ...due, now: nowIso, odometer: input.odometer, unit: input.unit });

    // A distance interval has no date of its own, so a service like spark plugs
    // at 60,000 miles would otherwise appear in the plan with no when at all.
    // The user just told us how far they drive; that turns the distance left
    // into a date. This is the whole reason the question is asked.
    let projectedAt: string | undefined;
    if (due.dueOdometer !== undefined && input.odometer !== undefined) {
      const days = ((due.dueOdometer - input.odometer) / distancePerYear) * 365;
      const at = new Date(now);
      at.setDate(at.getDate() + Math.round(days));
      at.setHours(DUE_HOUR, 0, 0, 0);
      projectedAt = at.toISOString();
    }

    // Whichever comes first, date or distance — the rule the app states on the
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
    // ones: "your brakes are 400 over" outranks "we have never seen a
    // brake inspection" as something to act on today.
    if ((a.dueAt ?? "") !== (b.dueAt ?? "")) return (a.dueAt ?? "\uffff").localeCompare(b.dueAt ?? "\uffff");
    return a.type.localeCompare(b.type);
  });

  return {
    items,
    dueNow: items.filter((i) => i.status === "due").length,
    soon: items.filter((i) => i.status === "soon").length,
    logged: items.filter((i) => i.logged).length,
    unit: input.unit,
    distancePerYear,
    odometer: input.odometer,
    projectedOdometer:
      input.odometer === undefined ? undefined : input.odometer + distancePerYear,
  };
}

/**
 * The one-line "when" under a service, shared by every screen that lists one
 * so that the results, the plan and the paywall summary cannot describe the
 * same row three different ways.
 *
 * A projected date is marked as an estimate. It is derived from the reading
 * the user typed and the rate they picked, and presenting that with the same
 * confidence as a date computed from a logged service would be the app's first
 * piece of false precision.
 */
export function planItemLine(item: PlanItem, unit: DistanceUnit): string {
  if (!item.logged) return t("plan.line.nothing");
  const parts: string[] = [];
  if (item.dueAt) {
    const date = formatDate(item.dueAt);
    parts.push(item.projected ? t("plan.line.about", { date }) : date);
  }
  if (item.dueOdometer !== undefined) parts.push(formatDistance(item.dueOdometer, unit));
  return parts.join(" · ") || t("plan.line.noInterval");
}

/**
 * The soonest service still ahead of the user.
 *
 * The results screen and the paywall summary both print "the next one", and
 * both used to take the first dated row out of `plan.items`. That list is
 * sorted worst-first, so on any car with something overdue "next up" was the
 * most overdue thing on it: a date in the past, printed under a label that
 * promises the future.
 *
 * Undefined when nothing is dated in the future, which the callers say in
 * words rather than printing a date that has already been and gone.
 */
export function nextUp(plan: Plan, now: Date = new Date()): PlanItem | undefined {
  const nowIso = now.toISOString();
  let soonest: PlanItem | undefined;
  for (const item of plan.items) {
    if (item.dueAt === undefined || item.dueAt <= nowIso) continue;
    if (!soonest || item.dueAt < soonest.dueAt!) soonest = item;
  }
  return soonest;
}
