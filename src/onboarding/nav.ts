import { useCallback } from "react";
import { useRouter } from "expo-router";
import { completeOnboarding, setOnboardingStep } from ".";
import { nextRoute, type OnboardingRoute } from "./flow";

/**
 * Moving through the flow, in the two directions that are not Back.
 *
 * Seventeen screens is too many to have each one naming its own successor in a
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
 */
export function useFinish(): () => void {
  const router = useRouter();
  return useCallback(() => {
    completeOnboarding();
    router.replace("/");
  }, [router]);
}
