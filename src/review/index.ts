import * as StoreReview from "expo-store-review";
import { getDb } from "../db/client";
import {
  shouldRequestReview,
  REVIEW_LAST_ASKED_KEY,
  REVIEW_ASK_COUNT_KEY,
  type ReviewEvent,
  type ReviewEventKind,
} from "./state";

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
 * Notes something the user did that suggests the app is working for them.
 *
 * Cheap and silent by design: this sits on the success path of the core
 * actions, so it must never be the reason logging a service fails.
 */
export function recordReviewEvent(kind: ReviewEventKind): void {
  try {
    getDb().runSync("INSERT INTO review_events (kind, at) VALUES (?, ?)", [
      kind,
      new Date().toISOString(),
    ]);
  } catch {
    // Happiness tracking is not worth an error dialog.
  }
}

/**
 * Only the window that can still matter. Every half-life in EVENT_WEIGHTS is
 * two weeks or less, so anything older than 30 days contributes less than a
 * thousandth of a point — reading it costs more than it is worth, and the rows
 * are pruned on the same boundary to stop the table growing forever.
 */
const RELEVANT_DAYS = 30;

function recentEvents(): ReviewEvent[] {
  const cutoff = new Date(Date.now() - RELEVANT_DAYS * 24 * 60 * 60 * 1000).toISOString();
  getDb().runSync("DELETE FROM review_events WHERE at < ?", [cutoff]);
  return getDb().getAllSync<ReviewEvent>("SELECT kind, at FROM review_events WHERE at >= ?", [
    cutoff,
  ]);
}

/**
 * Asks iOS for the rating prompt, if the user has earned being asked.
 *
 * Call this after a completed action, never during onboarding — App Store
 * Review Guideline 5.6.3 covers soliciting reviews before the user has
 * meaningfully used the app, and Apple rejects builds for it.
 *
 * Fire and forget. `requestReview` resolves when the request reaches StoreKit,
 * not when the user acts on it, and iOS may draw nothing at all: the annual
 * count is spent, ratings are disabled on the device, or it is a TestFlight
 * build. None of that is observable, so the ask is recorded either way — the
 * alternative is retrying against a system that has already declined, which
 * spends every good moment on a prompt no one sees.
 */
export async function maybeRequestReview(): Promise<void> {
  try {
    const askCount = Number(dbGet(REVIEW_ASK_COUNT_KEY) ?? "0");
    const state = {
      events: recentEvents(),
      lastAskedAt: dbGet(REVIEW_LAST_ASKED_KEY),
      askCount: Number.isFinite(askCount) ? askCount : 0,
    };
    if (!shouldRequestReview(state, new Date())) return;
    if (!(await StoreReview.hasAction())) return;

    dbSet(REVIEW_LAST_ASKED_KEY, new Date().toISOString());
    dbSet(REVIEW_ASK_COUNT_KEY, String(state.askCount + 1));
    await StoreReview.requestReview();
  } catch {
    // A rating prompt is the least important thing on screen. It never breaks
    // the flow it hangs off.
  }
}
