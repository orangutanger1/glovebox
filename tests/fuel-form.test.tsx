import { createElement, type ReactElement } from "react";
import { act } from "react";
import TestRenderer from "react-test-renderer";

/**
 * The fuel form, rendered.
 *
 * What a render proves and a pure test cannot: the odometer arrives prefilled
 * so the user edits three digits instead of typing six, the "Filled the tank"
 * toggle starts on so a row written by someone who never touched it matches
 * what the schema assumes, and a fill with no price still saves — logging is
 * free and frictionless or the log never fills up.
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
const tracked: { event: string; props?: Record<string, unknown> }[] = [];
jest.mock("../src/analytics", () => ({
  track: (event: string, props?: Record<string, unknown>) => tracked.push({ event, props }),
}));
jest.mock("../src/review", () => ({
  recordReviewEvent: jest.fn(),
  maybeRequestReview: jest.fn(async () => {}),
}));

import LogFuel from "../app/vehicle/[id]/fuel/new";
import { getDb } from "../src/db/client";
import { fuelEntriesForVehicle } from "../src/db/fuel";
import { t, setLanguage } from "../src/i18n";
import { setDistanceUnit } from "../src/units";
import { volumeUnitLabel } from "../src/fuel/format";
import { distanceUnitLabel } from "../src/units/format";

beforeAll(() => {
  setLanguage("en");
  setDistanceUnit("mi");
});

beforeEach(() => {
  navigated.length = 0;
  tracked.length = 0;
  getDb().runSync("DELETE FROM fuel_entries", []);
  getDb().runSync("DELETE FROM vehicles", []);
  getDb().runSync("INSERT INTO vehicles (id, name, odometer, created_at) VALUES (?, ?, ?, ?)", [
    "v1",
    "Civic",
    51771,
    "2026-01-01T00:00:00.000Z",
  ]);
});

function render(): TestRenderer.ReactTestRenderer {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(createElement(LogFuel) as ReactElement);
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

/** The Field whose legend is `label`, matched through the component's props
 *  rather than the rendered TextInput: the value under test is what the screen
 *  handed the field, which is exactly what the props carry. */
function field(tree: TestRenderer.ReactTestRenderer, label: string) {
  return tree.root.find(
    (n) => typeof n.type === "function" && n.type.name === "Field" && n.props.label === label
  );
}

function chip(tree: TestRenderer.ReactTestRenderer, label: string) {
  return tree.root.find(
    (n) => typeof n.type === "function" && n.type.name === "Chip" && n.props.label === label
  );
}

function saveButton(tree: TestRenderer.ReactTestRenderer) {
  return tree.root.find(
    (n) =>
      typeof n.type === "function" &&
      n.type.name === "Button" &&
      n.props.label === t("fuel.form.save")
  );
}

const ODO = t("fuel.form.odometer", { unit: distanceUnitLabel("mi") });
const VOL = () => t("fuel.form.volume", { unit: volumeUnitLabel() });

test("the odometer is prefilled from the vehicle's last known reading", () => {
  // Three digits to edit, not six to type. The form has under twenty seconds.
  const tree = render();
  expect(field(tree, ODO).props.value).toBe("51771");
  expect(field(tree, ODO).props.autoFocus).toBe(true);
});

test("the filled-the-tank toggle starts on", () => {
  // On by default, matching the column default, so a row written by a user who
  // never touched it is honest rather than merely present.
  const tree = render();
  expect(chip(tree, t("fuel.form.full")).props.selected).toBe(true);
});

test("saving writes the fill and returns to the vehicle", async () => {
  const tree = render();
  act(() => field(tree, ODO).props.onChangeText("52071"));
  act(() => field(tree, VOL()).props.onChangeText("12.4"));
  await act(async () => {
    await saveButton(tree).props.onPress();
  });

  const [row] = fuelEntriesForVehicle("v1");
  expect(row.odometer).toBe(52071);
  expect(row.volume).toBeCloseTo(12.4, 6);
  expect(row.full).toBe(1);
  expect(navigated).toContain("back");
});

test("a fill with no cost is still saved, with no cost", async () => {
  // The whole gating argument depends on this: logging is free and must stay
  // frictionless, and a user who did not note the price still logs the tank.
  const tree = render();
  act(() => field(tree, ODO).props.onChangeText("52071"));
  act(() => field(tree, VOL()).props.onChangeText("12"));
  await act(async () => {
    await saveButton(tree).props.onPress();
  });
  expect(fuelEntriesForVehicle("v1")[0].cost).toBeUndefined();
});

test("turning the toggle off stores a partial", async () => {
  const tree = render();
  act(() => chip(tree, t("fuel.form.full")).props.onPress());
  act(() => field(tree, ODO).props.onChangeText("52071"));
  act(() => field(tree, VOL()).props.onChangeText("5"));
  await act(async () => {
    await saveButton(tree).props.onPress();
  });
  expect(fuelEntriesForVehicle("v1")[0].full).toBe(0);
});

test("save is refused, with a message, when the volume is missing", async () => {
  // Both odometer and volume are NOT NULL in the schema. The form says so
  // rather than letting SQLite throw at the driver.
  const tree = render();
  act(() => field(tree, VOL()).props.onChangeText(""));
  await act(async () => {
    await saveButton(tree).props.onPress();
  });
  expect(fuelEntriesForVehicle("v1")).toHaveLength(0);
  expect(texts(tree.root)).toContain(t("fuel.form.needOdometer"));
});

test("the save reports whether the tank was filled", async () => {
  // The partial rate is how we find out whether the toggle is understood at all.
  const tree = render();
  act(() => field(tree, ODO).props.onChangeText("52071"));
  act(() => field(tree, VOL()).props.onChangeText("12"));
  await act(async () => {
    await saveButton(tree).props.onPress();
  });
  expect(tracked).toContainEqual({
    event: "fuel_logged",
    props: { full: true, priced: false },
  });
});
