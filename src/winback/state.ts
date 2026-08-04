export const LAST_OPEN_KEY = "last_open_at";
export const WINBACK_SHOWN_KEY = "winback_shown_at";

/**
 * Long enough away that the app had stopped being part of the user's month.
 * Two weeks is past the gap between an ordinary busy fortnight and having
 * actually put the app down.
 */
export const AWAY_DAYS = 14;

/** Asked once, then left alone for half a year. A win-back that reappears is
 *  an advert, and this app does not have those. */
export const COOLDOWN_DAYS = 180;

const DAY_MS = 86400000;

/**
 * Whether a returning user gets the churn screen.
 *
 * There is no such thing as an app-deletion hook on iOS: the home-screen long
 * press and its Delete button are SpringBoard's, the app is not running, and
 * nothing is delivered to it before or after. The moment the app actually gets
 * with somebody who had left is the moment they come back, and this is the test
 * for it.
 *
 * A subscriber is excluded on purpose. They have a real exit — the cancel flow
 * in the Customer Center, which carries its own survey and its own offer — and
 * interrupting a paying customer with a trial pitch is the worst version of
 * this screen.
 *
 * Pure over its inputs so the window arithmetic can be asserted without a
 * device or a clock.
 */
export function shouldOfferWinback(input: {
  /** The open before this one. Null on the first launch after onboarding. */
  lastOpenAt: string | null;
  lastShownAt: string | null;
  now: Date;
  isPro: boolean;
  /** Whether the trial offering exists. No offer, no screen. */
  hasOffer: boolean;
}): boolean {
  if (input.isPro || !input.hasOffer || !input.lastOpenAt) return false;

  const away = (input.now.getTime() - new Date(input.lastOpenAt).getTime()) / DAY_MS;
  // A negative gap means the clock moved backwards — a restored backup, a
  // timezone change, a user resetting the date. Treat it as "not away" rather
  // than as an enormous absence.
  if (!(away >= AWAY_DAYS)) return false;

  if (input.lastShownAt) {
    const since = (input.now.getTime() - new Date(input.lastShownAt).getTime()) / DAY_MS;
    if (!(since >= COOLDOWN_DAYS)) return false;
  }
  return true;
}
