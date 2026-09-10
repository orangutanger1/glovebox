import { getState, setState } from "../db/state";
import { GRANDFATHERED_KEY, grandfatherOnFirstRun } from "./state";

export { GRANDFATHERED_KEY, grandfatherOnFirstRun, isLocked, type LockInput } from "./state";

/**
 * Reads the grandfathering flag, stamping it on the first launch that finds it
 * missing.
 *
 * Called once from the boot effect, before anything can route. Stamping it
 * later — on the first wall, say — would mean a user who is offline at launch
 * and whose entitlement never resolves gets the flag written by whichever
 * screen happened to ask first.
 */
export function resolveGrandfathered(isOnboarded: boolean): boolean {
  const stored = getState(GRANDFATHERED_KEY);
  const answer = grandfatherOnFirstRun({ stored, isOnboarded });
  if (stored === null) setState(GRANDFATHERED_KEY, answer ? "true" : "false");
  return answer;
}

/** The stamped answer, for the screens that route on it. Never stamps. */
export function isGrandfathered(): boolean {
  return getState(GRANDFATHERED_KEY) === "true";
}
