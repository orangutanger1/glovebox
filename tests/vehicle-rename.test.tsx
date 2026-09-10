import { createElement, type ReactElement } from "react";
import { act } from "react";
import TestRenderer from "react-test-renderer";

/**
 * Renaming a vehicle.
 *
 * The garage had no way to do it at all: a name typed wrong in onboarding
 * could only be corrected by deleting the car and adding a new one, which
 * takes the whole service history with it. So the two things worth asserting
 * are that the rename lands, and that it lands on the name alone — the year,
 * make, model, odometer and every record on the row have to survive it, or the
 * fix costs what the workaround did.
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

jest.mock("expo-notifications", () => ({
  requestPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  getPermissionsAsync: jest.fn(async () => ({ status: "granted" })),
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {}),
  cancelScheduledNotificationAsync: jest.fn(async () => {}),
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

import EditVehicle from "../app/vehicle/[id]/edit";
import { getDb } from "../src/db/client";
import { getVehicle, renameVehicle } from "../src/db/vehicles";
import { listRecords } from "../src/db/records";
import { setLanguage } from "../src/i18n";

beforeAll(() => setLanguage("en"));

beforeEach(() => {
  navigated.length = 0;
  getDb().runSync("DELETE FROM service_records", []);
  getDb().runSync("DELETE FROM vehicles", []);
  getDb().runSync(
    "INSERT INTO vehicles (id, name, year, make, model, odometer, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
    ["v1", "2019 Honda Civic", 2019, "Honda", "Civic", 84210, "2026-01-01T00:00:00.000Z"]
  );
  getDb().runSync(
    "INSERT INTO service_records (id, vehicle_id, service_type, performed_at, odometer, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    ["r1", "v1", "OilChange", "2026-02-01T00:00:00.000Z", 80000, "2026-02-01T00:00:00.000Z"]
  );
});

function render(): TestRenderer.ReactTestRenderer {
  let tree!: TestRenderer.ReactTestRenderer;
  act(() => {
    tree = TestRenderer.create(createElement(EditVehicle) as ReactElement);
  });
  return tree;
}

function field(tree: TestRenderer.ReactTestRenderer, label: string) {
  return tree.root.find(
    (n) => typeof n.type === "function" && n.type.name === "Field" && n.props.label === label
  );
}

function button(tree: TestRenderer.ReactTestRenderer, label: string) {
  return tree.root.find(
    (n) => typeof n.type === "function" && n.type.name === "Button" && n.props.label === label
  );
}

test("the name arrives in the field, so a typo is edited rather than retyped", () => {
  expect(field(render(), "Name").props.value).toBe("2019 Honda Civic");
});

test("saving renames the car and leaves everything else on the row alone", () => {
  const tree = render();
  act(() => field(tree, "Name").props.onChangeText("The Blue One"));
  act(() => button(tree, "Save").props.onPress());

  const saved = getVehicle("v1")!;
  expect(saved.name).toBe("The Blue One");
  // The reason this is not `updateVehicleIdentity`: that function's contract
  // is "an absent field was cleared", so renaming through it from a form with
  // one input would blank the spec line under the cluster.
  expect(saved.year).toBe(2019);
  expect(saved.make).toBe("Honda");
  expect(saved.model).toBe("Civic");
  expect(saved.odometer).toBe(84210);
  // The whole point. Before this screen existed, correcting a name meant
  // deleting the vehicle, and deleting the vehicle is what puts a history out
  // of reach.
  expect(listRecords("v1")).toHaveLength(1);
  expect(navigated).toContain("back");
});

test("an empty name is not a rename", () => {
  const tree = render();
  act(() => field(tree, "Name").props.onChangeText("   "));

  expect(button(tree, "Save").props.disabled).toBe(true);
  act(() => button(tree, "Save").props.onPress());
  expect(getVehicle("v1")!.name).toBe("2019 Honda Civic");
});

test("renameVehicle touches one column", () => {
  renameVehicle("v1", "Wagon");
  const saved = getVehicle("v1")!;
  expect(saved.name).toBe("Wagon");
  expect(saved.make).toBe("Honda");
  expect(saved.odometer).toBe(84210);
});
