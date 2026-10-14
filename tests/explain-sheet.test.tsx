import { createElement, type ReactElement } from "react";
import { act } from "react";
import TestRenderer from "react-test-renderer";

/**
 * The service explainer sheet, rendered: what it says, what it reports, and
 * where its buttons go.
 */
(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const navigated: string[] = [];
let mockParams: Record<string, string> = {};
jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: (to: string) => navigated.push(to),
    replace: (to: string) => navigated.push(`replace:${to}`),
    back: () => navigated.push("back"),
    canGoBack: () => true,
  }),
  useLocalSearchParams: () => mockParams,
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
jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(async () => {}),
  impactAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium" },
  NotificationFeedbackType: { Success: "success", Warning: "warning" },
}));
const tracked: { event: string; props?: Record<string, unknown> }[] = [];
jest.mock("../src/analytics", () => ({
  track: (event: string, props?: Record<string, unknown>) => tracked.push({ event, props }),
}));

import ExplainSheet from "../app/explain";
import { getDb } from "../src/db/client";
import { t, setLanguage } from "../src/i18n";
import { setDistanceUnit } from "../src/units";

beforeAll(() => {
  setLanguage("en");
  setDistanceUnit("mi");
});

beforeEach(() => {
  navigated.length = 0;
  tracked.length = 0;
  getDb().runSync("DELETE FROM service_records", []);
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
    tree = TestRenderer.create(createElement(ExplainSheet) as ReactElement);
  });
  return tree;
}

function texts(tree: TestRenderer.ReactTestRenderer): string[] {
  return tree.root
    .findAll((n) => (n.type as unknown) === "Text")
    .map((n) => [n.props.children].flat().join(""));
}

function press(tree: TestRenderer.ReactTestRenderer, label: string): void {
  const button = tree.root.find(
    (n) => typeof n.type === "function" && n.type.name === "Button" && n.props.label === label,
  );
  act(() => button.props.onPress());
}

test("shows the service's copy and says it has never been logged", () => {
  mockParams = { type: "Cabin Air Filter", vehicle: "v1", source: "service_row" };
  const shown = texts(render());
  expect(shown).toContain(t("explain.Cabin Air Filter.what"));
  expect(shown).toContain(t("explain.difficulty.easy"));
  expect(shown).toContain("Not logged yet");
  expect(tracked[0]).toEqual({
    event: "explainer_opened",
    props: { service_type: "Cabin Air Filter", source: "service_row", status: "never_logged" },
  });
});

test("reports an overdue service as overdue", () => {
  getDb().runSync(
    "INSERT INTO service_records (id, vehicle_id, service_type, performed_at, odometer, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    ["r1", "v1", "Oil Change", "2025-01-01T17:00:00.000Z", 40000, "2025-01-01T17:00:00.000Z"],
  );
  mockParams = { type: "Oil Change", vehicle: "v1", source: "notification" };
  render();
  expect(tracked[0].props).toMatchObject({ source: "notification", status: "overdue" });
});

test("Log it opens the log form for that service in place of the card", () => {
  mockParams = { type: "Wiper Blades", vehicle: "v1", source: "due_row" };
  press(render(), t("explain.log"));
  expect(tracked.map((e) => e.event)).toContain("explainer_action");
  expect(navigated).toEqual(["replace:/vehicle/v1/log?type=Wiper%20Blades"]);
});

test("from the log form, Log it just goes back to the form", () => {
  mockParams = { type: "Wiper Blades", vehicle: "v1", source: "log_form" };
  press(render(), t("explain.log"));
  expect(navigated).toEqual(["back"]);
});

test("reports how long the card was open when it closes", () => {
  mockParams = { type: "Spark Plugs", vehicle: "v1", source: "service_row" };
  const tree = render();
  act(() => tree.unmount());
  expect(tracked[tracked.length - 1]).toMatchObject({
    event: "explainer_closed",
    props: { service_type: "Spark Plugs" },
  });
});

test("a service with no card closes without reporting anything", () => {
  mockParams = { type: "Other", vehicle: "v1", source: "service_row" };
  render();
  expect(tracked).toEqual([]);
  expect(navigated).toEqual(["back"]);
});
