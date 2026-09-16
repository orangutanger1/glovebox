import { AppState } from "react-native";
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOffering,
} from "react-native-purchases";
import RevenueCatUI, { PAYWALL_RESULT, type CustomerCenterCallbacks } from "react-native-purchases-ui";
import { track } from "../analytics";

/**
 * The offering that carries the introductory offer, and the only one that does.
 *
 * The intro deliberately does not appear on the first paywall. On the App
 * Store an introductory offer is attached to a *product* and applied
 * automatically by StoreKit to any eligible buyer — so "hide the cheap first
 * week on paywall one, show it on paywall two" cannot be done by hiding words.
 * The two paywalls have to sell different products, and they do: the default
 * offering sells products with no introductory offer, and this one sells
 * `pro_weekly`, whose first week is a pay-up-front introductory price.
 * Buying a no-intro product does not consume the subscription group's
 * introductory-offer eligibility, so a user who says no to the first paywall
 * is still eligible at the second.
 *
 * It exists entirely in the RevenueCat dashboard — an offering with this
 * identifier and a paywall attached. No offering, no screen: the flow goes
 * straight to the wall rather than promising a price that cannot be bought.
 */
export const DISCOUNT_OFFERING = "discount";

/**
 * The length of that introductory period, in days, for copy that names it.
 *
 * Must match the introductory offer on every product in the offering above.
 * `asc subscriptions offers introductory list --subscription-id <id>` is the
 * source of truth; today `pro_weekly` is ONE_WEEK / PAY_AS_YOU_GO over one
 * period, which is exactly what this file assumes.
 *
 * Pay-as-you-go rather than pay-up-front because Apple rejects a ONE_WEEK
 * pay-up-front offer outright ("Provided duration is not supported by
 * PAY_UP_FRONT"). Over a single period of a weekly subscription the two are
 * the same charge on the same day, so nothing here or in the copy depends on
 * the distinction.
 *
 * The offer exists in the United States only. Every other storefront buys
 * `pro_weekly` at its standard price with no introductory period — which the
 * copy survives, because it never names a price or a discount, and the sheet
 * shows whatever this storefront actually offers.
 *
 * The *price* is deliberately not here and is never in copy. StoreKit
 * localises and converts it per storefront, and a hardcoded "$0.99" is wrong
 * in every country that does not use dollars and stale the day the tier
 * changes. The RevenueCat sheet one tap away is the only thing that knows it.
 */
export const INTRO_DAYS = 7;

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

/**
 * Whether this customer has paid, read off a `CustomerInfo`.
 *
 * The entitlement is the answer, and the active subscriptions are the check
 * on it. Every product this app sells is Pro — there is one tier and nothing
 * else to buy — so a receipt with a live subscription and no entitlement is not
 * a customer who bought something lesser, it is a product that was never
 * attached to the entitlement in the dashboard. That is exactly what shipped:
 * `pro_weekly` was created for the discount offering on 2026-08-24 and left
 * off `pro`, so every trial started from the second paywall was a purchase
 * StoreKit honoured and the app did not. The buyer finished onboarding, killed
 * the app, and was walled on the next launch by a screen whose buy button then
 * told them they were already subscribed.
 *
 * So a live subscription counts, and the mismatch is reported rather than
 * silently papered over: `entitlement_missing` names the products, which is
 * the one line the dashboard needs to be fixed from.
 */
export function proFrom(info: CustomerInfo): boolean {
  if (info.entitlements.active[ENTITLEMENT] !== undefined) return true;
  const subscribed = info.activeSubscriptions ?? [];
  if (subscribed.length === 0) return false;
  const products = [...subscribed].sort().join(",");
  // Once per product set per process: the customer-info listener fires on every
  // refresh, and one line in the dashboard is the finding, not a hundred.
  if (!reportedMissing.has(products)) {
    reportedMissing.add(products);
    track("entitlement_missing", { products });
  }
  return true;
}

const reportedMissing = new Set<string>();

/**
 * Whether this customer has paid, or `null` when the store could not say.
 *
 * `null` is not `false`. The SDK throws for "no key in this bundle", "no
 * network and no cached receipt" and "native module missing", and none of
 * those is a customer who declined to pay. The launch wall reads the
 * difference — `isLocked` takes `null` and declines to lock on it — because a
 * subscriber with no signal at launch must not be shown a paywall for the
 * thing they are paying for. Screens that gate a single feature may still
 * treat `null` as "not yet" and offer the sheet; the sheet itself checks the
 * entitlement before it shows anything.
 */
export async function isPro(): Promise<boolean | null> {
  try {
    const info = await Purchases.getCustomerInfo();
    return proFrom(info);
  } catch {
    return null;
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
 *
 * The timer only reports a stall the app was actually awake for. StoreKit will
 * not put a sheet over a backgrounded app, so a user who switches away mid-wait
 * comes back to a paywall that presents on the next foreground — which is a
 * slow sheet, not a missing one. On 2026-09-03 one user produced exactly that:
 * `paywall_shown` at 02:51:47, this timer at 02:51:55, background at 02:52:47,
 * foreground at 02:54:50, and `paywall_presented` three seconds later. Counting
 * that as a stall is what made a fixed paywall read as still broken. So a
 * backgrounded app suppresses the report rather than delaying it: the question
 * this event answers is "was the app alive and waiting", and an app in the
 * background was not.
 */
function withStallWatch<T>(offering: string, presenting: Promise<T>): Promise<T> {
  // Sampled at the tap, not inside the timer: a sheet asked for while the app
  // was already on its way out has never had a foreground to appear in.
  let awake = AppState.currentState === "active";
  const backgrounded = AppState.addEventListener("change", (next) => {
    if (next !== "active") awake = false;
  });
  const timer = setTimeout(() => {
    if (!awake) return;
    track("paywall_stalled", { offering, ms: STALL_MS });
  }, STALL_MS);
  return presenting.finally(() => {
    clearTimeout(timer);
    backgrounded.remove();
  });
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
    let outcome: PaywallOutcome =
      result === PAYWALL_RESULT.PURCHASED || result === PAYWALL_RESULT.RESTORED
        ? "purchased"
        : result === PAYWALL_RESULT.CANCELLED
          ? "dismissed"
          : "unavailable";
    if (result === PAYWALL_RESULT.RESTORED) {
      // The sheet says RESTORED whenever its restore link was tapped, not
      // when a receipt came back with something on it. A new install tapping
      // it out of curiosity holds nothing, and counting that as a purchase
      // ended onboarding as a trial and reported a subscriber who did not
      // exist. Only a live entitlement makes a restore a purchase; anything
      // else is the sheet being closed.
      if ((await isPro()) !== true) outcome = "dismissed";
    }
    track("paywall_closed", { offering, outcome, result });
    // The sheet's word is StoreKit's word: the charge went through. Whether
    // the app now thinks so is a separate question, and the one this module
    // got wrong for two weeks — a product missing from the entitlement makes a
    // purchase that succeeds and unlocks nothing. Still `purchased`, because
    // the customer paid and the launch path grants a live subscription anyway;
    // the report is so the dashboard mistake is seen the day it is made rather
    // than the day a subscriber writes in.
    if (result === PAYWALL_RESULT.PURCHASED) {
      const pro = await isPro();
      if (pro !== true) track("purchase_without_entitlement", { offering, pro });
    }
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
  return proFrom(info);
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
