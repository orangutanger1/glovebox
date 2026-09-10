import type { Plan, PlanItem } from "./plan";

/**
 * The same plan, twelve months forward.
 *
 * "results" is the car as it stands: what is overdue, what is soon, how much
 * has a history behind it. That is a fact about today, and a user can act on it
 * once and be done. This is the argument that the problem recurs — at the rate
 * this driver actually drives, here is where the odometer lands by this time
 * next year and here is how many services arrive between now and then.
 *
 * Deliberately not a score. `results.tsx` already refuses to print one, and the
 * reason holds here: "your car's health is 62" is a number the app cannot
 * honestly compute, and dressing a count of due dates up as a percentage would
 * make this screen the one invented thing in a flow built entirely out of the
 * user's own answers. Every figure below is a count or a projection the
 * scheduler already makes.
 *
 * Pure over the plan, so the screen and a test see the same twelve months.
 */

const MONTHS = 12;

export type Outlook = {
  /** Services whose due date falls inside the next twelve months, including
   *  the ones already past — those are the ones that need doing soonest. */
  dueWithinYear: number;
  /** Of those, the ones already overdue with a history behind them. Same
   *  definition `results` counts by, so the two screens cannot disagree. */
  alreadyDue: number;
  /** The soonest dated service still ahead, if there is one. */
  next?: PlanItem;
  /** Where the odometer lands twelve months out, or undefined when the car has
   *  no reading to project from. */
  projectedOdometer?: number;
  /** Distance covered in those twelve months, at the rate the user stated. */
  distancePerYear: number;
};

export function buildOutlook(plan: Plan, now: Date = new Date()): Outlook {
  const horizon = new Date(now);
  horizon.setMonth(horizon.getMonth() + MONTHS);
  const cutoff = horizon.getTime();
  const nowMs = now.getTime();

  let dueWithinYear = 0;
  let next: PlanItem | undefined;

  for (const item of plan.items) {
    if (!item.dueAt) continue;
    const at = new Date(item.dueAt).getTime();
    if (at > cutoff) continue;
    dueWithinYear += 1;
    // Soonest still ahead. A service that is already past is counted above but
    // is not "next up" — it is late, and the screen before this one said so.
    if (at > nowMs && (next === undefined || at < new Date(next.dueAt!).getTime())) next = item;
  }

  return {
    dueWithinYear,
    alreadyDue: plan.pastDue,
    next,
    projectedOdometer: plan.projectedOdometer,
    distancePerYear: plan.distancePerYear,
  };
}
