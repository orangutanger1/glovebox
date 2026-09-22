import Purchases from "react-native-purchases";
import { getState, setState } from "../db/state";
import { track } from "../analytics";

/**
 * Two one-tap questions whose answers the event stream cannot infer.
 *
 * Paid traffic arrives with a keyword attached; the traffic that actually
 * moves the install count does not. The spikes come from TikTok slideshows,
 * and nothing in an install says so — a day of 120 installs converting at 1%
 * reads the same as a broken paywall until something asks. `source` asks
 * where the user came from, once, in onboarding. `objection` asks the user
 * who turned the exit offer down what stopped them, once, at that moment.
 *
 * Both answers are closed vocabularies, never text, for the same reason the
 * quiz answers are: they go straight into a breakdown.
 */

export const SOURCES = ["tiktok", "instagram", "youtube", "app_store", "friend", "other"] as const;
export type Source = (typeof SOURCES)[number];

export const OBJECTIONS = ["price", "try_first", "browsing", "no_car", "other"] as const;
export type Objection = (typeof OBJECTIONS)[number];

/** Where the objection was asked: the decline button, or backing out of
 *  Apple's payment sheet after tapping buy. */
export type ObjectionTrigger = "declined" | "sheet_cancelled";

const SOURCE_KEY = "survey.source";
const OBJECTION_KEY = "survey.objection";

/** The stored answer, or null when the question was never answered or holds
 *  a value this build does not know. Never throws. */
export function getSource(): Source | null {
  try {
    const raw = getState(SOURCE_KEY);
    return raw !== null && (SOURCES as readonly string[]).includes(raw) ? (raw as Source) : null;
  } catch {
    return null;
  }
}

/**
 * Stores the answer and reports it.
 *
 * Stamped on every later event by `sourceProperties`, and set on the person
 * too, so a breakdown works either way it is written. Also a RevenueCat
 * attribute, which is where revenue lives: "what did TikTok installs pay" is
 * then a filter on the RevenueCat dashboard rather than a join.
 */
export function recordSource(source: Source): void {
  try {
    setState(SOURCE_KEY, source);
  } catch {
    // The answer still goes out below; only the stamp on later events is lost.
  }
  track("source_answered", { source, $set: { heard_from: source } });
  try {
    // Declared void on some SDK versions, a promise on others.
    Promise.resolve(Purchases.setAttributes({ heard_from: source })).catch(() => {});
  } catch {
    /* an unconfigured SDK is not a survey failure */
  }
}

/** `heard_from` for every event, "unanswered" until the question has been.
 *  Read by analytics on every event, so it must never throw. */
export function sourceProperties(): Record<string, string> {
  return { heard_from: getSource() ?? "unanswered" };
}

/** Whether this install has not yet been asked what stopped it. Asked once,
 *  whichever trigger reaches it first. */
export function shouldAskObjection(): boolean {
  try {
    return getState(OBJECTION_KEY) === null;
  } catch {
    return false;
  }
}

/**
 * Spends the one ask and reports the answer. Null is a skip, which is counted:
 * how many decline to say is part of the answer.
 */
export function recordObjection(
  reason: Objection | null,
  trigger: ObjectionTrigger,
  offering: string
): void {
  try {
    setState(OBJECTION_KEY, reason ?? "skipped");
  } catch {
    // Worst case the sheet can come back once more.
  }
  track("paywall_objection", { reason: reason ?? "skipped", trigger, offering });
}
