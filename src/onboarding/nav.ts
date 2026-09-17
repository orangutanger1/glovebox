import { useCallback } from "react";
import { useRouter } from "expo-router";
import { completeOnboarding, setOnboardingStep } from ".";
import { track, trackStepAdvanced } from "../analytics";
import { cancelOnboardingNudges } from "../notify";
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
    // The forward half of every step, recorded here because this is the only
    // path forward: a screen cannot advance without saying so, and a screen
    // added later is instrumented by using the hook it has to use anyway.
    trackStepAdvanced(from);
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
export function useFinish(): (exit: "paid" | "trial" | "restored" | "free") => void {
  const router = useRouter();
  return useCallback(
    (exit: "paid" | "trial" | "restored" | "free") => {
      // The denominator for every drop-off rate: the count of users who
      // reached the garage at all, now split by what they agreed to on the way.
      track("onboarding_completed", { exit });
      completeOnboarding();
      // Before anything routes. The two "finish setting up your car" nudges are
      // scheduled from inside the flow, and the flow has just been finished —
      // a user who subscribes and is told two hours later to go and set up the
      // car they set up reads the app as not knowing what it did.
      void cancelOnboardingNudges().catch(() => {});
      // Someone who agreed to something does not land in a list.
      //
      // Both paying exits used to replace the stack with the garage, so the
      // last thing a new subscriber saw was Apple's receipt and the first thing
      // was one row in a list — nothing naming what they had bought, and no
      // next action. `/subscribed` is that missing beat, and it owns the move
      // to the car afterwards.
      // `restored` lands here too: an install that has just been handed its
      // subscription back owes the same naming of what it now has as one that
      // has just bought it. It is a separate reason rather than a fourth
      // caller of "paid" because it adds no subscriber and no revenue, and
      // counting it as a sale is exactly what made the funnel disagree with
      // both stores.
      if (exit !== "free") {
        router.replace("/subscribed");
        return;
      }
      // The garage. This exit is only reachable by an install that finished
      // onboarding under a build that promised a free tier, and that promise
      // outlives the build that made it. Nobody else leaves the flow without
      // paying: the trial screen keeps a decliner on itself rather than
      // handing them on to a wall, so there is no second screen to route to
      // and no free landing to congratulate anyone for saying no twice.
      router.replace("/");
    },
    [router]
  );
}
