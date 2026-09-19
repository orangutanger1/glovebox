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
  // A database as v6 left it, not a fully migrated one: replaying an
  // ALTER TABLE ... ADD COLUMN over a table that already has the column is
  // an error, and the device never does it — user_version gates every step.
  for (const m of MIGRATIONS) if (m.version <= 6) exec(m.sql);
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

test("migration 8 retires an estimated reading rather than promoting it", () => {
  // The estimate path is gone: nothing has been able to write one since the
  // odometer question became required, and the flag's readers went with it.
  // A row still carrying one from an older build must not become a reading
  // by default — that is the app's arithmetic presented with the confidence
  // of a number read off the dash, which is what every screen refused to do
  // while the flag existed. It becomes "not set", and the edit screen is
  // where the owner puts the real one.
  const { db, exec } = open();
  // A v7 database in miniature: only the columns the migration touches.
  db.exec(`
    CREATE TABLE vehicles (id TEXT PRIMARY KEY, name TEXT, odometer INTEGER,
      odometer_estimated INTEGER, created_at TEXT);
    INSERT INTO vehicles VALUES ('est', 'Guessed', 94500, 1, '2026-01-01T00:00:00.000Z');
    INSERT INTO vehicles VALUES ('read', 'Read', 84210, NULL, '2026-01-01T00:00:00.000Z');
  `);
  applyMigrations(exec, 7);
  const rows = db
    .prepare("SELECT id, odometer, odometer_estimated FROM vehicles ORDER BY id")
    .all() as { id: string; odometer: number | null; odometer_estimated: number | null }[];
  expect(rows).toEqual([
    { id: "est", odometer: null, odometer_estimated: null },
    { id: "read", odometer: 84210, odometer_estimated: null },
  ]);
});

test("migration 9 seeds the dash reading from the reading every existing car already has", () => {
  const { db, exec } = open();
  for (const m of MIGRATIONS) if (m.version <= 8) exec(m.sql);
  db.prepare("INSERT INTO vehicles (id, name, odometer, created_at) VALUES (?, ?, ?, ?)").run(
    "v1", "Civic", 84210, "2026-01-01T00:00:00.000Z"
  );
  db.prepare("INSERT INTO vehicles (id, name, created_at) VALUES (?, ?, ?)").run(
    "v2", "Golf", "2026-01-01T00:00:00.000Z"
  );
  applyMigrations(exec, 8);
  const rows = db
    .prepare("SELECT id, odometer, odometer_dash FROM vehicles ORDER BY id")
    .all() as { id: string; odometer: number | null; odometer_dash: number | null }[];
  expect(rows).toEqual([
    { id: "v1", odometer: 84210, odometer_dash: 84210 },
    { id: "v2", odometer: null, odometer_dash: null },
  ]);
});
