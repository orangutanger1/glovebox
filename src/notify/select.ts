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
 * When a pending notification fires, or `undefined` when the platform gives no
 * single time back.
 *
 * The app schedules every reminder as a `DATE` trigger, and on iOS the SDK
 * turns that into a `UNTimeIntervalNotificationTrigger` (seconds from now) on
 * the way in and serialises it as `{ type: "timeInterval", seconds }` on the
 * way out — the original date is gone, and a `seconds` count with no anchor
 * cannot rebuild it. So the schedule sites stash the due date in
 * `content.data.dueAt`, and that is read first; the trigger is only a
 * fallback for a platform that does hand a `date` or calendar components back.
 */
export function scheduledAt(request: {
  content?: { data?: Record<string, unknown> | null } | null;
  trigger?: unknown;
}): number | undefined {
  const due = request.content?.data?.dueAt;
  if (typeof due === "string" || typeof due === "number") {
    const at = new Date(due).getTime();
    if (!Number.isNaN(at)) return at;
  }
  return triggerTime(request.trigger);
}

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
