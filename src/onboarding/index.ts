import { getDb } from "../db/client";
import {
  readOnboardingState,
  ONBOARDING_COMPLETE_KEY,
  ONBOARDING_STEP_KEY,
  ONBOARDING_VEHICLE_KEY,
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
 * Puts the flags back to first-launch so the flow can be walked again from
 * Settings. Vehicles and records are deliberately untouched — this replays the
 * screens, it does not wipe the app, and a "replay" that silently deleted a
 * year of history would be the worst button in the product.
 */
export function resetOnboarding(): void {
  dbSet(ONBOARDING_COMPLETE_KEY, "false");
  dbSet(ONBOARDING_STEP_KEY, "welcome");
  // Cleared, not carried over: the replay writes a new car, so the previous
  // run's vehicle must stop being the one every step edits.
  getDb().runSync("DELETE FROM app_state WHERE key = ?", [ONBOARDING_VEHICLE_KEY]);
}
