// Shaping is arithmetic on what StoreKit hands back. No SDK is reached here;
// the offering is a fixture, and `react-native-purchases` is stubbed so the
// module can be imported under ts-jest.
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
jest.mock("react-native", () => ({
  AppState: { currentState: "active", addEventListener: () => ({ remove() {} }) },
}));
jest.mock("react-native-purchases-ui", () => ({
  __esModule: true,
  default: {},
}));
const mockTrack = jest.fn();
jest.mock("../src/analytics", () => ({ track: (e: string, p?: unknown) => mockTrack(e, p) }));

import type { PurchasesOffering, PurchasesPackage } from "react-native-purchases";
import { loadPlans, buy, prefetchPlans, resetPlansForTests, shapePlans } from "../src/purchases/plans";

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

  test("concurrent calls for different locales each fetch and cache their own", async () => {
    const [enUS, enGB] = await Promise.all([
      loadPlans("default", "en-US"),
      loadPlans("default", "en-GB"),
    ]);
    expect(getOfferings).toHaveBeenCalledTimes(2);
    expect(enUS?.find((p) => p.period === "year")?.perWeek).toBe("$1.54");
    expect(enGB?.find((p) => p.period === "year")?.perWeek).toBe("US$1.54");
  });

  test("treats an unknown eligibility as eligible and an ineligible one as not", async () => {
    checkEligibility.mockResolvedValueOnce({ pro_weekly: { status: 0, description: "" } });
    expect((await loadPlans("discount", "en-US"))?.[0].intro).not.toBeNull();
    resetPlansForTests();
    checkEligibility.mockResolvedValueOnce({ pro_weekly: { status: 1, description: "" } });
    expect((await loadPlans("discount", "en-US"))?.[0].intro).toBeNull();
  });

  test("an eligibility call that throws is treated as UNKNOWN, not ineligible", async () => {
    // The docblock on `eligibleProducts` argues UNKNOWN (offline) should be
    // treated as eligible; a thrown call is the same "could not ask" case and
    // must not quietly hide the intro price instead.
    checkEligibility.mockRejectedValueOnce(new Error("offline"));
    const plans = await loadPlans("discount", "en-US");
    expect(plans).toHaveLength(1);
    expect(plans?.[0].intro).not.toBeNull();
  });

  test("an offering with no packages the picker can label is null, not an empty list", async () => {
    const unusable = offering([
      pkg("$rc_lifetime", {
        identifier: "pro_life",
        price: 199,
        priceString: "$199",
        currencyCode: "USD",
        subscriptionPeriod: null as unknown as string,
      }),
    ]);
    getOfferings.mockResolvedValue({ current: unusable, all: { default: unusable } });
    expect(await loadPlans("default", "en-US")).toBeNull();
    expect(mockTrack).toHaveBeenCalledWith("paywall_unavailable", { offering: "current" });
  });

  test("a null offering is not cached, so a retry refetches once the store has it", async () => {
    getOfferings.mockResolvedValueOnce({ current: USD, all: { default: USD } });
    expect(await loadPlans("discount", "en-US")).toBeNull();
    expect(mockTrack).toHaveBeenCalledWith("paywall_unavailable", { offering: "discount" });

    getOfferings.mockResolvedValueOnce({ current: USD, all: { default: USD, discount: DISCOUNT } });
    const disc = await loadPlans("discount", "en-US");
    expect(disc?.map((p) => p.id)).toEqual(["$rc_weekly"]);
    expect(getOfferings).toHaveBeenCalledTimes(2);
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

describe("prefetchPlans", () => {
  test("a failing store at boot tracks nothing; nobody asked for a paywall yet", async () => {
    getOfferings.mockRejectedValueOnce(new Error("no network"));
    prefetchPlans();
    // Flush the microtask queue `loadPlans`'s catch runs on.
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(mockTrack).not.toHaveBeenCalled();
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
    // The sale, reported once, from the transaction. It used to come from a
    // mount effect on `/subscribed` — a screen a restore reaches too — and the
    // funnel counted seven subscribers against a ledger showing two.
    expect(mockTrack.mock.calls.filter((c) => c[0] === "subscription_success")).toEqual([
      ["subscription_success", { offering: "current", plan: "$rc_annual", pro: true }],
    ]);
  });

  test("a purchase the entitlement does not reflect is still a purchase, and reported", async () => {
    const [year] = (await loadPlans("default", "en-US"))!;
    purchasePackage.mockResolvedValueOnce({ customerInfo: FREE, productIdentifier: "pro_annual" });
    getCustomerInfo.mockResolvedValueOnce(FREE);
    await expect(buy(year, "default")).resolves.toBe("purchased");
    expect(mockTrack).toHaveBeenCalledWith("purchase_without_entitlement", { offering: "current", pro: false });
    // A sale the dashboard cannot see is still a sale: the disagreement rides
    // on the event rather than suppressing it.
    expect(mockTrack).toHaveBeenCalledWith("subscription_success", {
      offering: "current",
      plan: "$rc_annual",
      pro: false,
    });
  });

  test.each([
    ["dismissed", Object.assign(new Error("cancelled"), { userCancelled: true })],
    ["unavailable", new Error("store down")],
  ] as const)("a purchase that ends %s is not a sale", async (_outcome, error) => {
    const [year] = (await loadPlans("default", "en-US"))!;
    purchasePackage.mockRejectedValueOnce(error);
    await buy(year, "default");
    expect(mockTrack.mock.calls.map((c) => c[0])).not.toContain("subscription_success");
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
