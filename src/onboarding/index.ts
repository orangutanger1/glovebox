import { getDb } from "../db/client";
import {
  readOnboardingState,
  parseAnswers,
  ONBOARDING_COMPLETE_KEY,
  ONBOARDING_STEP_KEY,
  ONBOARDING_VEHICLE_KEY,
  ONBOARDING_ANSWERS_KEY,
  type Answers,
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

export function isOnboarded(): boolean {
  return readOnboardingState(dbGet).isOnboarded;
}

export function getOnboardingStep(): string | null {
  return readOnboardingState(dbGet).step;
}

export function setOnboardingStep(step: string): void {
  dbSet(ONBOARDING_STEP_KEY, step);
}

export function completeOnboarding(): void {
  dbSet(ONBOARDING_COMPLETE_KEY, "true");
}

/**
 * The vehicle the steps after "what are you driving?" write to.
 *
 * Returns null until the vehicle step has created one, and — because the row is
 * looked up rather than trusted — after that vehicle has been deleted. A step
 * that gets null creates instead of updating, which is the same behaviour a
 * first launch has always had.
 */
export function getOnboardingVehicleId(): string | null {
  return dbGet(ONBOARDING_VEHICLE_KEY);
}

export function setOnboardingVehicleId(vehicleId: string): void {
  dbSet(ONBOARDING_VEHICLE_KEY, vehicleId);
}

/**
 * The quiz answers that have nowhere else to live. Read on every screen after
 * the quiz, so it is a whole-object read rather than a key per answer: three
 * `app_state` rows to keep in step is three chances for a resumed flow to hold
 * half an opinion.
 */
export function getAnswers(): Answers {
  return parseAnswers(dbGet(ONBOARDING_ANSWERS_KEY));
}

/**
 * Merges rather than replaces. Each question owns one field and knows nothing
 * about the others; stepping back and changing one answer must not blank the
 * two after it.
 */
export function setAnswers(patch: Answers): void {
  dbSet(ONBOARDING_ANSWERS_KEY, JSON.stringify({ ...getAnswers(), ...patch }));
}

/**
 * Puts the flags back to first-launch so the flow can be walked again from
 * Settings. Vehicles and records are deliberately untouched — this replays the
 * screens, it does not wipe the app, and a "replay" that silently deleted a
 * year of history would be the worst button in the product.
 */
export function resetOnboarding(): void {
  dbSet(ONBOARDING_COMPLETE_KEY, "false");
  dbSet(ONBOARDING_STEP_KEY, "welcome");
  // Cleared, not carried over: the replay writes a new car, so the previous
  // run's vehicle must stop being the one every step edits — and the previous
  // run's answers must stop describing it, or the replay opens on a symptoms
  // screen built from a quiz this user has not taken yet.
  getDb().runSync("DELETE FROM app_state WHERE key IN (?, ?)", [
    ONBOARDING_VEHICLE_KEY,
    ONBOARDING_ANSWERS_KEY,
  ]);
}
