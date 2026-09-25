/**
 * The monthly odometer check-in.
 *
 * Mileage-based services are the half of the schedule the app cannot see
 * coming: nothing tells it how far the car has gone except the numbers the
 * owner types, and an owner who logs one oil change a year gives it one number
 * a year. The check-in asks for the reading once a month, which keeps every
 * distance-based due date honest and gives a set-and-forget app a light reason
 * to be opened between services.
 *
 * Pure, so it can be tested in Node. The anchor it counts from is read in
 * `../db/checkin`.
 */

/** A month, near enough. Long enough not to nag, short enough that an oil
 *  change on a 5,000 mi interval cannot come and go between two readings. */
export const CHECKIN_DAYS = 30;

/** The most cars that get a check-in. Each is one of the 64 notifications iOS
 *  will hold, and a garage bigger than this is a fleet, not a driveway. */
export const MAX_CHECKINS = 5;

/**
 * When to ask next: 10:00 local, a month after the last reading — and if that
 * month has already passed, the next month-step after now.
 *
 * Stepping rather than "tomorrow" is the point. The schedule is rebuilt on
 * every launch, so a rule of "overdue means ask tomorrow" would ask every day
 * for as long as the owner kept ignoring it. Stepping means an ignored
 * check-in comes back once a month and no more often.
 */
export function nextCheckinAt(anchor: string, now: number): string {
  const base = new Date(anchor);
  if (Number.isNaN(base.getTime())) return atTen(new Date(now), CHECKIN_DAYS).toISOString();
  for (let step = 1; ; step++) {
    const at = atTen(base, CHECKIN_DAYS * step);
    if (at.getTime() > now) return at.toISOString();
  }
}

function atTen(from: Date, days: number): Date {
  return new Date(from.getFullYear(), from.getMonth(), from.getDate() + days, 10, 0, 0, 0);
}

/** The latest of several ISO timestamps, ignoring the missing ones. */
export function latest(...values: (string | null | undefined)[]): string | undefined {
  let best: string | undefined;
  let bestAt = -Infinity;
  for (const v of values) {
    if (!v) continue;
    const at = new Date(v).getTime();
    if (!Number.isNaN(at) && at > bestAt) {
      best = v;
      bestAt = at;
    }
  }
  return best;
}
