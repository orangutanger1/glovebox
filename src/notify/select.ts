/**
 * Which reminders survive to be scheduled.
 *
 * Split out from `../notify` so it can be tested in Node: that module pulls in
 * expo-notifications and the SQLite layer at import time, and this is the part
 * with the arithmetic worth testing.
 */

/**
 * iOS keeps at most 64 pending notifications per app and silently drops the
 * rest, with no promise about *which* it drops. Thirteen default service types
 * means five vehicles is enough to reach that, so the app picks the survivors
 * itself instead of letting the OS choose. Under 64 to leave headroom.
 */
export const MAX_SCHEDULED = 60;

export type Reminder = {
  vehicleName: string;
  serviceType: string;
  dueAt: string;
  lastPerformedAt: string;
};

/** Past reminders dropped, soonest first, capped. */
export function selectReminders(
  candidates: Reminder[],
  now: number,
  cap: number = MAX_SCHEDULED
): Reminder[] {
  return candidates
    .filter((c) => new Date(c.dueAt).getTime() > now)
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
    .slice(0, cap);
}
