/**
 * The route list on its own, with nothing behind it.
 *
 * Split from `flow.ts` because the flow reads the experiment registry to
 * decide what to hide, and the registry reaches analytics and the native
 * SDKs. The notification code needs to know where the ask begins and nothing
 * else; importing the flow for that dragged RevenueCat into every module
 * that schedules a reminder. `flow.ts` re-exports all of this, so nothing
 * that reads the flow has to know the split exists.
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
  // Where the install came from. Not a quiz question — it changes nothing
  // the app computes, so it gets no counter — but the one answer the event
  // stream cannot infer: the install spikes come from TikTok slideshows and
  // arrive with no campaign attached. Last before the loader, where the user
  // has momentum and has already answered six questions; asked first, it
  // reads as a sign-up form.
  "source",
  // The payoff, in the order that earns the ask.
  "analyzing",
  // One page: what the app now watches for this car, and where the odometer
  // lands in a year at the rate the user drives. It replaced two — "results"
  // (the car today) and "outlook" (twelve months on) — which on a fresh
  // install read "12 services have no record yet" and then projected a year
  // from that nothing. The `onboarding_payoff` experiment also tries the flow
  // with no payoff screen at all; see `hiddenRoutes`.
  "schedule",
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

/**
 * Whether a step is in the ask: the paywall and everything after it. A user
 * parked here has answered every question and been shown the price, which
 * changes what the app may honestly say to bring them back — the resume
 * nudges switch copy on it. Read from the array so a screen added in front
 * of the paywall moves the line without anyone touching this.
 */
export function isAskStep(step: string | null): boolean {
  if (step === null) return false;
  const at = (FLOW as readonly string[]).indexOf(step);
  return at >= 0 && at >= FLOW.indexOf("paywall");
}
