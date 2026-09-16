# Custom Paywall Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the RevenueCat paywall sheet with an in-app price list drawn in the app's own design system, on both onboarding money screens and one full-screen route every other call site opens, while purchases keep going through the RevenueCat SDK.

**Architecture:** `src/purchases/plans.ts` loads offerings once, shapes packages into `Plan`s with derived per-week / per-month / save-% figures and intro eligibility, and buys through `Purchases.purchasePackage`. `src/paywall/` holds the pure UI (`PlanPicker`, `BuyFooter`, `ReviewCard`) and a promise bridge (`present.ts`) so `presentPaywall()` / `presentOffering()` keep their signatures but push a `/paywall` route. The two onboarding screens embed the picker inline.

**Tech Stack:** Expo 57 / React Native 0.86, TypeScript, expo-router, react-native-purchases (SDK only; `react-native-purchases-ui` stays for Customer Center), Jest (ts-jest `logic` project for `.test.ts`, jest-expo `screens` project for `.test.tsx`).

**Spec:** `docs/superpowers/specs/2026-09-16-custom-paywall-design.md`

## Global Constraints

- **No price, trial length or discount percentage in copy.** Every figure comes from StoreKit via the SDK (`priceString`, `introPrice.priceString`) or is arithmetic on `product.price` formatted with `Intl.NumberFormat`.
- **No em dashes (—) or en dashes (–) in any app copy.** `tests/onboarding-screens.test.tsx` renders every onboarding screen and fails on either. Use a colon, full stop or comma.
- **Typographic apostrophe U+2019 (’)**, never ASCII `'`, in copy.
- **16 locales.** Every new key goes into `src/i18n/catalog/en/*.ts` and the 10 full catalogs (`de fr it es ptBR nl sv pl ja ko`) with real translations. Regional overlays (`enGB enAU enCA frCA esMX`) only override keys that exist. `tests/i18n.test.ts` enforces key and placeholder parity. Exception: `paywall.review.quote` is a quotation and is identical English in every catalog.
- **Nothing that would not survive being checked.** No countdowns, no "one time", no "lowest price ever", no invented counts.
- **Event names are unchanged** (`paywall_shown`, `paywall_presented`, `paywall_closed`, `paywall_stalled`, `paywall_unavailable`, `paywall_unconfigured`, `restore_attempted`, `offer_declined`, `purchase_without_entitlement`). Two new: `paywall_plan_selected`, `paywall_purchase_started`.
- `PaywallOutcome` stays `"purchased" | "dismissed" | "unavailable"`.
- Primary buttons are white (`Button` variant `primary`). Red is for overdue only; the selection ring uses `tokens.color.hairlineLit`, the "Best value" and "Save" chips use `tokens.color.green` on `greenWash`.
- Press feedback is scale 0.97 over 120 ms (`PressableScale` / `usePressScale`). No opacity-only feedback.
- Run one project: `npx jest --selectProjects logic --testPathPattern <name>` or `--selectProjects screens`. Whole suite: `npx jest`. Type check: `npx tsc --noEmit`.
- Commit after every task. Conventional Commits, subject ≤ 50 chars.
- Do not edit `src/analytics/index.ts`.

---

### Task 1: Shape offerings into plans — `src/purchases/plans.ts` (pure part)

**Files:**
- Create: `src/purchases/plans.ts`
- Test: `tests/plans.test.ts`

**Interfaces:**
- Consumes: `PurchasesOffering`, `PurchasesPackage` types from `react-native-purchases`.
- Produces:
  ```ts
  export type PlanPeriod = "week" | "month" | "year";
  export type Plan = {
    id: string; period: PlanPeriod; package: PurchasesPackage;
    priceString: string; price: number; currency: string;
    intro: { priceString: string; price: number; periods: number } | null;
    perWeek: string; perMonth: string; savePct?: number;
  };
  export type OfferingId = "default" | "discount";
  export function shapePlans(offering: PurchasesOffering, eligible: Set<string>, locale: string): Plan[];
  ```

- [ ] **Step 1: Write the failing tests**

`tests/plans.test.ts`:

```ts
// Shaping is arithmetic on what StoreKit hands back. No SDK is reached here;
// the offering is a fixture, and `react-native-purchases` is stubbed so the
// module can be imported under ts-jest.
jest.mock("react-native-purchases", () => ({
  __esModule: true,
  default: {},
  INTRO_ELIGIBILITY_STATUS: {
    INTRO_ELIGIBILITY_STATUS_UNKNOWN: 0,
    INTRO_ELIGIBILITY_STATUS_INELIGIBLE: 1,
    INTRO_ELIGIBILITY_STATUS_ELIGIBLE: 2,
    INTRO_ELIGIBILITY_STATUS_NO_INTRO_OFFER_EXISTS: 3,
  },
}));
jest.mock("react-native", () => ({
  AppState: { currentState: "active", addEventListener: () => ({ remove() {} }) },
}));
jest.mock("../src/analytics", () => ({ track: jest.fn() }));

import type { PurchasesOffering, PurchasesPackage } from "react-native-purchases";
import { shapePlans } from "../src/purchases/plans";

function pkg(
  identifier: string,
  product: {
    identifier: string;
    price: number;
    priceString: string;
    currencyCode: string;
    subscriptionPeriod: string;
    introPrice?: { price: number; priceString: string; cycles: number };
  }
): PurchasesPackage {
  return {
    identifier,
    packageType: "CUSTOM",
    presentedOfferingContext: { offeringIdentifier: "x", placementIdentifier: null, targetingContext: null },
    offeringIdentifier: "x",
    product: {
      title: identifier,
      description: "",
      discounts: null,
      productCategory: null,
      productType: "AUTO_RENEWABLE_SUBSCRIPTION",
      pricePerWeek: null,
      pricePerMonth: null,
      pricePerYear: null,
      pricePerWeekString: null,
      pricePerMonthString: null,
      pricePerYearString: null,
      defaultOption: null,
      subscriptionOptions: null,
      presentedOfferingIdentifier: null,
      presentedOfferingContext: null,
      introPrice: product.introPrice
        ? {
            ...product.introPrice,
            period: "P1W",
            periodUnit: "WEEK",
            periodNumberOfUnits: 1,
          }
        : null,
      ...product,
    },
  } as unknown as PurchasesPackage;
}

function offering(packages: PurchasesPackage[]): PurchasesOffering {
  return {
    identifier: "default",
    serverDescription: "",
    metadata: {},
    availablePackages: packages,
    lifetime: null,
    annual: null,
    sixMonth: null,
    threeMonth: null,
    twoMonth: null,
    monthly: null,
    weekly: null,
  } as unknown as PurchasesOffering;
}

const USD = offering([
  pkg("$rc_weekly", { identifier: "pro_weekly", price: 2.99, priceString: "$2.99", currencyCode: "USD", subscriptionPeriod: "P1W" }),
  pkg("$rc_annual", { identifier: "pro_annual", price: 79.99, priceString: "$79.99", currencyCode: "USD", subscriptionPeriod: "P1Y" }),
  pkg("$rc_monthly", { identifier: "pro_monthly", price: 9.99, priceString: "$9.99", currencyCode: "USD", subscriptionPeriod: "P1M" }),
]);

test("plans come out year, month, week regardless of package order", () => {
  expect(shapePlans(USD, new Set(), "en-US").map((p) => p.period)).toEqual(["year", "month", "week"]);
});

test("per-week and per-month figures are arithmetic on the store price", () => {
  const [year, month, week] = shapePlans(USD, new Set(), "en-US");
  expect(year.perWeek).toBe("$1.54"); // 79.99 / 52
  expect(year.perMonth).toBe("$6.67"); // 79.99 / 12
  expect(month.perWeek).toBe("$2.31"); // 9.99 / (52 / 12)
  expect(month.perMonth).toBe("$9.99");
  expect(week.perWeek).toBe("$2.99");
  expect(week.perMonth).toBe("$12.96"); // 2.99 * 52 / 12
});

test("saving is against the weekly plan, whole percent, absent on weekly itself", () => {
  const [year, month, week] = shapePlans(USD, new Set(), "en-US");
  expect(year.savePct).toBe(49); // 1 - 79.99 / (2.99 * 52)
  expect(month.savePct).toBe(23); // 1 - 9.99 / (2.99 * 52 / 12)
  expect(week.savePct).toBeUndefined();
});

test("with no weekly plan there is no saving to claim", () => {
  const two = offering(USD.availablePackages.filter((p) => p.identifier !== "$rc_weekly"));
  for (const plan of shapePlans(two, new Set(), "en-US")) expect(plan.savePct).toBeUndefined();
});

test("formats in the product's currency, not the phone's, and honours zero-decimal currencies", () => {
  const jpy = offering([
    pkg("$rc_annual", { identifier: "pro_annual", price: 12000, priceString: "¥12,000", currencyCode: "JPY", subscriptionPeriod: "P1Y" }),
  ]);
  const [year] = shapePlans(jpy, new Set(), "en-US");
  expect(year.perMonth).toBe("¥1,000");
  const gbp = offering([
    pkg("$rc_annual", { identifier: "pro_annual", price: 79.99, priceString: "£79.99", currencyCode: "GBP", subscriptionPeriod: "P1Y" }),
  ]);
  expect(shapePlans(gbp, new Set(), "en-GB")[0].perWeek).toBe("£1.54");
});

test("the intro price rides only when this product is eligible", () => {
  const discount = offering([
    pkg("$rc_weekly", {
      identifier: "pro_weekly",
      price: 2.99,
      priceString: "$2.99",
      currencyCode: "USD",
      subscriptionPeriod: "P1W",
      introPrice: { price: 0.99, priceString: "$0.99", cycles: 1 },
    }),
  ]);
  expect(shapePlans(discount, new Set(["pro_weekly"]), "en-US")[0].intro).toEqual({
    priceString: "$0.99",
    price: 0.99,
    periods: 1,
  });
  expect(shapePlans(discount, new Set(), "en-US")[0].intro).toBeNull();
});

test("a package whose period cannot be read is left out rather than mislabelled", () => {
  const odd = offering([
    pkg("$rc_lifetime", { identifier: "pro_life", price: 199, priceString: "$199", currencyCode: "USD", subscriptionPeriod: null as unknown as string }),
    pkg("$rc_annual", { identifier: "pro_annual", price: 79.99, priceString: "$79.99", currencyCode: "USD", subscriptionPeriod: "P1Y" }),
  ]);
  expect(shapePlans(odd, new Set(), "en-US").map((p) => p.id)).toEqual(["$rc_annual"]);
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx jest --selectProjects logic --testPathPattern plans`
Expected: FAIL — `Cannot find module '../src/purchases/plans'`.

- [ ] **Step 3: Write the pure module**

`src/purchases/plans.ts`:

```ts
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
```

The `AppState`, `Purchases`, `INTRO_ELIGIBILITY_STATUS` and `track` imports are unused until Task 2. Leave them: ts-jest reports unused imports as warnings, not errors, and `tsc --noEmit` is run in Task 9 after they are used. If the project's `tsconfig` has `noUnusedLocals`, add the three usages from Task 2 Step 3 now instead of leaving them.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx jest --selectProjects logic --testPathPattern plans`
Expected: PASS, 7 tests. If `$1.54`-style expectations fail by a cent, print the value; the fixture prices divide as listed (79.99/52 = 1.538 → 1.54; 9.99/4.333 = 2.305 → 2.31; 2.99·52/12 = 12.957 → 12.96) and `Intl` rounds half-even on some engines. Adjust only the test's expected string to what `Intl` on this runtime prints, never the arithmetic.

- [ ] **Step 5: Commit**

```bash
git add src/purchases/plans.ts tests/plans.test.ts
git commit -m "feat(purchases): shape offerings into plans"
```

---

### Task 2: Load, cache, buy — the rest of `src/purchases/plans.ts`

**Files:**
- Modify: `src/purchases/plans.ts`
- Modify: `src/purchases/index.ts` (export `withStallWatch`, `STALL_MS`; nothing else yet)
- Test: `tests/plans.test.ts` (append)

**Interfaces:**
- Consumes: `withStallWatch(offering: string, p: Promise<T>): Promise<T>` from `src/purchases/index.ts` (made exported here); `isPro()` and `DISCOUNT_OFFERING` from the same file; `track` from `src/analytics`.
- Produces:
  ```ts
  export function loadPlans(offering: OfferingId, locale?: string): Promise<Plan[] | null>;
  export function prefetchPlans(): void;
  export function usePlans(offering: OfferingId): { plans: Plan[] | null; loading: boolean; retry: () => void };
  export type PurchaseResult = "purchased" | "dismissed" | "unavailable";
  export function buy(plan: Plan, offering: OfferingId): Promise<PurchaseResult>;
  export function resetPlansForTests(): void;
  ```

- [ ] **Step 1: Export the stall watchdog**

In `src/purchases/index.ts`, change `const STALL_MS = 8000;` to `export const STALL_MS = 8000;` and `function withStallWatch<T>(` to `export function withStallWatch<T>(`. Nothing else in that file changes in this task.

- [ ] **Step 2: Append the failing tests**

Append to `tests/plans.test.ts`. First, extend the mock at the top of the file so `Purchases` has the three static methods, by replacing the existing `jest.mock("react-native-purchases", …)` block with:

```ts
const getOfferings = jest.fn();
const checkEligibility = jest.fn();
const purchasePackage = jest.fn();
const getCustomerInfo = jest.fn();
jest.mock("react-native-purchases", () => ({
  __esModule: true,
  default: {
    getOfferings: () => getOfferings(),
    checkTrialOrIntroductoryPriceEligibility: (ids: string[]) => checkEligibility(ids),
    purchasePackage: (p: unknown) => purchasePackage(p),
    getCustomerInfo: () => getCustomerInfo(),
    isConfigured: async () => true,
  },
  INTRO_ELIGIBILITY_STATUS: {
    INTRO_ELIGIBILITY_STATUS_UNKNOWN: 0,
    INTRO_ELIGIBILITY_STATUS_INELIGIBLE: 1,
    INTRO_ELIGIBILITY_STATUS_ELIGIBLE: 2,
    INTRO_ELIGIBILITY_STATUS_NO_INTRO_OFFER_EXISTS: 3,
  },
}));
```

and change the analytics mock to capture calls:

```ts
const mockTrack = jest.fn();
jest.mock("../src/analytics", () => ({ track: (e: string, p?: unknown) => mockTrack(e, p) }));
```

Add `loadPlans, buy, resetPlansForTests` to the import from `../src/purchases/plans`. Then append:

```ts
const DISCOUNT = offering([
  pkg("$rc_weekly", {
    identifier: "pro_weekly",
    price: 2.99,
    priceString: "$2.99",
    currencyCode: "USD",
    subscriptionPeriod: "P1W",
    introPrice: { price: 0.99, priceString: "$0.99", cycles: 1 },
  }),
]);
(DISCOUNT as { identifier: string }).identifier = "discount";

const PRO = { entitlements: { active: { pro: {} } }, activeSubscriptions: ["pro_weekly"] };
const FREE = { entitlements: { active: {} }, activeSubscriptions: [] };

beforeEach(() => {
  resetPlansForTests();
  mockTrack.mockReset();
  getOfferings.mockReset();
  checkEligibility.mockReset();
  purchasePackage.mockReset();
  getCustomerInfo.mockReset();
  getOfferings.mockResolvedValue({ current: USD, all: { default: USD, discount: DISCOUNT } });
  checkEligibility.mockResolvedValue({ pro_weekly: { status: 2, description: "" } });
});

describe("loadPlans", () => {
  test("reads the current offering for default and the named one for discount", async () => {
    const def = await loadPlans("default", "en-US");
    expect(def?.map((p) => p.id)).toEqual(["$rc_annual", "$rc_monthly", "$rc_weekly"]);
    const disc = await loadPlans("discount", "en-US");
    expect(disc?.map((p) => p.id)).toEqual(["$rc_weekly"]);
    expect(disc?.[0].intro?.priceString).toBe("$0.99");
  });

  test("asks the store once and answers from memory after that", async () => {
    await loadPlans("default", "en-US");
    await loadPlans("default", "en-US");
    expect(getOfferings).toHaveBeenCalledTimes(1);
  });

  test("treats an unknown eligibility as eligible and an ineligible one as not", async () => {
    checkEligibility.mockResolvedValueOnce({ pro_weekly: { status: 0, description: "" } });
    expect((await loadPlans("discount", "en-US"))?.[0].intro).not.toBeNull();
    resetPlansForTests();
    checkEligibility.mockResolvedValueOnce({ pro_weekly: { status: 1, description: "" } });
    expect((await loadPlans("discount", "en-US"))?.[0].intro).toBeNull();
  });

  test("an eligibility call that throws costs the intro, not the plans", async () => {
    checkEligibility.mockRejectedValueOnce(new Error("offline"));
    const plans = await loadPlans("discount", "en-US");
    expect(plans).toHaveLength(1);
    expect(plans?.[0].intro).toBeNull();
  });

  test("a store that cannot answer is null, reported, and asked again next time", async () => {
    getOfferings.mockRejectedValueOnce(new Error("no products"));
    expect(await loadPlans("default", "en-US")).toBeNull();
    expect(mockTrack).toHaveBeenCalledWith("paywall_unavailable", { offering: "current" });
    expect(await loadPlans("default", "en-US")).not.toBeNull();
    expect(getOfferings).toHaveBeenCalledTimes(2);
  });

  test("a missing discount offering is null and reported as unavailable", async () => {
    getOfferings.mockResolvedValue({ current: USD, all: { default: USD } });
    expect(await loadPlans("discount", "en-US")).toBeNull();
    expect(mockTrack).toHaveBeenCalledWith("paywall_unavailable", { offering: "discount" });
  });
});

describe("buy", () => {
  test("a completed purchase is purchased, with the entitlement checked", async () => {
    const [year] = (await loadPlans("default", "en-US"))!;
    purchasePackage.mockResolvedValueOnce({ customerInfo: PRO, productIdentifier: "pro_annual" });
    getCustomerInfo.mockResolvedValueOnce(PRO);
    await expect(buy(year, "default")).resolves.toBe("purchased");
    expect(purchasePackage).toHaveBeenCalledWith(year.package);
    expect(mockTrack).toHaveBeenCalledWith("paywall_purchase_started", { offering: "current", plan: "$rc_annual" });
    expect(mockTrack).toHaveBeenCalledWith("paywall_closed", {
      offering: "current",
      outcome: "purchased",
      result: "PURCHASED",
      plan: "$rc_annual",
    });
    expect(mockTrack.mock.calls.map((c) => c[0])).not.toContain("purchase_without_entitlement");
  });

  test("a purchase the entitlement does not reflect is still a purchase, and reported", async () => {
    const [year] = (await loadPlans("default", "en-US"))!;
    purchasePackage.mockResolvedValueOnce({ customerInfo: FREE, productIdentifier: "pro_annual" });
    getCustomerInfo.mockResolvedValueOnce(FREE);
    await expect(buy(year, "default")).resolves.toBe("purchased");
    expect(mockTrack).toHaveBeenCalledWith("purchase_without_entitlement", { offering: "current", pro: false });
  });

  test("the user backing out of Apple's sheet is a dismissal", async () => {
    const [year] = (await loadPlans("default", "en-US"))!;
    purchasePackage.mockRejectedValueOnce(Object.assign(new Error("cancelled"), { userCancelled: true }));
    await expect(buy(year, "default")).resolves.toBe("dismissed");
    expect(mockTrack).toHaveBeenCalledWith("paywall_closed", {
      offering: "current",
      outcome: "dismissed",
      result: "CANCELLED",
      plan: "$rc_annual",
    });
  });

  test("any other failure is unavailable", async () => {
    const [week] = (await loadPlans("discount", "en-US"))!;
    purchasePackage.mockRejectedValueOnce(new Error("store down"));
    await expect(buy(week, "discount")).resolves.toBe("unavailable");
    expect(mockTrack).toHaveBeenCalledWith("paywall_closed", {
      offering: "discount",
      outcome: "unavailable",
      result: "ERROR",
      plan: "$rc_weekly",
    });
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `npx jest --selectProjects logic --testPathPattern plans`
Expected: FAIL — `loadPlans is not a function` (and the 7 Task 1 tests still pass).

- [ ] **Step 4: Write the loading and buying half**

Append to `src/purchases/plans.ts`:

```ts
import { useCallback, useEffect, useState } from "react";
import { DISCOUNT_OFFERING, isPro, withStallWatch } from "./index";
import { getLanguage } from "../i18n";

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
let inflight: Promise<Plan[] | null> | null = null;
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
 * sheet, and hiding it from someone eligible costs the conversion.
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
    return new Set();
  }
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
  return {
    default: def ? shapePlans(def, eligible, locale) : null,
    discount: disc ? shapePlans(disc, eligible, locale) : null,
  };
}

/**
 * The plans for one offering, or null when the store could not answer.
 *
 * Wrapped in the stall watchdog so a fetch that hangs while the app is awake
 * reports `paywall_stalled` exactly as a sheet that never came up did; the
 * event keeps its meaning, "the user tapped and nothing arrived".
 */
export async function loadPlans(
  offering: OfferingId,
  locale: string = getLanguage()
): Promise<Plan[] | null> {
  const label = offeringLabel(offering);
  if (!cached || cached.locale !== locale) {
    try {
      // One fetch shared by concurrent callers; cleared in `finally` so a
      // failure is retried by the next call rather than cached as null.
      inflight ??= withStallWatch(label, fetchAll(locale));
      const plans = await inflight;
      cached = { locale, plans };
    } catch {
      track("paywall_unavailable", { offering: label });
      return null;
    } finally {
      inflight = null;
    }
  }
  const plans = cached.plans[offering];
  if (!plans) track("paywall_unavailable", { offering: label });
  return plans;
}

/** Fire-and-forget warm-up for the boot sequence. Never throws. */
export function prefetchPlans(): void {
  void loadPlans("default").catch(() => {});
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
  return "purchased";
}
```

Move the `import` lines to the top of the file with the others (imports must precede code). `getLanguage` is exported from `src/i18n/index.ts` and returns the active BCP-47 tag; if its name differs, use whatever `app/_layout.tsx` imports as `getLanguage` from `../src/i18n`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx jest --selectProjects logic --testPathPattern plans`
Expected: PASS, 17 tests. If the "asked again next time" test sees `getOfferings` called once, the `finally` is not clearing `inflight` before the second call: make sure `inflight = null` runs in `finally`, not only in `catch`.

The circular import `plans.ts` → `index.ts` → (nothing back) is one-way; `index.ts` must not import from `plans.ts` until Task 3, where it does so lazily inside a function body.

- [ ] **Step 6: Commit**

```bash
git add src/purchases/plans.ts src/purchases/index.ts tests/plans.test.ts
git commit -m "feat(purchases): load, cache and buy plans"
```

---

### Task 3: The promise bridge, and retiring the sheet — `src/paywall/present.ts`, `src/purchases/index.ts`

**Files:**
- Create: `src/paywall/present.ts`
- Modify: `src/purchases/index.ts` (`presentPaywall`, `presentOffering`, imports, the `INTRO_DAYS` docblock)
- Modify: `tests/purchases-guard.test.ts`
- Test: `tests/paywall-present.test.ts`

**Interfaces:**
- Consumes: `router` from `expo-router` (imperative `router.push`).
- Produces:
  ```ts
  // src/paywall/present.ts
  export function openPaywall(offering: OfferingId, source: string): Promise<PurchaseResult>;
  export function settlePaywall(result: PurchaseResult): void;
  export function isPaywallOpen(): boolean;
  ```
  `presentPaywall(): Promise<boolean>` and `presentOffering(identifier?: string): Promise<PaywallOutcome>` keep their signatures.

- [ ] **Step 1: Write the failing bridge tests**

`tests/paywall-present.test.ts`:

```ts
const pushed: string[] = [];
jest.mock("expo-router", () => ({ router: { push: (to: string) => pushed.push(to) } }));

import { isPaywallOpen, openPaywall, settlePaywall } from "../src/paywall/present";

beforeEach(() => {
  pushed.length = 0;
  if (isPaywallOpen()) settlePaywall("dismissed");
});

test("opening pushes the route with its offering and source, and waits", async () => {
  const pending = openPaywall("discount", "winback");
  expect(pushed).toEqual(["/paywall?offering=discount&source=winback"]);
  expect(isPaywallOpen()).toBe(true);
  settlePaywall("purchased");
  await expect(pending).resolves.toBe("purchased");
  expect(isPaywallOpen()).toBe(false);
});

test("a second open while one is parked settles the first as dismissed", async () => {
  const first = openPaywall("default", "settings");
  const second = openPaywall("default", "garage");
  await expect(first).resolves.toBe("dismissed");
  settlePaywall("unavailable");
  await expect(second).resolves.toBe("unavailable");
  expect(pushed).toHaveLength(2);
});

test("settling with nothing parked is a no-op", () => {
  expect(() => settlePaywall("purchased")).not.toThrow();
  expect(isPaywallOpen()).toBe(false);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest --selectProjects logic --testPathPattern paywall-present`
Expected: FAIL — `Cannot find module '../src/paywall/present'`.

- [ ] **Step 3: Write the bridge**

`src/paywall/present.ts`:

```ts
import { router } from "expo-router";
import type { OfferingId, PurchaseResult } from "../purchases/plans";

/**
 * The sheet's promise, kept, for a screen.
 *
 * Five places in the app do `const bought = await presentPaywall(); if
 * (!bought) return;` and carry on in the same function. The RevenueCat sheet
 * made that shape natural because a native modal is a promise. The paywall
 * is now a route, and a route is not a promise, so this parks one: `open`
 * pushes the screen and returns a promise, the screen calls `settle` with
 * what happened, and the caller's code reads exactly as it did.
 *
 * One at a time. A second `open` while the first is parked would leave the
 * first caller waiting forever, so it is settled as dismissed first: the
 * user has plainly moved on from whatever asked.
 */
let pending: ((result: PurchaseResult) => void) | null = null;

export function isPaywallOpen(): boolean {
  return pending !== null;
}

export function openPaywall(offering: OfferingId, source: string): Promise<PurchaseResult> {
  if (pending) pending("dismissed");
  const promise = new Promise<PurchaseResult>((resolve) => {
    pending = resolve;
  });
  router.push(
    `/paywall?offering=${encodeURIComponent(offering)}&source=${encodeURIComponent(source)}` as never
  );
  return promise;
}

export function settlePaywall(result: PurchaseResult): void {
  const resolve = pending;
  pending = null;
  resolve?.(result);
}
```

- [ ] **Step 4: Run the bridge tests**

Run: `npx jest --selectProjects logic --testPathPattern paywall-present`
Expected: PASS, 3 tests.

- [ ] **Step 5: Rewire `presentPaywall` and `presentOffering`**

In `src/purchases/index.ts`:

1. Change the import line `import RevenueCatUI, { PAYWALL_RESULT, type CustomerCenterCallbacks } from "react-native-purchases-ui";` to `import RevenueCatUI, { type CustomerCenterCallbacks } from "react-native-purchases-ui";`.

2. Replace the whole `presentPaywall` function (`export async function presentPaywall(): Promise<boolean> { … }`) with:

```ts
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
```

3. Replace the whole `presentOffering` function with:

```ts
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
```

4. Delete the `hasOffering` function only if nothing else imports it (`grep -rn hasOffering app src`); `app/onboarding/offer.tsx` does today and is rewritten in Task 7, and `app/_layout.tsx` does for the win-back check. Keep it.

5. In the `INTRO_DAYS` docblock, delete the paragraph beginning `* The offer exists in the United States only.` through `* shows whatever this storefront actually offers.` and replace it with:

```ts
 * The offer exists in every storefront since 2026-09-16, created from the US
 * price point's equalisations (`asc subscriptions offers introductory
 * import`). Eligibility is still StoreKit's call per customer, which is why
 * `plans.ts` asks before it draws the intro price.
```

6. In the same docblock, the sentence `The RevenueCat sheet one tap away is the only thing that knows it.` becomes `StoreKit's own price string, read in plans.ts, is the only thing that knows it.`

- [ ] **Step 6: Update the guard tests**

In `tests/purchases-guard.test.ts`:

- Add, beside the other mocks:
  ```ts
  const opened: { offering: string; source: string }[] = [];
  let mockOpenResult: "purchased" | "dismissed" | "unavailable" = "dismissed";
  jest.mock("../src/paywall/present", () => ({
    openPaywall: async (offering: string, source: string) => {
      opened.push({ offering, source });
      return mockOpenResult;
    },
  }));
  ```
  and `opened.length = 0; mockOpenResult = "dismissed";` in the existing `beforeEach`.
- The test `"a configured SDK still presents, and reports what came back"` (search for that name): replace its body with
  ```ts
  getCustomerInfo.mockResolvedValueOnce(FREE);
  mockOpenResult = "purchased";
  await expect(presentPaywall()).resolves.toBe(true);
  expect(opened).toEqual([{ offering: "default", source: "gate" }]);
  ```
- The test `"an unconfigured SDK is never handed to the native paywall"`: keep its assertion that `presentPaywall()` resolves `false`; replace any assertion on `presentPaywall` (the RC UI mock) not being called with `expect(opened).toEqual([])`.
- In `describe("the paywall stall watchdog")`, the tests call `presentOffering()` and drive `presentPaywall` (the RC UI mock) to hang. Rewrite each of those tests to call `withStallWatch("current", new Promise(() => {}))` directly (import `withStallWatch` from `../src/purchases`), keeping their timer and `AppState` choreography and their assertions on `paywall_stalled`. The watchdog's behaviour is unchanged; only its caller moved.
- The two `describe` blocks `"a purchase the entitlement does not reflect"` and `"a restore from the sheet"`: delete them. That logic now lives in `buy` and is covered by `tests/plans.test.ts` (Task 2); the restore path is the screen's own `restore()` call, unchanged.
- Delete the `react-native-purchases-ui` mock's `presentPaywall` / `presentPaywallIfNeeded` entries and `PAYWALL_RESULT` if nothing in the file still references them; keep `presentCustomerCenter` for the Customer Center test.

- [ ] **Step 7: Run the guard suite and type-check**

Run: `npx jest --selectProjects logic --testPathPattern 'purchases-guard|paywall-present|plans'`
Expected: PASS.

Run: `npx tsc --noEmit`
Expected: errors only in `app/onboarding/paywall.tsx` and `app/onboarding/offer.tsx` if any (they still compile against the kept signatures, so likely none). Any error mentioning `PAYWALL_RESULT` means a reference survived; remove it.

- [ ] **Step 8: Commit**

```bash
git add src/paywall/present.ts src/purchases/index.ts tests/purchases-guard.test.ts tests/paywall-present.test.ts
git commit -m "feat(paywall): route the sheet's promise to a screen"
```

---

### Task 4: Copy in 16 locales

**Files:**
- Create: `src/i18n/catalog/en/paywall.ts`
- Modify: `src/i18n/catalog/en/index.ts` (register the fragment), `src/i18n/catalog/en/offer.ts`
- Modify: `src/i18n/catalog/{de,fr,it,es,ptBR,nl,sv,pl,ja,ko}.ts`, `src/i18n/catalog/{frCA,esMX}.ts`
- Test: `tests/i18n.test.ts` (existing; no change)

**Interfaces:**
- Produces the keys listed in Step 2, read with `t()` / `tNamed()` by Tasks 5–8.

- [ ] **Step 1: Run the parity test to see it green before you start**

Run: `npx jest --selectProjects logic --testPathPattern i18n`
Expected: PASS. Every step below must keep it so.

- [ ] **Step 2: Write the English fragment**

`src/i18n/catalog/en/paywall.ts`:

```ts
import type { Fragment } from "../types";

/**
 * The price list, drawn by the app since 2026-09-16.
 *
 * Nothing in here is a price. `{price}`, `{intro}` and `{pct}` are filled from
 * StoreKit's own strings and from arithmetic on them (`src/purchases/plans.ts`),
 * so the catalog can be translated without knowing a tier and stays true when
 * the tier changes.
 *
 * The CTA is one key per period rather than "Continue with {period}": the
 * period word inflects in half the catalog (German, Polish, Portuguese) and a
 * placeholder cannot carry a case ending.
 *
 * `paywall.review.quote` is a quotation from the App Store and is identical in
 * every language on purpose. Translating a customer's words would put
 * sentences in their mouth they did not write.
 */
export const paywall: Fragment = {
  "paywall.title": "Wrenchy Pro",
  "paywall.close": "Close",

  "paywall.period.week": "Weekly",
  "paywall.period.month": "Monthly",
  "paywall.period.year": "Yearly",
  "paywall.per.week": "per week",
  "paywall.per.month": "per month",
  "paywall.billed.month": "billed {price} per month",
  "paywall.billed.year": "billed {price} per year",
  "paywall.save": "Save {pct}%",
  "paywall.bestValue": "Best value",
  "paywall.intro.label": "Your first week",
  "paywall.then": "then {price} per week",

  "paywall.cta.week": "Continue with weekly",
  "paywall.cta.month": "Continue with monthly",
  "paywall.cta.year": "Continue with yearly",

  "paywall.legal.week": "Renews at {price} per week. Cancel anytime.",
  "paywall.legal.month": "Renews at {price} per month. Cancel anytime.",
  "paywall.legal.year": "Renews at {price} per year. Cancel anytime.",
  "paywall.legal.intro": "{intro} for the first week, then {price} per week. Cancel anytime.",
  "paywall.terms": "Terms",
  "paywall.privacy": "Privacy",
  "paywall.restore": "Restore",

  "paywall.included": "Included with Pro",
  "paywall.loading": "Loading prices",
  "paywall.retry": "Try again",

  "paywall.review.quote":
    "Compared to other apps I tried like MyAutoLog, Carfax, or what have you not, this app absolutely surpasses them all in terms of functionality, design, and ease of use.",
  "paywall.review.name": "Tracy Deckenbach",
  "paywall.review.source": "App Store review",
};
```

Register it in `src/i18n/catalog/en/index.ts`: add `import { paywall } from "./paywall";` beside the other imports and `paywall,` inside `FRAGMENTS`.

- [ ] **Step 3: Change the offer fragment**

In `src/i18n/catalog/en/offer.ts`:

- `"offer.paywall.title": "Cars don’t warn you. This does.",` → `"offer.paywall.title": "Never miss a service.",`
- `"offer.paywall.title.named": "{name}, cars don’t warn you. This does.",` → `"offer.paywall.title.named": "{name}, never miss a service.",`
- `"offer.paywall.cta": "Keep my car on record",` → delete the line.
- `"offer.trial.decline": "No thanks",` → `"offer.trial.decline": "I’d rather pay full price",`
- After `"offer.paywall.none": "None",` add:

```ts
  // The three benefit rows on the paywall, built from this user's own plan.
  // They replace the four gauges: the same numbers, read as sentences, on the
  // one screen where the reader is deciding rather than glancing.
  "offer.paywall.point.tracked.title": "{vehicle} on record",
  "offer.paywall.point.tracked.subtitle": {
    one: "{count} service tracked, by date and by distance",
    other: "{count} services tracked, by date and by distance",
  },
  "offer.paywall.point.due.title": {
    one: "{count} service overdue today",
    other: "{count} services overdue today",
  },
  "offer.paywall.point.due.none": "Nothing overdue today",
  "offer.paywall.point.due.subtitle": "Next warning {date}",
  "offer.paywall.point.due.noNext": "No warning needed yet",
  "offer.paywall.point.reminders.title": "A reminder before each one",
  "offer.paywall.point.reminders.subtitle": "On the day it comes due, and never a nag.",
  "offer.paywall.notNow": "Not now",
```

- [ ] **Step 4: Mirror into the ten full catalogs**

In each of `de.ts fr.ts it.ts es.ts ptBR.ts nl.ts sv.ts pl.ts ja.ts ko.ts`: delete `"offer.paywall.cta"`, change `offer.paywall.title`, `offer.paywall.title.named`, `offer.trial.decline`, add the nine `offer.paywall.point.*` / `notNow` keys next to the other `offer.paywall.*` keys, and add the whole `paywall.*` block (place it after the `offer` block). Use exactly these strings. The review quote is the English text in every file.

**de**
```ts
  "offer.paywall.title": "Nie wieder einen Service verpassen.",
  "offer.paywall.title.named": "{name}, nie wieder einen Service verpassen.",
  "offer.trial.decline": "Lieber den vollen Preis zahlen",
  "offer.paywall.point.tracked.title": "{vehicle} ist dokumentiert",
  "offer.paywall.point.tracked.subtitle": {
    one: "{count} Service im Blick, nach Datum und Kilometern",
    other: "{count} Services im Blick, nach Datum und Kilometern",
  },
  "offer.paywall.point.due.title": {
    one: "{count} Service ist heute überfällig",
    other: "{count} Services sind heute überfällig",
  },
  "offer.paywall.point.due.none": "Heute nichts überfällig",
  "offer.paywall.point.due.subtitle": "Nächste Warnung {date}",
  "offer.paywall.point.due.noNext": "Noch keine Warnung nötig",
  "offer.paywall.point.reminders.title": "Eine Erinnerung vor jedem Service",
  "offer.paywall.point.reminders.subtitle": "Am Tag der Fälligkeit, und nie aufdringlich.",
  "offer.paywall.notNow": "Jetzt nicht",

  "paywall.title": "Wrenchy Pro",
  "paywall.close": "Schließen",
  "paywall.period.week": "Wöchentlich",
  "paywall.period.month": "Monatlich",
  "paywall.period.year": "Jährlich",
  "paywall.per.week": "pro Woche",
  "paywall.per.month": "pro Monat",
  "paywall.billed.month": "{price} pro Monat abgerechnet",
  "paywall.billed.year": "{price} pro Jahr abgerechnet",
  "paywall.save": "{pct}% sparen",
  "paywall.bestValue": "Bestes Angebot",
  "paywall.intro.label": "Deine erste Woche",
  "paywall.then": "danach {price} pro Woche",
  "paywall.cta.week": "Weiter mit wöchentlich",
  "paywall.cta.month": "Weiter mit monatlich",
  "paywall.cta.year": "Weiter mit jährlich",
  "paywall.legal.week": "Verlängert sich für {price} pro Woche. Jederzeit kündbar.",
  "paywall.legal.month": "Verlängert sich für {price} pro Monat. Jederzeit kündbar.",
  "paywall.legal.year": "Verlängert sich für {price} pro Jahr. Jederzeit kündbar.",
  "paywall.legal.intro": "{intro} für die erste Woche, danach {price} pro Woche. Jederzeit kündbar.",
  "paywall.terms": "Nutzungsbedingungen",
  "paywall.privacy": "Datenschutz",
  "paywall.restore": "Wiederherstellen",
  "paywall.included": "In Pro enthalten",
  "paywall.loading": "Preise werden geladen",
  "paywall.retry": "Erneut versuchen",
  "paywall.review.quote": "<English quote, verbatim>",
  "paywall.review.name": "Tracy Deckenbach",
  "paywall.review.source": "App Store Rezension",
```

**fr**
```ts
  "offer.paywall.title": "Ne ratez plus jamais un entretien.",
  "offer.paywall.title.named": "{name}, ne ratez plus jamais un entretien.",
  "offer.trial.decline": "Je préfère payer le plein tarif",
  "offer.paywall.point.tracked.title": "{vehicle} est consignée",
  "offer.paywall.point.tracked.subtitle": {
    one: "{count} entretien suivi, par date et par distance",
    other: "{count} entretiens suivis, par date et par distance",
  },
  "offer.paywall.point.due.title": {
    one: "{count} entretien en retard aujourd’hui",
    other: "{count} entretiens en retard aujourd’hui",
  },
  "offer.paywall.point.due.none": "Rien en retard aujourd’hui",
  "offer.paywall.point.due.subtitle": "Prochaine alerte {date}",
  "offer.paywall.point.due.noNext": "Aucune alerte nécessaire pour l’instant",
  "offer.paywall.point.reminders.title": "Un rappel avant chacun",
  "offer.paywall.point.reminders.subtitle": "Le jour de l’échéance, jamais de relance.",
  "offer.paywall.notNow": "Pas maintenant",

  "paywall.title": "Wrenchy Pro",
  "paywall.close": "Fermer",
  "paywall.period.week": "Hebdomadaire",
  "paywall.period.month": "Mensuel",
  "paywall.period.year": "Annuel",
  "paywall.per.week": "par semaine",
  "paywall.per.month": "par mois",
  "paywall.billed.month": "facturé {price} par mois",
  "paywall.billed.year": "facturé {price} par an",
  "paywall.save": "Économisez {pct}%",
  "paywall.bestValue": "Meilleure offre",
  "paywall.intro.label": "Votre première semaine",
  "paywall.then": "puis {price} par semaine",
  "paywall.cta.week": "Continuer en hebdomadaire",
  "paywall.cta.month": "Continuer en mensuel",
  "paywall.cta.year": "Continuer en annuel",
  "paywall.legal.week": "Renouvelé à {price} par semaine. Annulable à tout moment.",
  "paywall.legal.month": "Renouvelé à {price} par mois. Annulable à tout moment.",
  "paywall.legal.year": "Renouvelé à {price} par an. Annulable à tout moment.",
  "paywall.legal.intro": "{intro} la première semaine, puis {price} par semaine. Annulable à tout moment.",
  "paywall.terms": "Conditions",
  "paywall.privacy": "Confidentialité",
  "paywall.restore": "Restaurer",
  "paywall.included": "Inclus dans Pro",
  "paywall.loading": "Chargement des prix",
  "paywall.retry": "Réessayer",
  "paywall.review.quote": "<English quote, verbatim>",
  "paywall.review.name": "Tracy Deckenbach",
  "paywall.review.source": "Avis App Store",
```

**it**
```ts
  "offer.paywall.title": "Non perdere mai più un tagliando.",
  "offer.paywall.title.named": "{name}, non perdere mai più un tagliando.",
  "offer.trial.decline": "Preferisco pagare il prezzo pieno",
  "offer.paywall.point.tracked.title": "{vehicle} è a libretto",
  "offer.paywall.point.tracked.subtitle": {
    one: "{count} intervento seguito, per data e per chilometri",
    other: "{count} interventi seguiti, per data e per chilometri",
  },
  "offer.paywall.point.due.title": {
    one: "{count} intervento scaduto oggi",
    other: "{count} interventi scaduti oggi",
  },
  "offer.paywall.point.due.none": "Niente di scaduto oggi",
  "offer.paywall.point.due.subtitle": "Prossimo avviso {date}",
  "offer.paywall.point.due.noNext": "Nessun avviso necessario per ora",
  "offer.paywall.point.reminders.title": "Un promemoria prima di ognuno",
  "offer.paywall.point.reminders.subtitle": "Il giorno della scadenza, senza insistere.",
  "offer.paywall.notNow": "Non ora",

  "paywall.title": "Wrenchy Pro",
  "paywall.close": "Chiudi",
  "paywall.period.week": "Settimanale",
  "paywall.period.month": "Mensile",
  "paywall.period.year": "Annuale",
  "paywall.per.week": "a settimana",
  "paywall.per.month": "al mese",
  "paywall.billed.month": "addebitato {price} al mese",
  "paywall.billed.year": "addebitato {price} all’anno",
  "paywall.save": "Risparmi il {pct}%",
  "paywall.bestValue": "Più conveniente",
  "paywall.intro.label": "La tua prima settimana",
  "paywall.then": "poi {price} a settimana",
  "paywall.cta.week": "Continua con settimanale",
  "paywall.cta.month": "Continua con mensile",
  "paywall.cta.year": "Continua con annuale",
  "paywall.legal.week": "Si rinnova a {price} a settimana. Disdici quando vuoi.",
  "paywall.legal.month": "Si rinnova a {price} al mese. Disdici quando vuoi.",
  "paywall.legal.year": "Si rinnova a {price} all’anno. Disdici quando vuoi.",
  "paywall.legal.intro": "{intro} per la prima settimana, poi {price} a settimana. Disdici quando vuoi.",
  "paywall.terms": "Termini",
  "paywall.privacy": "Privacy",
  "paywall.restore": "Ripristina",
  "paywall.included": "Incluso in Pro",
  "paywall.loading": "Caricamento prezzi",
  "paywall.retry": "Riprova",
  "paywall.review.quote": "<English quote, verbatim>",
  "paywall.review.name": "Tracy Deckenbach",
  "paywall.review.source": "Recensione App Store",
```

**es**
```ts
  "offer.paywall.title": "No vuelvas a saltarte una revisión.",
  "offer.paywall.title.named": "{name}, no vuelvas a saltarte una revisión.",
  "offer.trial.decline": "Prefiero pagar el precio completo",
  "offer.paywall.point.tracked.title": "{vehicle} queda registrado",
  "offer.paywall.point.tracked.subtitle": {
    one: "{count} mantenimiento vigilado, por fecha y por distancia",
    other: "{count} mantenimientos vigilados, por fecha y por distancia",
  },
  "offer.paywall.point.due.title": {
    one: "{count} mantenimiento vencido hoy",
    other: "{count} mantenimientos vencidos hoy",
  },
  "offer.paywall.point.due.none": "Nada vencido hoy",
  "offer.paywall.point.due.subtitle": "Próximo aviso {date}",
  "offer.paywall.point.due.noNext": "Aún no hace falta ningún aviso",
  "offer.paywall.point.reminders.title": "Un recordatorio antes de cada uno",
  "offer.paywall.point.reminders.subtitle": "El día que toca, y nunca insistiendo.",
  "offer.paywall.notNow": "Ahora no",

  "paywall.title": "Wrenchy Pro",
  "paywall.close": "Cerrar",
  "paywall.period.week": "Semanal",
  "paywall.period.month": "Mensual",
  "paywall.period.year": "Anual",
  "paywall.per.week": "por semana",
  "paywall.per.month": "al mes",
  "paywall.billed.month": "se cobra {price} al mes",
  "paywall.billed.year": "se cobra {price} al año",
  "paywall.save": "Ahorra {pct}%",
  "paywall.bestValue": "Mejor precio",
  "paywall.intro.label": "Tu primera semana",
  "paywall.then": "después {price} por semana",
  "paywall.cta.week": "Continuar con semanal",
  "paywall.cta.month": "Continuar con mensual",
  "paywall.cta.year": "Continuar con anual",
  "paywall.legal.week": "Se renueva a {price} por semana. Cancela cuando quieras.",
  "paywall.legal.month": "Se renueva a {price} al mes. Cancela cuando quieras.",
  "paywall.legal.year": "Se renueva a {price} al año. Cancela cuando quieras.",
  "paywall.legal.intro": "{intro} la primera semana, después {price} por semana. Cancela cuando quieras.",
  "paywall.terms": "Condiciones",
  "paywall.privacy": "Privacidad",
  "paywall.restore": "Restaurar",
  "paywall.included": "Incluido en Pro",
  "paywall.loading": "Cargando precios",
  "paywall.retry": "Reintentar",
  "paywall.review.quote": "<English quote, verbatim>",
  "paywall.review.name": "Tracy Deckenbach",
  "paywall.review.source": "Reseña en App Store",
```

**ptBR**
```ts
  "offer.paywall.title": "Nunca mais perca uma revisão.",
  "offer.paywall.title.named": "{name}, nunca mais perca uma revisão.",
  "offer.trial.decline": "Prefiro pagar o preço cheio",
  "offer.paywall.point.tracked.title": "{vehicle} está registrado",
  "offer.paywall.point.tracked.subtitle": {
    one: "{count} serviço acompanhado, por data e por distância",
    other: "{count} serviços acompanhados, por data e por distância",
  },
  "offer.paywall.point.due.title": {
    one: "{count} serviço atrasado hoje",
    other: "{count} serviços atrasados hoje",
  },
  "offer.paywall.point.due.none": "Nada atrasado hoje",
  "offer.paywall.point.due.subtitle": "Próximo aviso {date}",
  "offer.paywall.point.due.noNext": "Nenhum aviso necessário por enquanto",
  "offer.paywall.point.reminders.title": "Um lembrete antes de cada um",
  "offer.paywall.point.reminders.subtitle": "No dia em que vence, e nunca insistindo.",
  "offer.paywall.notNow": "Agora não",

  "paywall.title": "Wrenchy Pro",
  "paywall.close": "Fechar",
  "paywall.period.week": "Semanal",
  "paywall.period.month": "Mensal",
  "paywall.period.year": "Anual",
  "paywall.per.week": "por semana",
  "paywall.per.month": "por mês",
  "paywall.billed.month": "cobrado {price} por mês",
  "paywall.billed.year": "cobrado {price} por ano",
  "paywall.save": "Economize {pct}%",
  "paywall.bestValue": "Melhor valor",
  "paywall.intro.label": "Sua primeira semana",
  "paywall.then": "depois {price} por semana",
  "paywall.cta.week": "Continuar com semanal",
  "paywall.cta.month": "Continuar com mensal",
  "paywall.cta.year": "Continuar com anual",
  "paywall.legal.week": "Renova a {price} por semana. Cancele quando quiser.",
  "paywall.legal.month": "Renova a {price} por mês. Cancele quando quiser.",
  "paywall.legal.year": "Renova a {price} por ano. Cancele quando quiser.",
  "paywall.legal.intro": "{intro} na primeira semana, depois {price} por semana. Cancele quando quiser.",
  "paywall.terms": "Termos",
  "paywall.privacy": "Privacidade",
  "paywall.restore": "Restaurar",
  "paywall.included": "Incluído no Pro",
  "paywall.loading": "Carregando preços",
  "paywall.retry": "Tentar de novo",
  "paywall.review.quote": "<English quote, verbatim>",
  "paywall.review.name": "Tracy Deckenbach",
  "paywall.review.source": "Avaliação na App Store",
```

**nl**
```ts
  "offer.paywall.title": "Mis nooit meer een beurt.",
  "offer.paywall.title.named": "{name}, mis nooit meer een beurt.",
  "offer.trial.decline": "Ik betaal liever de volle prijs",
  "offer.paywall.point.tracked.title": "{vehicle} staat vastgelegd",
  "offer.paywall.point.tracked.subtitle": {
    one: "{count} beurt in de gaten, op datum en op afstand",
    other: "{count} beurten in de gaten, op datum en op afstand",
  },
  "offer.paywall.point.due.title": {
    one: "{count} beurt vandaag te laat",
    other: "{count} beurten vandaag te laat",
  },
  "offer.paywall.point.due.none": "Vandaag niets te laat",
  "offer.paywall.point.due.subtitle": "Volgende waarschuwing {date}",
  "offer.paywall.point.due.noNext": "Nog geen waarschuwing nodig",
  "offer.paywall.point.reminders.title": "Een herinnering vóór elke beurt",
  "offer.paywall.point.reminders.subtitle": "Op de dag zelf, en nooit zeurend.",
  "offer.paywall.notNow": "Nu niet",

  "paywall.title": "Wrenchy Pro",
  "paywall.close": "Sluiten",
  "paywall.period.week": "Wekelijks",
  "paywall.period.month": "Maandelijks",
  "paywall.period.year": "Jaarlijks",
  "paywall.per.week": "per week",
  "paywall.per.month": "per maand",
  "paywall.billed.month": "{price} per maand afgeschreven",
  "paywall.billed.year": "{price} per jaar afgeschreven",
  "paywall.save": "Bespaar {pct}%",
  "paywall.bestValue": "Voordeligst",
  "paywall.intro.label": "Je eerste week",
  "paywall.then": "daarna {price} per week",
  "paywall.cta.week": "Doorgaan met wekelijks",
  "paywall.cta.month": "Doorgaan met maandelijks",
  "paywall.cta.year": "Doorgaan met jaarlijks",
  "paywall.legal.week": "Verlengt voor {price} per week. Altijd opzegbaar.",
  "paywall.legal.month": "Verlengt voor {price} per maand. Altijd opzegbaar.",
  "paywall.legal.year": "Verlengt voor {price} per jaar. Altijd opzegbaar.",
  "paywall.legal.intro": "{intro} voor de eerste week, daarna {price} per week. Altijd opzegbaar.",
  "paywall.terms": "Voorwaarden",
  "paywall.privacy": "Privacy",
  "paywall.restore": "Herstellen",
  "paywall.included": "Inbegrepen bij Pro",
  "paywall.loading": "Prijzen laden",
  "paywall.retry": "Opnieuw proberen",
  "paywall.review.quote": "<English quote, verbatim>",
  "paywall.review.name": "Tracy Deckenbach",
  "paywall.review.source": "App Store-recensie",
```

**sv**
```ts
  "offer.paywall.title": "Missa aldrig en service igen.",
  "offer.paywall.title.named": "{name}, missa aldrig en service igen.",
  "offer.trial.decline": "Jag betalar hellre fullt pris",
  "offer.paywall.point.tracked.title": "{vehicle} finns på pränt",
  "offer.paywall.point.tracked.subtitle": {
    one: "{count} service bevakad, efter datum och sträcka",
    other: "{count} servicar bevakade, efter datum och sträcka",
  },
  "offer.paywall.point.due.title": {
    one: "{count} service försenad i dag",
    other: "{count} servicar försenade i dag",
  },
  "offer.paywall.point.due.none": "Inget försenat i dag",
  "offer.paywall.point.due.subtitle": "Nästa varning {date}",
  "offer.paywall.point.due.noNext": "Ingen varning behövs ännu",
  "offer.paywall.point.reminders.title": "En påminnelse före varje",
  "offer.paywall.point.reminders.subtitle": "Samma dag det är dags, aldrig tjatigt.",
  "offer.paywall.notNow": "Inte nu",

  "paywall.title": "Wrenchy Pro",
  "paywall.close": "Stäng",
  "paywall.period.week": "Veckovis",
  "paywall.period.month": "Månadsvis",
  "paywall.period.year": "Årsvis",
  "paywall.per.week": "per vecka",
  "paywall.per.month": "per månad",
  "paywall.billed.month": "{price} debiteras per månad",
  "paywall.billed.year": "{price} debiteras per år",
  "paywall.save": "Spara {pct}%",
  "paywall.bestValue": "Bäst värde",
  "paywall.intro.label": "Din första vecka",
  "paywall.then": "sedan {price} per vecka",
  "paywall.cta.week": "Fortsätt veckovis",
  "paywall.cta.month": "Fortsätt månadsvis",
  "paywall.cta.year": "Fortsätt årsvis",
  "paywall.legal.week": "Förnyas för {price} per vecka. Avsluta när du vill.",
  "paywall.legal.month": "Förnyas för {price} per månad. Avsluta när du vill.",
  "paywall.legal.year": "Förnyas för {price} per år. Avsluta när du vill.",
  "paywall.legal.intro": "{intro} första veckan, sedan {price} per vecka. Avsluta när du vill.",
  "paywall.terms": "Villkor",
  "paywall.privacy": "Integritet",
  "paywall.restore": "Återställ",
  "paywall.included": "Ingår i Pro",
  "paywall.loading": "Hämtar priser",
  "paywall.retry": "Försök igen",
  "paywall.review.quote": "<English quote, verbatim>",
  "paywall.review.name": "Tracy Deckenbach",
  "paywall.review.source": "App Store-recension",
```

**pl** (three plural forms: `one`, `few`, `many`)
```ts
  "offer.paywall.title": "Nigdy więcej nie przegap serwisu.",
  "offer.paywall.title.named": "{name}, nigdy więcej nie przegap serwisu.",
  "offer.trial.decline": "Wolę zapłacić pełną cenę",
  "offer.paywall.point.tracked.title": "{vehicle} jest w rejestrze",
  "offer.paywall.point.tracked.subtitle": {
    one: "{count} serwis pilnowany, według daty i przebiegu",
    few: "{count} serwisy pilnowane, według daty i przebiegu",
    many: "{count} serwisów pilnowanych, według daty i przebiegu",
    other: "{count} serwisu pilnowanego, według daty i przebiegu",
  },
  "offer.paywall.point.due.title": {
    one: "{count} serwis zaległy dziś",
    few: "{count} serwisy zaległe dziś",
    many: "{count} serwisów zaległych dziś",
    other: "{count} serwisu zaległego dziś",
  },
  "offer.paywall.point.due.none": "Nic dziś nie zalega",
  "offer.paywall.point.due.subtitle": "Następne ostrzeżenie {date}",
  "offer.paywall.point.due.noNext": "Na razie żadne ostrzeżenie nie jest potrzebne",
  "offer.paywall.point.reminders.title": "Przypomnienie przed każdym",
  "offer.paywall.point.reminders.subtitle": "W dniu terminu, bez nagabywania.",
  "offer.paywall.notNow": "Nie teraz",

  "paywall.title": "Wrenchy Pro",
  "paywall.close": "Zamknij",
  "paywall.period.week": "Tygodniowo",
  "paywall.period.month": "Miesięcznie",
  "paywall.period.year": "Rocznie",
  "paywall.per.week": "tygodniowo",
  "paywall.per.month": "miesięcznie",
  "paywall.billed.month": "{price} pobierane co miesiąc",
  "paywall.billed.year": "{price} pobierane co rok",
  "paywall.save": "Oszczędzasz {pct}%",
  "paywall.bestValue": "Najkorzystniej",
  "paywall.intro.label": "Twój pierwszy tydzień",
  "paywall.then": "potem {price} tygodniowo",
  "paywall.cta.week": "Dalej z planem tygodniowym",
  "paywall.cta.month": "Dalej z planem miesięcznym",
  "paywall.cta.year": "Dalej z planem rocznym",
  "paywall.legal.week": "Odnawia się za {price} tygodniowo. Anuluj, kiedy chcesz.",
  "paywall.legal.month": "Odnawia się za {price} miesięcznie. Anuluj, kiedy chcesz.",
  "paywall.legal.year": "Odnawia się za {price} rocznie. Anuluj, kiedy chcesz.",
  "paywall.legal.intro": "{intro} za pierwszy tydzień, potem {price} tygodniowo. Anuluj, kiedy chcesz.",
  "paywall.terms": "Regulamin",
  "paywall.privacy": "Prywatność",
  "paywall.restore": "Przywróć",
  "paywall.included": "W ramach Pro",
  "paywall.loading": "Wczytywanie cen",
  "paywall.retry": "Spróbuj ponownie",
  "paywall.review.quote": "<English quote, verbatim>",
  "paywall.review.name": "Tracy Deckenbach",
  "paywall.review.source": "Recenzja w App Store",
```

**ja**
```ts
  "offer.paywall.title": "点検を二度と逃さない。",
  "offer.paywall.title.named": "{name}さん、点検を二度と逃さない。",
  "offer.trial.decline": "通常価格で購入する",
  "offer.paywall.point.tracked.title": "{vehicle}を記録済み",
  "offer.paywall.point.tracked.subtitle": { other: "{count}件の整備を日付と距離で管理" },
  "offer.paywall.point.due.title": { other: "本日{count}件が期限超過" },
  "offer.paywall.point.due.none": "本日の期限超過はありません",
  "offer.paywall.point.due.subtitle": "次の通知 {date}",
  "offer.paywall.point.due.noNext": "今はまだ通知の必要はありません",
  "offer.paywall.point.reminders.title": "各整備の前にリマインド",
  "offer.paywall.point.reminders.subtitle": "期限当日に一度だけ。しつこく通知しません。",
  "offer.paywall.notNow": "今はしない",

  "paywall.title": "Wrenchy Pro",
  "paywall.close": "閉じる",
  "paywall.period.week": "週額",
  "paywall.period.month": "月額",
  "paywall.period.year": "年額",
  "paywall.per.week": "/週",
  "paywall.per.month": "/月",
  "paywall.billed.month": "月ごとに{price}を請求",
  "paywall.billed.year": "年ごとに{price}を請求",
  "paywall.save": "{pct}%お得",
  "paywall.bestValue": "一番お得",
  "paywall.intro.label": "最初の1週間",
  "paywall.then": "その後は週{price}",
  "paywall.cta.week": "週額プランで続ける",
  "paywall.cta.month": "月額プランで続ける",
  "paywall.cta.year": "年額プランで続ける",
  "paywall.legal.week": "週{price}で自動更新。いつでも解約できます。",
  "paywall.legal.month": "月{price}で自動更新。いつでも解約できます。",
  "paywall.legal.year": "年{price}で自動更新。いつでも解約できます。",
  "paywall.legal.intro": "最初の1週間は{intro}、その後は週{price}。いつでも解約できます。",
  "paywall.terms": "利用規約",
  "paywall.privacy": "プライバシー",
  "paywall.restore": "復元",
  "paywall.included": "Proに含まれる機能",
  "paywall.loading": "価格を読み込み中",
  "paywall.retry": "再試行",
  "paywall.review.quote": "<English quote, verbatim>",
  "paywall.review.name": "Tracy Deckenbach",
  "paywall.review.source": "App Storeレビュー",
```

**ko**
```ts
  "offer.paywall.title": "정비 시기를 다시는 놓치지 마세요.",
  "offer.paywall.title.named": "{name}님, 정비 시기를 다시는 놓치지 마세요.",
  "offer.trial.decline": "정가로 구매할게요",
  "offer.paywall.point.tracked.title": "{vehicle} 기록 완료",
  "offer.paywall.point.tracked.subtitle": { other: "정비 {count}건을 날짜와 거리로 관리" },
  "offer.paywall.point.due.title": { other: "오늘 기준 {count}건 기한 초과" },
  "offer.paywall.point.due.none": "오늘 기한을 넘긴 항목 없음",
  "offer.paywall.point.due.subtitle": "다음 알림 {date}",
  "offer.paywall.point.due.noNext": "아직 알림이 필요하지 않아요",
  "offer.paywall.point.reminders.title": "정비마다 미리 알림",
  "offer.paywall.point.reminders.subtitle": "기한 당일에 한 번만, 귀찮게 하지 않아요.",
  "offer.paywall.notNow": "나중에",

  "paywall.title": "Wrenchy Pro",
  "paywall.close": "닫기",
  "paywall.period.week": "주간",
  "paywall.period.month": "월간",
  "paywall.period.year": "연간",
  "paywall.per.week": "/주",
  "paywall.per.month": "/월",
  "paywall.billed.month": "매월 {price} 청구",
  "paywall.billed.year": "매년 {price} 청구",
  "paywall.save": "{pct}% 절약",
  "paywall.bestValue": "최고 혜택",
  "paywall.intro.label": "첫 주",
  "paywall.then": "이후 주 {price}",
  "paywall.cta.week": "주간 플랜으로 계속",
  "paywall.cta.month": "월간 플랜으로 계속",
  "paywall.cta.year": "연간 플랜으로 계속",
  "paywall.legal.week": "주 {price}로 자동 갱신됩니다. 언제든 해지할 수 있어요.",
  "paywall.legal.month": "월 {price}로 자동 갱신됩니다. 언제든 해지할 수 있어요.",
  "paywall.legal.year": "연 {price}로 자동 갱신됩니다. 언제든 해지할 수 있어요.",
  "paywall.legal.intro": "첫 주는 {intro}, 이후 주 {price}. 언제든 해지할 수 있어요.",
  "paywall.terms": "이용약관",
  "paywall.privacy": "개인정보",
  "paywall.restore": "복원",
  "paywall.included": "Pro에 포함",
  "paywall.loading": "가격 불러오는 중",
  "paywall.retry": "다시 시도",
  "paywall.review.quote": "<English quote, verbatim>",
  "paywall.review.name": "Tracy Deckenbach",
  "paywall.review.source": "App Store 리뷰",
```

Replace every `"<English quote, verbatim>"` with the exact `paywall.review.quote` string from the English fragment.

- [ ] **Step 5: Update the two overlays that override changed keys**

`src/i18n/catalog/esMX.ts`: `"offer.paywall.title": "Los carros no avisan. Esto sí.",` → `"offer.paywall.title": "No vuelvas a saltarte un servicio.",`; delete its `"offer.paywall.cta"` line. If it has `offer.paywall.title.named`, change it to `"{name}, no vuelvas a saltarte un servicio."`.

`src/i18n/catalog/frCA.ts`: `"offer.paywall.title": "Les autos ne préviennent pas. Ceci, oui.",` → `"offer.paywall.title": "Ne manquez plus jamais un entretien.",`; delete its `"offer.paywall.cta"` line. If it has `offer.paywall.title.named`, change it to `"{name}, ne manquez plus jamais un entretien."`.

`enGB.ts`, `enAU.ts`, `enCA.ts`: delete an `"offer.paywall.cta"` line if one exists; nothing else.

- [ ] **Step 6: Run the catalog tests**

Run: `npx jest --selectProjects logic --testPathPattern 'i18n|localization|plural'`
Expected: PASS. A failure naming a key and a language means that language is missing or has an extra key; a placeholder failure means a `{price}` / `{count}` / `{date}` / `{vehicle}` / `{name}` / `{pct}` / `{intro}` was dropped in translation. The Polish `other` form is for fractional counts and must exist.

Also run: `grep -rn "offer.paywall.cta" src app tests` — expected: only `tests/onboarding-screens.test.tsx` (fixed in Task 6). Any other hit is a caller that must switch to `paywall.cta.*`.

- [ ] **Step 7: Commit**

```bash
git add src/i18n/catalog
git commit -m "i18n(paywall): price list copy in 16 locales"
```

---

### Task 5: The picker, the footer, the review — `src/paywall/*`

**Files:**
- Create: `src/paywall/legal.ts`, `src/paywall/PlanPicker.tsx`, `src/paywall/BuyFooter.tsx`, `src/paywall/ReviewCard.tsx`, `src/paywall/IncludedStrip.tsx`
- Test: `tests/paywall-screens.test.tsx`

**Interfaces:**
- Consumes: `Plan`, `PlanPeriod` from `src/purchases/plans`; `restore` from `src/purchases`; `track` from `src/analytics`; `t` from `src/i18n`; `Panel`, `Check`, `Button`, `PressableScale`, `tokens` from `src/design`.
- Produces:
  ```ts
  // legal.ts
  export const TERMS_URL: string; export const PRIVACY_URL: string;
  // PlanPicker.tsx
  export function PlanPicker(props: { plans: Plan[]; selected: string; onSelect: (id: string) => void; layout?: "cards" | "rows"; offering: "current" | "discount" }): JSX.Element;
  export function defaultPlan(plans: Plan[]): string;
  // BuyFooter.tsx
  export function BuyFooter(props: { plan: Plan | null; busy: boolean; onBuy: () => void; onRestore: () => void; children?: React.ReactNode }): JSX.Element;
  // ReviewCard.tsx
  export function ReviewCard(): JSX.Element;
  // IncludedStrip.tsx
  export function IncludedStrip(): JSX.Element;
  ```

- [ ] **Step 1: Write the failing screen tests**

`tests/paywall-screens.test.tsx`:

```tsx
import { createElement, type ReactElement } from "react";
import { act } from "react";
import TestRenderer from "react-test-renderer";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  NotificationFeedbackType: { Warning: "warning" },
}));
const opened: string[] = [];
jest.mock("expo-linking", () => ({ openURL: async (url: string) => { opened.push(url); } }));
jest.mock("react-native-purchases", () => ({ __esModule: true, default: {} }));
jest.mock("react-native-purchases-ui", () => ({ __esModule: true, default: {} }));
const mockTrack = jest.fn();
jest.mock("../src/analytics", () => ({ track: (e: string, p?: unknown) => mockTrack(e, p) }));
const mockRestore = jest.fn(async () => false);
jest.mock("../src/purchases", () => ({
  restore: () => mockRestore(),
  DISCOUNT_OFFERING: "discount",
  INTRO_DAYS: 7,
}));

import type { Plan } from "../src/purchases/plans";
import { PlanPicker, defaultPlan } from "../src/paywall/PlanPicker";
import { BuyFooter } from "../src/paywall/BuyFooter";
import { ReviewCard } from "../src/paywall/ReviewCard";
import { TERMS_URL, PRIVACY_URL } from "../src/paywall/legal";
import { t } from "../src/i18n";

function plan(over: Partial<Plan> & { id: string; period: Plan["period"] }): Plan {
  return {
    package: {} as Plan["package"],
    priceString: "$0.00",
    price: 0,
    currency: "USD",
    intro: null,
    perWeek: "$0.00",
    perMonth: "$0.00",
    ...over,
  };
}

const YEAR = plan({ id: "$rc_annual", period: "year", priceString: "$79.99", price: 79.99, perWeek: "$1.54", perMonth: "$6.67", savePct: 49 });
const MONTH = plan({ id: "$rc_monthly", period: "month", priceString: "$9.99", price: 9.99, perWeek: "$2.31", perMonth: "$9.99", savePct: 23 });
const WEEK = plan({ id: "$rc_weekly", period: "week", priceString: "$2.99", price: 2.99, perWeek: "$2.99", perMonth: "$12.96" });
const INTRO = plan({ ...WEEK, intro: { priceString: "$0.99", price: 0.99, periods: 1 } });

function render(el: ReactElement): TestRenderer.ReactTestRenderer {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(el);
  });
  return tree;
}

function texts(tree: TestRenderer.ReactTestRenderer): string[] {
  return tree.root
    .findAllByType("Text" as never)
    .map((n) => (Array.isArray(n.props.children) ? n.props.children.join("") : String(n.props.children ?? "")))
    .filter(Boolean);
}

function pressable(tree: TestRenderer.ReactTestRenderer, label: string) {
  const hits = tree.root.findAll(
    (n) => typeof n.props.onPress === "function" && JSON.stringify(n.props).includes(label)
  );
  return hits[hits.length - 1];
}

beforeEach(() => {
  mockTrack.mockReset();
  opened.length = 0;
});

describe("PlanPicker", () => {
  test("the default selection is the plan that saves the most", () => {
    expect(defaultPlan([WEEK, MONTH, YEAR])).toBe("$rc_annual");
    expect(defaultPlan([WEEK])).toBe("$rc_weekly");
  });

  test("prints every plan with its store price and the derived per-period figure", () => {
    const tree = render(
      createElement(PlanPicker, { plans: [YEAR, MONTH, WEEK], selected: "$rc_annual", onSelect: () => {}, offering: "current" })
    );
    const printed = texts(tree).join(" ");
    expect(printed).toContain("$79.99");
    expect(printed).toContain("$1.54");
    expect(printed).toContain("$9.99");
    expect(printed).toContain("$2.99");
    expect(printed).toContain(t("paywall.save", { pct: 49 }));
    expect(printed).toContain(t("paywall.bestValue"));
  });

  test("a tap selects and is reported", () => {
    const onSelect = jest.fn();
    const tree = render(
      createElement(PlanPicker, { plans: [YEAR, MONTH, WEEK], selected: "$rc_annual", onSelect, offering: "current" })
    );
    act(() => pressable(tree, t("paywall.period.month")).props.onPress());
    expect(onSelect).toHaveBeenCalledWith("$rc_monthly");
    expect(mockTrack).toHaveBeenCalledWith("paywall_plan_selected", { offering: "current", plan: "$rc_monthly" });
  });

  test("the intro price is drawn only when the plan carries one", () => {
    const withIntro = texts(
      render(createElement(PlanPicker, { plans: [INTRO], selected: "$rc_weekly", onSelect: () => {}, offering: "discount" }))
    ).join(" ");
    expect(withIntro).toContain("$0.99");
    expect(withIntro).toContain(t("paywall.then", { price: "$2.99" }));
    const without = texts(
      render(createElement(PlanPicker, { plans: [WEEK], selected: "$rc_weekly", onSelect: () => {}, offering: "discount" }))
    ).join(" ");
    expect(without).not.toContain("$0.99");
    expect(without).not.toContain(t("paywall.then", { price: "$2.99" }));
  });
});

describe("BuyFooter", () => {
  test.each([
    [YEAR, t("paywall.cta.year"), t("paywall.legal.year", { price: "$79.99" })],
    [MONTH, t("paywall.cta.month"), t("paywall.legal.month", { price: "$9.99" })],
    [WEEK, t("paywall.cta.week"), t("paywall.legal.week", { price: "$2.99" })],
    [INTRO, t("paywall.cta.week"), t("paywall.legal.intro", { intro: "$0.99", price: "$2.99" })],
  ])("names the selected plan on the button and the renewal under it", (p, cta, legal) => {
    // Everything App Review looks for on a subscription screen: the price
    // and period before the button, the renewal line, Terms, Privacy, Restore.
    const printed = texts(render(createElement(BuyFooter, { plan: p, busy: false, onBuy: () => {}, onRestore: () => {} })));
    expect(printed).toContain(cta);
    expect(printed.join(" ")).toContain(legal);
    expect(printed).toContain(t("paywall.terms"));
    expect(printed).toContain(t("paywall.privacy"));
    expect(printed).toContain(t("paywall.restore"));
  });

  test("the links open the legal pages and Restore calls back", () => {
    const onRestore = jest.fn();
    const tree = render(createElement(BuyFooter, { plan: YEAR, busy: false, onBuy: () => {}, onRestore }));
    act(() => pressable(tree, t("paywall.terms")).props.onPress());
    act(() => pressable(tree, t("paywall.privacy")).props.onPress());
    expect(opened).toEqual([TERMS_URL, PRIVACY_URL]);
    act(() => pressable(tree, t("paywall.restore")).props.onPress());
    expect(onRestore).toHaveBeenCalled();
  });

  test("with no plan the button is not live and says it is loading", () => {
    const onBuy = jest.fn();
    const tree = render(createElement(BuyFooter, { plan: null, busy: false, onBuy, onRestore: () => {} }));
    expect(texts(tree)).toContain(t("paywall.loading"));
    expect(onBuy).not.toHaveBeenCalled();
  });
});

test("the review card quotes the review and says where it came from", () => {
  const printed = texts(render(createElement(ReviewCard)));
  expect(printed.join(" ")).toContain("surpasses them all");
  expect(printed).toContain(t("paywall.review.name"));
  expect(printed).toContain(t("paywall.review.source"));
});

test("no paywall component prints an em or en dash", () => {
  for (const el of [
    createElement(PlanPicker, { plans: [YEAR, MONTH, INTRO], selected: "$rc_annual", onSelect: () => {}, offering: "current" }),
    createElement(BuyFooter, { plan: INTRO, busy: false, onBuy: () => {}, onRestore: () => {} }),
    createElement(ReviewCard),
  ]) {
    expect(texts(render(el)).join(" ")).not.toMatch(/[—–]/);
  }
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest --selectProjects screens --testPathPattern paywall-screens`
Expected: FAIL — `Cannot find module '../src/paywall/PlanPicker'`.

- [ ] **Step 3: Write `legal.ts`**

`src/paywall/legal.ts`:

```ts
/**
 * The two links App Review expects under every subscription button
 * (Guideline 3.1.2). The RevenueCat sheet drew them from its dashboard
 * config; the app draws its own paywall now, so it carries them itself.
 *
 * Terms is Apple's standard EULA, which is what the app has always shipped
 * under (no custom EULA is set in App Store Connect). Privacy is the same
 * gist `ship.config.json` publishes to the store listing.
 */
export const TERMS_URL = "https://www.apple.com/legal/internet-services/itunes/dev/stdeula/";
export const PRIVACY_URL =
  "https://gist.github.com/orangutanger1/ce492daa25c4acdbc7db49068c33ce3f/raw/473d9af8d5d1594e990aaa5d33fd581234b9ec58/PrivacyPolicy.md";
```

- [ ] **Step 4: Write `PlanPicker.tsx`**

`src/paywall/PlanPicker.tsx`:

```tsx
import { View, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { PressableScale } from "../design/PressableScale";
import { tokens } from "../design/tokens";
import { t } from "../i18n";
import { track } from "../analytics";
import type { Plan } from "../purchases/plans";

/**
 * The price list.
 *
 * Two shapes, chosen by how many plans there are. Two plans sit side by side
 * as cards, each one a period and a big figure, because two things compared
 * are read across. Three stack as rows, because three cards across a phone
 * are three columns of small type. Both shapes print the same facts in the
 * same order: the period, the per-week or per-month figure the reader
 * compares on, and the amount actually billed underneath so the comparison
 * figure is never mistaken for the charge.
 *
 * Selection is the app's own: a lit hairline and a tick, no new hue. The
 * "best value" and "save" marks are green because green is the one colour
 * the system spends on a good, settled fact, and a saving computed from the
 * store's own prices is one.
 *
 * Nothing here is a price. Every string is StoreKit's or arithmetic on it.
 */

export function defaultPlan(plans: Plan[]): string {
  let best = plans[0];
  for (const plan of plans) if ((plan.savePct ?? -1) > (best.savePct ?? -1)) best = plan;
  return best.id;
}

const RING = 2;

function Mark({ label }: { label: string }) {
  return (
    <View
      style={{
        alignSelf: "flex-start",
        backgroundColor: tokens.color.greenWash,
        borderColor: tokens.color.greenGlow,
        borderWidth: 1,
        borderRadius: tokens.radius.pill,
        paddingHorizontal: tokens.space.sm + 2,
        paddingVertical: 3,
      }}
    >
      <Text style={{ ...tokens.text.legend, color: tokens.color.green }}>{label}</Text>
    </View>
  );
}

function Tick({ on }: { on: boolean }) {
  const size = 22;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: on ? 0 : 1.5,
        borderColor: tokens.color.hairlineLit,
        backgroundColor: on ? tokens.color.white : "transparent",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {on && (
        <Text style={{ color: tokens.color.housing, fontSize: 13, fontWeight: "700", lineHeight: 15 }}>✓</Text>
      )}
    </View>
  );
}

/** The comparison figure and its unit. Yearly and monthly compare per week;
 *  the weekly plan is its own figure. */
function headline(plan: Plan): { figure: string; unit: string } {
  if (plan.intro) return { figure: plan.intro.priceString, unit: t("paywall.intro.label") };
  if (plan.period === "week") return { figure: plan.priceString, unit: t("paywall.per.week") };
  return { figure: plan.perWeek, unit: t("paywall.per.week") };
}

/** The line under the figure: what is actually billed, or what follows the
 *  introductory week. */
function billed(plan: Plan): string | null {
  if (plan.intro) return t("paywall.then", { price: plan.priceString });
  if (plan.period === "year") return t("paywall.billed.year", { price: plan.priceString });
  if (plan.period === "month") return t("paywall.billed.month", { price: plan.priceString });
  return null;
}

function Frame({
  on,
  onPress,
  children,
  style,
}: {
  on: boolean;
  onPress: () => void;
  children: React.ReactNode;
  style?: object;
}) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      style={[
        {
          borderRadius: tokens.radius.lg,
          backgroundColor: on ? tokens.color.surfaceHi : tokens.color.surface,
          borderWidth: RING,
          borderColor: on ? tokens.color.hairlineLit : tokens.color.hairline,
          padding: tokens.space.md,
        },
        style,
      ]}
    >
      {children}
    </PressableScale>
  );
}

export function PlanPicker({
  plans,
  selected,
  onSelect,
  layout = plans.length <= 2 ? "cards" : "rows",
  offering,
}: {
  plans: Plan[];
  selected: string;
  onSelect: (id: string) => void;
  layout?: "cards" | "rows";
  /** For the event, in the sheet's vocabulary: "current" or "discount". */
  offering: "current" | "discount";
}) {
  const bestId = plans.some((p) => p.savePct !== undefined) ? defaultPlan(plans) : null;

  function choose(plan: Plan) {
    if (plan.id !== selected) {
      Haptics.selectionAsync().catch(() => {});
      track("paywall_plan_selected", { offering, plan: plan.id });
    }
    onSelect(plan.id);
  }

  if (layout === "cards") {
    return (
      <View style={{ flexDirection: "row", gap: tokens.space.sm }}>
        {plans.map((plan) => {
          const on = plan.id === selected;
          const { figure, unit } = headline(plan);
          const under = billed(plan);
          return (
            <Frame key={plan.id} on={on} onPress={() => choose(plan)} style={{ flex: 1, gap: tokens.space.sm }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ ...tokens.text.legend, color: on ? tokens.color.text : tokens.color.textMuted }}>
                  {t(`paywall.period.${plan.period}`)}
                </Text>
                <Tick on={on} />
              </View>
              {plan.intro && (
                <Text
                  style={{
                    ...tokens.text.caption,
                    color: tokens.color.textFaint,
                    textDecorationLine: "line-through",
                  }}
                >
                  {plan.priceString}
                </Text>
              )}
              <View style={{ flexDirection: "row", alignItems: "baseline", gap: tokens.space.xs }}>
                <Text style={{ ...tokens.text.readout, fontSize: 28, color: tokens.color.text }}>{figure}</Text>
                <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>{unit}</Text>
              </View>
              {under && (
                <Text style={{ ...tokens.text.caption, color: tokens.color.textFaint }}>{under}</Text>
              )}
              {(plan.savePct !== undefined || plan.id === bestId) && (
                <View style={{ flexDirection: "row", gap: tokens.space.xs, flexWrap: "wrap" }}>
                  {plan.id === bestId && <Mark label={t("paywall.bestValue")} />}
                  {plan.savePct !== undefined && <Mark label={t("paywall.save", { pct: plan.savePct })} />}
                </View>
              )}
            </Frame>
          );
        })}
      </View>
    );
  }

  return (
    <View style={{ gap: tokens.space.sm }}>
      {plans.map((plan) => {
        const on = plan.id === selected;
        const { figure, unit } = headline(plan);
        const under = billed(plan);
        return (
          <Frame
            key={plan.id}
            on={on}
            onPress={() => choose(plan)}
            style={{ flexDirection: "row", alignItems: "center", gap: tokens.space.md }}
          >
            <Tick on={on} />
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.space.sm, flexWrap: "wrap" }}>
                <Text style={{ ...tokens.text.heading, color: tokens.color.text }}>
                  {t(`paywall.period.${plan.period}`)}
                </Text>
                {plan.id === bestId && <Mark label={t("paywall.bestValue")} />}
                {plan.savePct !== undefined && <Mark label={t("paywall.save", { pct: plan.savePct })} />}
              </View>
              {under && (
                <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>{under}</Text>
              )}
            </View>
            <View style={{ alignItems: "flex-end" }}>
              {plan.intro && (
                <Text
                  style={{ ...tokens.text.caption, color: tokens.color.textFaint, textDecorationLine: "line-through" }}
                >
                  {plan.priceString}
                </Text>
              )}
              <Text style={{ ...tokens.text.readout, color: tokens.color.text }}>{figure}</Text>
              <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>{unit}</Text>
            </View>
          </Frame>
        );
      })}
    </View>
  );
}
```

`PressableScale` takes `style` for its inner `Animated.View`; passing an array is fine (it spreads into the transform array's sibling). If TypeScript rejects the `style` prop type, change `Frame`'s `style` to `StyleProp<ViewStyle>` from `react-native` and cast at the call site as the existing `PressableScale` does (`style as never`).

- [ ] **Step 5: Write `BuyFooter.tsx`**

`src/paywall/BuyFooter.tsx`:

```tsx
import { View, Text, Pressable } from "react-native";
import * as Linking from "expo-linking";
import { Button } from "../design/Button";
import { tokens } from "../design/tokens";
import { t } from "../i18n";
import type { Plan } from "../purchases/plans";
import { PRIVACY_URL, TERMS_URL } from "./legal";

/**
 * The button and everything App Review wants under it.
 *
 * The button names the plan it will buy, because "Continue" alone above three
 * prices is a button the reader has to look back up from. The renewal line
 * is the price and period again, in a sentence, with "cancel anytime": the
 * one disclosure Guideline 3.1.2 requires before a purchase, and the one
 * a reader who skipped the cards still needs. Terms, Privacy and Restore
 * are the three links review looks for; Restore is also how a subscriber
 * with an unsynced receipt gets back in without going to the App Store.
 *
 * `children` is the slot for a screen's own soft decline ("Not now",
 * "I’d rather pay full price"), printed between the button and the legal
 * line so it reads as a choice and not as fine print.
 */
export function BuyFooter({
  plan,
  busy,
  onBuy,
  onRestore,
  children,
}: {
  plan: Plan | null;
  busy: boolean;
  onBuy: () => void;
  onRestore: () => void;
  children?: React.ReactNode;
}) {
  const label = plan ? t(`paywall.cta.${plan.period}`) : t("paywall.loading");
  const legal = plan
    ? plan.intro
      ? t("paywall.legal.intro", { intro: plan.intro.priceString, price: plan.priceString })
      : t(`paywall.legal.${plan.period}`, { price: plan.priceString })
    : "";

  return (
    <View style={{ gap: tokens.space.sm }}>
      <Button label={label} onPress={onBuy} disabled={busy || plan === null} />
      {children}
      {legal !== "" && (
        <Text style={{ ...tokens.text.caption, color: tokens.color.textFaint, textAlign: "center" }}>
          {legal}
        </Text>
      )}
      <View style={{ flexDirection: "row", justifyContent: "center", gap: tokens.space.md }}>
        <Link label={t("paywall.terms")} onPress={() => void Linking.openURL(TERMS_URL)} />
        <Dot />
        <Link label={t("paywall.privacy")} onPress={() => void Linking.openURL(PRIVACY_URL)} />
        <Dot />
        <Link label={t("paywall.restore")} onPress={onRestore} disabled={busy} />
      </View>
    </View>
  );
}

function Link({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable onPress={onPress} disabled={disabled} hitSlop={8} accessibilityRole="link">
      <Text style={{ ...tokens.text.footnote, color: tokens.color.textFaint }}>{label}</Text>
    </Pressable>
  );
}

function Dot() {
  return <Text style={{ ...tokens.text.footnote, color: tokens.color.textFaint }}>·</Text>;
}
```

If `expo-linking` is not in `package.json`, use `import { Linking } from "react-native";` instead and change the test's mock to `jest.mock("react-native/Libraries/Linking/Linking", …)`; `expo-linking` is preferred because jest-expo mocks it cleanly. Check with `grep '"expo-linking"' package.json`.

- [ ] **Step 6: Write `ReviewCard.tsx` and `IncludedStrip.tsx`**

`src/paywall/ReviewCard.tsx`:

```tsx
import { View, Text } from "react-native";
import { Panel } from "../design/Surface";
import { tokens } from "../design/tokens";
import { t } from "../i18n";

/**
 * The one review, quoted.
 *
 * The reviews screen earlier in the flow deliberately quotes nobody: its
 * evidence is 1,715 reviews of other apps, and printing their words would be
 * borrowing the reviewer. This is different. It is a review of this app, on
 * this app's store page, by a customer who paid, and it is the only one.
 * One card, her words, her name, where it came from. It stays in English in
 * every language because it is a quotation.
 */
export function ReviewCard() {
  return (
    <Panel>
      <View style={{ padding: tokens.space.md, gap: tokens.space.sm }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ ...tokens.text.caption, color: tokens.color.green, letterSpacing: 2 }}>★★★★★</Text>
          <Text style={{ ...tokens.text.footnote, color: tokens.color.textFaint }}>
            {t("paywall.review.source")}
          </Text>
        </View>
        <Text style={{ ...tokens.text.body, color: tokens.color.text }}>
          {"“"}
          {t("paywall.review.quote")}
          {"”"}
        </Text>
        <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>{t("paywall.review.name")}</Text>
      </View>
    </Panel>
  );
}
```

`src/paywall/IncludedStrip.tsx`:

```tsx
import { View, Text } from "react-native";
import { tokens } from "../design/tokens";
import { t } from "../i18n";

/** Everything the subscription opens, as a row of quiet chips. The trial
 *  screen's list with the sentences taken off: seven things in two lines,
 *  read in one look, under a legend that says what the list is. */
const GETS = ["reminders", "due", "history", "costs", "garage", "intervals", "export"] as const;

export function IncludedStrip() {
  return (
    <View style={{ gap: tokens.space.sm }}>
      <Text style={{ ...tokens.text.legend, color: tokens.color.textFaint }}>{t("paywall.included")}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: tokens.space.xs + 2 }}>
        {GETS.map((id) => (
          <View
            key={id}
            style={{
              backgroundColor: tokens.color.surface,
              borderColor: tokens.color.hairline,
              borderWidth: 1,
              borderRadius: tokens.radius.pill,
              paddingHorizontal: tokens.space.sm + 2,
              paddingVertical: 4,
            }}
          >
            <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
              {t(`offer.trial.gets.${id}`)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
```

- [ ] **Step 7: Run the screen tests**

Run: `npx jest --selectProjects screens --testPathPattern paywall-screens`
Expected: PASS, 10 tests. If `pressable(tree, label)` finds nothing for the month row, the label is inside a nested `Text`; `JSON.stringify(n.props)` walks children, so check that `PressableScale` forwards `onPress` to the `Pressable` (it does, via `...rest`).

- [ ] **Step 8: Commit**

```bash
git add src/paywall tests/paywall-screens.test.tsx
git commit -m "feat(paywall): plan picker, buy footer, review card"
```

---

### Task 6: The first ask — `app/onboarding/paywall.tsx`

**Files:**
- Modify: `app/onboarding/paywall.tsx` (rewrite)
- Modify: `tests/onboarding-screens.test.tsx` (mocks and the paywall assertions)

**Interfaces:**
- Consumes: `usePlans`, `buy`, `Plan` from `src/purchases/plans`; `restore` from `src/purchases`; `PlanPicker`, `defaultPlan`, `BuyFooter`, `ReviewCard`, `IncludedStrip` from `src/paywall/*`; `useOnboardingFindings`, `nextUp`, `tNamed`, `useAdvance`, `useFinish`, `OnboardingScreen` as today.

- [ ] **Step 1: Update the screen test's mocks and assertions**

In `tests/onboarding-screens.test.tsx`:

1. After the `jest.mock("react-native-purchases", …)` line add:

```ts
// The money screens read the price list through this hook. Fixture plans
// keep the test off the store and make the printed prices assertable.
const mockPlans: Record<string, unknown[] | null> = {
  default: [
    { id: "$rc_annual", period: "year", package: {}, priceString: "$79.99", price: 79.99, currency: "USD", intro: null, perWeek: "$1.54", perMonth: "$6.67", savePct: 49 },
    { id: "$rc_monthly", period: "month", package: {}, priceString: "$9.99", price: 9.99, currency: "USD", intro: null, perWeek: "$2.31", perMonth: "$9.99", savePct: 23 },
    { id: "$rc_weekly", period: "week", package: {}, priceString: "$2.99", price: 2.99, currency: "USD", intro: null, perWeek: "$2.99", perMonth: "$12.96" },
  ],
  discount: [
    { id: "$rc_weekly", period: "week", package: {}, priceString: "$2.99", price: 2.99, currency: "USD", intro: { priceString: "$0.99", price: 0.99, periods: 1 }, perWeek: "$2.99", perMonth: "$12.96" },
  ],
};
const mockBuy = jest.fn(async () => "dismissed" as const);
jest.mock("../src/purchases/plans", () => ({
  usePlans: (offering: string) => ({ plans: mockPlans[offering] ?? null, loading: false, retry: () => {} }),
  buy: (plan: unknown, offering: string) => mockBuy(plan, offering),
  prefetchPlans: () => {},
}));
jest.mock("expo-linking", () => ({ openURL: async () => {} }));
```

2. In the test that asserts `toContain("Keep my car on record")` (search for it): replace that line with `expect(texts(render(OnboardingPaywall))).toContain(t("paywall.cta.year"));`.

3. In `"the paywall names what is bought, and leaves the schedule to the ask"`: replace the body after `const printed = …` with:

```ts
  // The headline is the promise; the three rows evidence it against this car;
  // the price list is on the same screen, not a sheet away.
  expect(printed).toContain("Cars don’t warn you. This does.".replace(/.*/, t("offer.paywall.title")));
  expect(printed.join(" ")).toContain("2014 Ford F-150");
  expect(printed.join(" ")).toContain(t("offer.paywall.point.reminders.title"));
  expect(printed.join(" ")).toContain("$79.99");
  expect(printed.join(" ")).toContain("$1.54");
  expect(printed).toContain(t("paywall.cta.year"));
  expect(printed).toContain(t("offer.paywall.notNow"));
  // The car's dated schedule still belongs to the reminder ask.
  expect(printed).not.toContain(serviceName("Air Filter"));
  expect(printed).not.toContain("Nothing on file");
```

(The first `expect` reduces to `toContain(t("offer.paywall.title"))`; write it that way.)

4. The unnamed/named test near the end (search `expect(unnamed).toContain(t("offer.paywall.title"))`) needs no change.

5. Add a new test after the one edited in 3:

```ts
test("Not now on the paywall goes to the trial, and a buy ends the flow paid", async () => {
  const car = createVehicle({ name: "2014 Ford F-150", year: 2014, odometer: 96500 });
  setOnboardingVehicleId(car.id);

  const tree = render(OnboardingPaywall);
  const notNow = tree.root.findAll(
    (n) => typeof n.props.onPress === "function" && stringsIn(n).includes(t("offer.paywall.notNow"))
  );
  act(() => notNow[notNow.length - 1].props.onPress());
  expect(navigated).toEqual(["/onboarding/offer"]);

  navigated.length = 0;
  mockBuy.mockResolvedValueOnce("purchased");
  const again = render(OnboardingPaywall);
  const cta = again.root.findAll(
    (n) => typeof n.props.onPress === "function" && stringsIn(n).includes(t("paywall.cta.year"))
  );
  await act(async () => {
    await cta[cta.length - 1].props.onPress();
  });
  expect(mockBuy).toHaveBeenCalledWith(expect.objectContaining({ id: "$rc_annual" }), "default");
  expect(navigated.some((to) => to.includes("subscribed") || to.startsWith("replace:"))).toBe(true);
});
```

`stringsIn` and `navigated` already exist in this file. If `useAdvance("paywall")` pushes a different path shape than `/onboarding/offer` in this file's other assertions, match theirs.

- [ ] **Step 2: Run to verify the paywall tests fail**

Run: `npx jest --selectProjects screens --testPathPattern onboarding-screens -t "paywall"`
Expected: FAIL on the assertions that name `paywall.cta.year`, `$79.99`, `offer.paywall.notNow`.

- [ ] **Step 3: Rewrite the screen**

Replace the whole of `app/onboarding/paywall.tsx` with:

```tsx
import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Check } from "../../src/design/Check";
import { tokens } from "../../src/design/tokens";
import { formatDate, t } from "../../src/i18n";
import { restore } from "../../src/purchases";
import { buy, usePlans, type Plan } from "../../src/purchases/plans";
import { PlanPicker, defaultPlan } from "../../src/paywall/PlanPicker";
import { BuyFooter } from "../../src/paywall/BuyFooter";
import { ReviewCard } from "../../src/paywall/ReviewCard";
import { IncludedStrip } from "../../src/paywall/IncludedStrip";
import { recordReviewEvent } from "../../src/review";
import { nextUp } from "../../src/onboarding/plan";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useOnboardingFindings } from "../../src/onboarding/usePlan";
import { tNamed } from "../../src/onboarding";
import { useAdvance, useFinish } from "../../src/onboarding/nav";
import { track } from "../../src/analytics";

/**
 * The first ask, with the price on it.
 *
 * Until 2026-09-16 this screen was the argument and a RevenueCat sheet was
 * the price list, a tap and a median 3.5 seconds away. On the first day with
 * paid traffic 59 people saw that sheet and none bought; 35 more never opened
 * the one after it. The list is drawn here now, under the argument, in the
 * app's own material, so the reader who has just been shown their car's
 * overdue count sees what it costs to fix that without leaving the page.
 *
 * Top to bottom: the promise, three rows that evidence it against this car,
 * what the subscription includes, the one review the app has, the plans, the
 * button. Everything fits without scrolling on a 4.7" screen; a scroll on a
 * paywall is a fold, and what is below a fold is not read.
 *
 * "Not now" is the decline the sheet's close button used to be. It goes to
 * the trial, which is the whole reason the trial exists. There is still no
 * free door.
 */
export default function OnboardingPaywall() {
  const advance = useAdvance("paywall");
  const finish = useFinish();
  const { vehicleName, plan } = useOnboardingFindings();
  const { plans, loading, retry } = usePlans("default");
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Shown once per mount, in the sheet's vocabulary, so the funnel's
  // `paywall_shown → paywall_presented` step keeps meaning "tapped → drawn".
  useEffect(() => {
    track("paywall_shown", { offering: "current" });
  }, []);
  useEffect(() => {
    if (plans) track("paywall_presented", { offering: "current", ms: 0 });
  }, [plans]);

  const chosen: Plan | null =
    plans?.find((p) => p.id === (selected ?? defaultPlan(plans))) ?? null;

  async function onBuy() {
    if (busy || !chosen) return;
    setBusy(true);
    setMsg(null);
    try {
      const outcome = await buy(chosen, "default");
      if (outcome === "purchased") {
        // Recorded, never acted on: nothing in onboarding may ask for a rating
        // (Guideline 5.6.3). This banks the signal for a later happy moment.
        recordReviewEvent("purchase");
        finish("paid");
        return;
      }
      if (outcome === "unavailable") setMsg(t("settings.store.error"));
    } finally {
      setBusy(false);
    }
  }

  async function onRestore() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const found = await restore();
      track("restore_attempted", { source: "onboarding_paywall", found });
      if (found) {
        recordReviewEvent("purchase");
        finish("paid");
        return;
      }
      setMsg(t("settings.restore.none"));
    } catch {
      track("restore_attempted", { source: "onboarding_paywall", found: null });
      setMsg(t("settings.store.error"));
    } finally {
      setBusy(false);
    }
  }

  function onNotNow() {
    track("paywall_closed", { offering: "current", outcome: "dismissed", result: "DECLINED" });
    advance();
  }

  const next = nextUp(plan);
  const dueTitle =
    plan.pastDue > 0
      ? t("offer.paywall.point.due.title", { count: plan.pastDue })
      : t("offer.paywall.point.due.none");
  const dueSubtitle = next?.dueAt
    ? t("offer.paywall.point.due.subtitle", { date: formatDate(next.dueAt) })
    : t("offer.paywall.point.due.noNext");

  const points: { title: string; subtitle: string }[] = [
    {
      title: t("offer.paywall.point.tracked.title", { vehicle: vehicleName }),
      subtitle: t("offer.paywall.point.tracked.subtitle", { count: plan.items.length }),
    },
    { title: dueTitle, subtitle: dueSubtitle },
    {
      title: t("offer.paywall.point.reminders.title"),
      subtitle: t("offer.paywall.point.reminders.subtitle"),
    },
  ];

  return (
    <OnboardingScreen
      route="paywall"
      title={tNamed("offer.paywall.title")}
      subtitle={t("offer.paywall.subtitle")}
      footer={
        <BuyFooter plan={chosen} busy={busy} onBuy={onBuy} onRestore={onRestore}>
          <Pressable
            onPress={onNotNow}
            disabled={busy}
            style={{ alignItems: "center", paddingVertical: tokens.space.xs }}
          >
            <Text style={{ ...tokens.text.legend, color: tokens.color.textMuted }}>
              {t("offer.paywall.notNow")}
            </Text>
          </Pressable>
        </BuyFooter>
      }
    >
      <View style={{ gap: tokens.space.sm + 2 }}>
        {points.map((point) => (
          <View
            key={point.title}
            style={{ flexDirection: "row", alignItems: "flex-start", gap: tokens.space.sm }}
          >
            <View style={{ paddingTop: 1 }}>
              <Check size={14} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...tokens.text.body, fontWeight: "600", color: tokens.color.text }}>
                {point.title}
              </Text>
              <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>{point.subtitle}</Text>
            </View>
          </View>
        ))}
      </View>

      <IncludedStrip />

      <ReviewCard />

      {plans ? (
        <PlanPicker
          plans={plans}
          selected={chosen?.id ?? defaultPlan(plans)}
          onSelect={setSelected}
          layout="rows"
          offering="current"
        />
      ) : (
        <Pressable onPress={retry} disabled={loading} style={{ alignItems: "center", padding: tokens.space.md }}>
          <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
            {loading ? t("paywall.loading") : t("paywall.retry")}
          </Text>
        </Pressable>
      )}

      {msg !== null && (
        <Text style={{ ...tokens.text.caption, color: tokens.color.textFaint }}>{msg}</Text>
      )}
    </OnboardingScreen>
  );
}
```

`settings.restore.none` exists (used by `offer.tsx` today). `OnboardingScreen` lays its children out in a column with `gap`; if the page overflows on a small phone, reduce `ReviewCard`'s quote to two lines with `numberOfLines={3}` on the quote `Text` rather than dropping a section.

- [ ] **Step 4: Run the onboarding screen suite**

Run: `npx jest --selectProjects screens --testPathPattern onboarding-screens`
Expected: PASS for every paywall test. The `offer` tests may still fail on `"No thanks"` (renamed in Task 4) and `"Start my first 7 days"`; those are Task 7's. If the em-dash sweep fails, the offending string is in a catalog you edited in Task 4; fix the catalog.

- [ ] **Step 5: Commit**

```bash
git add app/onboarding/paywall.tsx tests/onboarding-screens.test.tsx
git commit -m "feat(onboarding): draw the price list on the paywall"
```

---

### Task 7: The second ask — `app/onboarding/offer.tsx`

**Files:**
- Modify: `app/onboarding/offer.tsx` (rewrite)
- Modify: `tests/onboarding-screens.test.tsx` (the offer assertions)

**Interfaces:**
- Consumes: as Task 6, plus `useRouter`, `useLocalSearchParams` from `expo-router`, `isGrandfathered` from `src/paywall`, `previousRoute` from `src/onboarding/flow` is not needed (Back is the frame's).

- [ ] **Step 1: Update the offer assertions**

In `tests/onboarding-screens.test.tsx`:

1. `"the second offer promises nothing free and no free app to fall back on"`: `expect(printed).toContain("No thanks");` → `expect(texts(render(OnboardingOffer))).toContain(t("offer.trial.decline"));`. The `/\bfree\b/i` assertion stays; the new decline copy ("I’d rather pay full price") does not contain "free".

2. `"declining the second offer leaves the user on it, with no way out"`: replace every `"No thanks"` with `t("offer.trial.decline")`; replace `expect(after).toContain("Start my first 7 days");` with `expect(after).toContain(t("paywall.cta.week"));`. Add, before the decline tap: `expect(texts(tree).join(" ")).toContain("$0.99");` and `expect(texts(tree).join(" ")).toContain(t("paywall.then", { price: "$2.99" }));`.

   Then change what the decline does: today the test expects the decline to keep the user on the screen. The new decline goes **back to the paywall** on the first tap (spec), and the wall behaviour applies only when relaunched with `walled=1`. So:
   - After the tap, assert `expect(navigated).toEqual(["back"]);` and delete the assertions that `No thanks`/Back disappear and Restore appears from this test.
   - Add a new test for the wall:

```ts
test("relaunched with no entitlement, the offer is the wall: no back, restore in the link's place", () => {
  mockParams = { walled: "1" };
  try {
    const tree = render(OnboardingOffer);
    const printed = texts(tree);
    expect(printed).not.toContain(t("offer.trial.decline"));
    expect(printed).not.toContain("‹ Back");
    expect(printed).toContain(t("paywall.restore"));
    expect(printed).toContain(t("paywall.cta.week"));
    expect(printed.join(" ")).toContain("Your first 7 days cost less.");
  } finally {
    mockParams = {};
  }
});
```

   and make the `expo-router` mock's `useLocalSearchParams` read a mutable: change `useLocalSearchParams: () => ({}),` to `useLocalSearchParams: () => mockParams,` and declare `let mockParams: Record<string, string> = {};` above the `jest.mock("expo-router", …)` call (it must be prefixed `mock` to be allowed inside the factory).

3. `"the second offer does not open with the way out"`: unchanged. The renewal line now on this screen is `paywall.legal.intro`, which does not say "cancel in settings"; the assertion `not.toMatch(/cancel in settings/i)` keeps passing.

- [ ] **Step 2: Run to verify the offer tests fail**

Run: `npx jest --selectProjects screens --testPathPattern onboarding-screens -t "offer"`
Expected: FAIL on `paywall.cta.week`, `$0.99`, `navigated toEqual ["back"]`.

- [ ] **Step 3: Rewrite the screen**

Replace the whole of `app/onboarding/offer.tsx` with:

```tsx
import { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ListRow } from "../../src/design/ListRow";
import { Panel } from "../../src/design/Surface";
import { tokens } from "../../src/design/tokens";
import { t } from "../../src/i18n";
import { INTRO_DAYS, restore } from "../../src/purchases";
import { buy, usePlans, type Plan } from "../../src/purchases/plans";
import { PlanPicker, defaultPlan } from "../../src/paywall/PlanPicker";
import { BuyFooter } from "../../src/paywall/BuyFooter";
import { recordReviewEvent } from "../../src/review";
import { isGrandfathered } from "../../src/paywall";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { tNamed } from "../../src/onboarding";
import { useFinish } from "../../src/onboarding/nav";
import { track } from "../../src/analytics";

/** The three moments a trial has, in the order the user meets them. */
const STEPS = ["now", "runs", "ends"] as const;

/**
 * The second ask, and, once there is nothing left to ask, the wall.
 *
 * The first paywall asks for money at full price. This one sells the product
 * that carries the App Store introductory offer: a cheap first week, then it
 * renews. The split is the whole reason there are two screens: a trial shown
 * first is given to everyone who would have paid, and a trial shown to the
 * people walking out is the cheapest conversion in the funnel.
 *
 * The price is drawn here now (see paywall.tsx for why the sheet went): one
 * wide card, the standard price struck through beside the introductory one,
 * "then {price} per week" under it. When StoreKit says this customer is not
 * eligible, the card shows the plain weekly price and no strike-through, so
 * nothing on the glass promises what Apple's sheet will not honour.
 *
 * "I’d rather pay full price" is the soft decline: it is a true sentence, and
 * it goes back to the paywall, which is the screen that sells full price.
 *
 * Relaunched with `walled=1` (a lapsed or never-subscribed install that
 * finished onboarding), the same screen is the wall: no Back, no decline, and
 * Restore where the decline was, because a wall has to carry the way in for
 * the subscriber whose receipt has not synced (Guideline 3.1.1).
 */
export default function OnboardingOffer() {
  const router = useRouter();
  const finish = useFinish();
  const { walled } = useLocalSearchParams<{ walled?: string }>();
  const relaunched = walled === "1";

  const { plans, loading, retry } = usePlans("discount");
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    track("paywall_shown", { offering: "discount" });
  }, []);
  useEffect(() => {
    if (plans) track("paywall_presented", { offering: "discount", ms: 0 });
  }, [plans]);

  const chosen: Plan | null =
    plans?.find((p) => p.id === (selected ?? defaultPlan(plans))) ?? null;

  /** Where a successful purchase goes. A relaunched subscriber finished
   *  onboarding long ago and must not be counted as a completion. */
  function paid(exit: "trial" | "paid") {
    if (relaunched) {
      router.replace("/");
      return;
    }
    finish(exit);
  }

  async function onBuy() {
    if (busy || !chosen) return;
    setBusy(true);
    setMsg(null);
    try {
      const outcome = await buy(chosen, "discount");
      if (outcome === "purchased") {
        recordReviewEvent("purchase");
        paid("trial");
        return;
      }
      if (outcome === "unavailable") setMsg(t("settings.store.error"));
    } finally {
      setBusy(false);
    }
  }

  function onDecline() {
    // The last decision in the flow, and the one the funnel could not see.
    track("offer_declined", { walled: !isGrandfathered(), relaunched });
    if (isGrandfathered()) {
      finish("free");
      return;
    }
    router.back();
  }

  async function onRestore() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const found = await restore();
      track("restore_attempted", { source: "onboarding_offer", found });
      if (found) {
        recordReviewEvent("purchase");
        paid("paid");
        return;
      }
      setMsg(t("settings.restore.none"));
    } catch {
      track("restore_attempted", { source: "onboarding_offer", found: null });
      setMsg(t("settings.store.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <OnboardingScreen
      route="offer"
      title={tNamed("offer.trial.title", { count: INTRO_DAYS })}
      hideBack={relaunched}
      footer={
        <BuyFooter plan={chosen} busy={busy} onBuy={onBuy} onRestore={onRestore}>
          {!relaunched && (
            <Pressable
              onPress={onDecline}
              disabled={busy}
              style={{ alignItems: "center", paddingVertical: tokens.space.xs }}
            >
              <Text style={{ ...tokens.text.legend, color: tokens.color.textMuted }}>
                {t("offer.trial.decline")}
              </Text>
            </Pressable>
          )}
        </BuyFooter>
      }
    >
      {plans ? (
        <PlanPicker
          plans={plans}
          selected={chosen?.id ?? defaultPlan(plans)}
          onSelect={setSelected}
          layout="cards"
          offering="discount"
        />
      ) : (
        <Pressable onPress={retry} disabled={loading} style={{ alignItems: "center", padding: tokens.space.md }}>
          <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
            {loading ? t("paywall.loading") : t("paywall.retry")}
          </Text>
        </Pressable>
      )}

      <Text style={{ ...tokens.text.legend, color: tokens.color.textFaint }}>
        {t("offer.trial.legend")}
      </Text>
      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.sm }}>
          {STEPS.map((step) => (
            <ListRow
              key={step}
              title={t(`offer.trial.${step}.title`)}
              subtitle={t(`offer.trial.${step}.body`)}
            />
          ))}
        </View>
      </Panel>

      {msg !== null && (
        <Text style={{ ...tokens.text.caption, color: tokens.color.textFaint }}>{msg}</Text>
      )}
    </OnboardingScreen>
  );
}
```

The `declined` state and the `GETS` list are gone: the decline navigates, and the feature list is on the paywall as `IncludedStrip`. `hasOffering` is no longer imported here; `app/_layout.tsx` still uses it.

- [ ] **Step 4: Run the onboarding screen suite**

Run: `npx jest --selectProjects screens --testPathPattern onboarding-screens`
Expected: PASS, every test. The `“no screen in the flow prints an em or en dash”` sweep covers both rewritten screens.

- [ ] **Step 5: Commit**

```bash
git add app/onboarding/offer.tsx tests/onboarding-screens.test.tsx
git commit -m "feat(onboarding): draw the trial price on the offer"
```

---

### Task 8: The full-screen route, boot prefetch, and the other call sites — `app/paywall.tsx`, `app/_layout.tsx`

**Files:**
- Create: `app/paywall.tsx`
- Modify: `app/_layout.tsx` (boot line, route registration)
- Modify: `tests/root-layout.test.tsx` (mock)
- Test: `tests/paywall-route.test.tsx`

**Interfaces:**
- Consumes: `settlePaywall` from `src/paywall/present`; `usePlans`, `buy` from `src/purchases/plans`; `restore` from `src/purchases`; `Screen` from `src/design/Screen`; the Task 5 components.
- `app/index.tsx`, `app/settings.tsx`, `app/insights.tsx`, `app/winback.tsx`, `app/trial.tsx` are **not edited**: they call `presentPaywall()` / `presentOffering(DISCOUNT_OFFERING)`, which Task 3 rewired.

- [ ] **Step 1: Write the failing route test**

`tests/paywall-route.test.tsx`:

```tsx
import { createElement } from "react";
import { act } from "react";
import TestRenderer from "react-test-renderer";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const navigated: string[] = [];
let mockParams: Record<string, string> = { offering: "default", source: "settings" };
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: () => navigated.push("back"), canGoBack: () => true }),
  useLocalSearchParams: () => mockParams,
  router: { push: jest.fn() },
}));
jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => {}), notificationAsync: jest.fn(async () => {}), NotificationFeedbackType: { Warning: "warning" } }));
jest.mock("expo-linking", () => ({ openURL: async () => {} }));
jest.mock("react-native-purchases", () => ({ __esModule: true, default: {} }));
jest.mock("react-native-purchases-ui", () => ({ __esModule: true, default: {} }));
const mockTrack = jest.fn();
jest.mock("../src/analytics", () => ({ track: (e: string, p?: unknown) => mockTrack(e, p) }));
jest.mock("../src/purchases", () => ({ restore: async () => false, DISCOUNT_OFFERING: "discount", INTRO_DAYS: 7 }));
jest.mock("../src/review", () => ({ recordReviewEvent: jest.fn() }));

const settled: string[] = [];
jest.mock("../src/paywall/present", () => ({ settlePaywall: (r: string) => settled.push(r) }));

const YEAR = { id: "$rc_annual", period: "year", package: {}, priceString: "$79.99", price: 79.99, currency: "USD", intro: null, perWeek: "$1.54", perMonth: "$6.67", savePct: 49 };
const WEEK = { id: "$rc_weekly", period: "week", package: {}, priceString: "$2.99", price: 2.99, currency: "USD", intro: null, perWeek: "$2.99", perMonth: "$12.96" };
const mockBuy = jest.fn(async () => "dismissed");
jest.mock("../src/purchases/plans", () => ({
  usePlans: () => ({ plans: [YEAR, WEEK], loading: false, retry: () => {} }),
  buy: (p: unknown, o: string) => mockBuy(p, o),
}));

import PaywallRoute from "../app/paywall";
import { t } from "../src/i18n";

function render() {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(createElement(PaywallRoute));
  });
  return tree;
}
function texts(tree: TestRenderer.ReactTestRenderer): string[] {
  return tree.root
    .findAllByType("Text" as never)
    .map((n) => (Array.isArray(n.props.children) ? n.props.children.join("") : String(n.props.children ?? "")))
    .filter(Boolean);
}
function press(tree: TestRenderer.ReactTestRenderer, label: string) {
  const hits = tree.root.findAll(
    (n) => typeof n.props.onPress === "function" && JSON.stringify(n.props).includes(label)
  );
  return hits[hits.length - 1].props.onPress();
}

beforeEach(() => {
  navigated.length = 0;
  settled.length = 0;
  mockTrack.mockReset();
  mockBuy.mockReset();
  mockBuy.mockResolvedValue("dismissed");
});

test("draws the plans, the review, and the footer, and reports the show", () => {
  const printed = texts(render());
  expect(printed).toContain(t("paywall.title"));
  expect(printed.join(" ")).toContain("$79.99");
  expect(printed.join(" ")).toContain("surpasses them all");
  expect(printed).toContain(t("paywall.cta.year"));
  expect(mockTrack).toHaveBeenCalledWith("paywall_shown", { offering: "current" });
  expect(mockTrack).toHaveBeenCalledWith("paywall_presented", { offering: "current", ms: 0 });
});

test("closing settles the caller as dismissed and leaves", () => {
  const tree = render();
  act(() => press(tree, t("paywall.close")));
  expect(settled).toEqual(["dismissed"]);
  expect(navigated).toEqual(["back"]);
  expect(mockTrack).toHaveBeenCalledWith("paywall_closed", {
    offering: "current",
    outcome: "dismissed",
    result: "DECLINED",
  });
});

test("a purchase settles the caller as purchased and leaves", async () => {
  mockBuy.mockResolvedValueOnce("purchased");
  const tree = render();
  await act(async () => {
    await press(tree, t("paywall.cta.year"));
  });
  expect(mockBuy).toHaveBeenCalledWith(expect.objectContaining({ id: "$rc_annual" }), "default");
  expect(settled).toEqual(["purchased"]);
  expect(navigated).toEqual(["back"]);
});

test("a dismissed Apple sheet stays on the screen", async () => {
  const tree = render();
  await act(async () => {
    await press(tree, t("paywall.cta.year"));
  });
  expect(settled).toEqual([]);
  expect(navigated).toEqual([]);
});

test("unmounting without an answer settles as dismissed exactly once", () => {
  const tree = render();
  act(() => tree.unmount());
  expect(settled).toEqual(["dismissed"]);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx jest --selectProjects screens --testPathPattern paywall-route`
Expected: FAIL — `Cannot find module '../app/paywall'`.

- [ ] **Step 3: Write the route**

`app/paywall.tsx`:

```tsx
import { useEffect, useRef, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "../src/design/Screen";
import { tokens } from "../src/design/tokens";
import { t } from "../src/i18n";
import { restore } from "../src/purchases";
import { buy, usePlans, type OfferingId, type Plan, type PurchaseResult } from "../src/purchases/plans";
import { PlanPicker, defaultPlan } from "../src/paywall/PlanPicker";
import { BuyFooter } from "../src/paywall/BuyFooter";
import { ReviewCard } from "../src/paywall/ReviewCard";
import { IncludedStrip } from "../src/paywall/IncludedStrip";
import { settlePaywall } from "../src/paywall/present";
import { recordReviewEvent } from "../src/review";
import { track } from "../src/analytics";

/**
 * The paywall every feature gate opens.
 *
 * Add a second vehicle, edit intervals, unlock fuel insights, "Try Pro" in
 * the menu, the win-back screen: each used to await a RevenueCat sheet. They
 * await this screen now, through `src/paywall/present`, and read the answer
 * exactly as before. Purchases here never touch onboarding state; that is
 * the two onboarding screens' job.
 *
 * `offering=discount` draws the introductory weekly plan (the "Try Pro" and
 * win-back paths); anything else draws the default set.
 *
 * Whatever way this screen leaves, the caller hears once. A close, a swipe
 * back, a purchase, and an unmount from a navigation reset all settle the
 * same promise, and `answered` makes the second and later of those no-ops.
 */
export default function PaywallRoute() {
  const router = useRouter();
  const params = useLocalSearchParams<{ offering?: string; source?: string }>();
  const offering: OfferingId = params.offering === "discount" ? "discount" : "default";
  const label = offering === "default" ? "current" : "discount";

  const { plans, loading, retry } = usePlans(offering);
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const answered = useRef(false);

  useEffect(() => {
    track("paywall_shown", { offering: label });
  }, [label]);
  useEffect(() => {
    if (plans) track("paywall_presented", { offering: label, ms: 0 });
  }, [plans, label]);

  function settle(result: PurchaseResult) {
    if (answered.current) return;
    answered.current = true;
    settlePaywall(result);
  }

  // A screen popped by a gesture or a reset never ran `onClose`; the caller
  // still has to hear something, or its `await` never returns.
  useEffect(() => () => settle("dismissed"), []);

  const chosen: Plan | null =
    plans?.find((p) => p.id === (selected ?? defaultPlan(plans))) ?? null;

  function leave(result: PurchaseResult) {
    settle(result);
    if (router.canGoBack()) router.back();
  }

  function onClose() {
    track("paywall_closed", { offering: label, outcome: "dismissed", result: "DECLINED" });
    leave("dismissed");
  }

  async function onBuy() {
    if (busy || !chosen) return;
    setBusy(true);
    setMsg(null);
    try {
      const outcome = await buy(chosen, offering);
      if (outcome === "purchased") {
        recordReviewEvent("purchase");
        leave("purchased");
        return;
      }
      if (outcome === "unavailable") setMsg(t("settings.store.error"));
    } finally {
      setBusy(false);
    }
  }

  async function onRestore() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const found = await restore();
      track("restore_attempted", { source: `paywall_${params.source ?? "unknown"}`, found });
      if (found) {
        recordReviewEvent("purchase");
        leave("purchased");
        return;
      }
      setMsg(t("settings.restore.none"));
    } catch {
      track("restore_attempted", { source: `paywall_${params.source ?? "unknown"}`, found: null });
      setMsg(t("settings.store.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      edges={["top", "bottom"]}
      footer={<BuyFooter plan={chosen} busy={busy} onBuy={onBuy} onRestore={onRestore} />}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ ...tokens.text.title, color: tokens.color.text }}>{t("paywall.title")}</Text>
        <Pressable
          onPress={onClose}
          disabled={busy}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={t("paywall.close")}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: tokens.color.surfaceHi,
            borderWidth: 1,
            borderColor: tokens.color.hairline,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: tokens.color.text, fontSize: 16, lineHeight: 18 }}>✕</Text>
        </Pressable>
      </View>

      <IncludedStrip />
      <ReviewCard />

      {plans ? (
        <PlanPicker
          plans={plans}
          selected={chosen?.id ?? defaultPlan(plans)}
          onSelect={setSelected}
          offering={label}
        />
      ) : (
        <Pressable onPress={retry} disabled={loading} style={{ alignItems: "center", padding: tokens.space.md }}>
          <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
            {loading ? t("paywall.loading") : t("paywall.retry")}
          </Text>
        </Pressable>
      )}

      {msg !== null && (
        <Text style={{ ...tokens.text.caption, color: tokens.color.textFaint }}>{msg}</Text>
      )}
    </Screen>
  );
}
```

The close test finds the pressable by `accessibilityLabel` (it is in `props`, so `JSON.stringify(n.props)` matches). `Screen` accepts `title`; it is not passed because the close glyph sits on the title row.

- [ ] **Step 4: Register the route and the prefetch**

In `app/_layout.tsx`:

1. Add `import { prefetchPlans } from "../src/purchases/plans";` beside the `../src/purchases` import.
2. Immediately after `boot("purchases", initPurchases);` add:

```ts
    // Prices in hand before any paywall mounts. The sheet this replaced
    // fetched on the tap and took a median 3.5 s to appear.
    boot("plans", prefetchPlans);
```

3. Find the `<Stack>` (or `<Stack.Screen>` list) and add a screen for the route, matching how `winback` or `trial` is registered:

```tsx
<Stack.Screen name="paywall" options={{ headerShown: false, presentation: "fullScreenModal" }} />
```

If routes are registered with `screenOptions` only and no explicit `Stack.Screen` list, add this one `Stack.Screen` inside the `<Stack>`.

4. In `tests/root-layout.test.tsx`, beside its `jest.mock("../src/purchases", …)`, add:

```ts
jest.mock("../src/purchases/plans", () => ({ prefetchPlans: jest.fn() }));
```

- [ ] **Step 5: Run the route test, the layout test, and type-check**

Run: `npx jest --selectProjects screens --testPathPattern 'paywall-route|root-layout'`
Expected: PASS.

Run: `npx tsc --noEmit`
Expected: no errors. A `presentation` type error means this expo-router version spells it `"fullScreenModal"` on `Stack.Screen`'s `options` under `native-stack`; match what `winback` uses.

- [ ] **Step 6: Commit**

```bash
git add app/paywall.tsx app/_layout.tsx tests/paywall-route.test.tsx tests/root-layout.test.tsx
git commit -m "feat(paywall): full-screen route for every gate"
```

---

### Task 9: Whole suite, dead code, device check

**Files:**
- Modify: `src/purchases/index.ts` (remove what nothing calls), `package.json` only if `react-native-purchases-ui` is now unused (it is not: Customer Center).

- [ ] **Step 1: Sweep for dead references**

Run:

```bash
grep -rn "PAYWALL_RESULT\|presentPaywallIfNeeded\|RevenueCatUI.presentPaywall\|offer.paywall.cta\|hasOffering" app src tests
```

Expected: `hasOffering` only in `src/purchases/index.ts` and `app/_layout.tsx`; nothing else. Delete any survivor.

- [ ] **Step 2: Full suite and types**

Run: `npx tsc --noEmit && npx jest`
Expected: both projects PASS. `tests/purchases-guard.test.ts` has once shown a load flake (a suite crash with 0 failing tests); rerun once before investigating.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore(paywall): retire the sheet's last references"
```

Skip the commit if Step 1 removed nothing.

- [ ] **Step 4: Device check (dev build, sandbox account)**

1. Fresh install. Walk to `paywall`: prices appear with the screen (no spinner beyond the first frame after boot). Three rows, yearly pre-selected with "Best value", "Save 49%" (or whatever the live tiers give). Tap monthly: ring moves, haptic, `paywall_plan_selected` in PostHog live events. Tap "Continue with monthly": Apple's sheet; cancel → back on the screen, `paywall_closed{CANCELLED}`.
2. "Not now" → `offer`. One wide card: `$2.99` struck through, `$0.99`, "then $2.99 per week". On a sandbox account that has used the intro, no strike-through and plain `$2.99`.
3. "I’d rather pay full price" → back on `paywall`.
4. Buy the weekly on `offer` with a sandbox account → garage, `onboarding_completed{exit:"trial"}`, `subscription_success`, RevenueCat customer shows the purchase.
5. Settings → Manage subscription still opens Customer Center. Settings → "Try Pro" opens `/paywall?offering=discount` full screen; ✕ returns.
6. Garage → Add vehicle as a non-Pro: `/paywall` opens; ✕ returns to the garage with no navigation.
7. Switch the phone to German: every string on both screens is German except the review.

- [ ] **Step 5: Ship**

This is JS-only and ships as an OTA: `npm run ota -- --message "custom paywall"` per the repo's `scripts/ota.mjs` gating. Watch PostHog for `paywall_presented.ms` (should be ~0) and `paywall_stalled` (should vanish), then the `paywall_shown → paywall_closed{purchased}` rate against the 2026-09-16 baseline (0 / 59 full price, 1 / 23 discount, real).

---

## Self-review

**Spec coverage.** `plans.ts` load/derive/eligibility/buy/events: Tasks 1–2. `presentPaywall`/`presentOffering` kept and rerouted, RC UI paywall removed, `INTRO_DAYS` docblock fixed: Task 3. All copy keys incl. review, 16 locales, `offer.trial.decline` reworded, `offer.paywall.title` reworded: Task 4. `PlanPicker` cards/rows/strike-through/best-value/save, `BuyFooter` CTA-by-period/legal line/Terms/Privacy/Restore, `ReviewCard`, chip strip, `legal.ts`: Task 5. Paywall screen with three findings rows, strip, review, rows picker, "Not now" → offer, buy → `finish("paid")`: Task 6. Offer screen with cards picker, intro strike-through, decline → back, wall on `walled=1`: Task 7. `/paywall` route with close, promise settle on every exit, `prefetchPlans` at boot, route registration, five call sites untouched: Task 8. Compliance test (BuyFooter `test.each`), em-dash sweep, i18n parity, plan math, bridge: Tasks 2/4/5. Rollout 100 % and PostHog comparison: Task 9.

**Placeholder scan.** `"<English quote, verbatim>"` in Task 4 is an explicit instruction to paste the English string, stated once above the catalogs; no other placeholders.

**Type consistency.** `Plan`, `OfferingId` (`"default" | "discount"`), `PurchaseResult` (`"purchased" | "dismissed" | "unavailable"`), `loadPlans(offering, locale?)`, `usePlans(offering) → {plans, loading, retry}`, `buy(plan, offering)`, `openPaywall(offering, source)`, `settlePaywall(result)`, `PlanPicker({plans, selected, onSelect, layout?, offering: "current"|"discount"})`, `defaultPlan(plans) → id`, `BuyFooter({plan, busy, onBuy, onRestore, children?})` are used with the same shapes in every task. The event `offering` property uses the sheet's vocabulary (`"current"` / `"discount"`) everywhere; the `OfferingId` type uses `"default"` / `"discount"` and is mapped by `offeringLabel` in `plans.ts` and by `label` in the screens.
