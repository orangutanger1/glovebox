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
  const Stack = ({ children, screenOptions }: { children?: React.ReactNode; screenOptions?: Record<string, unknown> }) => {
    if (screenOptions) mockScreenOptions.push(screenOptions);
    return createElement("View", { testID: "navigator" }, children);
  };
  Stack.Screen = () => null;
  return {
    Stack,
    useRouter: () => ({ push: () => {}, replace: mockReplace, navigate: () => {} }),
  };
});
// Prefixed `mock` so the hoisted factories above and below may close over them.
const mockReplace = jest.fn();
// Every `screenOptions` the root stack was rendered with, in order.
const mockScreenOptions: Record<string, unknown>[] = [];
// The `app_design` arm as `isRedesign` reports it; `assignExperiments` can flip
// it, the way the boot effect writes the row on a fresh install.
let mockArmA = false;
let mockAssign: () => void = () => {};
let mockOnboarded = true;
let mockPro: boolean | null = false;
let mockHasOffer = false;
// When set, the store's answer waits on it: a launch caught mid-question.
let mockProGate: Promise<void> | null = null;
jest.mock("react-native-gesture-handler", () => {
  const { createElement } = require("react");
  return {
    GestureHandlerRootView: ({ children }: { children?: React.ReactNode }) =>
      createElement("View", null, children),
  };
});
jest.mock("expo-quick-actions", () => ({ initial: null }));
jest.mock("expo-quick-actions/hooks", () => ({ useQuickActionCallback: () => {} }));
jest.mock("expo-status-bar", () => ({ StatusBar: () => null }));
jest.mock("../src/experiments", () => ({ assignExperiments: () => mockAssign() }));
// The arm is read on every render (tokens, the status bar). Pinned here so the
// `getDb` count below still counts boots, not style reads.
jest.mock("../src/design/theme", () => ({
  ...jest.requireActual("../src/design/theme"),
  isRedesign: () => mockArmA,
}));
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
  isPro: async () => {
    if (mockProGate) await mockProGate;
    return mockPro;
  },
}));
jest.mock("../src/purchases/plans", () => ({ prefetchPlans: jest.fn() }));
jest.mock("../src/analytics", () => ({
  identifyFromPurchases: async () => {},
  initAnalytics: () => {},
  reportFatals: () => {},
}));
jest.mock("../src/notify", () => ({ rescheduleAll: async () => {} }));
jest.mock("../src/notify/opened", () => ({ watchNotificationOpens: () => () => {} }));
jest.mock("../src/onboarding", () => ({ isOnboarded: () => mockOnboarded, getOnboardingStep: () => null }));
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

/**
 * A walled user's garage used to draw first and be replaced by the wall a beat
 * later, so every launch flashed the garage. The launch now covers the stack
 * while the store answers, for the users who can be walled, and only them.
 */
describe("the launch cover", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockHasOffer = true;
    mockPro = false;
  });
  afterEach(() => {
    mockProGate = null;
  });

  async function mount(): Promise<{ tree: TestRenderer.ReactTestRenderer; answer: () => Promise<void> }> {
    let open!: () => void;
    mockProGate = new Promise<void>((resolve) => (open = resolve));
    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<RootLayout />);
    });
    return {
      tree,
      answer: async () => {
        await act(async () => {
          open();
        });
      },
    };
  }
  const covered = (tree: TestRenderer.ReactTestRenderer) =>
    tree.root.findAllByProps({ testID: "launch-cover" }).length > 0;

  test("covers the garage until the store answers, then lifts onto the wall", async () => {
    mockGrandfathered = false;
    const { tree, answer } = await mount();
    expect(covered(tree)).toBe(true);
    await answer();
    expect(mockReplace).toHaveBeenCalledWith("/onboarding/offer?walled=1");
    expect(covered(tree)).toBe(false);
    act(() => tree.unmount());
  });

  test("never covers a grandfathered user, who cannot be walled", async () => {
    mockGrandfathered = true;
    const { tree, answer } = await mount();
    expect(covered(tree)).toBe(false);
    await answer();
    act(() => tree.unmount());
  });
});

/**
 * A fresh install's first frame comes before the boot effect has tossed the
 * `app_design` coin, so the root stack was drawn with the classic (dark) header
 * and nothing re-rendered it. Arm A then ran its whole first session under a
 * dark header bar with a white chevron, while screens that draw their own
 * title (the vehicle screen) printed it in A's dark text: a barely visible
 * title on a dark bar.
 */
describe("the header follows the arm assigned at boot", () => {
  afterEach(() => {
    mockArmA = false;
    mockAssign = () => {};
    mockOnboarded = true;
    mockScreenOptions.length = 0;
  });

  test("a fresh install assigned arm A gets the light header", async () => {
    mockOnboarded = false;
    mockAssign = () => {
      mockArmA = true;
    };
    let tree!: TestRenderer.ReactTestRenderer;
    await act(async () => {
      tree = TestRenderer.create(<RootLayout />);
    });
    const last = mockScreenOptions[mockScreenOptions.length - 1] as {
      headerStyle: { backgroundColor: string };
      headerTintColor: string;
    };
    expect(last.headerStyle).toEqual({ backgroundColor: "#F4F4F7" });
    expect(last.headerTintColor).toBe("#16161A");
    await act(async () => {
      tree.unmount();
    });
  });
});
