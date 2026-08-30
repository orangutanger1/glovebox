import { useCallback } from "react";
import { useRouter } from "expo-router";
import { completeOnboarding, setOnboardingStep } from ".";
import { track } from "../analytics";
import { nextRoute, type OnboardingRoute } from "./flow";

/**
 * Moving through the flow, in the two directions that are not Back.
 *
 * Fifteen screens is too many to have each one naming its own successor in a
 * `router.push` string. The old six did exactly that, and the strings were
 * already wrong twice — a screen pushed the route after the one it recorded as
 * the resume point, so quitting on that screen reopened the previous one.
 * Recording the step and navigating to it are the same act and belong in the
 * same three lines.
 */
export function useAdvance(from: OnboardingRoute, mode: "push" | "replace" = "push"): () => void {
  const router = useRouter();
  return useCallback(() => {
    const next = nextRoute(from);
    if (!next) return;
    setOnboardingStep(next);
    const to = `/onboarding/${next}` as never;
    // `replace` is for the screens that advance themselves. Leaving one of
    // those on the stack gives the screen after it a Back button that lands on
    // a screen whose only behaviour is to move forward again.
    if (mode === "replace") router.replace(to);
    else router.push(to);
  }, [from, mode, router]);
}

/**
 * The only exit. `replace`, not `push`: the garage must not have seventeen
 * onboarding screens behind it for a back-swipe to walk into.
 *
 * The caller names why it is leaving, because that is the difference the
 * revenue question turns on. A completion event with no reason counts a user
 * who subscribed, a user who started a trial and a user who declined twice as
 * the same outcome, which is how thirty-two installs and no subscribers looked
 * like a mystery rather than a paywall nobody accepted. Still one exit path:
 * the reason is an argument, not a second function.
 */
export function useFinish(): (exit: "paid" | "trial" | "free") => void {
  const router = useRouter();
  return useCallback(
    (exit: "paid" | "trial" | "free") => {
      // The denominator for every drop-off rate: the count of users who
      // reached the garage at all, now split by what they agreed to on the way.
      track("onboarding_completed", { exit });
      completeOnboarding();
      // Someone who agreed to something does not land in a list.
      //
      // Both paying exits used to replace the stack with the garage, so the
      // last thing a new subscriber saw was Apple's receipt and the first thing
      // was one row in a list — nothing naming what they had bought, and no
      // next action. `/subscribed` is that missing beat, and it owns the move
      // to the car afterwards. A user who declined twice still goes straight to
      // the garage: there is nothing to confirm and a screen congratulating
      // them for saying no twice would be the worst screen in the product.
      router.replace(exit === "free" ? "/" : "/subscribed");
    },
    [router]
  );
}
