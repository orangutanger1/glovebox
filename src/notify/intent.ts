import { getState, setState } from "../db/state";

/**
 * What the user said about reminders on the plan screen, and whether iOS has
 * been asked yet.
 *
 * These are two different facts and the app used to conflate them. The plan
 * screen fired `requestPermission()` the moment "Remind me" was tapped, which
 * put the iOS permission alert on the glass one screen before the money ask:
 * two system-modal decisions back to back, the cheap one first, and the
 * expensive one arriving on a user who had just been interrupted. iOS gives an
 * app exactly one permission prompt in its lifetime, so the timing of that
 * prompt is not a detail.
 *
 * The choice stays where it makes sense — next to six dated services, which is
 * the context that makes opt-in mean anything — and the prompt moves to the
 * garage, after onboarding has finished and the sale has been made or lost.
 * "Not now" is still a real answer: it records `no` and nothing ever asks
 * again, in-app or from the system.
 */
const INTENT_KEY = "notify_intent";
const ASKED_KEY = "notify_asked";

export type NotifyIntent = "yes" | "no" | null;

/** `null` for a user who has not been offered reminders yet — a resumed flow
 *  that has not reached the plan screen, or an install from before this ask. */
export function getNotifyIntent(): NotifyIntent {
  const stored = getState(INTENT_KEY);
  return stored === "yes" || stored === "no" ? stored : null;
}

export function setNotifyIntent(intent: "yes" | "no"): void {
  setState(INTENT_KEY, intent);
}

/**
 * Whether the system prompt has already been put in front of this install.
 *
 * Stamped before the prompt is awaited rather than after: a user who force
 * quits while the alert is up has still been asked, and iOS will not show it a
 * second time whatever this app believes. Re-asking on every garage mount is
 * the failure mode this flag exists to prevent, and it has to survive a crash
 * to prevent it.
 */
export function hasAskedNotifyPermission(): boolean {
  return getState(ASKED_KEY) === "true";
}

export function markAskedNotifyPermission(): void {
  setState(ASKED_KEY, "true");
}
