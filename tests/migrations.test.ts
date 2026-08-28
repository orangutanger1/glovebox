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
