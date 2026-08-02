import { getDb } from "../db/client";
import { readOnboardingState, ONBOARDING_COMPLETE_KEY, ONBOARDING_STEP_KEY } from "./state";

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
