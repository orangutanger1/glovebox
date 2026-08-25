import { getState, setState } from "../db/state";

/**
 * Whether iOS has already been asked for notification permission.
 *
 * One flag, because there is only one fact worth storing. This used to be two:
 * the answer the user gave on the plan screen and whether the system prompt had
 * fired, because the prompt was deferred to the first mount of the garage and
 * the intention had to survive the trip. It does not travel any more — "Turn on
 * reminders" fires the alert itself, on the tap that promised it — so the
 * intention is spent the moment it is expressed and the only thing left to
 * remember is that the one prompt iOS grants has been spent.
 *
 * "Not now" spends nothing. Nothing in the app re-asks: the garage no longer
 * asks at all, and Settings only asks when the user taps the row.
 */
const ASKED_KEY = "notify_asked";

/**
 * Stamped before the prompt is awaited rather than after: a user who force
 * quits while the alert is up has still been asked, and iOS will not show it a
 * second time whatever this app believes.
 */
export function hasAskedNotifyPermission(): boolean {
  return getState(ASKED_KEY) === "true";
}

export function markAskedNotifyPermission(): void {
  setState(ASKED_KEY, "true");
}
