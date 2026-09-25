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

export const EXPERIMENTS = {
  onboarding_symptoms: ["control", "no_symptoms"],
  // The payoff after the loader. It used to be two screens — "12 services
  // have no record yet" and "The next twelve months" — that on a fresh install
  // stated the obvious and projected from nothing. "condensed" is the two
  // folded into one honest page; "none" goes from the loader straight on.
  // There is no arm that keeps the old pair. Pulled 2026-09-18 on 4/23 vs
  // 0/15 paid, put back 2026-09-19 to run longer: too few installs to call.
  onboarding_payoff: ["condensed", "none"],
  // What sits under the onboarding paywall's headline. "points" is the three
  // benefit rows it carried until 2026-09-24; "preview" is this car's plan,
  // one service dated and the next ones by name behind Pro — the answer to
  // "I want to try it first" that is not a free trial. Shipped to everyone
  // for a few hours as OTA 01a0d651, then split. See
  // docs/DECISIONS.md.
  paywall_preview: ["points", "preview"],
} as const;

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
  const variants: readonly string[] = EXPERIMENTS[name];
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
