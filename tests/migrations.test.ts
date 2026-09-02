import Database from "better-sqlite3";
import { MIGRATIONS, applyMigrations } from "../src/db/schema";

function open() {
  const db = new Database(":memory:");
  const exec = (sql: string) => db.exec(sql);
  return { db, exec };
}

test("migrations create the expected tables from scratch", () => {
  const { db, exec } = open();
  const v = applyMigrations(exec, 0);
  expect(v).toBe(MIGRATIONS.length);
  const names = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table'")
    .all()
    .map((r: any) => r.name);
  expect(names).toEqual(expect.arrayContaining(["vehicles", "service_records", "service_intervals"]));
});

test("migrations are idempotent when re-run from the recorded version", () => {
  const { exec } = open();
  const v1 = applyMigrations(exec, 0);
  const v2 = applyMigrations(exec, v1);
  expect(v2).toBe(v1);
});

test("existing rows survive a full migration replay", () => {
  const { db, exec } = open();
  applyMigrations(exec, 0);
  db.prepare("INSERT INTO vehicles (id, name, created_at) VALUES (?, ?, ?)").run(
    "v1", "Civic", "2026-01-01T00:00:00.000Z"
  );
  applyMigrations(exec, MIGRATIONS.length);
  const row: any = db.prepare("SELECT name, created_at FROM vehicles WHERE id='v1'").get();
  expect(row.name).toBe("Civic");
  expect(row.created_at).toBe("2026-01-01T00:00:00.000Z");
});

test("no migration contains a destructive statement", () => {
  for (const m of MIGRATIONS) {
    expect(m.sql).not.toMatch(/\bDROP\b/i);
    expect(m.sql).not.toMatch(/\bDELETE\s+FROM\b/i);
  }
});

test("migration 6 adds body_style and leaves existing rows unknown", () => {
  const { db, exec } = open();
  applyMigrations(exec, 0);
  db.prepare("INSERT INTO vehicles (id, name, created_at) VALUES (?, ?, ?)").run(
    "v1", "Civic", "2026-01-01T00:00:00.000Z"
  );
  applyMigrations(exec, MIGRATIONS.length);
  const row = db.prepare("SELECT body_style FROM vehicles WHERE id='v1'").get() as {
    body_style: string | null;
  };
  expect(row.body_style).toBeNull();
});

test("migration 7 creates fuel_entries with the columns the math needs", () => {
  const { db, exec } = open();
  applyMigrations(exec, 0);
  const cols = db.prepare("PRAGMA table_info(fuel_entries)").all() as {
    name: string;
    type: string;
    notnull: number;
    dflt_value: string | null;
  }[];
  const by = Object.fromEntries(cols.map((c) => [c.name, c]));
  // odometer and volume are NOT NULL, deliberately unlike service_records: a
  // fill without either can never yield a distance, and it corrupts the tank
  // after it as well.
  expect(by.odometer.notnull).toBe(1);
  expect(by.volume.notnull).toBe(1);
  // cost stays nullable: a fill nobody priced must not be summed as a zero.
  expect(by.cost.notnull).toBe(0);
  expect(by.full.notnull).toBe(1);
  expect(by.full.dflt_value).toBe("1");
});

test("fuel entries are indexed by odometer, which is their true order", () => {
  const { db, exec } = open();
  applyMigrations(exec, 0);
  const idx = db
    .prepare("SELECT name, sql FROM sqlite_master WHERE type='index' AND name='idx_fuel_vehicle'")
    .get() as { sql: string } | undefined;
  expect(idx?.sql).toContain("odometer");
});

test("migration 7 preserves rows written under v6", () => {
  const { db, exec } = open();
  applyMigrations(exec, 0);
  db.prepare("INSERT INTO vehicles (id, name, created_at) VALUES (?, ?, ?)").run(
    "v1", "Civic", "2026-01-01T00:00:00.000Z"
  );
  db.prepare(
    "INSERT INTO service_records (id, vehicle_id, service_type, performed_at, revision, created_at) VALUES (?, ?, ?, ?, 1, ?)"
  ).run("r1", "v1", "Oil Change", "2026-02-01T12:00:00.000Z", "2026-02-01T12:00:00.000Z");
  applyMigrations(exec, 6);
  expect(
    (db.prepare("SELECT COUNT(*) AS n FROM service_records").get() as { n: number }).n
  ).toBe(1);
  expect(
    (db.prepare("SELECT name FROM vehicles WHERE id='v1'").get() as { name: string }).name
  ).toBe("Civic");
});
