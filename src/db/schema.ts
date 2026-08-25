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
  {
    version: 3,
    sql: `
      CREATE TABLE IF NOT EXISTS review_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        kind TEXT NOT NULL,
        at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_review_events_at
        ON review_events (at DESC);
    `,
  },
  // The column held miles because the app only had miles. It now holds whatever
  // unit the user reads (see `app_state.distance_unit`), so the name was a
  // standing lie about the contents — and the one thing a maintenance log cannot
  // afford is a number whose unit you have to guess. A rename rather than a new
  // column: every existing value is already correct, only its label was wrong.
  {
    version: 4,
    sql: `
      ALTER TABLE service_intervals RENAME COLUMN miles TO distance;
    `,
  },
  // An odometer reading the app worked out rather than one the user read off
  // the dash. Onboarding lets them say "I'll add it later" instead of stopping
  // at a mandatory number, which means the garage is now holding two kinds of
  // reading and has to be able to tell them apart: an estimate is labelled as
  // one everywhere it is shown, and the first real number that arrives clears
  // the flag. A nullable column rather than a default, so every row written
  // before this migration reads as "not an estimate", which is what it is.
  {
    version: 5,
    sql: `
      ALTER TABLE vehicles ADD COLUMN odometer_estimated INTEGER;
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
