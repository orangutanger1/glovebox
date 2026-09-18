import { createElement, type ComponentType } from "react";
import { act } from "react";
import TestRenderer from "react-test-renderer";

/**
 * The two full paywalls' funnel events, counted.
 *
 * `paywall_shown` is "the route mounted" and `paywall_presented` is "a price
 * was on the glass"; the ratio between them is the store-latency step of the
 * funnel, and both have to fire once per view. The exit offer fired
 * `paywall_presented` on every tap for a day (a plan list rebuilt per render,
 * see tests/offer-screen.test.tsx); these two screens key the same effect on
 * the same kind of list and had nothing counting it.
 */
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const navigated: string[] = [];
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: (to: string) => navigated.push(to),
    replace: (to: string) => navigated.push(`replace:${to}`),
    back: () => navigated.push("back"),
    canGoBack: () => true,
  }),
  useLocalSearchParams: () => ({}),
  useFocusEffect: (effect: () => void | (() => void)) => {
    require("react").useEffect(effect, [effect]);
  },
}));

jest.mock("../src/db/client", () => {
  const Sqlite = require("better-sqlite3");
  const db = new Sqlite(":memory:");
  const { applyMigrations } = jest.requireActual("../src/db/schema");
  applyMigrations((sql: string) => db.exec(sql), 0);
  return {
    getDb: () => ({
      runSync: (sql: string, params: unknown[] = []) => db.prepare(sql).run(...params),
      getFirstSync: (sql: string, params: unknown[] = []) => db.prepare(sql).get(...params) ?? null,
      getAllSync: (sql: string, params: unknown[] = []) => db.prepare(sql).all(...params),
    }),
  };
});

const tracked: { event: string; props?: Record<string, unknown> }[] = [];
jest.mock("../src/analytics", () => ({
  track: (event: string, props?: Record<string, unknown>) => tracked.push({ event, props }),
  trackStepAdvanced: () => {},
  trackStepBack: () => {},
}));

const mockBuy = jest.fn(
  async (_plan: unknown, _offering: string) =>
    "dismissed" as "dismissed" | "purchased" | "unavailable"
);
// One array for the life of the test, as the real hook holds one in state: a
// list rebuilt per render would itself be the bug this file guards against.
jest.mock("../src/purchases/plans", () => {
  const plans = [
    {
      id: "$rc_annual", period: "year", package: {}, priceString: "$29.99", price: 29.99,
      currency: "USD", intro: null, perWeek: "$0.58", perMonth: "$2.50",
    },
  ];
  return {
    usePlans: () => ({ plans, loading: false, retry: () => {} }),
    buy: (plan: unknown, offering: string) => mockBuy(plan, offering),
  };
});
jest.mock("../src/purchases", () => ({ restore: async () => false }));
jest.mock("../src/paywall/present", () => ({ settlePaywall: () => {} }));
jest.mock("expo-notifications", () => ({
  cancelScheduledNotificationAsync: jest.fn(async () => {}),
  setNotificationHandler: jest.fn(),
  SchedulableTriggerInputTypes: { DATE: "date" },
}));
jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(async () => {}),
  impactAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: { Warning: "warning" },
}));

import { setLanguage, t } from "../src/i18n";
import PaywallRoute from "../app/paywall";
import OnboardingPaywall from "../app/onboarding/paywall";

beforeAll(() => setLanguage("en"));
beforeEach(() => {
  tracked.length = 0;
  navigated.length = 0;
});
// Unmounted, not just dropped: the onboarding paywall's CloseButton arms a
// four-second timer, and a tree left mounted fires it after Jest has torn
// the environment down.
const trees: TestRenderer.ReactTestRenderer[] = [];
afterEach(() => {
  for (const tree of trees.splice(0)) act(() => tree.unmount());
});

function render(screen: ComponentType): TestRenderer.ReactTestRenderer {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(createElement(screen));
  });
  trees.push(tree);
  return tree;
}

function stringsIn(node: TestRenderer.ReactTestInstance): string[] {
  return node
    .findAll((n) => typeof n.type === "string")
    .flatMap((n) => n.children.filter((c): c is string => typeof c === "string"));
}

async function tap(tree: TestRenderer.ReactTestRenderer, label: string) {
  const target = tree.root.findAll(
    (n) => typeof n.props.onPress === "function" && stringsIn(n).includes(label)
  );
  await act(async () => {
    await target[target.length - 1].props.onPress();
  });
}

const count = (event: string, offering: string) =>
  tracked.filter((e) => e.event === event && e.props?.offering === offering).length;

describe.each([
  ["the feature-gate paywall", PaywallRoute, "current"],
  ["the onboarding paywall", OnboardingPaywall, "current"],
] as const)("%s", (_name, screen, offering) => {
  test("shown and presented are each reported once, however often the screen re-renders", async () => {
    const tree = render(screen);
    expect(count("paywall_shown", offering)).toBe(1);
    expect(count("paywall_presented", offering)).toBe(1);
    // A dismissed buy flips `busy` on and off again: two renders, no new view.
    await tap(tree, t("paywall.cta.year"));
    // A failed restore: another two, plus the message.
    await tap(tree, t("paywall.restore"));
    expect(count("paywall_shown", offering)).toBe(1);
    expect(count("paywall_presented", offering)).toBe(1);
  });
});
