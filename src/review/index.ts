import * as StoreReview from "expo-store-review";
import { getDb } from "../db/client";
import { shouldRequestReview, REVIEW_ASKED_KEY } from "./state";

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
 * Asks iOS to show the rating prompt, if this is the moment to ask.
 *
 * Fire and forget, deliberately. `requestReview` resolves the instant the
 * request is handed to StoreKit, not when the user acts on it, and iOS may
 * decide to show nothing at all — the count is exhausted, the device has
 * ratings disabled, it is a TestFlight build. None of that is knowable and
 * none of it should ever hold up a tap on Continue, so every failure path here
 * is silent and the caller does not await a decision.
 *
 * The asked-at flag is written whether or not the system draws anything. The
 * alternative is retrying an ask iOS has already refused, which burns the one
 * moment we have without ever surfacing a prompt.
 */
export async function maybeRequestReview(facts: { recordCount: number }): Promise<void> {
  try {
    if (!shouldRequestReview(dbGet, facts)) return;
    if (!(await StoreReview.hasAction())) return;
    dbSet(REVIEW_ASKED_KEY, new Date().toISOString());
    await StoreReview.requestReview();
  } catch {
    // A rating prompt is the least important thing on screen. It never breaks
    // the flow it is attached to.
  }
}
