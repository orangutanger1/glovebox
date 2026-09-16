/**
 * The one thing the paywall module must never do.
 *
 * `RevenueCatUI.presentPaywall` reaches `Purchases.shared` on the native side,
 * and reading that singleton before `configure` is a Swift `fatalError`: the
 * process dies, no JavaScript exception is raised, and the app closes on the
 * tap with nothing to show for it. Every build that ships without
 * `EXPO_PUBLIC_RC_IOS_KEY` inlined — a native build or an OTA update published
 * without the environment that holds it — reaches that line. So the guard is
 * the contract, and this file is what stops it being refactored away.
 */
const isConfigured = jest.fn(async () => true);
const presentPaywall = jest.fn(async (_params?: unknown) => "CANCELLED");
const presentPaywallIfNeeded = jest.fn(async (_params?: unknown) => "CANCELLED");
const presentCustomerCenter = jest.fn(async (_params?: unknown) => {});
const getOfferings = jest.fn(async () => ({ all: {} }));
type Info = { entitlements: { active: Record<string, unknown> }; activeSubscriptions: string[] };
const FREE: Info = { entitlements: { active: {} }, activeSubscriptions: [] };
const PRO: Info = { entitlements: { active: { pro: {} } }, activeSubscriptions: ["pro_monthly"] };
/** A live receipt for a product nobody attached to the entitlement. */
const ORPHAN: Info = { entitlements: { active: {} }, activeSubscriptions: ["pro_weekly"] };
const getCustomerInfo = jest.fn(async (): Promise<Info> => FREE);
const restorePurchases = jest.fn(async (): Promise<Info> => FREE);

jest.mock("react-native-purchases", () => ({
  __esModule: true,
  default: {
    isConfigured: () => isConfigured(),
    getOfferings: () => getOfferings(),
    getCustomerInfo: () => getCustomerInfo(),
    restorePurchases: () => restorePurchases(),
    setLogLevel: jest.fn(),
    configure: jest.fn(),
  },
  LOG_LEVEL: { DEBUG: "debug", ERROR: "error" },
}));

jest.mock("react-native-purchases-ui", () => ({
  __esModule: true,
  default: {
    presentPaywall: (params: unknown) => presentPaywall(params),
    presentPaywallIfNeeded: (params: unknown) => presentPaywallIfNeeded(params),
    presentCustomerCenter: (params: unknown) => presentCustomerCenter(params),
  },
  PAYWALL_RESULT: {
    PURCHASED: "PURCHASED",
    RESTORED: "RESTORED",
    CANCELLED: "CANCELLED",
    NOT_PRESENTED: "NOT_PRESENTED",
    ERROR: "ERROR",
  },
}));

/**
 * `react-native` itself, because the stall watchdog reads `AppState`.
 *
 * This project is the `logic` one: ts-jest in plain Node, with none of Expo's
 * transforms, so the real module is a syntax error before it is anything else.
 * The mock is a real state machine rather than a stub — the watchdog's whole
 * job is to tell "the app was awake and the sheet never came" apart from "the
 * user switched away", and a listener that never fires cannot test that.
 */
const mockAppState: {
  currentState: string;
  listeners: ((next: string) => void)[];
} = { currentState: "active", listeners: [] };

jest.mock("react-native", () => ({
  AppState: {
    get currentState() {
      return mockAppState.currentState;
    },
    addEventListener: (_event: string, handler: (next: string) => void) => {
      mockAppState.listeners.push(handler);
      return {
        remove: () => {
          mockAppState.listeners = mockAppState.listeners.filter((l) => l !== handler);
        },
      };
    },
  },
}));

/** Drives the mock the way iOS would: set the state, then notify. */
function appStateChange(next: string): void {
  mockAppState.currentState = next;
  for (const listener of [...mockAppState.listeners]) listener(next);
}

const mockTrack = jest.fn();
jest.mock("../src/analytics", () => ({ track: (...args: unknown[]) => mockTrack(...args) }));

import {
  isPro,
  presentCustomerCenter as openCustomerCenter,
  presentOffering,
  presentPaywall as gatePaywall,
  proFrom,
  restore,
} from "../src/purchases";

beforeEach(() => {
  isConfigured.mockClear();
  presentPaywall.mockClear();
  presentPaywallIfNeeded.mockClear();
  presentCustomerCenter.mockClear();
  mockTrack.mockClear();
  getCustomerInfo.mockReset().mockResolvedValue(FREE);
  restorePurchases.mockReset().mockResolvedValue(FREE);
  mockAppState.currentState = "active";
  mockAppState.listeners = [];
});

/** The events the module reported, in order, by name. */
function tracked(): string[] {
  return mockTrack.mock.calls.map((call) => call[0] as string);
}

test("an unconfigured SDK is never handed to the native paywall", async () => {
  isConfigured.mockResolvedValueOnce(false);

  await expect(presentOffering()).resolves.toBe("unavailable");
  expect(presentPaywall).not.toHaveBeenCalled();
});

test("nor to the entitlement gate, nor to Customer Center", async () => {
  isConfigured.mockResolvedValue(false);

  await expect(gatePaywall()).resolves.toBe(false);
  await openCustomerCenter();

  expect(presentPaywallIfNeeded).not.toHaveBeenCalled();
  expect(presentCustomerCenter).not.toHaveBeenCalled();

  isConfigured.mockResolvedValue(true);
});

test("a configured SDK still presents, and reports what came back", async () => {
  await expect(presentOffering()).resolves.toBe("dismissed");
  expect(presentPaywall).toHaveBeenCalledTimes(1);
});

test("an SDK that cannot answer whether it is configured is treated as unconfigured", async () => {
  // The RN bridge throws rather than resolving when the native module is
  // missing entirely, which is the same situation with a worse error.
  isConfigured.mockRejectedValueOnce(new Error("native module not linked"));

  await expect(presentOffering()).resolves.toBe("unavailable");
  expect(presentPaywall).not.toHaveBeenCalled();
});

/**
 * The stall watchdog, and the false positive that made a fixed paywall read as
 * still broken.
 *
 * On 2026-09-03 one user emitted `paywall_shown` at 02:51:47, `paywall_stalled`
 * eight seconds later, backgrounded the app at 02:52:47, came back at 02:54:50
 * and got `paywall_presented` three seconds after that. StoreKit will not put a
 * sheet over a backgrounded app, so that is a slow sheet, not a missing one —
 * and counting it as a stall is what kept the ad budget throttled against a bug
 * that had already been fixed.
 */
describe("the paywall stall watchdog", () => {
  /** A presentation that stays pending until the test decides otherwise. */
  function pendingPaywall(): { settle: () => void } {
    let release: (value: string) => void = () => {};
    presentPaywall.mockImplementationOnce(
      () => new Promise<string>((resolve) => (release = resolve))
    );
    return { settle: () => release("CANCELLED") };
  }

  /**
   * Runs the microtasks between the call and the sheet being asked for.
   *
   * `presentOffering` awaits the configured check first, so the watchdog's
   * timer does not exist yet on the tick the call returns — advancing fake
   * timers before this has run advances past nothing.
   */
  async function untilPresenting(): Promise<void> {
    for (let tick = 0; tick < 20 && presentPaywall.mock.calls.length === 0; tick += 1) {
      await Promise.resolve();
    }
    expect(presentPaywall).toHaveBeenCalled();
  }

  test("reports a sheet that never came up while the app was awake", async () => {
    jest.useFakeTimers();
    const paywall = pendingPaywall();
    const presenting = presentOffering();
    await untilPresenting();

    jest.advanceTimersByTime(8000);
    expect(tracked()).toContain("paywall_stalled");

    paywall.settle();
    await presenting;
    jest.useRealTimers();
  });

  test("stays silent when the user switched away mid-wait", async () => {
    jest.useFakeTimers();
    const paywall = pendingPaywall();
    const presenting = presentOffering();
    await untilPresenting();

    appStateChange("background");
    jest.advanceTimersByTime(8000);
    expect(tracked()).not.toContain("paywall_stalled");

    // And the sheet that arrives on the next foreground is still reported as
    // the presentation it is, late rather than lost.
    appStateChange("active");
    paywall.settle();
    await presenting;
    expect(tracked()).toContain("paywall_presented");
    jest.useRealTimers();
  });

  test("stays silent when the sheet was asked for by an app already leaving", async () => {
    jest.useFakeTimers();
    mockAppState.currentState = "inactive";
    const paywall = pendingPaywall();
    const presenting = presentOffering();
    await untilPresenting();

    jest.advanceTimersByTime(8000);
    expect(tracked()).not.toContain("paywall_stalled");

    paywall.settle();
    await presenting;
    jest.useRealTimers();
  });

  test("drops its AppState listener once the sheet has settled", async () => {
    await presentOffering();
    expect(mockAppState.listeners).toHaveLength(0);
  });
});

/**
 * The entitlement, and the receipt that contradicts it.
 *
 * `pro_weekly` was created for the discount offering on 2026-08-24 and never
 * attached to `pro`. StoreKit sold it, RevenueCat granted nothing, and every
 * trial buyer was walled on their next cold launch by a paywall whose buy button
 * then said "already subscribed". One tier, so a live subscription is Pro
 * whatever the entitlement says — and the mismatch is reported, once, so the
 * dashboard gets fixed instead of the symptom.
 */
describe("who counts as Pro", () => {
  test("the entitlement, when it is there", () => {
    expect(proFrom(PRO as never)).toBe(true);
    expect(tracked()).not.toContain("entitlement_missing");
  });

  test("nobody with no entitlement and no subscription", () => {
    expect(proFrom(FREE as never)).toBe(false);
  });

  test("a live subscription with no entitlement is Pro, and is reported once", () => {
    expect(proFrom(ORPHAN as never)).toBe(true);
    expect(proFrom(ORPHAN as never)).toBe(true);
    expect(mockTrack).toHaveBeenCalledWith("entitlement_missing", { products: "pro_weekly" });
    expect(tracked().filter((e) => e === "entitlement_missing")).toHaveLength(1);
  });

  test("a receipt with no subscription list at all is read as free, not thrown on", () => {
    expect(proFrom({ entitlements: { active: {} } } as never)).toBe(false);
  });

  test("restore reads the receipt the same way", async () => {
    restorePurchases.mockResolvedValueOnce(ORPHAN);
    await expect(restore()).resolves.toBe(true);
  });
});

/**
 * `null` is a store that could not answer. It used to be `false`, and `false`
 * at launch is a paywall — shown to whoever opened the app in a tunnel.
 */
describe("isPro", () => {
  test("answers from the receipt", async () => {
    getCustomerInfo.mockResolvedValueOnce(PRO);
    await expect(isPro()).resolves.toBe(true);
    getCustomerInfo.mockResolvedValueOnce(FREE);
    await expect(isPro()).resolves.toBe(false);
  });

  test("is unknown, not free, when the SDK throws", async () => {
    getCustomerInfo.mockRejectedValueOnce(new Error("There is no singleton instance"));
    await expect(isPro()).resolves.toBeNull();
  });
});

describe("a purchase the entitlement does not reflect", () => {
  test("is still a purchase, and is reported", async () => {
    presentPaywall.mockResolvedValueOnce("PURCHASED");
    getCustomerInfo.mockResolvedValueOnce(FREE);
    await expect(presentOffering()).resolves.toBe("purchased");
    expect(mockTrack).toHaveBeenCalledWith("purchase_without_entitlement", {
      offering: "current",
      pro: false,
    });
  });

  test("is not reported when the entitlement followed the purchase", async () => {
    presentPaywall.mockResolvedValueOnce("PURCHASED");
    getCustomerInfo.mockResolvedValueOnce(PRO);
    await expect(presentOffering()).resolves.toBe("purchased");
    expect(tracked()).not.toContain("purchase_without_entitlement");
  });

  test("is not checked for on a dismissal", async () => {
    await presentOffering();
    expect(getCustomerInfo).not.toHaveBeenCalled();
  });
});

/**
 * The sheet's "Restore purchases" returns RESTORED whether or not the receipt
 * held anything. Two installs on 2026-09-16 tapped it with nothing to restore
 * and were counted as trials: onboarding ended, `subscription_success` fired,
 * and the funnel gained two conversions RevenueCat had never seen.
 */
describe("a restore from the sheet", () => {
  test("is a purchase when the entitlement is live", async () => {
    presentPaywall.mockResolvedValueOnce("RESTORED");
    getCustomerInfo.mockResolvedValueOnce(PRO);
    await expect(presentOffering()).resolves.toBe("purchased");
    expect(mockTrack).toHaveBeenCalledWith("paywall_closed", {
      offering: "current",
      outcome: "purchased",
      result: "RESTORED",
    });
    expect(tracked()).not.toContain("purchase_without_entitlement");
  });

  test("that restored nothing is a dismissal", async () => {
    presentPaywall.mockResolvedValueOnce("RESTORED");
    getCustomerInfo.mockResolvedValueOnce(FREE);
    await expect(presentOffering()).resolves.toBe("dismissed");
    expect(mockTrack).toHaveBeenCalledWith("paywall_closed", {
      offering: "current",
      outcome: "dismissed",
      result: "RESTORED",
    });
    expect(tracked()).not.toContain("purchase_without_entitlement");
  });

  test("the store could not confirm is a dismissal, not a paid exit", async () => {
    presentPaywall.mockResolvedValueOnce("RESTORED");
    getCustomerInfo.mockRejectedValueOnce(new Error("offline"));
    await expect(presentOffering()).resolves.toBe("dismissed");
  });
});
