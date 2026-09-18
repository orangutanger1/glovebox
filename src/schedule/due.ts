import type { DistanceUnit } from "../units";
import { dueStatus, nextDue, type Interval } from "./index";

export type DueState = {
  type: string;
  status: "due" | "soon" | "ok";
  dueAt?: string;
  dueOdometer?: number;
  /** How far the reading is past `dueOdometer`. Absent when there is no distance
   *  figure, no reading, or the reading has not reached it yet. */
  overBy?: number;
  /** The record the state was computed from: the latest of its type. */
  last: { performed_at: string; odometer?: number };
};

/**
 * Latest record per type → nextDue → dueStatus, once.
 *
 * The garage card, the vehicle screen, the reminder collector and the
 * onboarding plan each carried their own copy of this loop, and the copies
 * drifted. When b50b2f6 shipped "Other" with no interval, the garage card
 * learned to skip an empty interval, the plan already skipped "Other" by name,
 * and the vehicle screen and the collector only skipped it by accident — an
 * empty interval yields no due figure, which reads as "ok". The next rule of
 * that shape would have had four places to land and three to miss.
 *
 * Pure over its inputs so the rule can be asserted in Node with no DB: the
 * caller reads the records, the intervals in force and the odometer, and this
 * decides what each service's state is.
 *
 * A type with no interval, or an interval with neither a month nor a distance
 * figure, produces no state at all. The app has no opinion about it: it is not
 * "on schedule", it must not take the headline from a service that has one,
 * and it must never be listed as due.
 *
 * Output order is the order the types were first seen in `records`, which for
 * `listRecords` is most-recent-first. Callers that need another order sort.
 */
export function dueStates(input: {
  records: { service_type: string; performed_at: string; odometer?: number }[];
  intervals: Record<string, Interval>;
  odometer?: number;
  unit: DistanceUnit;
  now: string;
}): DueState[] {
  const latest = new Map<string, { performed_at: string; odometer?: number }>();
  for (const r of input.records) {
    const seen = latest.get(r.service_type);
    if (!seen || r.performed_at > seen.performed_at) latest.set(r.service_type, r);
  }

  const out: DueState[] = [];
  for (const [type, last] of latest) {
    const interval = input.intervals[type];
    if (!interval || (interval.months === undefined && interval.distance === undefined)) continue;
    const due = nextDue({ lastPerformedAt: last.performed_at, lastOdometer: last.odometer, interval });
    const status = dueStatus({ ...due, now: input.now, odometer: input.odometer, unit: input.unit });
    const overBy =
      due.dueOdometer !== undefined && input.odometer !== undefined && input.odometer > due.dueOdometer
        ? input.odometer - due.dueOdometer
        : undefined;
    out.push({ type, status, dueAt: due.dueAt, dueOdometer: due.dueOdometer, overBy, last });
  }
  return out;
}
