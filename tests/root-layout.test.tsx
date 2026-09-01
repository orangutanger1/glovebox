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
    useRouter: () => ({ push: () => {}, replace: () => {}, navigate: () => {} }),
  };
});
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
  hasOffering: async () => false,
  initPurchases: () => {},
  isPro: async () => false,
}));
jest.mock("../src/analytics", () => ({
  identifyFromPurchases: async () => {},
  initAnalytics: () => {},
  reportFatals: () => {},
}));
jest.mock("../src/notify", () => ({ rescheduleAll: async () => {} }));
jest.mock("../src/onboarding", () => ({ isOnboarded: () => true, getOnboardingStep: () => null }));
jest.mock("../src/onboarding/flow", () => ({ resumeRoute: () => "welcome" }));
jest.mock("../src/review", () => ({ recordReviewEvent: () => {} }));
jest.mock("../src/winback", () => ({ recordOpen: () => null, getWinbackShownAt: () => null }));
jest.mock("../src/winback/state", () => ({ shouldOfferWinback: () => false }));
jest.mock("../src/quickactions", () => ({
  QUICK_ACTION_FEEDBACK: "feedback",
  QUICK_ACTION_TRIAL: "trial",
  syncQuickActions: async () => {},
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
