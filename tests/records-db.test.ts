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
import { createVehicle, getVehicle, setOdometerReading } from "../src/db/vehicles";
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

describe("a reading the owner typed onto the dash", () => {
  // The onboarding odometer screen and the edit screen write the reading
  // directly; no row stands behind it. The log form then prefills that same
  // number, so the first service logged is a row that *equals* the reading
  // without having raised it. Deleting that row used to rewind the reading to
  // NULL — the number the owner read off the dash, gone with a row that
  // never set it.
  const dash = (n: number) => {
    getDb().runSync("UPDATE vehicles SET odometer = NULL, odometer_dash = NULL WHERE id='v1'", []);
    setOdometerReading("v1", n);
  };

  test("survives deleting a service logged at the prefilled reading", () => {
    dash(84210);
    const prefilled = log(84210);
    softDeleteRecord(prefilled.id);
    expect(reading()).toBe(84210);
  });

  test("survives the onboarding 'Just now' answer being taken back", () => {
    dash(84210);
    const justNow = log(84210);
    softDeleteRecord(justNow.id);
    const sixMonthsAgo = log(80000);
    expect(reading()).toBe(84210);
    expect(sixMonthsAgo.odometer).toBe(80000);
  });

  test("still lets a typo'd row above it be taken back down to it", () => {
    dash(84210);
    const typo = log(842100);
    expect(reading()).toBe(842100);
    softDeleteRecord(typo.id);
    expect(reading()).toBe(84210);
  });

  test("a lower reading typed on the edit screen wins over an older dash reading", () => {
    dash(84210);
    setOdometerReading("v1", 84000);
    const row = log(84000);
    softDeleteRecord(row.id);
    expect(reading()).toBe(84000);
  });

  test("a vehicle created with a reading treats it as the dash reading", () => {
    const v = createVehicle({ name: "Golf", odometer: 50000 });
    const row = addRecord({
      vehicle_id: v.id,
      service_type: "Wiper Blades",
      performed_at: "2026-03-01T12:00:00.000Z",
      odometer: 50000,
    });
    softDeleteRecord(row.id);
    expect(getVehicle(v.id)?.odometer).toBe(50000);
  });
});
