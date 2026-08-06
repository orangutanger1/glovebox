import Database from "better-sqlite3";

/**
 * The export reads two pieces of state now: the language the header row is
 * written in, and the unit its Odometer column is labelled with. The unit lives
 * in `app_state`, so the module graph reaches SQLite and the suite has to stand
 * a database up the same way the onboarding walk-through does.
 */
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

import { toCsv } from "../src/export/csv";
import { setLanguage } from "../src/i18n";
import { getDistanceUnit, setDistanceUnit } from "../src/units";

// The header row is translated, so the copy asserted below is only English's
// if English is the language in force.
beforeAll(() => setLanguage("en"));

beforeEach(() => setDistanceUnit("mi"));

const HEADER = "Vehicle,Service,Date,Odometer (mi),Cost,Notes,Deleted\n";

test("writes a header row even when there are no records", () => {
  expect(toCsv([])).toBe(HEADER);
});

test("the odometer column says which unit its numbers are in", () => {
  // A column of bare numbers is unreadable once the app can store either unit:
  // 51,771 is a well-travelled car in miles and an ordinary one in kilometres.
  expect(getDistanceUnit()).toBe("mi");
  expect(toCsv([]).split(",")[3]).toBe("Odometer (mi)");

  setDistanceUnit("km");
  expect(toCsv([]).split(",")[3]).toBe("Odometer (km)");
});

test("writes one line per record", () => {
  const out = toCsv([
    {
      vehicle_name: "Civic",
      service_type: "Oil Change",
      performed_at: "2026-01-15T00:00:00.000Z",
      odometer: 50000,
      cost: 49.99,
      notes: "Mobil 1",
    },
  ]);
  expect(out).toBe(HEADER + "Civic,Oil Change,2026-01-15,50000,49.99,Mobil 1,\n");
});

test("the cells stay machine-readable whatever the header says", () => {
  // The contract a spreadsheet was built against: English service identifiers,
  // ISO dates, ungrouped numbers. Only the row a person reads is translated,
  // and switching the unit label must not start grouping the digits under it.
  setDistanceUnit("km");
  const out = toCsv([
    {
      vehicle_name: "Civic",
      service_type: "Oil Change",
      performed_at: "2026-01-15T00:00:00.000Z",
      odometer: 51771,
      cost: 49.99,
      notes: "Mobil 1",
    },
  ]);
  expect(out).toBe(
    "Vehicle,Service,Date,Odometer (km),Cost,Notes,Deleted\n" +
      "Civic,Oil Change,2026-01-15,51771,49.99,Mobil 1,\n"
  );
});

test("quotes and escapes fields containing commas or quotes", () => {
  const out = toCsv([
    {
      vehicle_name: "Civic",
      service_type: "Other",
      performed_at: "2026-01-15T00:00:00.000Z",
      notes: 'Replaced belt, hose, and "the thing"',
    },
  ]);
  expect(out).toContain('"Replaced belt, hose, and ""the thing"""');
});

test("marks soft-deleted rows instead of omitting them", () => {
  const out = toCsv([
    {
      vehicle_name: "Civic",
      service_type: "Oil Change",
      performed_at: "2026-01-15T00:00:00.000Z",
      deleted_at: "2026-02-01T00:00:00.000Z",
    },
  ]);
  expect(out.trim().endsWith(",deleted")).toBe(true);
});
