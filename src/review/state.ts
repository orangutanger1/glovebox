export const REVIEW_LAST_ASKED_KEY = "review_last_asked_at";
export const REVIEW_ASK_COUNT_KEY = "review_ask_count";

export type ReviewEventKind = "app_open" | "log_service" | "export" | "purchase";

export type ReviewEvent = { kind: ReviewEventKind; at: string };

/**
 * What each signal is worth, and how fast it stops being true.
 *
 * A rating prompt should land on someone who is glad about the app right now,
 * not someone who was glad in March. Every event therefore decays: `points` is
 * what it is worth the moment it happens, `halfLifeDays` is how long until it
 * is worth half that. Opening the app is weak and forgotten by tomorrow.
 * Logging a service is the thing the app is for. Paying is the strongest
 * statement a user can make and it stays true for a fortnight.
 */
export const EVENT_WEIGHTS: Record<ReviewEventKind, { points: number; halfLifeDays: number }> = {
  app_open: { points: 1, halfLifeDays: 1 },
  log_service: { points: 5, halfLifeDays: 2 },
  export: { points: 5, halfLifeDays: 2 },
  purchase: { points: 10, halfLifeDays: 14 },
};

/**
 * High enough that no single action reaches it.
 *
 * The cheapest route to 16 is roughly three logged services inside a couple of
 * days, or a purchase plus a service plus an export. That is the point: the ask
 * follows a pattern of use, never one lucky tap.
 */
export const SCORE_THRESHOLD = 16;

/** Two weeks between asks, per RevenueCat's guidance. */
export const COOLDOWN_DAYS = 14;

/**
 * iOS shows the system prompt at most three times per app per 365 days and
 * silently ignores the rest. Asking a fourth time cannot produce a prompt, so
 * we stop counting on it.
 */
export const MAX_ASKS = 3;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Current happiness, with every event faded by its age.
 *
 * Each half-life cuts a contribution in half, continuously — a 5-point event
 * with a 2-day half-life is worth 5 when it lands, 3.5 a day later, 2.5 after
 * two days. Events dated in the future (a clock the user rolled back) are
 * treated as happening now rather than amplified.
 */
export function happinessScore(events: ReviewEvent[], now: Date): number {
  return events.reduce((total, event) => {
    const weight = EVENT_WEIGHTS[event.kind];
    if (!weight) return total;
    const ageMs = now.getTime() - new Date(event.at).getTime();
    if (!Number.isFinite(ageMs)) return total;
    const ageDays = Math.max(0, ageMs) / DAY_MS;
    return total + weight.points * Math.pow(0.5, ageDays / weight.halfLifeDays);
  }, 0);
}

/**
 * Whether this is a moment to ask for a rating.
 *
 * Pure over its inputs, the same way readOnboardingState is over an injected
 * getter — the whole decision is testable in Node and only the StoreKit call is
 * device-bound.
 *
 * Deliberately NOT tied to onboarding. App Store Review Guideline 5.6.3 treats
 * soliciting a review before the user has meaningfully used the app as
 * manipulating the App Store experience, and Apple rejects for it. A rating
 * gathered at first launch is also worthless as signal: the user is rating a
 * promise, and the first bad week turns it into a one-star correction.
 */
export function shouldRequestReview(
  state: { events: ReviewEvent[]; lastAskedAt: string | null; askCount: number },
  now: Date
): boolean {
  if (state.askCount >= MAX_ASKS) return false;

  if (state.lastAskedAt) {
    const since = now.getTime() - new Date(state.lastAskedAt).getTime();
    if (!Number.isFinite(since) || since < COOLDOWN_DAYS * DAY_MS) return false;
  }

  return happinessScore(state.events, now) >= SCORE_THRESHOLD;
}
