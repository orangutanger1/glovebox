export const REVIEW_LAST_ASKED_KEY = "review_last_asked_at";
export const REVIEW_ASK_COUNT_KEY = "review_ask_count";
/** Set once the subscriber's first-action ask has been spent. */
export const REVIEW_FIRST_ACTION_KEY = "review_first_action_asked";
/** Set once the end-of-onboarding ask has been spent. */
export const REVIEW_ONBOARDING_KEY = "review_onboarding_asked";
/** Every launch, counted from install. Never pruned, unlike review_events. */
export const REVIEW_OPEN_COUNT_KEY = "review_open_count";

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

/**
 * The launches that ask, counting the first as 1. Each is its own moment:
 * coming back a third, fifth and tenth time is the habit forming. Only the
 * yearly budget stands between them, so whichever three moments arrive first
 * are the three asks iOS shows.
 */
export const OPEN_ASK_COUNTS: readonly number[] = [3, 5, 10];

/** How long after a launch the open ask waits, so it never lands on a user
 *  still finding their place. */
export const OPEN_ASK_DELAY_MS = 10_000;

/**
 * iOS shows the system prompt at most three times per app per 365 days and
 * silently ignores the rest. Asking a fourth time cannot produce a prompt, so
 * we stop counting on it.
 */
export const MAX_ASKS = 3;

/** The window iOS counts those asks over. The count is per year, not per
 *  install: a user asked three times in their first month was never asked
 *  again, for as long as they kept the app. */
export const ASK_WINDOW_DAYS = 365;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * How many of the year's asks are spent. One timestamp rather than three: the
 * count resets once the *last* ask is a year old, which is a little stricter
 * than Apple's rolling window and never looser than it.
 */
export function spentAsks(
  state: { lastAskedAt: string | null; askCount: number },
  now: Date
): number {
  if (!state.lastAskedAt) return 0;
  const since = now.getTime() - new Date(state.lastAskedAt).getTime();
  if (Number.isFinite(since) && since >= ASK_WINDOW_DAYS * DAY_MS) return 0;
  return state.askCount;
}

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
 * Not tied to onboarding, which has its own single ask near its end (see
 * `shouldRequestOnboardingReview`). Guideline 5.6.3 rejects soliciting a
 * review before the user has meaningfully used the app, so never earlier.
 */
export function shouldRequestReview(
  state: { events: ReviewEvent[]; lastAskedAt: string | null; askCount: number },
  now: Date
): boolean {
  if (!canAsk(state, now)) return false;
  return happinessScore(state.events, now) >= SCORE_THRESHOLD;
}

/**
 * The yearly budget, without the happiness test. Every ask shares it: iOS
 * spends the same three prompts a year on any of them. There is no cooldown
 * between asks — each trigger fires at most once per install, so the budget
 * is what keeps them from piling up.
 */
export function canAsk(
  state: { lastAskedAt: string | null; askCount: number },
  now: Date
): boolean {
  return spentAsks(state, now) < MAX_ASKS;
}

/**
 * Near the end of onboarding, once. The user has answered the quiz and seen
 * the schedule built for their own car, which is the use Guideline 5.6.3
 * asks for; the very start of onboarding is not.
 */
export function shouldRequestOnboardingReview(
  state: { lastAskedAt: string | null; askCount: number; asked: boolean },
  now: Date
): boolean {
  return !state.asked && canAsk(state, now);
}

/** Whether this launch, by its count, is one of the launches that ask. */
export function shouldRequestOpenReview(
  state: { lastAskedAt: string | null; askCount: number; openCount: number },
  now: Date
): boolean {
  return OPEN_ASK_COUNTS.includes(state.openCount) && canAsk(state, now);
}

/**
 * The one ask that skips the score: a subscriber's first tap on the car.
 *
 * The happiness engine waits for a pattern of use, which is right for an
 * install that has not paid. A user who has just paid and is now reaching
 * for the thing they paid for is at the high point of the whole flow, and
 * the engine's threshold puts the ask days past it. So this asks once, at
 * that moment, and never again: `asked` is the install's record that the
 * moment was spent, whether or not iOS drew anything.
 *
 * Still gated on a purchase event. A subscriber has meaningfully used the
 * app in the sense Guideline 5.6.3 cares about: they read eleven screens
 * about their own car and paid for the schedule it built. An unpaid install's
 * first tap has done neither.
 */
export function shouldRequestFirstActionReview(
  state: { events: ReviewEvent[]; lastAskedAt: string | null; askCount: number; asked: boolean },
  now: Date
): boolean {
  if (state.asked) return false;
  if (!state.events.some((e) => e.kind === "purchase")) return false;
  return canAsk(state, now);
}
