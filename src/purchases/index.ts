import { AppState } from "react-native";
import Purchases, {
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOffering,
} from "react-native-purchases";
import RevenueCatUI, { type CustomerCenterCallbacks } from "react-native-purchases-ui";
import { track } from "../analytics";

/**
 * The offering the exit screen and the wall sell from, and the only one that
 * undercuts the standard prices.
 *
 * It carries one package: a yearly plan at a lower price than the standard
 * offering's yearly. It used to carry `pro_weekly` with a $0.99 introductory
 * week, and that was the wrong shape twice over. On the App Store an
 * introductory offer is attached to a *product* and applied by StoreKit to
 * any eligible buyer, so the same product on the first paywall showed the
 * intro there too and the second screen had nothing left to offer. And a
 * cheap week that renews weekly is a worse deal than it reads.
 *
 * A separate product at a plain lower price has no eligibility rule for
 * StoreKit to apply and no renewal surprise. The gap between the two yearly
 * prices is read off the two offerings in `plans.ts` (`compareAt`); no price
 * is in copy, because StoreKit localises both per storefront and a hardcoded
 * figure is wrong in every country that does not use dollars.
 */
export const DISCOUNT_OFFERING = "discount";

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
 * Nothing may present the paywall without this. `presentPaywall` routes to
 * the `/paywall` screen through `openPaywall`, which reaches `Purchases.shared`
 * on the native side, and reading that singleton before `configure` is a
 * Swift `fatalError`: the process is killed, no JavaScript exception is ever
 * raised, and the app "just closes" on the tap.
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

/**
 * The entitlement gate: shows the paywall only to a customer who is not Pro,
 * and answers whether they are Pro afterwards. Used by every feature that is
 * gated on the subscription (add a second vehicle, intervals, fuel insights).
 *
 * The paywall is the app's own screen now (`app/paywall.tsx`), reached
 * through the promise bridge in `src/paywall/present`, so this still reads as
 * "await the sheet" at every call site.
 */
export async function presentPaywall(source = "gate"): Promise<boolean> {
  if (!(await configured())) return false;
  if ((await isPro()) === true) return true;
  const { openPaywall } = await import("../paywall/present");
  return (await openPaywall("default", source)) === "purchased";
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
export const STALL_MS = 8000;

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
export function withStallWatch<T>(offering: string, presenting: Promise<T>): Promise<T> {
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
 * Opens a specific offering's paywall, or the default when no identifier is
 * given. Unlike `presentPaywall` this does not check the entitlement first:
 * the onboarding screens navigate here on purpose, and a screen that shows
 * nothing is a dead end.
 *
 * `paywall_shown` is emitted by the screen on mount, `paywall_presented` when
 * it has prices to draw, `paywall_closed` by `buy` or by the screen's own
 * close, so the funnel keeps its shape.
 */
export async function presentOffering(
  identifier?: string,
  source = "offer"
): Promise<PaywallOutcome> {
  const offering = identifier === DISCOUNT_OFFERING ? "discount" : "default";
  if (!(await configured())) {
    track("paywall_unconfigured", { offering: identifier ?? "current" });
    return "unavailable";
  }
  const { openPaywall } = await import("../paywall/present");
  return openPaywall(offering, source);
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

/**
 * Hands an existing subscription back to an install that has lost it.
 *
 * The event fires here rather than at the four call sites because a restore is
 * one thing wherever it is tapped, and because the thing it must never again
 * be confused with is a sale. `subscription_success` used to cover both: every
 * successful restore — a reinstall by one of the two real subscribers, a
 * family-shared entitlement, a sandbox tester — was booked as a new
 * subscription, and the funnel reported numbers the store ledger flatly denied.
 * A restore adds no revenue and no subscriber. It has its own name.
 */
export async function restore(): Promise<boolean> {
  const info = await Purchases.restorePurchases();
  const found = proFrom(info);
  if (found) track("subscription_restored");
  return found;
}

/**
 * The only way out of a subscription from inside the app.
 *
 * `presentPaywall` routes to the app's own paywall screen, which does nothing
 * once the entitlement is active, correct for gating, but it left a subscriber
 * with no route to switch between monthly and annual, to cancel, or even to
 * see what they were paying for. Customer Center is RevenueCat's native sheet
 * for all of that; its contents are configured in the dashboard rather than
 * built here.
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
