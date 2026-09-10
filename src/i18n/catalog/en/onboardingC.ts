import type { Fragment } from "../types";

/**
 * The back half of onboarding: the findings pager, the answer to it, the
 * reviews evidence, the computed results, and the frame all four are drawn in.
 *
 * The status badge on a results row is keyed rather than printed: `due` is a
 * plan state the code branches on, and a translated word cannot also be an
 * identifier. The two counts on the reviews subtitle are one sentence and one
 * key — the count that moves the verb is `count`, the total rides along as a
 * plain placeholder, because a sentence assembled from clauses cannot be
 * reordered by a translator.
 */
export const onboardingC: Fragment = {
  "onboardingC.back": "Back",
  "onboardingC.question": "Question {step} / {total}",

  "onboardingC.results.overdue": {
    one: "One service is already overdue.",
    other: "{count} services are already overdue.",
  },
  "onboardingC.results.noBaseline": {
    one: "One service has no record yet.",
    other: "{count} services have no record yet.",
  },
  "onboardingC.results.noneYet": "Nothing is overdue yet.",
  "onboardingC.results.clear": "Nothing is overdue, and nothing is close.",
  "onboardingC.results.subtitle": "Your {vehicle}, {distance} a year.",
  "onboardingC.results.continue": "Continue",
  "onboardingC.results.dueNow": "Due now",
  "onboardingC.results.soon": "Soon",
  "onboardingC.results.onFile": "On file",
  "onboardingC.results.onFileValue": "{logged} / {total}",
  "onboardingC.results.status.due": "Due",
  "onboardingC.results.status.soon": "Soon",
  "onboardingC.results.status.ok": "OK",
  "onboardingC.results.status.noRecord": "No record",

  // The twelve-month projection, between the results and the notification
  // ask. Counts and dates the scheduler already computes; no score.
  "onboardingC.outlook.title": "The next twelve months",
  "onboardingC.outlook.subtitle": "Your {vehicle}, {distance} a year.",
  "onboardingC.outlook.dueWithinYear": "Due in a year",
  "onboardingC.outlook.nextUp": "Next up",
  "onboardingC.outlook.none": "No date",
  "onboardingC.outlook.odometer": "Today",
  "onboardingC.outlook.projected": "In a year",
  "onboardingC.outlook.continue": "Continue",

  // The only figures in the flow that are not the user's own. Both are
  // AAA's, both are attributed on the glass, and the money stays in the
  // currency they were published in. See src/onboarding/cost.ts.
  "onboardingC.cost.title": "Keeping it running costs about {cost} a year.",
  "onboardingC.cost.subtitle": "At the {distance} a year you drive.",
  "onboardingC.cost.perYear": "A year",
  "onboardingC.cost.fiveYears": "Over five years",
  "onboardingC.cost.roadsidePercent": "{percent}%",
  "onboardingC.cost.roadside": "of the {calls} roadside calls AAA answered in {year} were tows and flat batteries.",
  "onboardingC.cost.source": "{rate}, and {roadside}. US averages, in {currency}.",
  "onboardingC.cost.continue": "Continue",

  // The counterpart of the cost screen, and the opposite kind of figure: not
  // one number on it comes from outside this phone. Both pairs are counted
  // from the tracked services and from how many of them the user could put a
  // date on, which is why the screen can make a comparison at all — "you will
  // save $400 a year" has no published figure behind it and would be the one
  // invented number in the flow.
  "onboardingC.compare.title": "On your own, or on a schedule.",
  "onboardingC.compare.subtitle": "Your {vehicle}, kept both ways.",
  "onboardingC.compare.dated": "Services with a date on them",
  "onboardingC.compare.remembered": "Services you have to keep in your head",
  "onboardingC.compare.alone": "On your own",
  "onboardingC.compare.withApp": "With Wrenchy",
  "onboardingC.compare.ofTotal": "{count} of {total}",
  "onboardingC.compare.source": "Counted from your own answers. No averages, no estimates.",
  "onboardingC.compare.continue": "Continue",

  "onboardingC.symptoms.next": "Continue",
  "onboardingC.symptoms.last": "So what do I do",

  "onboardingC.help.title": "All three are the same problem.",
  "onboardingC.help.subtitle": "Nothing is written down where it can warn you.",
  "onboardingC.help.continue": "Continue",

  "onboardingC.reviews.title": "This app exists because of these.",
  "onboardingC.reviews.subtitle": {
    one: "{count} of {total} App Store reviews of apps that already do this is one to three stars.",
    other: "{count} of {total} App Store reviews of apps that already do this are one to three stars.",
  },
  "onboardingC.reviews.continue": "Continue",
  "onboardingC.reviews.mentioning": "Reviews mentioning",
};
