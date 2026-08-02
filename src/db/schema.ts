export const MIGRATIONS: { version: number; sql: string }[] = [
  {
    version: 1,
    sql: `
      CREATE TABLE IF NOT EXISTS vehicles (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        make TEXT,
        model TEXT,
        year INTEGER,
        odometer INTEGER,
        created_at TEXT NOT NULL,
        deleted_at TEXT
      );

      CREATE TABLE IF NOT EXISTS service_records (
        id TEXT PRIMARY KEY NOT NULL,
        vehicle_id TEXT NOT NULL,
        service_type TEXT NOT NULL,
        performed_at TEXT NOT NULL,
        odometer INTEGER,
        cost REAL,
        notes TEXT,
        revision INTEGER NOT NULL DEFAULT 1,
        supersedes TEXT,
        deleted_at TEXT,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS service_intervals (
        service_type TEXT PRIMARY KEY NOT NULL,
        months INTEGER,
        miles INTEGER
      );

      CREATE INDEX IF NOT EXISTS idx_records_vehicle
        ON service_records (vehicle_id, performed_at DESC);
    `,
  },
  {
    version: 2,
    sql: `
      CREATE TABLE IF NOT EXISTS app_state (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT
      );
    `,
  },
];

/**
 * Applies every migration newer than `currentVersion` in order.
 * Pure orchestration: the caller supplies `exec`, so the same code runs
 * against expo-sqlite on device and better-sqlite3 in tests.
 */
export function applyMigrations(exec: (sql: string) => void, currentVersion: number): number {
  let version = currentVersion;
  for (const m of MIGRATIONS) {
    if (m.version <= version) continue;
    exec(m.sql);
    version = m.version;
  }
  return version;
}
