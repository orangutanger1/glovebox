import Purchases, { LOG_LEVEL, type PurchasesOffering } from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT, type CustomerCenterCallbacks } from "react-native-purchases-ui";
import { track } from "../analytics";

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
    console.warn("EXPO_PUBLIC_RC_IOS_KEY missing, paywall will be empty");
    return;
  }
  Purchases.setLogLevel(__DEV__ ? LOG_LEVEL.DEBUG : LOG_LEVEL.ERROR);
  Purchases.configure({ apiKey });
  // Without this, every Apple Search Ads install lands in RevenueCat as
  // organic: the AdServices attribution token is what carries campaign, ad
  // group and keyword. It is the only way to tie subscription revenue back to
  // a keyword, so keyword-level ROAS is unmeasurable until it is called.
  // iOS-only and best-effort — a rejected/absent token is not an error worth
  // surfacing to the user.
  Purchases.enableAdServicesAttributionTokenCollection().catch(() => {});
}

/**
 * Whether the native SDK is holding a configuration, asked of the SDK rather
 * than inferred from `initPurchases` having run.
 *
 * Nothing may present RevenueCat UI without this. `RevenueCatUI.presentPaywall`
 * reaches `Purchases.shared` on the native side, and reading that singleton
 * before `configure` is a Swift `fatalError`: the process is killed, no
 * JavaScript exception is ever raised, and the app "just closes" on the tap.
 * A build or an OTA update published without `EXPO_PUBLIC_RC_IOS_KEY` inlined
 * is enough to reach it, which is exactly what shipped: the key lives in the
 * EAS environment and an update published without `--environment production`
 * carries `undefined` into the bundle, so `initPurchases` returns early and the
 * paywall button becomes a crash.
 */
async function configured(): Promise<boolean> {
  try {
    return await Purchases.isConfigured();
  } catch {
    return false;
  }
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
  if (!(await configured())) return false;
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
  const offering = identifier ?? "current";
  if (!(await configured())) {
    // The crash case, reported as its own reason so a build shipped without
    // the key is one event in the funnel rather than a cliff of terminations.
    track("paywall_unconfigured", { offering });
    return "unavailable";
  }
  try {
    const params: { offering?: PurchasesOffering } = {};
    if (identifier) {
      const resolved = await offeringFor(identifier);
      if (!resolved) {
        // Distinct from a dismissal on purpose: this is a configuration fault,
        // and counting it as a decline would understate the paywall's real
        // conversion rate by however many builds shipped with it broken.
        track("paywall_unavailable", { offering });
        return "unavailable";
      }
      params.offering = resolved;
    }
    // Intent, not evidence. `paywall_shown` has always been emitted here, one
    // line before the sheet is asked for, so it counts attempts — including
    // the ones where RevenueCatUI never renders anything. It stays where it is
    // so the existing funnel keeps comparing to itself.
    track("paywall_shown", { offering });
    const asked = Date.now();
    const result = await RevenueCatUI.presentPaywall(params);
    // Evidence. Only reachable once the sheet has actually come back, so
    // `shown` minus `presented` is the number of paywalls that failed to
    // appear at all — previously indistinguishable from a decline. `ms` is
    // what separates a real decision from a sheet that returned instantly:
    // a StoreKit checkout the user cancelled takes seconds, a paywall that
    // could not load takes none.
    track("paywall_presented", { offering, result, ms: Date.now() - asked });
    const outcome: PaywallOutcome =
      result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED
        ? "purchased"
        : result === PAYWALL_RESULT.CANCELLED
          ? "dismissed"
          : "unavailable";
    track("paywall_closed", { offering, outcome, result });
    return outcome;
  } catch {
    // No API key in the build, no network, products not yet fetchable from the
    // store. The flow must not strand the user on a screen whose only control
    // just threw.
    track("paywall_unavailable", { offering });
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
  // Same fatal native path as the paywall: no configuration, no sheet.
  if (!(await configured())) return;
  await RevenueCatUI.presentCustomerCenter(callbacks ? { callbacks } : undefined);
}
