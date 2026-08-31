import { createElement, type ReactElement } from "react";
import { act } from "react";
import TestRenderer from "react-test-renderer";
import { StyleSheet, type TextStyle } from "react-native";

/**
 * The garage row, rendered.
 *
 * The card used to hold a pill that held a label, so one vehicle offered two
 * places a tap could land for one intent. What a render can prove and a pure
 * test cannot: that there is now exactly one target per vehicle, and that the
 * row's ink comes from the tokens rather than a hard-coded default.
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
  // The real hook needs a navigation container. The garage only uses it to
  // reload the list on entry, which under the test renderer is mount.
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
      runSync: (sql: string, params: unknown[] = []) =>
        db.prepare(sql).run(...params),
      getFirstSync: (sql: string, params: unknown[] = []) =>
        db.prepare(sql).get(...params) ?? null,
      getAllSync: (sql: string, params: unknown[] = []) =>
        db.prepare(sql).all(...params),
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
jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn(async () => {}) }));

import Garage from "../app/index";
import { createVehicle, listVehicles } from "../src/db/vehicles";
import { addRecord } from "../src/db/records";
import { nextReminders } from "../src/notify/collect";
import { serviceName } from "../src/schedule/names";
import { tokens } from "../src/design/tokens";
import { formatDate, t, setLanguage } from "../src/i18n";
import { setDistanceUnit } from "../src/units";

const NAME = "2016 Honda Civic";

beforeAll(() => {
  setLanguage("en");
  setDistanceUnit("mi");
  createVehicle({ name: NAME, odometer: 101475 });
});

function render(): TestRenderer.ReactTestRenderer {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(createElement(Garage) as ReactElement);
  });
  return tree;
}

/** The literal strings a single host node prints, joined. */
function ownText(node: TestRenderer.ReactTestInstance): string {
  const kids: unknown = node.props.children;
  return (Array.isArray(kids) ? kids : [kids])
    .filter((k): k is string => typeof k === "string")
    .join("");
}

/** Every string the host nodes under `node` put on the glass. */
function texts(node: TestRenderer.ReactTestInstance): string[] {
  return node
    .findAll((n) => typeof n.type === "string")
    .map(ownText)
    .filter((s) => s.length > 0);
}

function colorOf(
  tree: TestRenderer.ReactTestRenderer,
  text: string,
): TextStyle["color"] {
  const node = tree.root.find(
    (n) => typeof n.type === "string" && ownText(n) === text,
  );
  const style: TextStyle = StyleSheet.flatten(node.props.style);
  return style.color;
}

/**
 * Matched by name rather than `findAllByType(Pressable)`: the export is a
 * `memo` wrapper and what renders is the function inside it, so identity
 * comparison against the import finds nothing.
 */
function pressables(
  node: TestRenderer.ReactTestInstance,
): TestRenderer.ReactTestInstance[] {
  return node.findAll(
    (n) => typeof n.type === "function" && n.type.name === "Pressable",
  );
}

test("a vehicle row is one tap target, not a card wrapping a button", () => {
  const tree = render();
  const rowPressables = pressables(tree.root).filter((p) =>
    texts(p).some((s) => s.includes("Civic")),
  );
  expect(rowPressables).toHaveLength(1);

  // And the target is the whole card: the readouts sit inside it too, so there
  // is no unpressable region between the name and the number.
  expect(texts(rowPressables[0])).toContain("101,475");

  navigated.length = 0;
  act(() => {
    rowPressables[0].props.onPress();
  });
  expect(navigated).toEqual([`/vehicle/${listVehicles()[0].id}`]);
});

test("the inner open-and-log pill is gone", () => {
  const rendered = texts(render().root);
  for (const key of ["garage.openAndLog", "garage.openHistory"] as const) {
    expect(rendered).not.toContain(t(key));
  }
  // The chevron carries the affordance the pill used to spell out.
  expect(rendered).toContain("\u203a");
});

test("the row takes its ink from the tokens, not a hard-coded default", () => {
  const tree = render();
  expect(colorOf(tree, NAME)).toBe(tokens.color.text);
  expect(colorOf(tree, "\u203a")).toBe(tokens.color.textMuted);
});

test("the garage offers the schedule and a one-tap way to log, not a black screen", () => {
  const tree = render();
  const printed = texts(tree.root);
  // The home screen after onboarding used to be one status card on an empty
  // screen. The quick-log chips are the missing half: the log form, opened
  // with the service already chosen.
  expect(printed).toContain(t("garage.quickLog"));
  for (const service of ["Oil Change", "Tire Rotation", "Brake Inspection"]) {
    expect(printed).toContain(serviceName(service));
  }

  navigated.length = 0;
  const chip = pressables(tree.root).find((p) =>
    texts(p).includes(serviceName("Oil Change")),
  )!;
  act(() => chip.props.onPress());
  expect(navigated).toEqual([
    `/vehicle/${listVehicles()[0].id}/log?type=Oil%20Change`,
  ]);
});

test("coming up lists the reminders this car would actually get", () => {
  const car = listVehicles()[0];
  addRecord({
    vehicle_id: car.id,
    service_type: "Oil Change",
    performed_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  });

  const printed = texts(render().root);
  expect(printed).toContain(t("garage.comingUp"));
  // The row is the scheduled reminder, so the home screen and the notification
  // cannot disagree about what is next.
  expect(printed).toContain(formatDate(nextReminders(car.id, 1)[0].dueAt));
});
