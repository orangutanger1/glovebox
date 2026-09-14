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

/**
 * When a pending notification fires, read off whatever shape the platform
 * hands back — or `undefined` for a trigger that has no single time.
 *
 * The app schedules every reminder as a `DATE` trigger, and on iOS that comes
 * back from `getAllScheduledNotificationsAsync` as a *calendar* trigger: the
 * SDK converts the date into `UNCalendarNotificationTrigger` components on the
 * way in, and serialises those components on the way out. Reading `date` alone
 * found nothing on every device, so Settings never once printed the next date.
 * The components are in the phone's own zone, which is what `new Date(y, m…)`
 * builds.
 */
export function triggerTime(trigger: unknown): number | undefined {
  if (!trigger || typeof trigger !== "object") return undefined;
  const t = trigger as {
    date?: number | string;
    dateComponents?: Record<string, unknown>;
    seconds?: number;
  };
  if (t.date !== undefined) {
    const at = new Date(t.date).getTime();
    return Number.isNaN(at) ? undefined : at;
  }
  const c = t.dateComponents;
  if (c) {
    const n = (key: string, fallback: number) => (typeof c[key] === "number" ? (c[key] as number) : fallback);
    if (typeof c.year !== "number" || typeof c.month !== "number" || typeof c.day !== "number") {
      return undefined;
    }
    return new Date(n("year", 0), n("month", 1) - 1, n("day", 1), n("hour", 0), n("minute", 0), n("second", 0)).getTime();
  }
  return undefined;
}
