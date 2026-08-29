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
 * row's ink comes from whichever palette is on the glass rather than a
 * hard-coded default.
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
import { ThemeProvider } from "../src/design/theme";
import { setThemeMode, type ThemeMode } from "../src/design/themeState";
import { DARK, LIGHT, type Palette } from "../src/design/palette";
import { t, setLanguage } from "../src/i18n";
import { setDistanceUnit } from "../src/units";

const NAME = "2016 Honda Civic";

beforeAll(() => {
  setLanguage("en");
  setDistanceUnit("mi");
  createVehicle({ name: NAME, odometer: 101475 });
});

/**
 * Rendered through the provider, in the mode named. A bare render always gets
 * the LIGHT context default, which would make the dark case assert nothing.
 */
function renderIn(mode: ThemeMode): TestRenderer.ReactTestRenderer {
  setThemeMode(mode);
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(
      createElement(ThemeProvider, null, createElement(Garage)) as ReactElement,
    );
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
  const tree = renderIn("light");
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
  const rendered = texts(renderIn("light").root);
  for (const key of ["garage.openAndLog", "garage.openHistory"] as const) {
    expect(rendered).not.toContain(t(key));
  }
  // The chevron carries the affordance the pill used to spell out.
  expect(rendered).toContain("\u203a");
});

test.each<[ThemeMode, Palette]>([
  ["light", LIGHT],
  ["dark", DARK],
])("the row takes its ink from the %s palette", (mode, palette) => {
  const tree = renderIn(mode);
  expect(colorOf(tree, NAME)).toBe(palette.ink);
  expect(colorOf(tree, "\u203a")).toBe(palette.inkMuted);
});
