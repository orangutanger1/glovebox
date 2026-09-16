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
const presentCustomerCenter = jest.fn(async (_params?: unknown) => {});
const opened: { offering: string; source: string }[] = [];
let mockOpenResult: "purchased" | "dismissed" | "unavailable" = "dismissed";
jest.mock("../src/paywall/present", () => ({
  openPaywall: async (offering: string, source: string) => {
    opened.push({ offering, source });
    return mockOpenResult;
  },
}));
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
    presentCustomerCenter: (params: unknown) => presentCustomerCenter(params),
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
  withStallWatch,
} from "../src/purchases";

beforeEach(() => {
  isConfigured.mockClear();
  presentCustomerCenter.mockClear();
  mockTrack.mockClear();
  opened.length = 0;
  mockOpenResult = "dismissed";
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
  expect(opened).toEqual([]);
});

test("nor to the entitlement gate, nor to Customer Center", async () => {
  isConfigured.mockResolvedValue(false);

  await expect(gatePaywall()).resolves.toBe(false);
  await openCustomerCenter();

  expect(opened).toEqual([]);
  expect(presentCustomerCenter).not.toHaveBeenCalled();

  isConfigured.mockResolvedValue(true);
});

test("a configured SDK still presents, and reports what came back", async () => {
  getCustomerInfo.mockResolvedValueOnce(FREE);
  mockOpenResult = "purchased";
  await expect(gatePaywall()).resolves.toBe(true);
  expect(opened).toEqual([{ offering: "default", source: "gate" }]);
});

test("an SDK that cannot answer whether it is configured is treated as unconfigured", async () => {
  // The RN bridge throws rather than resolving when the native module is
  // missing entirely, which is the same situation with a worse error.
  isConfigured.mockRejectedValueOnce(new Error("native module not linked"));

  await expect(presentOffering()).resolves.toBe("unavailable");
  expect(opened).toEqual([]);
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
  function pendingPresentation(): { settle: () => void; promise: Promise<string> } {
    let release: (value: string) => void = () => {};
    const promise = new Promise<string>((resolve) => (release = resolve));
    return { promise, settle: () => release("CANCELLED") };
  }

  test("reports a sheet that never came up while the app was awake", async () => {
    jest.useFakeTimers();
    const paywall = pendingPresentation();
    const watched = withStallWatch("current", paywall.promise);

    jest.advanceTimersByTime(8000);
    expect(tracked()).toContain("paywall_stalled");

    paywall.settle();
    await watched;
    jest.useRealTimers();
  });

  test("stays silent when the user switched away mid-wait", async () => {
    jest.useFakeTimers();
    const paywall = pendingPresentation();
    const watched = withStallWatch("current", paywall.promise);

    appStateChange("background");
    jest.advanceTimersByTime(8000);
    expect(tracked()).not.toContain("paywall_stalled");

    appStateChange("active");
    paywall.settle();
    await watched;
    jest.useRealTimers();
  });

  test("stays silent when the sheet was asked for by an app already leaving", async () => {
    jest.useFakeTimers();
    mockAppState.currentState = "inactive";
    const paywall = pendingPresentation();
    const watched = withStallWatch("current", paywall.promise);

    jest.advanceTimersByTime(8000);
    expect(tracked()).not.toContain("paywall_stalled");

    paywall.settle();
    await watched;
    jest.useRealTimers();
  });

  test("drops its AppState listener once the sheet has settled", async () => {
    const paywall = pendingPresentation();
    const watched = withStallWatch("current", paywall.promise);
    paywall.settle();
    await watched;
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

