import { getDb } from "./client";

/**
 * The `app_state` key/value table, in one place.
 *
 * Four modules had grown a private copy of this pair of three-line functions —
 * onboarding, review, win-back, and then units and locale would have made six.
 * The SQL is identical in every copy, which means a fix to any of it (the
 * `?? null` that keeps a missing row from reading as the string "null", the
 * upsert that keeps a second write from throwing on the primary key) has to be
 * made in every copy or in none.
 */
export function getState(key: string): string | null {
  const row = getDb().getFirstSync<{ value: string | null }>(
    "SELECT value FROM app_state WHERE key = ?",
    [key]
  );
  return row?.value ?? null;
}

export function setState(key: string, value: string): void {
  getDb().runSync(
    `INSERT INTO app_state (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value]
  );
}
