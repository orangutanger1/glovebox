/**
 * The two decisions behind the wall, kept pure.
 *
 * Split from the database the same way `winback/state` is: both are read on
 * every launch and the cost of either being wrong is an existing user opening
 * the app to a paywall in front of their own service history, so both are
 * asserted in Node rather than on a device.
 */

/**
 * Whether this install was promised a free tier.
 *
 * Written exactly once, on the first launch of the build that introduced the
 * wall, and read on every launch after. It is not derived on the fly because
 * the only evidence available — "was onboarding already complete?" — stops
 * being true the moment a grandfathered user taps Replay onboarding in
 * Settings, and recomputing there would take the free app away from someone
 * for looking at the flow again.
 */
export const GRANDFATHERED_KEY = "paywall_grandfathered";

/**
 * The one-time answer, given the row that may or may not be there yet.
 *
 * `stored` is the `app_state` value: null the first time this build runs, and
 * "true"/"false" forever after. An install that had already finished
 * onboarding did so under a build that offered a free tier and let the user
 * decline both asks, so it keeps that app. A fresh install has been promised
 * nothing.
 */
export function grandfatherOnFirstRun(input: {
  stored: string | null;
  isOnboarded: boolean;
}): boolean {
  if (input.stored !== null) return input.stored === "true";
  return input.isOnboarded;
}

export type LockInput = {
  /** `null` until RevenueCat has answered. */
  isPro: boolean | null;
  grandfathered: boolean;
  isOnboarded: boolean;
};

/**
 * Whether the app is closed to this user, or `null` while that is not yet
 * knowable.
 *
 * The `null` is the point. The entitlement resolves a beat after launch, and
 * an unknown entitlement read as "not Pro" would put the wall in front of a
 * paying subscriber on every cold launch — briefly, which is worse than
 * permanently, because it looks like the subscription has lapsed. So the
 * caller renders nothing rather than guessing.
 *
 * Nobody mid-onboarding is walled, whatever the store says: the flow makes its
 * own two asks and hands its own decliners to the wall at the end. It also
 * answers without waiting there, because no value of `isPro` could change it.
 */
export function isLocked(input: LockInput): boolean | null {
  if (!input.isOnboarded || input.grandfathered) return false;
  if (input.isPro === null) return null;
  return !input.isPro;
}
