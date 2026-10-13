import { getState, setState } from "../db/state";
import { track } from "../analytics";

/**
 * A/B tests, assigned on the device.
 *
 * One registry, one row per experiment in `app_state`, one property per
 * experiment on every analytics event. That is the whole system, and it is
 * deliberately smaller than a feature-flag service: the split cannot be
 * changed without shipping code, and in exchange the assignment is
 * deterministic, works on a launch with no network, and cannot fall to
 * control because a fetch was slow.
 *
 * Only a fresh install is assigned — one that has not finished onboarding
 * and has no persisted step. An install already mid-flow when the experiment
 * ships would see its screens change under it, and an install that finished
 * under one build has already produced its outcome. Both report
 * "unassigned" and behave as control.
 *
 * The row is written once and read on every launch. It is never rewritten,
 * even when it holds a value this build does not recognise: the row is the
 * record of what the install was shown, and a later build that overwrote it
 * would count the same user in two arms.
 */

// `onboarding_symptoms` (control / no_symptoms) and
// `onboarding_payoff` (condensed / none) ran from 09-16 and 09-19 and ended
// with the shorter arm shipped to everyone (see `HIDDEN` in
// src/onboarding/flow.ts): 16/394 vs 10/394 and 14/396 vs 10/369 paid, neither
// significant, and ~1,700 per arm would have been needed to tell. Before them,
// `paywall_preview` (points / preview) ran 2026-09-24 → 2026-09-30 and ended
// early on 16/102 vs 6/109 main-paywall buy taps. `exit_offer_plans`
// (yearly / with_monthly) ran 2026-10-01 → 2026-10-13 and ended with the
// yearly-only offer for everyone: 1/99 vs 0/73 paid per viewer, and none of
// the 9 monthly buy taps paid. Installs keep their
// `experiment.*` rows; nothing reads them. See docs/DECISIONS.md.
export const EXPERIMENTS: Readonly<Record<string, readonly string[]>> = {
  // The whole look, 2026-10-12. `classic` (B) is the app as it was: the flat
  // dark garage, white buttons, no mascot. `redesign` (A) is the Planta-shaped
  // app — a Today list of service tasks and a Garage, a floating tab bar, a
  // vehicle screen split into To-do / Care plan / History — dressed like Opal
  // and Bevel, with the blue car mascot whose mood follows the service status.
  // Onboarding and both paywalls keep every step, price, timer and test arm;
  // only their surfaces change (blue pill buttons, rounder cards, the mascot).
  // An install with no row (everyone before this build) stays classic.
  app_design: ["classic", "redesign"],
};

export type ExperimentName = keyof typeof EXPERIMENTS;
export type Variant<E extends ExperimentName> = (typeof EXPERIMENTS)[E][number];

const NAMES = Object.keys(EXPERIMENTS) as ExperimentName[];
const key = (name: ExperimentName) => `experiment.${name}`;

/** The stored variant, or null when this install was never assigned or holds
 *  a value this build does not know. Never throws. */
export function getVariant<E extends ExperimentName>(name: E): Variant<E> | null {
  let raw: string | null;
  try {
    raw = getState(key(name));
  } catch {
    return null;
  }
  const variants: readonly string[] = EXPERIMENTS[name] ?? [];
  return raw !== null && variants.includes(raw) ? (raw as Variant<E>) : null;
}

/**
 * Coin-flips every registered experiment this install has no row for, when
 * the install is eligible. Returns what it assigned, which is empty on every
 * launch but the first.
 */
export function assignExperiments(
  eligible: boolean,
  random: () => number = Math.random
): Partial<Record<ExperimentName, string>> {
  const assigned: Partial<Record<ExperimentName, string>> = {};
  if (!eligible) return assigned;
  for (const name of NAMES) {
    // A row of any value means the question was already answered for this
    // install, even if the answer is one this build no longer recognises.
    if (getState(key(name)) !== null) continue;
    const variants = EXPERIMENTS[name];
    const variant = variants[Math.min(variants.length - 1, Math.floor(random() * variants.length))];
    setState(key(name), variant);
    assigned[name] = variant;
    track("experiment_assigned", { experiment: name, variant });
  }
  return assigned;
}

/** `exp_<name>` for every registered experiment, "unassigned" where there is
 *  no usable row. Read by analytics on every event, so it must never throw. */
export function experimentProperties(): Record<string, string> {
  const props: Record<string, string> = {};
  for (const name of NAMES) props[`exp_${name}`] = getVariant(name) ?? "unassigned";
  return props;
}
