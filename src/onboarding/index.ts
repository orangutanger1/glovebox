import { getDb } from "../db/client";
import { t, type Vars } from "../i18n";
import { getState, setState } from "../db/state";
import {
  readOnboardingState,
  parseAnswers,
  ONBOARDING_COMPLETE_KEY,
  ONBOARDING_STEP_KEY,
  ONBOARDING_VEHICLE_KEY,
  ONBOARDING_ANSWERS_KEY,
  ONBOARDING_NAME_KEY,
  ONBOARDING_NUDGE_KEY,
  normalizeName,
  parseNudgeState,
  type Answers,
  type NudgeState,
} from "./state";

export function isOnboarded(): boolean {
  return readOnboardingState(getState).isOnboarded;
}

export function getOnboardingStep(): string | null {
  return readOnboardingState(getState).step;
}

export function setOnboardingStep(step: string): void {
  setState(ONBOARDING_STEP_KEY, step);
}

export function completeOnboarding(): void {
  setState(ONBOARDING_COMPLETE_KEY, "true");
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
  return getState(ONBOARDING_VEHICLE_KEY);
}

export function setOnboardingVehicleId(vehicleId: string): void {
  setState(ONBOARDING_VEHICLE_KEY, vehicleId);
}

/**
 * What to call the driver, or null.
 *
 * Null is a real answer with a real cause: every install that finished
 * onboarding before the name screen existed has none, and they are the majority
 * of installs on the day this ships. Every caller renders the unnamed sentence
 * for them rather than a greeting with a hole in it.
 */
export function getOnboardingName(): string | null {
  return normalizeName(getState(ONBOARDING_NAME_KEY) ?? "");
}

/** Normalised on the way in, so nothing downstream has to trim a push
 *  notification. A name that normalises to nothing is not written. */
export function setOnboardingName(raw: string): void {
  const name = normalizeName(raw);
  if (name) setState(ONBOARDING_NAME_KEY, name);
}

/**
 * What the app has already sent an unfinished flow, and when.
 *
 * Null until the first pair is armed, and null again once the flow is finished
 * or replayed. Every reader treats null as "nothing sent yet".
 */
export function getNudgeState(): NudgeState | null {
  return parseNudgeState(getState(ONBOARDING_NUDGE_KEY));
}

export function setNudgeState(state: NudgeState): void {
  setState(ONBOARDING_NUDGE_KEY, JSON.stringify(state));
}

/** Dropped rather than zeroed, so "never armed" and "armed at epoch zero" stay
 *  distinguishable to anything reading the row directly. */
export function clearNudgeState(): void {
  getDb().runSync("DELETE FROM app_state WHERE key = ?", [ONBOARDING_NUDGE_KEY]);
}

/**
 * A sentence in two versions: with the driver's name in it, and without.
 *
 * Every string the name appears in needs both, because the name cannot be
 * relied on. It is required of anyone starting the flow from here on, but every
 * install that finished onboarding under an earlier build has none, and those
 * installs are the ones already receiving reminders. Interpolating an empty
 * string into "{name}, your oil change is due" produces a notification that
 * opens with a comma.
 *
 * Two keys rather than one with a conditional inside it: where a name goes in a
 * sentence is the translator's decision, and in several of the shipped
 * languages it is not the front. A key pair lets each catalog put it where its
 * own grammar wants it, or leave it out of one of the two entirely.
 */
export function tNamed(key: string, vars?: Vars): string {
  const name = getOnboardingName();
  return name ? t(`${key}.named`, { ...vars, name }) : t(key, vars);
}

/**
 * The quiz answers that have nowhere else to live. Read on every screen after
 * the quiz, so it is a whole-object read rather than a key per answer: three
 * `app_state` rows to keep in step is three chances for a resumed flow to hold
 * half an opinion.
 */
export function getAnswers(): Answers {
  return parseAnswers(getState(ONBOARDING_ANSWERS_KEY));
}

/**
 * Merges rather than replaces. Each question owns one field and knows nothing
 * about the others; stepping back and changing one answer must not blank the
 * two after it.
 */
export function setAnswers(patch: Answers): void {
  setState(ONBOARDING_ANSWERS_KEY, JSON.stringify({ ...getAnswers(), ...patch }));
}

/**
 * Puts the flags back to first-launch so the flow can be walked again from
 * Settings. Vehicles and records are deliberately untouched — this replays the
 * screens, it does not wipe the app, and a "replay" that silently deleted a
 * year of history would be the worst button in the product.
 */
export function resetOnboarding(): void {
  setState(ONBOARDING_COMPLETE_KEY, "false");
  setState(ONBOARDING_STEP_KEY, "welcome");
  // Cleared, not carried over: the replay writes a new car, so the previous
  // run's vehicle must stop being the one every step edits — and the previous
  // run's answers must stop describing it, or the replay opens on a symptoms
  // screen built from a quiz this user has not taken yet.
  //
  // The nudge record goes with them: a replay is a fresh run of the flow, and
  // the two resume nudges are counted per run. Left behind, a user who had
  // already been nudged twice would start the replay with the quota spent.
  getDb().runSync("DELETE FROM app_state WHERE key IN (?, ?, ?)", [
    ONBOARDING_VEHICLE_KEY,
    ONBOARDING_ANSWERS_KEY,
    ONBOARDING_NUDGE_KEY,
  ]);
}
