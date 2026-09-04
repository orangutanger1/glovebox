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

jest.mock("react-native-purchases", () => ({
  __esModule: true,
  default: {
    isConfigured: () => isConfigured(),
    getOfferings: () => getOfferings(),
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

import { presentCustomerCenter as openCustomerCenter, presentOffering, presentPaywall as gatePaywall } from "../src/purchases";

beforeEach(() => {
  isConfigured.mockClear();
  presentPaywall.mockClear();
  presentPaywallIfNeeded.mockClear();
  presentCustomerCenter.mockClear();
  mockTrack.mockClear();
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
