import type { Fragment } from "../types";

/**
 * The back half of onboarding: the findings pager, the answer to it, the
 * reviews evidence, the computed results, and the frame all four are drawn in.
 *
 * The status badge on a results row is keyed rather than printed: `due` is a
 * plan state the code branches on, and a translated word cannot also be an
 * identifier. The three counts on the reviews subtitle are one sentence and one
 * key — the count that moves the verb is `count`, the other two ride along as
 * plain placeholders, because a sentence assembled from clauses cannot be
 * reordered by a translator.
 */
export const onboardingC: Fragment = {
  "onboardingC.back": "Back",
  "onboardingC.question": "Question {step} / {total}",

  "onboardingC.results.overdue": {
    one: "One service is already overdue.",
    other: "{count} services are already overdue.",
  },
  "onboardingC.results.noneLogged": "Nothing you have logged is overdue.",
  "onboardingC.results.noneYet": "Nothing is overdue yet.",
  "onboardingC.results.clear": "Nothing is overdue, and nothing is close.",
  "onboardingC.results.subtitle":
    "Worked out for your {vehicle} from {distance} a year and what you have logged.",
  "onboardingC.results.continue": "Continue",
  "onboardingC.results.dueNow": "Due now",
  "onboardingC.results.soon": "Soon",
  "onboardingC.results.onFile": "On file",
  "onboardingC.results.onFileValue": "{logged} / {total}",
  "onboardingC.results.status.due": "Due",
  "onboardingC.results.status.soon": "Soon",
  "onboardingC.results.status.ok": "OK",
  "onboardingC.results.next":
    "The next one lands {date}, whichever comes first by date or by distance.",
  "onboardingC.results.countdown":
    "Every service is counted down by date and by distance, whichever comes first.",

  "onboardingC.symptoms.next": "Continue",
  "onboardingC.symptoms.last": "So what do I do",

  "onboardingC.help.title": "All three are the same problem.",
  "onboardingC.help.subtitle":
    "Nothing is written down in a form that can warn you, which is the whole of what Wrenchy does.",
  "onboardingC.help.continue": "Continue",

  "onboardingC.reviews.title": "This app exists because of these.",
  "onboardingC.reviews.subtitle": {
    one:
      "{count} of the {total} App Store reviews of the {apps} apps that already do this is one to three stars.",
    other:
      "{count} of the {total} App Store reviews of the {apps} apps that already do this are one to three stars.",
  },
  "onboardingC.reviews.continue": "Continue",
  "onboardingC.reviews.scroll": "Scroll to read all four",
  "onboardingC.reviews.mentioning": "Reviews mentioning",
};
