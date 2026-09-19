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
export const FLOW = [
  "welcome",
  // Who the driver is, before anything is asked about the car. One field, and
  // the only thing the app ever learns about the person: it is read back on
  // both screens that ask for money and in every reminder the app sends.
  // Before the quiz because that is where an introduction goes — asked after
  // six questions it reads as a form field the app forgot, and asked after the
  // results it reads as a condition on seeing them.
  "name",
  // The quiz. Six questions, all of which change what the app computes.
  "vehicle",
  "odometer",
  // The notification ask, two questions in.
  //
  // It used to be the last screen before the paywall, which covered exactly one
  // drop-off — the one at the ask for money. Then it moved to just after the
  // computed result, which still left eleven screens in front of it. Both
  // versions had the same hole: everybody who quit inside the quiz quit with
  // notifications never requested, and an install the app cannot notify is an
  // install it cannot invite back. An abandoned flow has a half-written car in
  // it and no way to say so.
  //
  // Here is the earliest point at which the ask is still about something. The
  // car and its mileage are known, so the screen can name the vehicle it will
  // be sending reminders about; one question earlier there is no car at all,
  // and "allow notifications?" with nothing behind it is the context-free ask
  // opt-in collapses on. The full plan is not computed yet — the screen falls
  // back to the tracked schedule for this car, which is the honest version of
  // the same promise at this point in the flow.
  "notify",
  "drive",
  "service",
  // The one outside figure in the flow, placed on the answer it is about. The
  // user has just said when the car was last serviced, and 41% of cars being
  // behind on one is the sentence that follows. It used to sit beside
  // "compare" at the end of the story, which put the flow's two statistic
  // screens back to back: two figures in a row read as a slide deck, and the
  // second was skimmed. Splitting them gives each one a page to itself. The
  // screen carries nothing of the user's own, so it sits between two questions
  // without depending on either.
  "cost",
  "tracking",
  "worry",
  // The payoff, in the order that earns the ask. The loader used to land on
  // a results page — first two screens ("results", "outlook"), then one
  // ("schedule") — that on a fresh install told the user what they had just
  // not typed. The `onboarding_payoff` experiment tried the flow with no
  // page there at all, and that arm converted; the loader now lands on the
  // pain beat.
  "analyzing",
  "symptoms",
  // The second of the two outside-figure screens, and the counterpart to
  // "cost", which sits back inside the quiz.
  //
  // "cost" is how many cars are behind. This is the gap between the two ways
  // of spending on one: kept to schedule against caught late. It is a chart
  // rather than a paragraph because the whole claim is a comparison, and a
  // comparison drawn is read in one look and a comparison written is read
  // twice or not at all.
  "compare",
  // "help" carries the Free/Pro boundary too: it used to be its own screen
  // here, and the tap between the promise and its price bought nothing.
  "help",
  "reviews",
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

/** The variants that shape the flow, one slot per experiment. */
export type FlowVariants = {
  symptoms?: string | null;
};

/**
 * Screens the install's variants do not show. The symptoms experiment hides
 * the pain beat: the three red cards and the reply to them. Anything that is
 * not a recognised variant — control, unassigned, a value this build does not
 * know — hides nothing, so the fallback flow is the fuller one.
 */
export function hiddenRoutes(variants: FlowVariants | string | null): readonly OnboardingRoute[] {
  // A bare string is the symptoms variant: the shape every caller used before
  // there was a second experiment, kept so a test can still say
  // `hiddenRoutes("no_symptoms")`.
  const v: FlowVariants = typeof variants === "string" || variants === null ? { symptoms: variants } : variants;
  const hidden: OnboardingRoute[] = [];
  if (v.symptoms === "no_symptoms") hidden.push("symptoms", "help");
  return hidden;
}

/** What this install hides, from its stored variants. The default for every
 *  caller that is not a test. */
function activeHidden(): readonly OnboardingRoute[] {
  return hiddenRoutes({ symptoms: getVariant("onboarding_symptoms") });
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
  // The payoff pages: two, then one, then none. An install parked on any of
  // them resumes on what now follows the loader; `resumeRoute` steps past it
  // for an arm that hides it.
  results: "symptoms",
  outlook: "symptoms",
  schedule: "symptoms",
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
