import { act } from "react";
import TestRenderer from "react-test-renderer";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

/**
 * Everything below exists only so `app/_layout.tsx` can be rendered.
 * `RootLayout` is the app's boot sequence — database, purchases, analytics,
 * notifications, quick actions — and there is no smaller unit to render:
 * `Chrome` is not exported and is deliberately not being exported to make this
 * easier. The seam under test is the one the app actually mounts.
 *
 * The mocks are inert on purpose. None of the boot work is under test here;
 * the assertion is that the navigator exists at all.
 */
jest.mock("expo-router", () => {
  const { createElement } = require("react");
  const Stack = ({ children }: { children?: React.ReactNode }) =>
    createElement("View", { testID: "navigator" }, children);
  Stack.Screen = () => null;
  return {
    Stack,
    useRouter: () => ({ push: () => {}, replace: mockReplace, navigate: () => {} }),
  };
});
// Prefixed `mock` so the hoisted factories above and below may close over them.
const mockReplace = jest.fn();
let mockPro: boolean | null = false;
let mockHasOffer = false;
jest.mock("react-native-gesture-handler", () => {
  const { createElement } = require("react");
  return {
    GestureHandlerRootView: ({ children }: { children?: React.ReactNode }) =>
      createElement("View", null, children),
  };
});
jest.mock("expo-quick-actions", () => ({ initial: null }));
jest.mock("expo-quick-actions/hooks", () => ({ useQuickActionCallback: () => {} }));
let mockDbBoots = 0;
jest.mock("../src/db/client", () => ({
  getDb: () => {
    mockDbBoots += 1;
    return {};
  },
}));
jest.mock("../src/purchases", () => ({
  DISCOUNT_OFFERING: "discount",
  hasOffering: async () => mockHasOffer,
  initPurchases: () => {},
  isPro: async () => mockPro,
}));
jest.mock("../src/purchases/plans", () => ({ prefetchPlans: jest.fn() }));
jest.mock("../src/analytics", () => ({
  identifyFromPurchases: async () => {},
  initAnalytics: () => {},
  reportFatals: () => {},
}));
jest.mock("../src/notify", () => ({ rescheduleAll: async () => {} }));
jest.mock("../src/notify/opened", () => ({ watchNotificationOpens: () => () => {} }));
jest.mock("../src/onboarding", () => ({ isOnboarded: () => true, getOnboardingStep: () => null }));
let mockGrandfathered = true;
jest.mock("../src/paywall", () => {
  const { isLocked } = jest.requireActual("../src/paywall/state");
  return { resolveGrandfathered: () => mockGrandfathered, isLocked };
});
const mockSyncQuickActions = jest.fn(async (_offer: boolean) => {});
jest.mock("../src/onboarding/flow", () => ({ resumeRoute: () => "welcome" }));
jest.mock("../src/review", () => ({ recordLaunchAndMaybeAsk: () => {} }));
jest.mock("../src/winback", () => ({ recordOpen: () => null, getWinbackShownAt: () => null }));
jest.mock("../src/winback/state", () => ({ shouldOfferWinback: () => false }));
jest.mock("../src/quickactions", () => ({
  QUICK_ACTION_FEEDBACK: "feedback",
  QUICK_ACTION_TRIAL: "trial",
  syncQuickActions: (offer: boolean) => mockSyncQuickActions(offer),
}));
jest.mock("../src/feedback", () => ({ openFeedback: async () => {} }));
jest.mock("../src/i18n/preference", () => ({ bootLanguage: () => "en" }));
jest.mock("../src/units", () => ({ initDistanceUnit: () => {} }));
jest.mock("../src/money", () => ({ initCurrency: () => {} }));

import RootLayout from "../app/_layout";

describe("the root layout mounts a navigator on the first commit", () => {
  /**
   * This assertion is the 1.1.0 launch crash, in one line.
   *
   * `RootLayout` used to return `null` until the fonts settled, which is on
   * every cold launch. expo-router renders this component as the only screen of
   * its own root navigator, so returning nothing left the router holding a
   * route with no navigator to render it in: the root slot re-dispatched
   * navigation state until React threw "Maximum update depth exceeded", and
   * because that throw lands in the commit driven from the C++ scheduler it
   * reached `RCTFatal` — past every `try`/`catch` and error boundary — and
   * expo-updates aborted the process half a second into launch. Builds 17
   * through 20 on TestFlight, four identical crash reports, no JS frames in
   * any of them.
   *
   * Nothing may render `null` from the root layout, for any reason. The
   * navigator must exist from the first commit, and the boot sequence must
   * still run.
   */
  test("mounts the navigator instead of rendering nothing", () => {
    const booted = mockDbBoots;
    let tree!: TestRenderer.ReactTestRenderer;
    act(() => {
      tree = TestRenderer.create(<RootLayout />);
    });
    expect(tree.toJSON()).not.toBeNull();
    expect(tree.root.findAllByProps({ testID: "navigator" }).length).toBeGreaterThan(0);
    expect(mockDbBoots).toBe(booted + 1);
    act(() => {
      tree.unmount();
    });
  });
});

/**
 * What the launch does with the store's answer.
 *
 * Three answers, not two. `true` and `false` are a customer; `null` is a store
 * that could not say — no key in the bundle, no network and no cached receipt —
 * and it used to be folded into `false`. `false` at launch is the wall, so a
 * subscriber who opened the app with no signal was shown a paywall for the
 * thing they were paying for, and the menu offered them a trial.
 */
describe("the launch and the entitlement", () => {
  async function launch(): Promise<void> {
    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<RootLayout />);
    });
    await act(async () => {
      tree.unmount();
    });
  }

  beforeEach(() => {
    mockReplace.mockClear();
    mockSyncQuickActions.mockClear();
    mockGrandfathered = false;
    mockHasOffer = true;
  });

  test("walls a customer the store says has not paid", async () => {
    mockPro = false;
    await launch();
    expect(mockReplace).toHaveBeenCalledWith("/onboarding/offer?walled=1");
    expect(mockSyncQuickActions).toHaveBeenCalledWith(true);
  });

  test("lets a paying customer in", async () => {
    mockPro = true;
    await launch();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockSyncQuickActions).toHaveBeenCalledWith(false);
  });

  test("does not wall, or offer a trial to, a customer the store could not describe", async () => {
    mockPro = null;
    await launch();
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockSyncQuickActions).toHaveBeenCalledWith(false);
  });
});
