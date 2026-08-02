export const ONBOARDING_COMPLETE_KEY = "onboarding_complete";
export const ONBOARDING_STEP_KEY = "onboarding_step";

/**
 * Pure over an injected `get`, the same way applyMigrations is pure over `exec` —
 * testable in Node against a plain map, no device driver required.
 */
export function readOnboardingState(get: (key: string) => string | null): {
  isOnboarded: boolean;
  step: string | null;
} {
  return {
    isOnboarded: get(ONBOARDING_COMPLETE_KEY) === "true",
    step: get(ONBOARDING_STEP_KEY),
  };
}
