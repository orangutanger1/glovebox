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
  useLocalSearchParams: () => ({ id: (globalThis as { __vehicleId?: string }).__vehicleId }),
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

jest.mock("../src/recalls/RecallsSection", () => ({ RecallsSection: () => null }));

let mockV2 = false;
jest.mock("../src/design/theme", () => ({
  ...jest.requireActual("../src/design/theme"),
  isDesignV2: () => mockV2,
}));

import VehicleRoute from "../app/vehicle/[id]";
import { explainPath } from "../src/explain";
import { ServiceSticker } from "../src/redesign/stickers";
import { createVehicle, listVehicles } from "../src/db/vehicles";
import { addRecord } from "../src/db/records";
import { setState } from "../src/db/state";
import { resetDesignCache } from "../src/design/theme";
import { t, setLanguage } from "../src/i18n";
import { setDistanceUnit } from "../src/units";

beforeAll(() => {
  setLanguage("en");
  setDistanceUnit("mi");
  createVehicle({ name: "Outback", odometer: 50_000 });
  const id = listVehicles()[0].id;
  (globalThis as { __vehicleId?: string }).__vehicleId = id;
  addRecord({
    vehicle_id: id,
    service_type: "Oil Change",
    performed_at: new Date(Date.now() - 30 * 86_400_000).toISOString(),
    odometer: 48_000,
  });
  setState("experiment.app_design", "redesign");
});

const mounted: TestRenderer.ReactTestRenderer[] = [];
afterEach(() => {
  act(() => {
    for (const tree of mounted.splice(0)) tree.unmount();
  });
  mockV2 = false;
});
afterAll(() => resetDesignCache());

function render(): TestRenderer.ReactTestRenderer {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(createElement(VehicleRoute) as ReactElement);
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

function tab(tree: TestRenderer.ReactTestRenderer, label: string) {
  const target = tree.root.find(
    (n) => n.props.accessibilityRole === "tab" && typeof n.props.onPress === "function" && texts(n).includes(label)
  );
  act(() => target.props.onPress());
}

test("arm A's vehicle screen: odometer, next-task banner, and nothing due", () => {
  const rendered = texts(render().root);
  expect(rendered).toContain("50,000 mi");
  expect(rendered.some((s) => s.startsWith("Oil Change: In "))).toBe(true);
  expect(rendered).toContain(t("redesign.car.nothingDue"));
  expect(rendered).toContain(t("redesign.segment.upcoming"));
});

test("Care plan shows how complete the plan is and the first gap to fill", () => {
  const tree = render();
  tab(tree, t("redesign.car.tab.plan"));
  const rendered = texts(tree.root);
  expect(rendered).toContain(t("redesign.car.complete", { percent: 40 }));
  expect(rendered).toContain(t("redesign.car.gap.service", { service: "Tire Rotation" }));
  expect(rendered).toContain(t("redesign.car.notLogged"));
});

test("History lists the log and keeps the delete-vehicle action", () => {
  const tree = render();
  tab(tree, t("redesign.car.tab.history"));
  const rendered = texts(tree.root);
  expect(rendered).toContain("Oil Change");
  expect(rendered).toContain(t("vehicle.deleteVehicle"));
});

describe("A v2's vehicle screen", () => {
  const id = () => listVehicles()[0].id;
  function pressWhere(tree: TestRenderer.ReactTestRenderer, pred: (n: TestRenderer.ReactTestInstance) => boolean) {
    const target = tree.root.find((n) => typeof n.props.onPress === "function" && !n.props.disabled && pred(n));
    act(() => target.props.onPress());
  }

  test("the odometer reads as one number, not six digits", () => {
    mockV2 = true;
    const tree = render();
    expect(tree.root.findAll((n) => n.props.accessibilityLabel === "50,000 mi" && n.props.accessible === true).length).toBeGreaterThan(0);
    expect(texts(tree.root)).not.toContain("50,000 mi");
  });

  test("care plan rows still open the explainer", () => {
    mockV2 = true;
    const tree = render();
    tab(tree, t("redesign.car.tab.plan"));
    navigated.length = 0;
    pressWhere(tree, (n) => n.props.accessibilityRole === "button" && texts(n).includes("Oil Change"));
    expect(navigated).toEqual([explainPath("Oil Change", "service_row", id())]);
  });

  test("History rows still open the explainer, with the service's sticker", () => {
    mockV2 = true;
    const tree = render();
    tab(tree, t("redesign.car.tab.history"));
    expect(tree.root.findAllByType(ServiceSticker).length).toBeGreaterThan(0);
    navigated.length = 0;
    pressWhere(tree, (n) => n.props.accessibilityRole !== "tab" && texts(n).includes("Oil Change") && !texts(n).includes(t("redesign.car.tab.history")));
    expect(navigated).toEqual([explainPath("Oil Change", "service_row", id())]);
  });
});
