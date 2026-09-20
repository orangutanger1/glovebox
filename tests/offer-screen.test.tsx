import { createElement } from "react";
import { act } from "react";
import TestRenderer from "react-test-renderer";

/**
 * The exit offer's funnel events, counted.
 *
 * `paywall_presented` is the "the user was shown a price" step, and it has to
 * fire once per view: the screen re-renders on every tap, and a step that
 * fired on every render inflated exactly the number it exists to make honest.
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
      compareAt: { priceString: "$3.99", price: 3.99, pct: 86 },
    },
  ];
  return {
    usePlans: () => ({ plans, loading: false, retry: () => {} }),
    buy: (plan: unknown, offering: string) => mockBuy(plan, offering),
  };
});
jest.mock("../src/purchases", () => ({ restore: async () => false }));
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
  NotificationFeedbackType: { Success: "success", Warning: "warning", Error: "error" },
}));

import { setLanguage, t } from "../src/i18n";
import OnboardingOffer from "../app/onboarding/offer";

beforeAll(() => setLanguage("en"));
beforeEach(() => {
  tracked.length = 0;
  navigated.length = 0;
});

function render(): TestRenderer.ReactTestRenderer {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(createElement(OnboardingOffer));
  });
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

const presented = () =>
  tracked.filter((e) => e.event === "paywall_presented" && e.props?.offering === "discount");

test("the price is reported as presented once, however often the screen re-renders", async () => {
  const tree = render();
  expect(presented()).toHaveLength(1);
  // A dismissed buy flips `busy` on and off again: two renders, no new view.
  await tap(tree, t("offer.trial.cta"));
  // A failed restore: another two, plus the message.
  await tap(tree, t("paywall.restore"));
  expect(presented()).toHaveLength(1);
});

test("buying the discount yearly is a paid exit, not a trial", async () => {
  // The offering sells a flat-price yearly; nothing on it trials. An exit
  // called "trial" would count it against a product the app no longer sells.
  mockBuy.mockResolvedValueOnce("purchased");
  const tree = render();
  await tap(tree, t("offer.trial.cta"));
  expect(tracked).toContainEqual({ event: "onboarding_completed", props: { exit: "paid" } });
  expect(navigated).toContain("replace:/subscribed");
});
