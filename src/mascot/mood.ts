/**
 * The car mascot's mood, from the service status it is standing in front of.
 *
 * The mascot is a status light with a face: it never says anything the
 * schedule does not. Worst state wins, so one overdue service on any car makes
 * the garage worried however many others are fine.
 *
 * - `sleepy`: nothing logged yet, so there is no schedule to be anything about.
 * - `worried`: something is overdue.
 * - `heads-up`: something falls due within the "soon" window.
 * - `happy`: everything tracked is on schedule.
 * - `celebrating`: a service was just logged. Transient, set by the screen
 *   that saw the save, never derived from the schedule.
 */
export type Mood = "happy" | "heads-up" | "worried" | "sleepy" | "celebrating";

export type Status = "due" | "soon" | "ok";

export function moodFor(input: { logged: number; statuses: readonly Status[] }): Mood {
  if (input.logged === 0) return "sleepy";
  if (input.statuses.includes("due")) return "worried";
  if (input.statuses.includes("soon")) return "heads-up";
  return "happy";
}

/**
 * How much of a service's interval is left, 0–1, by whichever runs out first:
 * the months or the distance. `null` when the interval gives the app nothing
 * to measure against (no months, or distance with no reading on either side).
 *
 * This is the only "health" figure the redesign draws, and it is arithmetic on
 * the user's own interval, not a score: 40% means 40% of the gap you set
 * between oil changes is still ahead of you.
 */
export function lifeLeft(input: {
  lastPerformedAt: string;
  lastOdometer?: number;
  months?: number;
  distance?: number;
  odometer?: number;
  now: string;
}): number | null {
  const parts: number[] = [];
  if (input.months !== undefined && input.months > 0) {
    const start = new Date(input.lastPerformedAt).getTime();
    const span = input.months * 30.44 * 86_400_000;
    parts.push(1 - (new Date(input.now).getTime() - start) / span);
  }
  if (
    input.distance !== undefined &&
    input.distance > 0 &&
    input.lastOdometer !== undefined &&
    input.odometer !== undefined
  ) {
    parts.push(1 - (input.odometer - input.lastOdometer) / input.distance);
  }
  if (parts.length === 0) return null;
  return Math.max(0, Math.min(1, Math.min(...parts)));
}
