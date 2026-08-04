import Purchases, { LOG_LEVEL, type PurchasesOffering } from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT, type CustomerCenterCallbacks } from "react-native-purchases-ui";

/**
 * The offering that carries the free trial, and the only one that does.
 *
 * The trial deliberately does not appear on the first paywall. On the App
 * Store a free trial is an *introductory offer* attached to a product, applied
 * automatically by StoreKit to any eligible buyer — so "hide the trial on
 * paywall one, show it on paywall two" cannot be done by hiding words. The two
 * paywalls have to sell different products, and they do: the default offering
 * sells products with no introductory offer, and this one sells `pro_annual`,
 * which carries a 3-day free trial. Buying a no-trial product does not consume
 * the subscription group's introductory-offer eligibility, so a user who says
 * no to the first paywall is still eligible at the second.
 *
 * It exists entirely in the RevenueCat dashboard — an offering with this
 * identifier and a paywall attached. No offering, no screen: the flow goes
 * straight into the app rather than promising a trial that cannot be started.
 */
export const DISCOUNT_OFFERING = "discount";

/**
 * The length of that trial, in days, for copy that names it.
 *
 * Must match the introductory offer on every product in the offering above.
 * `asc subscriptions offers introductory list --subscription-id <id>` is the
 * source of truth; today `pro_annual` is THREE_DAYS / FREE_TRIAL and
 * `pro_monthly` has none, which is exactly the split this file assumes.
 */
export const TRIAL_DAYS = 3;

export const ENTITLEMENT = "pro";

export function initPurchases(): void {
  const apiKey = process.env.EXPO_PUBLIC_RC_IOS_KEY;
  if (!apiKey) {
    console.warn("EXPO_PUBLIC_RC_IOS_KEY missing — paywall will be empty");
    return;
  }
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey });
}

export async function isPro(): Promise<boolean> {
  try {
    const info = await Purchases.getCustomerInfo();
    return info.entitlements.active[ENTITLEMENT] !== undefined;
  } catch {
    return false;
  }
}

export async function presentPaywall(): Promise<boolean> {
  const result = await RevenueCatUI.presentPaywallIfNeeded({
    requiredEntitlementIdentifier: ENTITLEMENT,
  });
  return result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED;
}

/**
 * `dismissed` and `unavailable` both mean "nobody paid", and the caller has to
 * tell them apart anyway: a dismissal has earned the second offer, a paywall
 * that could not load has not — showing a discount to a user who was never
 * shown a price is a worse trade than letting them into the app.
 */
export type PaywallOutcome = "purchased" | "dismissed" | "unavailable";

/**
 * Presents a specific offering's paywall, or the current one when no
 * identifier is given. Unlike `presentPaywall` this does not check the
 * entitlement first: the onboarding paywall is a screen the user navigated to,
 * and a screen that renders nothing is a dead end.
 */
export async function presentOffering(identifier?: string): Promise<PaywallOutcome> {
  try {
    const params: { offering?: PurchasesOffering } = {};
    if (identifier) {
      const offering = await offeringFor(identifier);
      if (!offering) return "unavailable";
      params.offering = offering;
    }
    const result = await RevenueCatUI.presentPaywall(params);
    if (result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED) {
      return "purchased";
    }
    return result === PAYWALL_RESULT.CANCELLED ? "dismissed" : "unavailable";
  } catch {
    // No API key in the build, no network, products not yet fetchable from the
    // store. The flow must not strand the user on a screen whose only control
    // just threw.
    return "unavailable";
  }
}

async function offeringFor(identifier: string): Promise<PurchasesOffering | null> {
  const offerings = await Purchases.getOfferings();
  return offerings.all[identifier] ?? null;
}

/** Whether the second offer is worth routing to. Never throws. */
export async function hasOffering(identifier: string): Promise<boolean> {
  try {
    return (await offeringFor(identifier)) !== null;
  } catch {
    return false;
  }
}

export async function restore(): Promise<boolean> {
  const info = await Purchases.restorePurchases();
  return info.entitlements.active[ENTITLEMENT] !== undefined;
}

/**
 * The only way out of a subscription from inside the app.
 *
 * `presentPaywall` wraps `presentPaywallIfNeeded`, which does nothing once the
 * entitlement is active — correct for gating, but it left a subscriber with no
 * route to switch between monthly and annual, to cancel, or even to see what
 * they were paying for. Customer Center is RevenueCat's native sheet for all of
 * that; its contents are configured in the dashboard rather than built here.
 *
 * The cancel path is also the app's only exit interview. The dashboard can put
 * a feedback row and a promotional offer on it; the callbacks are how the
 * outcome gets back to the caller.
 */
export async function presentCustomerCenter(
  callbacks?: CustomerCenterCallbacks
): Promise<void> {
  await RevenueCatUI.presentCustomerCenter(callbacks ? { callbacks } : undefined);
}
