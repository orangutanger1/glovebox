import { createElement, type ReactElement } from "react";
import { act } from "react";
import TestRenderer from "react-test-renderer";

/**
 * The odometer check-in and the glovebox document form.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

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
  Stack: { Screen: () => null },
}));

jest.mock("../src/db/client", () => {
  const Sqlite = require("better-sqlite3");
  const db = new Sqlite(":memory:");
  const { applyMigrations } = jest.requireActual("../src/db/schema");
  applyMigrations((sql: string) => db.exec(sql), 0);
  return {
    getDb: () => ({
      runSync: (sql: string, p: unknown[] = []) => db.prepare(sql).run(...p),
      getFirstSync: (sql: string, p: unknown[] = []) => db.prepare(sql).get(...p) ?? null,
      getAllSync: (sql: string, p: unknown[] = []) => db.prepare(sql).all(...p),
    }),
  };
});

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {}),
  scheduleNotificationAsync: jest.fn(async () => "id"),
  setNotificationHandler: jest.fn(),
  SchedulableTriggerInputTypes: { DATE: "date" },
}));
jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn(async () => {}),
  impactAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  NotificationFeedbackType: { Success: "success", Warning: "warning" },
  ImpactFeedbackStyle: { Light: "light", Heavy: "heavy" },
}));
const tracked: [string, Record<string, unknown>][] = [];
jest.mock("../src/analytics", () => ({
  track: (event: string, props: Record<string, unknown>) => tracked.push([event, props]),
}));

import Checkin from "../app/checkin";
import DocumentForm from "../app/vehicle/[id]/document";
import { getDb } from "../src/db/client";
import { getVehicle } from "../src/db/vehicles";
import { getState } from "../src/db/state";
import { addDocument, getDocument, listDocuments } from "../src/db/documents";
import { setLanguage } from "../src/i18n";

beforeAll(() => setLanguage("en"));

beforeEach(() => {
  navigated.length = 0;
  tracked.length = 0;
  getDb().runSync("DELETE FROM documents", []);
  getDb().runSync("DELETE FROM app_state", []);
  getDb().runSync("DELETE FROM vehicles", []);
  getDb().runSync(
    "INSERT INTO vehicles (id, name, odometer, odometer_dash, created_at) VALUES (?, ?, ?, ?, ?)",
    ["v1", "Civic", 50000, 50000, "2026-01-01T00:00:00.000Z"]
  );
});

function render(screen: () => ReactElement | null): TestRenderer.ReactTestRenderer {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(createElement(screen) as ReactElement);
  });
  return tree;
}

const byName = (tree: TestRenderer.ReactTestRenderer, name: string, prop: string, value: string) =>
  tree.root.find((n) => typeof n.type === "function" && n.type.name === name && n.props[prop] === value);

describe("odometer check-in", () => {
  test("a new reading is saved, stamped, and a notification tap lands on the car", () => {
    mockParams = { vehicle: "v1", source: "notification" };
    const tree = render(Checkin);
    act(() => byName(tree, "Field", "label", "Odometer today (mi)").props.onChangeText("51200"));
    act(() => byName(tree, "Button", "label", "Save reading").props.onPress());
    expect(getVehicle("v1")!.odometer).toBe(51200);
    expect(getState("odometer_read_at:v1")).not.toBeNull();
    expect(navigated).toEqual(["replace:/vehicle/v1"]);
    expect(tracked).toContainEqual([
      "odometer_checkin",
      { source: "notification", changed: true, had_reading: true, moved: "1000-2500" },
    ]);
  });

  test("'hasn't changed' is one tap and leaves the reading alone", () => {
    mockParams = { vehicle: "v1", source: "vehicle" };
    const tree = render(Checkin);
    act(() => byName(tree, "Button", "label", "Hasn't changed").props.onPress());
    expect(getVehicle("v1")!.odometer).toBe(50000);
    expect(getState("odometer_read_at:v1")).not.toBeNull();
    expect(navigated).toEqual(["back"]);
  });

  test("a reading below the last one is refused, not written", () => {
    mockParams = { vehicle: "v1" };
    const tree = render(Checkin);
    act(() => byName(tree, "Field", "label", "Odometer today (mi)").props.onChangeText("5000"));
    act(() => byName(tree, "Button", "label", "Save reading").props.onPress());
    expect(getVehicle("v1")!.odometer).toBe(50000);
    expect(getState("odometer_read_at:v1")).toBeNull();
    expect(navigated).toEqual([]);
  });
});

describe("document form", () => {
  test("a new document defaults to insurance, dated a year out", () => {
    mockParams = { id: "v1" };
    const tree = render(DocumentForm);
    act(() => byName(tree, "Field", "label", "Issued by").props.onChangeText("Geico"));
    act(() => byName(tree, "Button", "label", "Save").props.onPress());
    const [doc] = listDocuments("v1");
    expect(doc).toMatchObject({ kind: "insurance", issuer: "Geico" });
    const years = (new Date(doc.expires_at!).getTime() - Date.now()) / (365 * 24 * 3600 * 1000);
    expect(years).toBeGreaterThan(0.9);
    expect(years).toBeLessThan(1.1);
    expect(navigated).toEqual(["back"]);
    expect(tracked[0][0]).toBe("document_saved");
  });

  test("editing can take the expiry off", () => {
    const d = addDocument("v1", { kind: "registration", expires_at: "2027-01-01T12:00:00.000Z" });
    mockParams = { id: "v1", doc: d.id };
    const tree = render(DocumentForm);
    act(() => byName(tree, "Chip", "label", "Doesn't expire").props.onPress());
    act(() => byName(tree, "Button", "label", "Save").props.onPress());
    expect(getDocument(d.id)!.expires_at).toBeUndefined();
  });
});
