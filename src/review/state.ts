export const REVIEW_ASKED_KEY = "review_asked_at";

/**
 * Whether this is a moment to ask for a rating.
 *
 * Pure over an injected `get`, the same way readOnboardingState is — the
 * decision is testable in Node, and only the SKStoreReviewController call
 * itself is device-bound.
 *
 * Two conditions, and both are about not wasting the ask:
 *
 * - The user has to have logged something real. The prompt lands on the Ready
 *   screen, after a vehicle, an odometer reading and a service record exist and
 *   the app has just shown a computed due date back to them. Asking before that
 *   is asking a stranger to vouch for you.
 * - We ask once per install, ever. iOS caps the system prompt at three per app
 *   per 365 days and silently swallows anything past it, so a second ask is not
 *   a second chance — it is a no-op that we would wrongly record as shown.
 *   Replaying onboarding from Settings therefore does not re-ask.
 */
export function shouldRequestReview(
  get: (key: string) => string | null,
  facts: { recordCount: number }
): boolean {
  if (get(REVIEW_ASKED_KEY) !== null) return false;
  return facts.recordCount > 0;
}
