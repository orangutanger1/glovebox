import { getVariant } from "../experiments";

/**
 * The onboarding route graph.
 *
 * The flow used to be six screens of setup: ask for the car, ask for the
 * mileage, ask for one service, show it back, ask for notifications, present
 * the paywall. It collected the data the app needs and then asked for money
 * having never once told the user what the money was for.
 *
 * The shape here is the conversion structure the product was modelled on:
 * quiz, then a computed result, then the gap the app closes, then the answer
 * to it, then evidence, then the plan, then the offer. Every screen after the
 * quiz is built from the user's own answers, so none of it is a feature tour.
 *
 * The tail is a ladder, and the order of it is the whole conversion argument.
 * "paywall" asks for money and offers no way past itself except the sheet.
 * "offer" catches the user who closed that sheet and gives them the trial,
 * which is worth more here than it is up front: a trial shown first is handed
 * to everyone who would have paid outright. A user who closes that one too has
 * declined twice, and the flow keeps them on it: there is nothing left to sell,
 * and both of the screens that used to follow — a free-tier landing and then a
 * wall repeating the same argument with the offer taken off it — were the app
 * spending its last screen on something other than the ask.
 *
 * One ordered array is the whole navigation model: Back is the entry before
 * you, Continue is the entry after you, and no screen hard-codes the name of
 * its neighbour. Inserting or removing a screen is a one-line edit here.
 */
export {
  FLOW,
  QUIZ,
  isOnboardingRoute,
  isAskStep,
  type OnboardingRoute,
} from "./routes";
import { FLOW, QUIZ, isOnboardingRoute, type OnboardingRoute } from "./routes";

/** The variants that shape the flow, one slot per experiment. */
export type FlowVariants = {
  symptoms?: string | null;
  payoff?: string | null;
};

/**
 * Screens the install's variants do not show. The symptoms experiment hides
 * the pain beat: the three red cards and the reply to them. The payoff
 * experiment's "none" arm hides the schedule page, so the loader lands on
 * whatever comes next. Anything that is not a recognised variant — control,
 * unassigned, a value this build does not know — hides nothing, so the
 * fallback flow is the fuller one.
 */
export function hiddenRoutes(variants: FlowVariants | string | null): readonly OnboardingRoute[] {
  // A bare string is the symptoms variant: the shape every caller used before
  // there was a second experiment, kept so a test can still say
  // `hiddenRoutes("no_symptoms")`.
  const v: FlowVariants = typeof variants === "string" || variants === null ? { symptoms: variants } : variants;
  const hidden: OnboardingRoute[] = [];
  if (v.symptoms === "no_symptoms") hidden.push("symptoms", "help");
  if (v.payoff === "none") hidden.push("schedule");
  return hidden;
}

/** What this install hides, from its stored variants. The default for every
 *  caller that is not a test. */
function activeHidden(): readonly OnboardingRoute[] {
  return hiddenRoutes({
    symptoms: getVariant("onboarding_symptoms"),
    payoff: getVariant("onboarding_payoff"),
  });
}

export function nextRoute(
  route: OnboardingRoute,
  hidden: readonly OnboardingRoute[] = activeHidden()
): OnboardingRoute | null {
  let i = FLOW.indexOf(route) + 1;
  while (i < FLOW.length && hidden.includes(FLOW[i])) i += 1;
  return FLOW[i] ?? null;
}

/**
 * Screens that move on by themselves. Back has to step over them: "analyzing"
 * replaces itself with the results, so a Back from the results that landed on
 * it would be pushed straight forward again — the last quiz question would be
 * unreachable and the only way out of the loop would be force-quitting.
 */
const TRANSIENT: readonly OnboardingRoute[] = ["analyzing"];

export function previousRoute(
  route: OnboardingRoute,
  hidden: readonly OnboardingRoute[] = activeHidden()
): OnboardingRoute | null {
  let i = FLOW.indexOf(route) - 1;
  while (i >= 0 && (TRANSIENT.includes(FLOW[i]) || hidden.includes(FLOW[i]))) i -= 1;
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
  // The two payoff screens, folded into one. An install parked on either
  // resumes on the page that replaced them.
  results: "schedule",
  outlook: "schedule",
};

/** Where a relaunch resumes. Anything unrecognised restarts the flow; a step
 *  this install's variant does not show resumes on the next screen it does. */
export function resumeRoute(
  step: string | null,
  hidden: readonly OnboardingRoute[] = activeHidden()
): OnboardingRoute {
  if (!step) return "welcome";
  const route = isOnboardingRoute(step) ? step : RETIRED[step];
  if (!route) return "welcome";
  return hidden.includes(route) ? (nextRoute(route, hidden) ?? "welcome") : route;
}
