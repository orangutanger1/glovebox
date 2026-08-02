export const ONBOARDING_COMPLETE_KEY = "onboarding_complete";
export const ONBOARDING_STEP_KEY = "onboarding_step";

/**
 * The one vehicle this run of onboarding owns.
 *
 * Every step used to reach for `listVehicles()[0]`, which is the right car on a
 * first launch and the wrong one on a replay: Settings offers "Replay
 * onboarding" to a user who already has a garage, and the vehicle step then
 * rewrote their oldest car's year, make and model, while the service step soft
 * deleted that car's existing records for whatever service type was picked.
 * Naming the vehicle explicitly keeps a replay additive, which is what the
 * confirmation dialog promises.
 */
export const ONBOARDING_VEHICLE_KEY = "onboarding_vehicle_id";

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
