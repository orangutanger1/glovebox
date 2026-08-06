import type { Fragment } from "../types";

/**
 * The four quiz screens between the car and the findings: what was last done,
 * how the user tracks today, what they are trying to avoid, and the readout
 * while the plan is computed.
 *
 * The chip values on these screens are persisted answers and stay English
 * identifiers forever, so every chip label here is keyed by the value it
 * renders rather than being the value itself.
 */
export const onboardingB: Fragment = {
  "onboardingB.continue": "Continue",

  "onboardingB.service.title": "What did you last get done?",
  "onboardingB.service.subtitle": "Close enough is fine because you can correct it later.",
  "onboardingB.service.legend": "Service",
  "onboardingB.service.caption": "Pick one, and you can log the rest anytime.",
  // Two whole questions rather than one with a hole in it: the service name is
  // a noun the sentence has to agree with, and no language builds that from a
  // clause plus a lowercased identifier.
  "onboardingB.service.when": "When was the {service}?",
  "onboardingB.service.whenOther": "When was the service?",
  "onboardingB.service.somethingElse": "Something else",
  "onboardingB.service.ago.now": "Just now",
  "onboardingB.service.ago.lastMonth": "Last month",
  "onboardingB.service.ago.months3": "3 months ago",
  "onboardingB.service.ago.months6": "6 months ago",
  "onboardingB.service.ago.notSure": "Not sure",

  "onboardingB.tracking.title": "How do you keep track today?",
  "onboardingB.tracking.subtitle": "Whatever it is, it is more than most people do.",
  "onboardingB.tracking.legend": "Today",
  "onboardingB.tracking.caption":
    "Whatever you pick, Glovebox exports everything you log as a CSV for free.",
  "onboardingB.tracking.memory": "Memory",
  "onboardingB.tracking.receipts": "Receipts in the car",
  "onboardingB.tracking.spreadsheet": "A spreadsheet",
  "onboardingB.tracking.dealer": "My shop keeps it",
  "onboardingB.tracking.nothing": "Nothing at all",

  "onboardingB.worry.title": "What are you trying to avoid?",
  "onboardingB.worry.subtitle":
    "Pick as many as apply, since this decides what the app puts in front of you.",
  "onboardingB.worry.caption":
    "Last one, and the next screen is about your car rather than about the app.",
  "onboardingB.worry.bills": "Surprise repair bills",
  "onboardingB.worry.missed": "Missing a service",
  "onboardingB.worry.records": "Losing the records",
  "onboardingB.worry.resale": "Resale value",
  "onboardingB.worry.upsell": "Getting upsold",

  "onboardingB.analyzing.title": "Working out the schedule.",
  "onboardingB.analyzing.odometer": "{vehicle} at {distance}",
  "onboardingB.analyzing.intervals": {
    one: "{count} service interval applied",
    other: "{count} service intervals applied",
  },
  "onboardingB.analyzing.rate": "{distance} a year",
  "onboardingB.analyzing.rateProjected": "{distance} a year, so {projected} by next year",
  "onboardingB.analyzing.clear": "Nothing needs attention today",
  // Two counts, one of which decides the wording. The plural is selected on
  // what needs attention because that is the clause the lamp is lit for.
  "onboardingB.analyzing.due": {
    one: "{count} needs attention, {soon} coming up",
    other: "{count} need attention, {soon} coming up",
  },
  "onboardingB.analyzing.done": "Done",
  "onboardingB.analyzing.progress": "Reading {index} of {total}",
};
