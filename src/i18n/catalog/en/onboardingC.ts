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
  "onboardingC.reviews.scroll": "Scroll to read all four",
  "onboardingC.reviews.mentioning": "Reviews mentioning",
};
