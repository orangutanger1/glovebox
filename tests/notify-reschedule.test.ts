import Database from "better-sqlite3";

jest.mock("../src/db/client", () => {
  const db = new Database(":memory:");
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

// Every call into iOS yields a tick, the way the bridge does: it is the
// interleaving between two rebuilds that the test is about, and a mock that
// answers synchronously cannot interleave.
const tick = () => new Promise((resolve) => setTimeout(resolve, 1));
const held: { content: { title: string; data?: Record<string, unknown> } }[] = [];
/** The service reminders among what iOS holds: each car also gets one
 *  odometer check-in, which carries `kind` instead of a service. */
const services = () => held.filter((h) => typeof h.content.data?.serviceType === "string");
const checkins = () => held.filter((h) => h.content.data?.kind === "checkin");
jest.mock("expo-notifications", () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: "granted", canAskAgain: false })),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {
    await tick();
    held.length = 0;
  }),
  scheduleNotificationAsync: jest.fn(async (request: never) => {
    await tick();
    held.push(request);
    return "id";
  }),
  cancelScheduledNotificationAsync: jest.fn(async () => {}),
  getAllScheduledNotificationsAsync: jest.fn(async () => held),
  SchedulableTriggerInputTypes: { DATE: "date" },
}));

import { getDb } from "../src/db/client";
import { rescheduleAll } from "../src/notify";
import { completeOnboarding } from "../src/onboarding";
import { createVehicle } from "../src/db/vehicles";
import { addRecord } from "../src/db/records";

const TYPES = ["Oil Change", "Tire Rotation", "Brake Inspection", "Air Filter"];

beforeEach(() => {
  held.length = 0;
  getDb().runSync("DELETE FROM service_records", []);
  getDb().runSync("DELETE FROM documents", []);
  getDb().runSync("DELETE FROM vehicles", []);
  completeOnboarding();
  const v = createVehicle({ name: "Civic" });
  for (const type of TYPES) {
    addRecord({ vehicle_id: v.id, service_type: type, performed_at: new Date().toISOString() });
  }
});

test("a rebuild holds one reminder per dated service", async () => {
  await rescheduleAll();
  expect(services()).toHaveLength(TYPES.length);
  expect(checkins()).toHaveLength(1);
});

test("two rebuilds started together still leave one copy of each reminder", async () => {
  // Fifteen call sites fire this without awaiting it — a delete and a Back
  // and another delete, Settings mounting while its row is tapped. Two runs
  // interleaved as clear, clear, schedule, schedule, and iOS ended up holding
  // every reminder twice.
  await Promise.all([rescheduleAll(), rescheduleAll()]);
  const titles = held.map((h) => h.content.title).sort();
  expect(titles).toEqual([...new Set(titles)]);
  expect(services()).toHaveLength(TYPES.length);
  expect(checkins()).toHaveLength(1);
});

test("a rebuild that fails does not stop the next one", async () => {
  const Notifications = jest.requireMock("expo-notifications");
  Notifications.cancelAllScheduledNotificationsAsync.mockRejectedValueOnce(new Error("bridge"));
  await expect(rescheduleAll()).rejects.toThrow("bridge");
  await rescheduleAll();
  expect(services()).toHaveLength(TYPES.length);
});

test("a dated document gets its expiry reminders, and a tap opens it", async () => {
  const { addDocument } = jest.requireActual("../src/db/documents");
  const vehicleId = getDb().getFirstSync<{ id: string }>("SELECT id FROM vehicles", [])!.id;
  const expires = new Date();
  expires.setDate(expires.getDate() + 90);
  const doc = addDocument(vehicleId, { kind: "insurance", expires_at: expires.toISOString() });
  await rescheduleAll();
  const alerts = held.filter((h) => h.content.data?.kind === "document");
  expect(alerts.map((a) => a.content.data?.daysLeft)).toEqual([30, 7]);
  expect(alerts[0].content.data?.url).toBe(`/vehicle/${vehicleId}/document?doc=${doc.id}`);
  expect(services()).toHaveLength(TYPES.length);
});
