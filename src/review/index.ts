import { getDb } from "../db/client";
import { getState, setState } from "../db/state";
import {
  shouldRequestReview,
  shouldRequestFirstActionReview,
  shouldRequestOnboardingReview,
  shouldRequestOpenReview,
  spentAsks,
  REVIEW_LAST_ASKED_KEY,
  REVIEW_ASK_COUNT_KEY,
  REVIEW_FIRST_ACTION_KEY,
  REVIEW_ONBOARDING_KEY,
  REVIEW_OPEN_COUNT_KEY,
  OPEN_ASK_DELAY_MS,
  type ReviewEvent,
  type ReviewEventKind,
} from "./state";

/**
 * Loaded on use, never at import.
 *
 * `expo-store-review` resolves its native module the moment the module is
 * evaluated, so a top-level import throws "Cannot find native module
 * 'ExpoStoreReview'" in any binary compiled before the package was added — and
 * because this module is reached from the root layout, that throw took the
 * whole app down at boot with no screen and no recoverable state. Two builds
 * share a runtime version whenever the app version does not change, so that is
 * not a hypothetical: an OTA update carrying this file lands on the previous
 * native build and bricks it.
 *
 * Deferring the require moves the failure inside `maybeRequestReview`, where it
 * is already caught, and the worst outcome becomes a rating prompt that does
 * not appear.
 */
function loadStoreReview(): typeof import("expo-store-review") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("expo-store-review");
}

/**
 * Notes something the user did that suggests the app is working for them.
 *
 * Cheap and silent by design: this sits on the success path of the core
 * actions, so it must never be the reason logging a service fails.
 */
export function recordReviewEvent(kind: ReviewEventKind): void {
  try {
    getDb().runSync("INSERT INTO review_events (kind, at) VALUES (?, ?)", [
      kind,
      new Date().toISOString(),
    ]);
  } catch {
    // Happiness tracking is not worth an error dialog.
  }
}

/**
 * Only the window that can still matter. Every half-life in EVENT_WEIGHTS is
 * two weeks or less, so anything older than 30 days contributes less than a
 * thousandth of a point — reading it costs more than it is worth, and the rows
 * are pruned on the same boundary to stop the table growing forever.
 */
const RELEVANT_DAYS = 30;

function recentEvents(): ReviewEvent[] {
  const cutoff = new Date(Date.now() - RELEVANT_DAYS * 24 * 60 * 60 * 1000).toISOString();
  getDb().runSync("DELETE FROM review_events WHERE at < ?", [cutoff]);
  return getDb().getAllSync<ReviewEvent>("SELECT kind, at FROM review_events WHERE at >= ?", [
    cutoff,
  ]);
}

/**
 * Asks iOS for the rating prompt, if the user has earned being asked.
 *
 * Call this after a completed action. Onboarding has its own ask
 * (`requestReviewInOnboarding`); App Store Review Guideline 5.6.3 rejects
 * soliciting reviews before the user has meaningfully used the app.
 *
 * Fire and forget. `requestReview` resolves when the request reaches StoreKit,
 * not when the user acts on it, and iOS may draw nothing at all: the annual
 * count is spent, ratings are disabled on the device, or it is a TestFlight
 * build. None of that is observable, so the ask is recorded either way — the
 * alternative is retrying against a system that has already declined, which
 * spends every good moment on a prompt no one sees.
 */
export async function maybeRequestReview(): Promise<void> {
  try {
    const state = readState();
    const now = new Date();
    if (!shouldRequestReview(state, now)) return;
    await ask(state, now);
  } catch {
    // A rating prompt is the least important thing on screen. It never breaks
    // the flow it hangs off.
  }
}

/**
 * The subscriber's one extra ask, on their first tap on the car screen.
 *
 * Sits beside the happiness engine rather than inside it (see
 * `shouldRequestFirstActionReview` for why the moment is worth a rule of its
 * own). Call it from the controls on the vehicle screen that open something:
 * log a service, log a fill-up, edit the car. Not from delete or undo, which
 * are not the moment.
 *
 * The flag is set the moment the decision is yes, before StoreKit is asked,
 * so a second tap during the await cannot spend the moment twice. An install
 * that has not paid keeps the flag clear and is checked again next tap: the
 * purchase may come later, from the settings screen, and the first tap after
 * it is still the first tap that counts.
 */
export async function requestReviewOnFirstAction(): Promise<void> {
  try {
    const state = { ...readState(), asked: getState(REVIEW_FIRST_ACTION_KEY) !== null };
    const now = new Date();
    if (!shouldRequestFirstActionReview(state, now)) return;
    setState(REVIEW_FIRST_ACTION_KEY, now.toISOString());
    await ask(state, now);
  } catch {
    // Same as above: never the reason a tap on the car does nothing.
  }
}

/**
 * Counts this launch and, if it is the third, fifth or tenth, asks for the
 * rating after OPEN_ASK_DELAY_MS. Call once per launch, from boot. The ask
 * waits for `onboarded`: a launch still inside onboarding is counted but
 * never asks, since the screen under it is a quiz.
 */
export function recordLaunchAndMaybeAsk(onboarded: boolean): void {
  try {
    const previous = Number(getState(REVIEW_OPEN_COUNT_KEY) ?? "0");
    const openCount = (Number.isFinite(previous) ? previous : 0) + 1;
    setState(REVIEW_OPEN_COUNT_KEY, String(openCount));
    recordReviewEvent("app_open");
    if (!onboarded) return;
    setTimeout(() => {
      void (async () => {
        try {
          const state = { ...readState(), openCount };
          const now = new Date();
          if (!shouldRequestOpenReview(state, now)) return;
          await ask(state, now);
        } catch {
          // Never the reason a launch goes wrong.
        }
      })();
    }, OPEN_ASK_DELAY_MS);
  } catch {
    // Same as above.
  }
}

/**
 * The end-of-onboarding ask, once per install. Called from the screen just
 * before the paywall. Flag set before StoreKit is asked, as with the
 * first-action ask.
 */
export async function requestReviewInOnboarding(): Promise<void> {
  try {
    const state = { ...readState(), asked: getState(REVIEW_ONBOARDING_KEY) !== null };
    const now = new Date();
    if (!shouldRequestOnboardingReview(state, now)) return;
    setState(REVIEW_ONBOARDING_KEY, now.toISOString());
    await ask(state, now);
  } catch {
    // A rating prompt never holds up onboarding.
  }
}

function readState(): { events: ReviewEvent[]; lastAskedAt: string | null; askCount: number } {
  const askCount = Number(getState(REVIEW_ASK_COUNT_KEY) ?? "0");
  return {
    events: recentEvents(),
    lastAskedAt: getState(REVIEW_LAST_ASKED_KEY),
    askCount: Number.isFinite(askCount) ? askCount : 0,
  };
}

/** Spends one of the year's asks and hands the prompt to StoreKit. */
async function ask(state: { lastAskedAt: string | null; askCount: number }, now: Date): Promise<void> {
  const StoreReview = loadStoreReview();
  if (!(await StoreReview.hasAction())) return;

  setState(REVIEW_LAST_ASKED_KEY, now.toISOString());
  // Counted within the year, so a count that has aged out starts over.
  setState(REVIEW_ASK_COUNT_KEY, String(spentAsks(state, now) + 1));
  await StoreReview.requestReview();
}
