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
import { addRecord, softDeleteRecord, undoDelete } from "../src/db/records";
import { addFuelEntry } from "../src/db/fuel";

beforeEach(() => {
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

const log = (odometer?: number) =>
  addRecord({
    vehicle_id: "v1",
    service_type: "Oil Change",
    performed_at: "2026-03-01T12:00:00.000Z",
    odometer,
  });

const reading = () =>
  (getDb().getFirstSync("SELECT odometer FROM vehicles WHERE id='v1'", []) as {
    odometer: number | null;
  }).odometer;

describe("the vehicle's reading after a service is deleted", () => {
  // The same rule the fills keep (tests/fuel-db.test.ts): a write raises the
  // reading, so deleting the write that raised it has to lower it again.
  test("deleting the service that set the reading rewinds it to the highest surviving row", () => {
    log(1200);
    const typo = log(842100);
    expect(reading()).toBe(842100);
    softDeleteRecord(typo.id);
    expect(reading()).toBe(1200);
  });

  test("a fill counts as a surviving row", () => {
    addFuelEntry({
      vehicle_id: "v1",
      filled_at: "2026-03-01T12:00:00.000Z",
      odometer: 1400,
      volume: 12,
      full: true,
    });
    const typo = log(842100);
    softDeleteRecord(typo.id);
    expect(reading()).toBe(1400);
  });

  test("deleting a service below the reading leaves it alone", () => {
    log(1500);
    const older = log(1200);
    softDeleteRecord(older.id);
    expect(reading()).toBe(1500);
  });

  test("deleting a service with no reading leaves it alone", () => {
    log(1500);
    const unread = log(undefined);
    softDeleteRecord(unread.id);
    expect(reading()).toBe(1500);
  });

  test("undoing the delete puts the reading back", () => {
    log(1200);
    const latest = log(1500);
    softDeleteRecord(latest.id);
    expect(reading()).toBe(1200);
    undoDelete(latest.id);
    expect(reading()).toBe(1500);
  });
});
