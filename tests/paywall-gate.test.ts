import {
  grandfatherOnFirstRun,
  isLocked,
  type LockInput,
} from "../src/paywall/state";

/**
 * The two decisions that turn a freemium app into a subscription-only one.
 *
 * Both are pure over their inputs so they can be asserted here rather than on
 * a device: the cost of getting either one wrong is an existing user opening
 * the app to a wall in front of a year of their own service history, which is
 * the kind of bug that arrives as a refund request and a one-star review
 * rather than as a crash report.
 */

describe("who is grandfathered", () => {
  test("an install that had already finished onboarding keeps its free app", () => {
    // The only signal available: this build is the first one that can write
    // the flag, so anyone already onboarded when it runs finished under the
    // freemium build and was promised a free tier.
    expect(grandfatherOnFirstRun({ stored: null, isOnboarded: true })).toBe(true);
  });

  test("a fresh install is not", () => {
    expect(grandfatherOnFirstRun({ stored: null, isOnboarded: false })).toBe(false);
  });

  test("the answer is written once and never recomputed", () => {
    // A user who is grandfathered and then replays onboarding from Settings is
    // momentarily not onboarded. Recomputing here would revoke the free tier
    // of someone who did nothing but look at the flow again.
    expect(grandfatherOnFirstRun({ stored: "true", isOnboarded: false })).toBe(true);
    expect(grandfatherOnFirstRun({ stored: "false", isOnboarded: true })).toBe(false);
  });
});

describe("who sees the wall", () => {
  const at = (patch: Partial<LockInput>): boolean | null =>
    isLocked({ isPro: false, grandfathered: false, isOnboarded: true, ...patch });

  test("a new user who paid for nothing does", () => {
    expect(at({})).toBe(true);
  });

  test("a subscriber does not", () => {
    expect(at({ isPro: true })).toBe(false);
  });

  test("a grandfathered free user does not", () => {
    expect(at({ grandfathered: true })).toBe(false);
  });

  test("nobody mid-onboarding does", () => {
    // The flow has its own two asks and its own exit into the wall. Walling a
    // user who is three questions into the quiz would take the app's whole
    // argument away before it has been made.
    expect(at({ isOnboarded: false })).toBe(false);
  });

  test("the answer is withheld until the entitlement is actually known", () => {
    // `null` is the moment before RevenueCat answers. Treating it as "not Pro"
    // would flash the wall at a paying subscriber on every cold launch.
    expect(at({ isPro: null })).toBeNull();
  });

  test("an unknown entitlement mid-onboarding is still not a wall", () => {
    // No wall is possible here whatever the store eventually says, so the
    // screen must not be held back waiting for it.
    expect(at({ isPro: null, isOnboarded: false })).toBe(false);
  });
});
