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
import { addRecord, costedRecords } from "../src/db/records";
import { softDeleteVehicle, undoDeleteVehicle } from "../src/db/vehicles";
import {
  addFuelEntry,
  allFuelEntries,
  allFuelForExport,
  fuelEntriesForVehicle,
  listFuelEntries,
  softDeleteFuelEntry,
  undoDeleteFuelEntry,
} from "../src/db/fuel";

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

const add = (
  odometer: number,
  volume: number,
  extra: Partial<{ cost: number; full: boolean }> = {}
) =>
  addFuelEntry({
    vehicle_id: "v1",
    filled_at: "2026-03-01T12:00:00.000Z",
    odometer,
    volume,
    full: true,
    ...extra,
  });

test("a saved fill comes back with what was typed", () => {
  const saved = add(1200, 12.4, { cost: 51.2 });
  const [row] = listFuelEntries("v1");
  expect(row.id).toBe(saved.id);
  expect(row.odometer).toBe(1200);
  expect(row.volume).toBeCloseTo(12.4, 6);
  expect(row.cost).toBeCloseTo(51.2, 6);
  expect(row.full).toBe(1);
});

test("an unpriced fill stores NULL, which reads back as absent rather than zero", () => {
  add(1200, 12);
  const [row] = listFuelEntries("v1");
  expect(row.cost).toBeUndefined();
});

test("a partial is stored as 0, not dropped", () => {
  add(1200, 5, { full: false });
  expect(listFuelEntries("v1")[0].full).toBe(0);
});

test("a fill past the vehicle's reading advances the odometer and clears the estimate", () => {
  getDb().runSync("UPDATE vehicles SET odometer_estimated = 1 WHERE id = 'v1'", []);
  add(1200, 12);
  const v = getDb().getFirstSync(
    "SELECT odometer, odometer_estimated FROM vehicles WHERE id='v1'",
    []
  ) as { odometer: number; odometer_estimated: number | null };
  expect(v.odometer).toBe(1200);
  expect(v.odometer_estimated).toBeNull();
});

test("a fill behind the vehicle's reading never walks the odometer backwards", () => {
  add(1200, 12);
  add(900, 12);
  const v = getDb().getFirstSync("SELECT odometer FROM vehicles WHERE id='v1'", []) as {
    odometer: number;
  };
  expect(v.odometer).toBe(1200);
});

test("deleting tombstones the row and undo brings it back", () => {
  const saved = add(1200, 12);
  softDeleteFuelEntry(saved.id);
  expect(listFuelEntries("v1")).toHaveLength(0);
  undoDeleteFuelEntry(saved.id);
  expect(listFuelEntries("v1")).toHaveLength(1);
});

test("the export keeps a deleted fill; the math does not", () => {
  // Opposite obligations, the same pair src/db/records already keeps: an export
  // must never lose a row the user once had, and a figure must never include a
  // fill they deleted.
  const saved = add(1200, 12);
  softDeleteFuelEntry(saved.id);
  expect(allFuelForExport()).toHaveLength(1);
  expect(allFuelForExport()[0].vehicle_name).toBe("Civic");
  expect(fuelEntriesForVehicle("v1")).toHaveLength(0);
});

test("the history reads newest first and the math reads oldest first", () => {
  add(1200, 12);
  add(1500, 12);
  expect(listFuelEntries("v1").map((r) => r.odometer)).toEqual([1500, 1200]);
  expect(fuelEntriesForVehicle("v1").map((r) => r.odometer)).toEqual([1200, 1500]);
});

test("a deleted vehicle's fills and services leave the garage totals, and return with it", () => {
  // The rows stay on disk for the export; the insights screen sums only what
  // the user can still reach from the garage.
  add(1200, 10, { cost: 40 });
  addRecord({
    vehicle_id: "v1",
    service_type: "Oil Change",
    performed_at: "2026-03-01T12:00:00.000Z",
    cost: 80,
  });
  expect(allFuelEntries()).toHaveLength(1);
  expect(costedRecords()).toHaveLength(1);

  softDeleteVehicle("v1");
  expect(allFuelEntries()).toHaveLength(0);
  expect(costedRecords()).toHaveLength(0);
  expect(allFuelForExport()).toHaveLength(1);

  undoDeleteVehicle("v1");
  expect(allFuelEntries()).toHaveLength(1);
  expect(costedRecords()).toHaveLength(1);
});

const reading = () =>
  (getDb().getFirstSync("SELECT odometer FROM vehicles WHERE id='v1'", []) as {
    odometer: number | null;
  }).odometer;

describe("the vehicle's reading after a delete", () => {
  // Every write is a high-water mark, so the only way a typo'd 842,100 ever
  // came off the dash was deleting the car. Deleting the fill that set the
  // reading now puts the reading back where the surviving rows say it is.
  test("deleting the fill that set the reading rewinds it to the highest surviving row", () => {
    add(1200, 12);
    const typo = add(842100, 12);
    expect(reading()).toBe(842100);
    softDeleteFuelEntry(typo.id);
    expect(reading()).toBe(1200);
  });

  test("a service record counts as a surviving row", () => {
    addRecord({
      vehicle_id: "v1",
      service_type: "Oil Change",
      performed_at: "2026-03-01T12:00:00.000Z",
      odometer: 1400,
    });
    const typo = add(842100, 12);
    softDeleteFuelEntry(typo.id);
    expect(reading()).toBe(1400);
  });

  test("deleting a fill below the reading leaves it alone", () => {
    add(1500, 12);
    const older = add(1200, 12);
    softDeleteFuelEntry(older.id);
    expect(reading()).toBe(1500);
  });

  test("deleting the only row that ever set the reading clears it", () => {
    // The app no longer knows a reading, and "not set" is what it says rather
    // than the number the user just told it was wrong.
    getDb().runSync("UPDATE vehicles SET odometer = NULL WHERE id='v1'", []);
    const typo = add(842100, 12);
    softDeleteFuelEntry(typo.id);
    expect(reading()).toBeNull();
  });

  test("undoing the delete puts the reading back", () => {
    add(1200, 12);
    const latest = add(1500, 12);
    softDeleteFuelEntry(latest.id);
    expect(reading()).toBe(1200);
    undoDeleteFuelEntry(latest.id);
    expect(reading()).toBe(1500);
  });
});
