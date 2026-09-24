import { useCallback, useEffect, useState } from "react";
import Purchases, {
  INTRO_ELIGIBILITY_STATUS,
  type PurchasesOffering,
  type PurchasesPackage,
} from "react-native-purchases";
import { track } from "../analytics";
import { DISCOUNT_OFFERING, isPro, withStallWatch } from "./index";
import { getLanguage } from "../i18n";

/**
 * The price list, shaped for the screens that draw it.
 *
 * The RevenueCat sheet used to do all of this: fetch the offering, read the
 * store's price strings, decide whether this customer gets the introductory
 * week, and put a button on it. The sheet is gone (see the 2026-09-16 design)
 * and the app draws the list itself, so the arithmetic the sheet did for free
 * lives here, once, and every paywall in the app reads the same numbers.
 *
 * Nothing here knows a price. `price` and `priceString` are what StoreKit
 * returned for this storefront; `perWeek`, `perMonth` and `savePct` are
 * derived from `price` and formatted in the product's own currency. A yearly
 * plan reads "$1.54 per week" in Ohio and "£1.54 per week" in Leeds without a
 * figure in the catalog, and it stays right the day the tier changes.
 */

export type PlanPeriod = "week" | "month" | "year";

export type Plan = {
  /** The package identifier, e.g. "$rc_annual". Stable across storefronts. */
  id: string;
  period: PlanPeriod;
  package: PurchasesPackage;
  /** StoreKit's localised standard price, e.g. "£79.99". */
  priceString: string;
  price: number;
  currency: string;
  /** The introductory price, only when this customer is eligible for it. */
  intro: { priceString: string; price: number; periods: number } | null;
  /** The standard price per week and per month, in the product's currency. */
  perWeek: string;
  perMonth: string;
  /** Saving against the weekly plan of the same offering, whole percent.
   *  Undefined on the weekly plan and when there is no weekly plan. */
  savePct?: number;
  /** The standard offering's plan of the same period that this one
   *  undercuts: its price, struck through beside this plan's own price, and
   *  the saving between the two. Set only on the discount offering; undefined
   *  when the standard offering has no plan of the same period, or it is not
   *  dearer. */
  compareAt?: { priceString: string; price: number; pct: number };
};

export type OfferingId = "default" | "discount";

const WEEKS_PER_YEAR = 52;
const WEEKS_PER_MONTH = WEEKS_PER_YEAR / 12;
const ORDER: PlanPeriod[] = ["year", "month", "week"];

/** ISO 8601 subscription period → the three periods the app sells. Anything
 *  else (a six-month plan, a lifetime product) is not a plan the picker can
 *  label honestly, and is dropped rather than guessed at. */
function periodOf(iso: string | null): PlanPeriod | null {
  switch (iso) {
    case "P1W":
    case "P7D":
      return "week";
    case "P1M":
      return "month";
    case "P1Y":
    case "P12M":
      return "year";
    default:
      return null;
  }
}

/** Weekly cost of a plan at its standard price. */
function weeklyPrice(price: number, period: PlanPeriod): number {
  if (period === "week") return price;
  if (period === "month") return price / WEEKS_PER_MONTH;
  return price / WEEKS_PER_YEAR;
}

const formatters: Record<string, Intl.NumberFormat> = {};
/**
 * A derived price in the product's currency.
 *
 * Falls back to the number with the code beside it when the runtime has no
 * currency data for the pair, the same way `formatMoney` does: Hermes ships a
 * reduced ICU, and a throw here rejected the whole offering, which left the
 * paywall on "Retry" with nothing to sell.
 */
function money(locale: string, currency: string, value: number): string {
  const key = `${locale}|${currency}`;
  try {
    formatters[key] ??= new Intl.NumberFormat(locale, { style: "currency", currency });
    return formatters[key].format(value);
  } catch {
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)} ${currency}`;
  }
}

/**
 * Shapes one offering's packages into plans, ordered year → month → week.
 *
 * `eligible` is the set of product identifiers this customer may buy at the
 * introductory price. It is a set rather than a lookup because the caller
 * has already resolved StoreKit's three-state answer (see `loadPlans`).
 */
export function shapePlans(
  offering: PurchasesOffering,
  eligible: Set<string>,
  locale: string
): Plan[] {
  const plans: Plan[] = [];
  for (const pack of offering.availablePackages) {
    const product = pack.product;
    const period = periodOf(product.subscriptionPeriod);
    if (!period) continue;
    const currency = product.currencyCode;
    const intro =
      product.introPrice && eligible.has(product.identifier)
        ? {
            priceString: product.introPrice.priceString,
            price: product.introPrice.price,
            periods: product.introPrice.cycles,
          }
        : null;
    plans.push({
      id: pack.identifier,
      period,
      package: pack,
      priceString: product.priceString,
      price: product.price,
      currency,
      intro,
      perWeek: money(locale, currency, weeklyPrice(product.price, period)),
      perMonth: money(locale, currency, weeklyPrice(product.price, period) * WEEKS_PER_MONTH),
    });
  }
  plans.sort((a, b) => ORDER.indexOf(a.period) - ORDER.indexOf(b.period));

  const weekly = plans.find((p) => p.period === "week");
  if (weekly) {
    for (const plan of plans) {
      if (plan.period === "week") continue;
      const pct = Math.round((1 - weeklyPrice(plan.price, plan.period) / weekly.price) * 100);
      if (pct > 0) plan.savePct = pct;
    }
  }
  return plans;
}

/** The event-property name for an offering, kept as the sheet reported it so
 *  the funnel keeps comparing to itself: "current" for the default. */
function offeringLabel(offering: OfferingId): string {
  return offering === "default" ? "current" : DISCOUNT_OFFERING;
}

/**
 * One fetch per process, shared by every paywall. `_layout` calls
 * `prefetchPlans` at boot, so by the time a screen mounts the promise has
 * usually settled and the picker draws on its first frame. The sheet this
 * replaces fetched on the tap and took a median 3.5 s to appear.
 *
 * A failed fetch is not cached: the next screen asks again, because "no
 * network at boot" must not become "no prices for the rest of the session".
 */
let inflight: { locale: string; promise: Promise<Record<OfferingId, Plan[] | null>> } | null = null;
let cached: { locale: string; plans: Record<OfferingId, Plan[] | null> } | null = null;

export function resetPlansForTests(): void {
  inflight = null;
  cached = null;
}

/**
 * Which products this customer may buy at their introductory price.
 *
 * StoreKit answers ELIGIBLE, INELIGIBLE, UNKNOWN or NO_INTRO_OFFER_EXISTS.
 * UNKNOWN (offline, or a storefront that has not answered yet) is treated as
 * eligible: StoreKit applies the offer itself at purchase time, so showing it
 * to someone who turns out ineligible costs a surprised glance at Apple's
 * sheet, and hiding it from someone eligible costs the conversion. A call
 * that throws outright is the same "we could not ask" case as UNKNOWN, so it
 * is treated the same way rather than as a blanket ineligibility.
 */
async function eligibleProducts(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  try {
    const answer = await Purchases.checkTrialOrIntroductoryPriceEligibility(ids);
    const eligible = new Set<string>();
    for (const id of ids) {
      const status = answer[id]?.status;
      if (
        status === INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_ELIGIBLE ||
        status === INTRO_ELIGIBILITY_STATUS.INTRO_ELIGIBILITY_STATUS_UNKNOWN
      ) {
        eligible.add(id);
      }
    }
    return eligible;
  } catch {
    return new Set(ids);
  }
}

/** An offering with no package the picker can label honestly is the same as
 *  no offering at all: `defaultPlan` and every screen that reads `plans[0]`
 *  need "nothing to draw", not an empty array they would have to check for
 *  separately. */
function usable(plans: Plan[]): Plan[] | null {
  return plans.length > 0 ? plans : null;
}

/**
 * The exit screen sells a yearly plan for less than the first screen asked,
 * and the argument is the gap — shown in the unit Apple's sheet will charge.
 * The standard yearly is struck through beside the discount yearly, and the
 * saving is between the two: "$79.99" struck, "$29.99 per year", "63% off".
 *
 * It used to compare per week: the standard weekly struck beside the yearly's
 * weekly cost, "$3.99" over "$0.58 per week", "86% off". The tap rate was fine
 * and the sheet killed it — Apple then asked for $29.99 up front, and nine in
 * ten who tapped backed out in a few seconds (2026-09-19→24: 5/51 paid, against
 * 8/19 on the full-price screen). A figure the sheet does not repeat is a
 * figure that reads as a trick the moment the sheet appears.
 *
 * A discount plan with no standard plan of its own period, or one nothing
 * standard is dearer than, gets no strike-through: the screen shows a plain
 * price rather than a comparison across two bases.
 */
export function markCompareAt(discount: Plan[], standard: Plan[] | null): Plan[] {
  if (!standard) return discount;
  for (const plan of discount) {
    const full = standard.find((p) => p.period === plan.period && p.currency === plan.currency);
    if (!full || full.price <= plan.price) continue;
    plan.compareAt = {
      priceString: full.priceString,
      price: full.price,
      pct: Math.round((1 - plan.price / full.price) * 100),
    };
  }
  return discount;
}

async function fetchAll(locale: string): Promise<Record<OfferingId, Plan[] | null>> {
  const offerings = await Purchases.getOfferings();
  const def = offerings.current;
  const disc = offerings.all[DISCOUNT_OFFERING] ?? null;
  const withIntro = [def, disc]
    .flatMap((o) => o?.availablePackages ?? [])
    .filter((p) => p.product.introPrice)
    .map((p) => p.product.identifier);
  const eligible = await eligibleProducts(Array.from(new Set(withIntro)));
  const standard = def ? usable(shapePlans(def, eligible, locale)) : null;
  return {
    default: standard,
    discount: disc ? usable(markCompareAt(shapePlans(disc, eligible, locale), standard)) : null,
  };
}

/**
 * The plans for one offering, or null when the store could not answer.
 *
 * Wrapped in the stall watchdog so a fetch that hangs while the app is awake
 * reports `paywall_stalled` exactly as a sheet that never came up did; the
 * event keeps its meaning, "the user tapped and nothing arrived".
 *
 * `silent` is for the boot-time warm-up: nobody asked for a paywall yet, so a
 * failure here is not the user's "tapped and nothing arrived" moment and must
 * not wear the stall watchdog or `paywall_unavailable`. Screens always call
 * with reporting on.
 */
export async function loadPlans(
  offering: OfferingId,
  locale: string = getLanguage(),
  options: { silent?: boolean } = {}
): Promise<Plan[] | null> {
  const silent = options.silent ?? false;
  const label = offeringLabel(offering);
  // A `null` for the requested offering is not cached: it means the store
  // has not (yet) got this offering, and the next call — typically the
  // screen's own "Try again" — must ask again rather than replay the same
  // null for the rest of the session.
  const stale = !cached || cached.locale !== locale || cached.plans[offering] === null;
  if (stale) {
    try {
      // One fetch shared by concurrent callers of the *same* locale; a
      // concurrent call for a different locale starts its own fetch rather
      // than reusing one, so it never caches another locale's prices.
      // Cleared in `finally` so a failure is retried by the next call rather
      // than cached as null.
      if (!inflight || inflight.locale !== locale) {
        const attempt = fetchAll(locale);
        inflight = { locale, promise: silent ? attempt : withStallWatch(label, attempt) };
      }
      const request = inflight;
      const plans = await request.promise;
      cached = { locale, plans };
    } catch {
      if (!silent) track("paywall_unavailable", { offering: label });
      return null;
    } finally {
      if (inflight?.locale === locale) inflight = null;
    }
  }
  const plans = cached!.plans[offering];
  if (!plans && !silent) track("paywall_unavailable", { offering: label });
  return plans;
}

/** Fire-and-forget warm-up for the boot sequence. Never throws, and never
 *  reports: nobody has asked for a paywall yet, so a failed warm-up is not
 *  the "tapped and nothing arrived" event `paywall_unavailable` describes. */
export function prefetchPlans(): void {
  void loadPlans("default", undefined, { silent: true }).catch(() => {});
}

/**
 * The plans for a screen. `loading` is true only while nothing has answered
 * yet; a `null` with `loading` false is a store that could not, and `retry`
 * asks again.
 */
export function usePlans(offering: OfferingId): {
  plans: Plan[] | null;
  loading: boolean;
  retry: () => void;
} {
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    setLoading(true);
    loadPlans(offering).then((result) => {
      if (!live) return;
      setPlans(result);
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [offering, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { plans, loading, retry };
}

export type PurchaseResult = "purchased" | "dismissed" | "unavailable";

/**
 * Buys one plan through the SDK. Apple's own payment sheet still appears;
 * what is gone is RevenueCat's list in front of it.
 *
 * The outcome vocabulary and the entitlement check are the sheet's, moved:
 * a purchase StoreKit honoured that the entitlement does not reflect is still
 * `purchased` (the customer paid; the launch path grants a live subscription
 * anyway) and is reported so the dashboard mistake is seen the day it is made.
 */
export async function buy(plan: Plan, offering: OfferingId): Promise<PurchaseResult> {
  const label = offeringLabel(offering);
  track("paywall_purchase_started", { offering: label, plan: plan.id });
  try {
    await Purchases.purchasePackage(plan.package);
  } catch (error) {
    const cancelled = (error as { userCancelled?: boolean | null })?.userCancelled === true;
    const outcome: PurchaseResult = cancelled ? "dismissed" : "unavailable";
    track("paywall_closed", {
      offering: label,
      outcome,
      result: cancelled ? "CANCELLED" : "ERROR",
      plan: plan.id,
    });
    return outcome;
  }
  track("paywall_closed", { offering: label, outcome: "purchased", result: "PURCHASED", plan: plan.id });
  const pro = await isPro();
  if (pro !== true) track("purchase_without_entitlement", { offering: label, pro });
  // The sale, reported from the transaction that made it and from nowhere
  // else. It used to be a mount effect on `/subscribed`, which is a screen and
  // not a purchase: a restore routed there too, and the effect re-ran whenever
  // the plan it drew recomputed. Seven people and thirteen events stood for
  // two subscriptions. StoreKit has now honoured this purchase, so this fires
  // once per sale, and `pro` carries the entitlement disagreement rather than
  // suppressing the event — a sale the dashboard cannot see is still a sale.
  track("subscription_success", { offering: label, plan: plan.id, pro });
  return "purchased";
}
