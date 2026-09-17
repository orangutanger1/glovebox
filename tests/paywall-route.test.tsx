import { createElement } from "react";
import { act } from "react";
import TestRenderer from "react-test-renderer";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const navigated: string[] = [];
const mockParams: Record<string, string> = { offering: "default", source: "settings" };
jest.mock("expo-router", () => ({
  useRouter: () => ({ back: () => navigated.push("back"), canGoBack: () => true }),
  useLocalSearchParams: () => mockParams,
  router: { push: jest.fn() },
}));
jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  return { SafeAreaView: View, useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }) };
});
jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  impactAsync: jest.fn(async () => {}),
  NotificationFeedbackType: { Warning: "warning" },
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
}));
jest.mock("expo-linking", () => ({ openURL: async () => {} }));
jest.mock("react-native-purchases", () => ({ __esModule: true, default: {} }));
jest.mock("react-native-purchases-ui", () => ({ __esModule: true, default: {} }));
const mockTrack = jest.fn();
jest.mock("../src/analytics", () => ({ track: (e: string, p?: unknown) => mockTrack(e, p) }));
jest.mock("../src/purchases", () => ({ restore: async () => false, DISCOUNT_OFFERING: "discount" }));
jest.mock("../src/review", () => ({ recordReviewEvent: jest.fn() }));

const settled: string[] = [];
jest.mock("../src/paywall/present", () => ({ settlePaywall: (r: string) => settled.push(r) }));

const YEAR = { id: "$rc_annual", period: "year", package: {}, priceString: "$79.99", price: 79.99, currency: "USD", intro: null, perWeek: "$1.54", perMonth: "$6.67", savePct: 49 };
const WEEK = { id: "$rc_weekly", period: "week", package: {}, priceString: "$2.99", price: 2.99, currency: "USD", intro: null, perWeek: "$2.99", perMonth: "$12.96" };
const mockBuy = jest.fn(async (_p: unknown, _o: string) => "dismissed");
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
// Walks the subtree for the label as text rather than JSON.stringify-ing
// props: once a PressableScale/Button mounts, its Animated.Value acquires an
// internal back-reference that makes JSON.stringify throw on a circular
// structure. Reading the rendered text is what the test actually needs.
function pressable(tree: TestRenderer.ReactTestRenderer, label: string) {
  const hits = tree.root.findAll((n) => {
    if (typeof n.props.onPress !== "function") return false;
    if (n.props.accessibilityLabel === label) return true;
    try {
      return n
        .findAllByType("Text" as never)
        .some((txt) => {
          const children = txt.props.children;
          const str = Array.isArray(children) ? children.join("") : String(children ?? "");
          return str.includes(label);
        });
    } catch {
      return false;
    }
  });
  return hits[hits.length - 1];
}
function press(tree: TestRenderer.ReactTestRenderer, label: string) {
  return pressable(tree, label).props.onPress();
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
  expect(mockTrack).toHaveBeenCalledWith("paywall_presented", { offering: "current", ms: expect.any(Number) });
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
