import { useEffect, useState } from "react";

/**
 * Holds a control inert for `ms` after the thing in front of it appears.
 *
 * Distinct from `OnboardingScreen`'s `gateTimeoutMs`, which gates on the
 * scroll and uses its timer only to stop refusing. That mechanism opens
 * immediately on a screen whose content already fits, which is every card in
 * the symptoms pager: there is nothing to scroll, so a scroll gate is not a
 * gate there at all.
 *
 * This is the other case. The symptoms cards are one route with three cards,
 * so the tap that advances a card is in the same pixel as the tap that
 * advanced the previous one, and a user who taps three times fast never sees
 * two of the three findings the whole flow was built to deliver. `key` is what
 * makes that work: the dwell restarts whenever the card behind it changes, and
 * the frame cannot do it because the frame does not know the route is paged.
 *
 * Deliberately short. A long one is an argument with the user, and the flow
 * already decided (see `app/onboarding/reviews.tsx`) that it does not argue.
 */
export function useDwell(ms: number, key: unknown): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(false);
    const timer = setTimeout(() => setReady(true), ms);
    return () => clearTimeout(timer);
  }, [ms, key]);

  return ready;
}
