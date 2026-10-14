import { createElement, type ReactElement } from "react";
import { act } from "react";
import TestRenderer from "react-test-renderer";

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
  Stack: { Screen: () => null },
}));

jest.mock("react-native-safe-area-context", () => {
  const { View } = require("react-native");
  const insets = { top: 47, bottom: 34, left: 0, right: 0 };
  return {
    SafeAreaView: View,
    useSafeAreaInsets: () => insets,
  };
});

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

jest.mock("react-native-purchases-ui", () => ({ __esModule: true, default: {} }));
jest.mock("react-native-purchases", () => ({ __esModule: true, default: {} }));
jest.mock("expo-notifications", () => ({
  requestPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  getPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {}),
  scheduleNotificationAsync: jest.fn(async () => "id"),
  setNotificationHandler: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
  SchedulableTriggerInputTypes: { DATE: "date" },
}));
jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(async () => {}),
  impactAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "light", Heavy: "heavy" },
}));

// A v2 is pinned per test; everything else about the arm is the real module.
let mockV2 = false;
jest.mock("../src/design/theme", () => ({
  ...jest.requireActual("../src/design/theme"),
  isDesignV2: () => mockV2,
}));

import Home from "../app/index";
import { Ring } from "../src/redesign/ui";
import { HeroCard } from "../src/redesign/HeroCard";
import { createVehicle, listVehicles } from "../src/db/vehicles";
import { addRecord } from "../src/db/records";
import { setState } from "../src/db/state";
import { resetDesignCache } from "../src/design/theme";
import { markLogged } from "../src/mascot/celebrate";
import { t, setLanguage } from "../src/i18n";
import { setDistanceUnit } from "../src/units";

const NAME = "2016 Honda Civic";

beforeAll(() => {
  setLanguage("en");
  setDistanceUnit("mi");
  createVehicle({ name: NAME, odometer: 101_475 });
  const id = listVehicles()[0].id;
  // An oil change a year and 7,210 miles ago: overdue on both counts, and
  // 2,210 mi past the default 5,000 mi interval.
  addRecord({
    vehicle_id: id,
    service_type: "Oil Change",
    performed_at: new Date(Date.now() - 365 * 86_400_000).toISOString(),
    odometer: 94_265,
  });
});

const mounted: TestRenderer.ReactTestRenderer[] = [];

afterEach(() => {
  // Unmounted so the celebration's timer is cleared before the environment goes.
  act(() => {
    for (const tree of mounted.splice(0)) tree.unmount();
  });
  resetDesignCache();
  mockV2 = false;
});

function render(): TestRenderer.ReactTestRenderer {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(createElement(Home) as ReactElement);
  });
  mounted.push(tree);
  return tree;
}

function ownText(node: TestRenderer.ReactTestInstance): string {
  const kids: unknown = node.props.children;
  return (Array.isArray(kids) ? kids : [kids]).filter((k): k is string => typeof k === "string").join("");
}

function texts(node: TestRenderer.ReactTestInstance): string[] {
  return node
    .findAll((n) => typeof n.type === "string")
    .map(ownText)
    .filter((s) => s.length > 0);
}

function press(tree: TestRenderer.ReactTestRenderer, predicate: (n: TestRenderer.ReactTestInstance) => boolean) {
  const target = tree.root.find((n) => typeof n.props.onPress === "function" && predicate(n));
  act(() => {
    target.props.onPress();
  });
}

test("an install with no design row keeps the classic garage", () => {
  const rendered = texts(render().root);
  expect(rendered).toContain(t("garage.title"));
  expect(rendered).not.toContain(t("redesign.tab.today"));
});

test("arm A shows Today: the status, the overdue task, and the tab bar", () => {
  setState("experiment.app_design", "redesign");
  const rendered = texts(render().root);
  expect(rendered).toContain(t("redesign.status.worried", { count: 1 }));
  expect(rendered).toContain(t("redesign.todayTasks"));
  expect(rendered).toContain("Oil Change");
  expect(rendered).toContain(t("redesign.tab.today"));
  expect(rendered).toContain(t("redesign.tab.garage"));
});

test("checking a task opens the log with that service chosen", () => {
  setState("experiment.app_design", "redesign");
  const tree = render();
  navigated.length = 0;
  press(tree, (n) => n.props.accessibilityLabel === t("redesign.check", { service: "Oil Change" }));
  expect(navigated).toEqual([`/vehicle/${listVehicles()[0].id}/log?type=Oil%20Change`]);
});

test("the plus logs straight away with one car", () => {
  setState("experiment.app_design", "redesign");
  const tree = render();
  navigated.length = 0;
  press(tree, (n) => n.props.accessibilityLabel === t("redesign.plus"));
  expect(navigated).toEqual([`/vehicle/${listVehicles()[0].id}/log`]);
});

test("the Garage tab lists the car with its next task", () => {
  setState("experiment.app_design", "redesign");
  const tree = render();
  press(tree, (n) => n.props.accessibilityRole === "tab" && texts(n).includes(t("redesign.tab.garage")));
  const rendered = texts(tree.root);
  expect(rendered).toContain(NAME);
  expect(rendered.some((s) => s.startsWith("Next: Oil Change"))).toBe(true);
  expect(rendered).toContain("0%");
});

test("a just-logged service celebrates once", () => {
  setState("experiment.app_design", "redesign");
  markLogged(listVehicles()[0].id, "Oil Change");
  const rendered = texts(render().root);
  expect(rendered).toContain(t("redesign.celebrate.title"));
  expect(texts(render().root)).not.toContain(t("redesign.celebrate.title"));
});

test("v2 leads with one figure instead of rings", () => {
  setState("experiment.app_design", "redesign");
  mockV2 = true;
  const tree = render();
  expect(texts(tree.root)).toContain("2,210");
  expect(tree.root.findAllByType(HeroCard)).toHaveLength(1);
  expect(tree.root.findAllByType(Ring)).toHaveLength(0);
});

test("v2 keeps the check that logs a task", () => {
  setState("experiment.app_design", "redesign");
  mockV2 = true;
  const tree = render();
  navigated.length = 0;
  press(tree, (n) => n.props.accessibilityLabel === t("redesign.check", { service: "Oil Change" }));
  expect(navigated).toEqual([`/vehicle/${listVehicles()[0].id}/log?type=Oil%20Change`]);
});

test("arm A without v2 keeps the ring row", () => {
  setState("experiment.app_design", "redesign");
  const tree = render();
  expect(tree.root.findAllByType(Ring).length).toBeGreaterThan(0);
  expect(tree.root.findAllByType(HeroCard)).toHaveLength(0);
});

test("v2's plus is a black disc", () => {
  setState("experiment.app_design", "redesign");
  mockV2 = true;
  const tree = render();
  const plus = tree.root.find((n) => n.props.accessibilityLabel === t("redesign.plus") && typeof n.props.onPress === "function");
  const discs = plus.findAll((n) => typeof n.type === "string" && n.props.style?.width === 58);
  expect(discs[0].props.style.backgroundColor).toBe("#16161A");
});
