import { getDb } from "../db/client";
import { LAST_OPEN_KEY, WINBACK_SHOWN_KEY } from "./state";

function dbGet(key: string): string | null {
  const row = getDb().getFirstSync<{ value: string | null }>(
    "SELECT value FROM app_state WHERE key = ?",
    [key]
  );
  return row?.value ?? null;
}

function dbSet(key: string, value: string): void {
  getDb().runSync(
    `INSERT INTO app_state (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [key, value]
  );
}

/**
 * Stamps this launch and hands back the previous one.
 *
 * Returning the old value is the whole point: the gap the win-back test needs
 * is between this launch and the last one, and reading the key after writing it
 * gives zero every time.
 */
export function recordOpen(now: Date = new Date()): string | null {
  const previous = dbGet(LAST_OPEN_KEY);
  dbSet(LAST_OPEN_KEY, now.toISOString());
  return previous;
}

export function getWinbackShownAt(): string | null {
  return dbGet(WINBACK_SHOWN_KEY);
}

/** Written when the screen is shown, not when the offer is taken — somebody
 *  who said no has been asked, and being asked is what the cooldown counts. */
export function markWinbackShown(now: Date = new Date()): void {
  dbSet(WINBACK_SHOWN_KEY, now.toISOString());
}
