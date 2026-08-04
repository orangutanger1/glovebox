/**
 * The onboarding route graph.
 *
 * The flow used to be six screens of setup: ask for the car, ask for the
 * mileage, ask for one service, show it back, ask for notifications, present
 * the paywall. It collected the data the app needs and then asked for money
 * having never once told the user what the money was for.
 *
 * The shape here is the conversion structure the product was modelled on:
 * quiz, then a computed result, then the cost of the problem, then the answer
 * to it, then evidence, then the plan, then the offer — with a second, cheaper
 * offer for the user who walks away from the first. Every screen after the
 * quiz is built from the user's own answers, so none of it is a feature tour.
 *
 * One ordered array is the whole navigation model: Back is the entry before
 * you, Continue is the entry after you, and no screen hard-codes the name of
 * its neighbour. Inserting or removing a screen is a one-line edit here.
 */
export const FLOW = [
  "welcome",
  "intro",
  // The quiz. Six questions, all of which change what the app computes.
  "vehicle",
  "odometer",
  "drive",
  "service",
  "tracking",
  "worry",
  // The payoff, in the order that earns the ask.
  "analyzing",
  "results",
  "symptoms",
  "help",
  "reviews",
  "features",
  "plan",
  "paywall",
  "offer",
] as const;

export type OnboardingRoute = (typeof FLOW)[number];

/**
 * The screens that ask a question, in order. They get "QUESTION n / 6" and a
 * lamp row; the narrative screens after them deliberately get neither, because
 * a progress counter on a story tells the user how much of it they can skim.
 */
export const QUIZ: readonly OnboardingRoute[] = [
  "vehicle",
  "odometer",
  "drive",
  "service",
  "tracking",
  "worry",
];

export function isOnboardingRoute(value: string): value is OnboardingRoute {
  return (FLOW as readonly string[]).includes(value);
}

export function nextRoute(route: OnboardingRoute): OnboardingRoute | null {
  return FLOW[FLOW.indexOf(route) + 1] ?? null;
}

/**
 * Screens that move on by themselves. Back has to step over them: "analyzing"
 * replaces itself with the results, so a Back from the results that landed on
 * it would be pushed straight forward again — the last quiz question would be
 * unreachable and the only way out of the loop would be force-quitting.
 */
const TRANSIENT: readonly OnboardingRoute[] = ["analyzing"];

export function previousRoute(route: OnboardingRoute): OnboardingRoute | null {
  let i = FLOW.indexOf(route) - 1;
  while (i >= 0 && TRANSIENT.includes(FLOW[i])) i -= 1;
  return i >= 0 ? FLOW[i] : null;
}

/** `null` off the quiz, so a screen can ask without knowing where it sits. */
export function quizStep(route: OnboardingRoute): { step: number; total: number } | null {
  const i = QUIZ.indexOf(route);
  return i === -1 ? null : { step: i + 1, total: QUIZ.length };
}

/**
 * Screens that existed before this flow did. A build that shipped the old six
 * screens persisted "ready" or "reminders" as the resume point, and an install
 * sitting on one of those would otherwise be redirected to a route that no
 * longer exists — a blank screen on every launch, forever, with no way out.
 */
const RETIRED: Record<string, OnboardingRoute> = {
  ready: "analyzing",
  reminders: "plan",
};

/** Where a relaunch resumes. Anything unrecognised restarts the flow. */
export function resumeRoute(step: string | null): OnboardingRoute {
  if (!step) return "welcome";
  if (isOnboardingRoute(step)) return step;
  return RETIRED[step] ?? "welcome";
}
