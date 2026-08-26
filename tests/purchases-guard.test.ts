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

jest.mock("../src/analytics", () => ({ track: jest.fn() }));

import { presentCustomerCenter as openCustomerCenter, presentOffering, presentPaywall as gatePaywall } from "../src/purchases";

beforeEach(() => {
  isConfigured.mockClear();
  presentPaywall.mockClear();
  presentPaywallIfNeeded.mockClear();
  presentCustomerCenter.mockClear();
});

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
