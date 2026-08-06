import { getState, setState } from "../db/state";
import { LAST_OPEN_KEY, WINBACK_SHOWN_KEY } from "./state";

/**
 * Stamps this launch and hands back the previous one.
 *
 * Returning the old value is the whole point: the gap the win-back test needs
 * is between this launch and the last one, and reading the key after writing it
 * gives zero every time.
 */
export function recordOpen(now: Date = new Date()): string | null {
  const previous = getState(LAST_OPEN_KEY);
  setState(LAST_OPEN_KEY, now.toISOString());
  return previous;
}

export function getWinbackShownAt(): string | null {
  return getState(WINBACK_SHOWN_KEY);
}

/** Written when the screen is shown, not when the offer is taken — somebody
 *  who said no has been asked, and being asked is what the cooldown counts. */
export function markWinbackShown(now: Date = new Date()): void {
  setState(WINBACK_SHOWN_KEY, now.toISOString());
}
