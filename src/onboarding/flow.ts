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
 * to it, then evidence, then the plan, then the offer. Every screen after the
 * quiz is built from the user's own answers, so none of it is a feature tour.
 *
 * The tail is a ladder, and the order of it is the whole conversion argument.
 * "paywall" asks for money and offers no way past itself except the sheet.
 * "offer" catches the user who closed that sheet and gives them the trial,
 * which is worth more here than it is up front: a trial shown first is handed
 * to everyone who would have paid outright. A user who closes that one too has
 * declined twice and is taken to the garage, because the flow has nothing left
 * to sell and a screen advertising the free tier is not an ask, it is a
 * consolation the app pays for in conversions.
 *
 * One ordered array is the whole navigation model: Back is the entry before
 * you, Continue is the entry after you, and no screen hard-codes the name of
 * its neighbour. Inserting or removing a screen is a one-line edit here.
 */
export const FLOW = [
  "welcome",
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
  // "help" carries the Free/Pro boundary too: it used to be its own screen
  // here, and the tap between the promise and its price bought nothing.
  "help",
  "reviews",
  "notify",
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
  reminders: "notify",
  // The plan screen, split in two: the notification soft-ask it carried is now
  // "notify", and the schedule it showed is folded into the paywall. An install
  // parked on it resumes on the ask, which used to come first on that screen.
  plan: "notify",
  // The contract screen. It listed what the six questions would ask, which is
  // a screen the user pays a tap for to be told they are about to be asked
  // something. Removed; an install parked on it resumes at the first question.
  intro: "vehicle",
  // The free-mode landing, which used to be the last screen. An install parked
  // on it resumes on the trial offer: it is the last thing left worth asking,
  // and its own decline now ends the flow.
  free: "offer",
  // The Free/Pro boundary screen, folded into "help". An install parked on it
  // resumes on the paywall, which now carries the plan it used to lead to; the
  // rows it was showing are two screens behind and were read on the way.
  features: "paywall",
};

/** Where a relaunch resumes. Anything unrecognised restarts the flow. */
export function resumeRoute(step: string | null): OnboardingRoute {
  if (!step) return "welcome";
  if (isOnboardingRoute(step)) return step;
  return RETIRED[step] ?? "welcome";
}
