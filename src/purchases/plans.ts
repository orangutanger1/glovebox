import { AppState } from "react-native";
import Purchases, {
  INTRO_ELIGIBILITY_STATUS,
  type PurchasesOffering,
  type PurchasesPackage,
} from "react-native-purchases";
import { track } from "../analytics";

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
function money(locale: string, currency: string, value: number): string {
  const key = `${locale}|${currency}`;
  formatters[key] ??= new Intl.NumberFormat(locale, { style: "currency", currency });
  return formatters[key].format(value);
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
