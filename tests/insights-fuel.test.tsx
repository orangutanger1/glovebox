import { createElement, type ReactElement } from "react";
import { act } from "react";
import TestRenderer from "react-test-renderer";

/**
 * The fuel card on the costs screen.
 *
 * The gating argument, rendered: logging is free and the analysis is Pro, so a
 * free user must see the card locked rather than not see it at all. The fills
 * they have already logged are the whole reason the upgrade is worth anything,
 * and a blank space sells nothing.
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
  useFocusEffect: (cb: () => void | (() => void)) => {
    const { useEffect } = require("react");
    useEffect(() => cb(), [cb]);
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
      getFirstSync: (sql: string, params: unknown[] = []) =>
        db.prepare(sql).get(...params) ?? null,
      getAllSync: (sql: string, params: unknown[] = []) => db.prepare(sql).all(...params),
    }),
  };
});

let mockPro = false;
let mockPaywall: () => Promise<boolean> = async () => false;
jest.mock("../src/purchases", () => ({
  isPro: async () => mockPro,
  presentPaywall: () => mockPaywall(),
  ENTITLEMENT: "pro",
}));
jest.mock("../src/purchases/useIsPro", () => ({ useIsPro: () => mockPro }));
const mockTracked: string[] = [];
jest.mock("../src/analytics", () => ({
  track: (event: string) => mockTracked.push(event),
}));
jest.mock("../src/review", () => ({
  recordReviewEvent: jest.fn(),
  maybeRequestReview: jest.fn(async () => {}),
}));
jest.mock("react-native-purchases-ui", () => ({
  __esModule: true,
  default: {},
  PAYWALL_RESULT: {},
}));
jest.mock("react-native-purchases", () => ({ __esModule: true, default: {} }));

// The US region makes the figures gallons and MPG.
jest.mock("../src/i18n/device", () => ({
  deviceRegion: () => "US",
  deviceLanguageTags: () => ["en-US"],
}));

import Insights from "../app/insights";
import { getDb } from "../src/db/client";
import { addFuelEntry } from "../src/db/fuel";
import { formatEfficiency } from "../src/fuel/format";
import { t, setLanguage } from "../src/i18n";
import { formatMoney } from "../src/money";
import { setDistanceUnit } from "../src/units";

beforeAll(() => {
  setLanguage("en");
  setDistanceUnit("mi");
});

beforeEach(() => {
  navigated.length = 0;
  mockTracked.length = 0;
  mockPro = false;
  mockPaywall = async () => false;
  getDb().runSync("DELETE FROM fuel_entries", []);
  getDb().runSync("DELETE FROM service_records", []);
  getDb().runSync("DELETE FROM vehicles", []);
  getDb().runSync("INSERT INTO vehicles (id, name, odometer, created_at) VALUES (?, ?, ?, ?)", [
    "v1",
    "Civic",
    1000,
    "2026-01-01T00:00:00.000Z",
  ]);
});

const fill = (odometer: number, volume: number, cost?: number) =>
  addFuelEntry({
    vehicle_id: "v1",
    filled_at: "2026-03-01T12:00:00.000Z",
    odometer,
    volume,
    cost,
    full: true,
  });

function render(): TestRenderer.ReactTestRenderer {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(createElement(Insights) as ReactElement);
  });
  return tree;
}

function ownText(node: TestRenderer.ReactTestInstance): string {
  const kids: unknown = node.props.children;
  return (Array.isArray(kids) ? kids : [kids])
    .filter((k): k is string => typeof k === "string")
    .join("");
}

function texts(node: TestRenderer.ReactTestInstance): string[] {
  return node
    .findAll((n) => typeof n.type === "string")
    .map(ownText)
    .filter((s) => s.length > 0);
}

function button(tree: TestRenderer.ReactTestRenderer, label: string) {
  return tree.root.find(
    (n) => typeof n.type === "function" && n.type.name === "Button" && n.props.label === label
  );
}

test("a free user sees the locked card, not a blank space", () => {
  fill(1000, 10, 40);
  fill(1300, 10, 45);
  const printed = texts(render().root);
  expect(printed).toContain(t("fuel.card.locked.title"));
  expect(printed).not.toContain(formatEfficiency(30, "mpg_us"));
});

test("tapping the locked card presents the paywall and records the event", async () => {
  fill(1000, 10, 40);
  let presented = false;
  mockPaywall = async () => {
    presented = true;
    return false;
  };
  const tree = render();
  await act(async () => {
    await button(tree, t("fuel.card.locked.cta")).props.onPress();
  });
  expect(presented).toBe(true);
  expect(mockTracked).toContain("fuel_card_paywall");
});

test("a Pro user sees efficiency and fuel spend without tapping anything", () => {
  mockPro = true;
  fill(1000, 10, 40);
  fill(1300, 10, 45);
  const printed = texts(render().root);
  expect(printed).toContain(t("fuel.card.efficiency"));
  expect(printed).toContain(formatEfficiency(30, "mpg_us"));
  expect(printed).not.toContain(t("fuel.card.locked.title"));
  // Cost per distance is scaled to 100 units, so it is a figure rather than
  // the "$0" that whole-unit money rounding makes of a per-mile cost.
  expect(printed).toContain(formatMoney((45 / 300) * 100));
});

test("a store that cannot be reached becomes a message, not a dead button", async () => {
  fill(1000, 10, 40);
  mockPaywall = async () => {
    throw new Error("no products");
  };
  const tree = render();
  await act(async () => {
    await button(tree, t("fuel.card.locked.cta")).props.onPress();
  });
  const printed = texts(tree.root);
  expect(printed).toContain(t("settings.store.error"));
  expect(printed).not.toContain(t("fuel.card.efficiency"));
});

test("with fewer than two full tanks the card says so instead of showing zero", () => {
  mockPro = true;
  fill(1000, 10, 40);
  const printed = texts(render().root);
  expect(printed).toContain(t("fuel.card.empty"));
});

test("priced fills alone keep the screen alive when no service was ever priced", () => {
  // The existing empty state returns early on "nothing priced". A garage with
  // fills but no priced services is not that screen.
  mockPro = true;
  fill(1000, 10, 40);
  fill(1300, 10, 45);
  const printed = texts(render().root);
  expect(printed).not.toContain(t("insights.empty.title"));
  expect(printed).toContain(t("fuel.card.title"));
});

test("fuel is its own section: the service totals are untouched", () => {
  mockPro = true;
  fill(1000, 10, 40);
  fill(1300, 10, 45);
  const tree = render();
  // No service was ever logged, so the recorded-so-far total must not have
  // quietly absorbed the 85 of fuel — it stays a zero drawn from no services.
  const printed = texts(tree.root);
  expect(printed).toContain(t("insights.total.priced", { count: 0 }));
  expect(printed).toContain(formatMoney(0));
  // And the fuel spend is stated separately, in its own card.
  expect(printed).toContain(t("fuel.card.spend"));
  expect(printed).toContain(formatMoney(85));
});
