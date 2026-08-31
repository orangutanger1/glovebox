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
  // AdServices attribution collection is disabled: on iOS 26.6 the token fetch
  // wedges six `AAAttributionRequester` threads at launch — every one blocked
  // on the framework's own semaphore, per the build 18 and 19 crash reports —
  // inside the window the app then dies in. Without it, Apple Search Ads
  // installs land in RevenueCat as organic until the framework or the SDK is
  // fixed, so keyword-level ROAS goes dark before the app does. Reinstate only
  // behind a check that the fetch no longer hangs the launch.
  // Purchases.enableAdServicesAttributionTokenCollection().catch(() => {});
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
 * How long `presentPaywall` may take before the funnel is told it is stuck.
 *
 * A user deciding on a price takes seconds; a StoreKit sheet that is going to
 * appear has appeared well inside this. Anything past it is a sheet that never
 * came up.
 */
const STALL_MS = 8000;

/**
 * Reports a paywall that neither appeared nor failed.
 *
 * On 2026-08-31 two users on build 23 tapped the paywall CTA and emitted
 * `paywall_shown` and then nothing at all: no `paywall_presented`, no
 * `paywall_closed`, no `paywall_unavailable`, and no throw for the catch below
 * to report. Both re-entered the flow minutes later and did it again. A promise
 * that never settles and a process that died mid-call leave exactly the same
 * hole in the stream, and the difference decides whether the fix is in this
 * file or in the native layer — so the timer says which: a `paywall_stalled`
 * that arrives means the app was alive and waiting, and its absence beside a
 * `paywall_shown` means it was not.
 *
 * Instrumentation only. It never rejects, never races the result away and
 * never presents anything: the awaited promise is still the sheet's own, so a
 * sheet that comes up late is reported late rather than abandoned, and a second
 * presentation — the failure that stacks two unreachable sheets — remains
 * impossible.
 */
function withStallWatch<T>(offering: string, presenting: Promise<T>): Promise<T> {
  const timer = setTimeout(() => {
    track("paywall_stalled", { offering, ms: STALL_MS });
  }, STALL_MS);
  return presenting.finally(() => clearTimeout(timer));
}

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
    const result = await withStallWatch(offering, RevenueCatUI.presentPaywall(params));
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
