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
