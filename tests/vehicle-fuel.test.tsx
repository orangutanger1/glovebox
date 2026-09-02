import { createElement, type ReactElement } from "react";
import { act } from "react";
import TestRenderer from "react-test-renderer";

/**
 * The fuel section on the vehicle screen.
 *
 * Two things a render proves and the arithmetic cannot. First, that the states
 * before a figure exists say what is still needed: a dash where a number
 * belongs reads as a broken calculation, and a user whose first fill produced
 * nothing has to be told the second full tank is where the figure arrives.
 * Second, that fuel and service history stay apart — interleaved, the oil
 * change is buried under forty fill-ups by spring.
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
  useLocalSearchParams: () => ({ id: "v1" }),
  useFocusEffect: (cb: () => void | (() => void)) => {
    const { useEffect } = require("react");
    useEffect(() => cb(), [cb]);
  },
  Stack: { Screen: () => null },
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

jest.mock("react-native-purchases-ui", () => ({
  __esModule: true,
  default: {},
  PAYWALL_RESULT: {},
}));
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
  notificationAsync: jest.fn(async () => {}),
  NotificationFeedbackType: { Success: "success" },
}));

// The US region makes the figures gallons and MPG, which is what the numbers
// below are written in.
jest.mock("../src/i18n/device", () => ({
  deviceRegion: () => "US",
  deviceLanguageTags: () => ["en-US"],
}));

import VehicleDetail from "../app/vehicle/[id]";
import { getDb } from "../src/db/client";
import { addFuelEntry } from "../src/db/fuel";
import { addRecord } from "../src/db/records";
import { formatEfficiency } from "../src/fuel/format";
import { t, setLanguage } from "../src/i18n";
import { setDistanceUnit } from "../src/units";

beforeAll(() => {
  setLanguage("en");
  setDistanceUnit("mi");
});

beforeEach(() => {
  navigated.length = 0;
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

const fill = (odometer: number, volume: number, extra: Partial<{ cost: number }> = {}) =>
  addFuelEntry({
    vehicle_id: "v1",
    filled_at: "2026-03-01T12:00:00.000Z",
    odometer,
    volume,
    full: true,
    ...extra,
  });

function render(): TestRenderer.ReactTestRenderer {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(createElement(VehicleDetail) as ReactElement);
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

function pressables(node: TestRenderer.ReactTestInstance) {
  return node.findAll(
    (n) => typeof n.type === "function" && n.type.name === "Pressable"
  );
}

function rows(tree: TestRenderer.ReactTestRenderer) {
  return tree.root.findAll(
    (n) => typeof n.type === "function" && n.type.name === "ListRow"
  );
}

test("with no fills the section says what to do rather than showing a dash", () => {
  const printed = texts(render().root);
  expect(printed).toContain(t("fuel.summary.needFirst"));
  expect(printed).not.toContain(t("fuel.summary.last"));
});

test("with one full fill it says the figure is one tank away", () => {
  // The state that reads as a broken app if it is not explained: the user
  // logged a fill and got no number back.
  fill(1200, 12);
  const printed = texts(render().root);
  expect(printed).toContain(t("fuel.summary.needSecond"));
});

test("with two full fills it shows the last tank and the average", () => {
  fill(1000, 10);
  fill(1300, 10);
  const printed = texts(render().root);
  expect(printed).toContain(t("fuel.summary.last"));
  expect(printed).toContain(formatEfficiency(30, "mpg_us"));
  expect(printed).toContain(t("fuel.summary.average"));
});

test("at most three recent fills are shown, with a way to see the rest", () => {
  for (const odo of [1000, 1300, 1600, 1900, 2200]) fill(odo, 10);
  const tree = render();
  const fuelRows = rows(tree).filter((r) => r.props.title.includes("gal"));
  expect(fuelRows).toHaveLength(3);

  const seeAll = pressables(tree.root).find((p) => texts(p).includes(t("fuel.seeAll")))!;
  act(() => seeAll.props.onPress());
  expect(navigated).toEqual(["/vehicle/v1/fuel"]);
});

test("the fuel section is separate from the service history", () => {
  // Interleaved, this is forty fill-ups with an oil change buried among them,
  // and the service history is the thing the app exists for.
  addRecord({
    vehicle_id: "v1",
    service_type: "Oil Change",
    performed_at: "2026-02-01T12:00:00.000Z",
    odometer: 900,
  });
  fill(1200, 12);
  const tree = render();
  const printed = texts(tree.root);
  expect(printed).toContain(t("fuel.title"));
  expect(printed).toContain(t("vehicle.history"));

  // The FlatList's data is the service history alone: a fuel row rendered
  // inside it would carry a volume in its title.
  const list = tree.root.find((n) => typeof n.type === "function" && n.type.name === "FlatList");
  expect(list.props.data).toHaveLength(1);
  expect(list.props.data[0].service_type).toBe("Oil Change");
});

test("Log fuel routes to the form, beside Log service", () => {
  const tree = render();
  const buttons = tree.root.findAll(
    (n) => typeof n.type === "function" && n.type.name === "Button"
  );
  const labels = buttons.map((b) => b.props.label);
  expect(labels).toContain(t("vehicle.logService"));
  expect(labels).toContain(t("fuel.log"));

  act(() => buttons.find((b) => b.props.label === t("fuel.log"))!.props.onPress());
  expect(navigated).toEqual(["/vehicle/v1/fuel/new"]);
});
