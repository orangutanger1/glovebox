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

import { getDb } from "../src/db/client";
import { CHECKIN_DAYS, latest, nextCheckinAt } from "../src/checkin";
import { lastReadingAt, markOdometerRead } from "../src/db/checkin";
import { addRecord } from "../src/db/records";
import { addFuelEntry } from "../src/db/fuel";

const DAY = 24 * 60 * 60 * 1000;

describe("nextCheckinAt", () => {
  test("a month after the last reading, at 10am local", () => {
    const anchor = new Date(2026, 0, 1, 15, 30).toISOString();
    const at = new Date(nextCheckinAt(anchor, new Date(2026, 0, 2).getTime()));
    expect(at).toEqual(new Date(2026, 0, 1 + CHECKIN_DAYS, 10, 0, 0, 0));
  });

  test("an ignored check-in comes back a month later, not tomorrow", () => {
    const anchor = new Date(2026, 0, 1).toISOString();
    // 45 days on: the first check-in has passed unanswered.
    const now = new Date(2026, 0, 1).getTime() + 45 * DAY;
    const at = new Date(nextCheckinAt(anchor, now));
    expect(at).toEqual(new Date(2026, 0, 1 + 2 * CHECKIN_DAYS, 10, 0, 0, 0));
    // And asking again the next day gives the same answer.
    expect(nextCheckinAt(anchor, now + DAY)).toBe(at.toISOString());
  });

  test("never in the past", () => {
    const anchor = new Date(2020, 0, 1).toISOString();
    const now = Date.now();
    expect(new Date(nextCheckinAt(anchor, now)).getTime()).toBeGreaterThan(now);
  });
});

test("latest skips the missing ones", () => {
  expect(latest(undefined, "2026-01-01T00:00:00.000Z", null, "2026-03-01T00:00:00.000Z")).toBe(
    "2026-03-01T00:00:00.000Z"
  );
  expect(latest(undefined, null)).toBeUndefined();
});

describe("lastReadingAt", () => {
  const vehicle = { id: "v1", created_at: "2026-01-01T00:00:00.000Z" };

  beforeEach(() => {
    getDb().runSync("DELETE FROM service_records", []);
    getDb().runSync("DELETE FROM fuel_entries", []);
    getDb().runSync("DELETE FROM app_state", []);
    getDb().runSync("DELETE FROM vehicles", []);
    getDb().runSync("INSERT INTO vehicles (id, name, odometer, created_at) VALUES (?, ?, ?, ?)", [
      "v1",
      "Civic",
      1000,
      vehicle.created_at,
    ]);
  });

  test("the day the car was added, when nothing else has been read", () => {
    expect(lastReadingAt(vehicle)).toBe(vehicle.created_at);
  });

  test("a fill-up counts as a reading, so a weekly filler is never asked", () => {
    addFuelEntry({ vehicle_id: "v1", filled_at: "2026-02-10T12:00:00.000Z", odometer: 1500, volume: 10, full: true });
    expect(lastReadingAt(vehicle)).toBe("2026-02-10T12:00:00.000Z");
  });

  test("a service with no mileage on it does not", () => {
    addRecord({ vehicle_id: "v1", service_type: "Oil Change", performed_at: "2026-02-10T12:00:00.000Z" });
    expect(lastReadingAt(vehicle)).toBe(vehicle.created_at);
  });

  test("an answered check-in wins when it is the latest", () => {
    addRecord({ vehicle_id: "v1", service_type: "Oil Change", performed_at: "2026-02-10T12:00:00.000Z", odometer: 1200 });
    markOdometerRead("v1", new Date("2026-03-05T09:00:00.000Z"));
    expect(lastReadingAt(vehicle)).toBe("2026-03-05T09:00:00.000Z");
  });
});
