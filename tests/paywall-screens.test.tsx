import { createElement, type ReactElement } from "react";
import { act } from "react";
import TestRenderer from "react-test-renderer";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  NotificationFeedbackType: { Warning: "warning" },
}));
const opened: string[] = [];
jest.mock("expo-linking", () => ({ openURL: async (url: string) => { opened.push(url); } }));
jest.mock("react-native-purchases", () => ({ __esModule: true, default: {} }));
jest.mock("react-native-purchases-ui", () => ({ __esModule: true, default: {} }));
const mockTrack = jest.fn();
jest.mock("../src/analytics", () => ({ track: (e: string, p?: unknown) => mockTrack(e, p) }));
const mockRestore = jest.fn(async () => false);
jest.mock("../src/purchases", () => ({
  restore: () => mockRestore(),
  DISCOUNT_OFFERING: "discount",
  INTRO_DAYS: 7,
}));

import type { Plan } from "../src/purchases/plans";
import { PlanPicker, defaultPlan } from "../src/paywall/PlanPicker";
import { BuyFooter } from "../src/paywall/BuyFooter";
import { ReviewCard } from "../src/paywall/ReviewCard";
import { TERMS_URL, PRIVACY_URL } from "../src/paywall/legal";
import { t } from "../src/i18n";

function plan(over: Partial<Plan> & { id: string; period: Plan["period"] }): Plan {
  return {
    package: {} as Plan["package"],
    priceString: "$0.00",
    price: 0,
    currency: "USD",
    intro: null,
    perWeek: "$0.00",
    perMonth: "$0.00",
    ...over,
  };
}

const YEAR = plan({ id: "$rc_annual", period: "year", priceString: "$79.99", price: 79.99, perWeek: "$1.54", perMonth: "$6.67", savePct: 49 });
const MONTH = plan({ id: "$rc_monthly", period: "month", priceString: "$9.99", price: 9.99, perWeek: "$2.31", perMonth: "$9.99", savePct: 23 });
const WEEK = plan({ id: "$rc_weekly", period: "week", priceString: "$2.99", price: 2.99, perWeek: "$2.99", perMonth: "$12.96" });
const INTRO = plan({ ...WEEK, intro: { priceString: "$0.99", price: 0.99, periods: 1 } });

function render(el: ReactElement): TestRenderer.ReactTestRenderer {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(el);
  });
  return tree;
}

function texts(tree: TestRenderer.ReactTestRenderer): string[] {
  return tree.root
    .findAllByType("Text" as never)
    .map((n) => (Array.isArray(n.props.children) ? n.props.children.join("") : String(n.props.children ?? "")))
    .filter(Boolean);
}

function pressable(tree: TestRenderer.ReactTestRenderer, label: string) {
  // Walks the subtree for the label as text rather than JSON.stringify-ing
  // props: once a PressableScale/Button mounts, its Animated.Value acquires
  // an internal back-reference that makes JSON.stringify throw on a circular
  // structure. Reading the rendered text is what the test actually needs.
  const hits = tree.root.findAll((n) => {
    if (typeof n.props.onPress !== "function") return false;
    try {
      return n
        .findAllByType("Text" as never)
        .some((t) => {
          const children = t.props.children;
          const str = Array.isArray(children) ? children.join("") : String(children ?? "");
          return str.includes(label);
        });
    } catch {
      return false;
    }
  });
  return hits[hits.length - 1];
}

beforeEach(() => {
  mockTrack.mockReset();
  opened.length = 0;
});

describe("PlanPicker", () => {
  test("the default selection is the plan that saves the most", () => {
    expect(defaultPlan([WEEK, MONTH, YEAR])).toBe("$rc_annual");
    expect(defaultPlan([WEEK])).toBe("$rc_weekly");
  });

  test("prints every plan with its store price and the derived per-period figure", () => {
    const tree = render(
      createElement(PlanPicker, { plans: [YEAR, MONTH, WEEK], selected: "$rc_annual", onSelect: () => {}, offering: "current" })
    );
    const printed = texts(tree).join(" ");
    expect(printed).toContain("$79.99");
    expect(printed).toContain("$1.54");
    expect(printed).toContain("$9.99");
    expect(printed).toContain("$2.99");
    expect(printed).toContain(t("paywall.save", { pct: 49 }));
    expect(printed).toContain(t("paywall.bestValue"));
  });

  test("a tap selects and is reported", () => {
    const onSelect = jest.fn();
    const tree = render(
      createElement(PlanPicker, { plans: [YEAR, MONTH, WEEK], selected: "$rc_annual", onSelect, offering: "current" })
    );
    act(() => pressable(tree, t("paywall.period.month")).props.onPress());
    expect(onSelect).toHaveBeenCalledWith("$rc_monthly");
    expect(mockTrack).toHaveBeenCalledWith("paywall_plan_selected", { offering: "current", plan: "$rc_monthly" });
  });

  test("the intro price is drawn only when the plan carries one", () => {
    const withIntro = texts(
      render(createElement(PlanPicker, { plans: [INTRO], selected: "$rc_weekly", onSelect: () => {}, offering: "discount" }))
    ).join(" ");
    expect(withIntro).toContain("$0.99");
    expect(withIntro).toContain(t("paywall.then", { price: "$2.99" }));
    const without = texts(
      render(createElement(PlanPicker, { plans: [WEEK], selected: "$rc_weekly", onSelect: () => {}, offering: "discount" }))
    ).join(" ");
    expect(without).not.toContain("$0.99");
    expect(without).not.toContain(t("paywall.then", { price: "$2.99" }));
  });
});

describe("BuyFooter", () => {
  test.each([
    [YEAR, t("paywall.cta.year"), t("paywall.legal.year", { price: "$79.99" })],
    [MONTH, t("paywall.cta.month"), t("paywall.legal.month", { price: "$9.99" })],
    [WEEK, t("paywall.cta.week"), t("paywall.legal.week", { price: "$2.99" })],
    [INTRO, t("paywall.cta.week"), t("paywall.legal.intro", { intro: "$0.99", price: "$2.99" })],
  ])("names the selected plan on the button and the renewal under it", (p, cta, legal) => {
    // Everything App Review looks for on a subscription screen: the price
    // and period before the button, the renewal line, Terms, Privacy, Restore.
    const printed = texts(render(createElement(BuyFooter, { plan: p, busy: false, onBuy: () => {}, onRestore: () => {} })));
    expect(printed).toContain(cta);
    expect(printed.join(" ")).toContain(legal);
    expect(printed).toContain(t("paywall.terms"));
    expect(printed).toContain(t("paywall.privacy"));
    expect(printed).toContain(t("paywall.restore"));
  });

  test("the links open the legal pages and Restore calls back", () => {
    const onRestore = jest.fn();
    const tree = render(createElement(BuyFooter, { plan: YEAR, busy: false, onBuy: () => {}, onRestore }));
    act(() => pressable(tree, t("paywall.terms")).props.onPress());
    act(() => pressable(tree, t("paywall.privacy")).props.onPress());
    expect(opened).toEqual([TERMS_URL, PRIVACY_URL]);
    act(() => pressable(tree, t("paywall.restore")).props.onPress());
    expect(onRestore).toHaveBeenCalled();
  });

  test("with no plan the button is not live and says it is loading", () => {
    const onBuy = jest.fn();
    const tree = render(createElement(BuyFooter, { plan: null, busy: false, onBuy, onRestore: () => {} }));
    expect(texts(tree)).toContain(t("paywall.loading"));
    expect(onBuy).not.toHaveBeenCalled();
  });
});

test("the review card quotes the review and says where it came from", () => {
  const printed = texts(render(createElement(ReviewCard)));
  expect(printed.join(" ")).toContain("surpasses them all");
  expect(printed).toContain(t("paywall.review.name"));
  expect(printed).toContain(t("paywall.review.source"));
});

test("no paywall component prints an em or en dash", () => {
  for (const el of [
    createElement(PlanPicker, { plans: [YEAR, MONTH, INTRO], selected: "$rc_annual", onSelect: () => {}, offering: "current" }),
    createElement(BuyFooter, { plan: INTRO, busy: false, onBuy: () => {}, onRestore: () => {} }),
    createElement(ReviewCard),
  ]) {
    expect(texts(render(el)).join(" ")).not.toMatch(/[—–]/);
  }
});
