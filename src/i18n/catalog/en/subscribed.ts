import type { Fragment } from "../types";

/**
 * The screen between paying and the garage.
 *
 * Four strings, and the restraint is deliberate. The rest of the screen is
 * borrowed: the gauges reuse the paywall's own legends so the numbers read as
 * the thing that was argued for, and the two unlocked rows reuse the feature
 * titles from the help screen so a capability is not described one way before
 * the money and another way after it.
 */
export const subscribed: Fragment = {
  // Not "Thank you" and not "Welcome to Pro". The app is an instrument panel;
  // the moment a system comes on, it says so.
  "subscribed.title": "Pro is on.",
  "subscribed.body":
    "{vehicle} is on the schedule now. You'll be told before each service is due, not after.",
  "subscribed.unlocked": "Also unlocked",
  // The car, not the garage. A free garage held one vehicle and now holds
  // several, but the schedule this user just paid to be warned about is on the
  // car itself.
  "subscribed.cta": "See the schedule",
};
