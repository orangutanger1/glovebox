import type { Fragment } from "../types";

/**
 * The end of onboarding — features, plan, paywall, trial — plus the winback
 * launch, which makes the same trial offer to a returning user.
 *
 * They share one namespace because they share one argument: the two screens
 * that name the trial must say the same number of days in the same words, and
 * a translator editing "free days" in two fragments will eventually edit only
 * one of them.
 *
 * Every sentence carrying the trial length is a plural entry even though the
 * shipped value is never one day. The number comes from the RevenueCat
 * offering, not from the build, so English's "1 free day" is one dashboard
 * edit away and the languages with more than two forms need it regardless.
 */
export const offer: Fragment = {
  "offer.badge.pro": "Pro",
  "offer.badge.free": "Free",

  "offer.features.title": "What you are getting.",

  "offer.plan.title": "Here is the plan.",
  "offer.plan.subtitle": {
    one: "{count} service on a schedule for your {vehicle}.",
    other: "{count} services on a schedule for your {vehicle}.",
  },
  "offer.plan.cta": "Turn on reminders",
  "offer.plan.decline": "Not now",

  "offer.notify.title": "Never miss a service.",
  "offer.notify.off": "Reminders off",

  "offer.paywall.title": "Cars don’t warn you. This does.",
  "offer.paywall.subtitle": "Every service and every reading, on record.",
  "offer.paywall.cta": "Keep my car on record",
  "offer.paywall.vehicle": "On record",
  "offer.paywall.scheduled": "Now tracked",
  "offer.paywall.services": { one: "service", other: "services" },
  "offer.paywall.dueNow": "Overdue today",
  "offer.paywall.nextUp": "Next warning",
  "offer.paywall.none": "None",

  "offer.paywall.impact.legend": "What that is worth",
  // Three lines, and they have to land in the width of a phone at the moment
  // the price is on screen. The long version explained each benefit in a full
  // clause; a reader deciding whether to pay skims a bullet and takes the verb.
  "offer.paywall.impact.warned": "Warned before it costs you, not after.",
  "offer.paywall.impact.upsell": "You walk in knowing. Nothing gets sold to you twice.",
  "offer.paywall.impact.resale": "A full log at resale, and it shows in the price.",

  "offer.trial.title": { one: "Try it for {count} day.", other: "Try it for {count} days." },
  "offer.trial.cta": { one: "Start my {count} free day", other: "Start my {count} free days" },
  "offer.trial.decline": "No thanks, show me the free app",
  "offer.trial.subtitle": "Full Pro, free. Nothing is charged today.",
  "offer.trial.legend": "How the trial runs",
  "offer.trial.now.title": "Today",
  "offer.trial.now.body": "Everything unlocks: your plan, your reminders, your full log.",
  "offer.trial.runs.title": "While it runs",
  "offer.trial.runs.body": "Every service your car is due for is watched, not remembered.",
  "offer.trial.ends.title": "When it ends",
  "offer.trial.ends.body": "It renews at the price on the next screen. You decide before then.",

  "offer.winback.title": "You stopped logging.",
  "offer.winback.decline": "Just take me to my garage",
  "offer.winback.body":
    "Your records are exactly where you left them. Nothing expired, nothing was deleted, and nothing needs setting up again.",
  "offer.winback.feedback": "Tell us what went wrong",
  "offer.winback.feedbackNote": "A short form, opens in Safari",
  "offer.winback.caption": {
    one: "Or give it one more go: {count} day of Pro, free. Cancel before it ends and you pay nothing.",
    other:
      "Or give it one more go: {count} days of Pro, free. Cancel before they end and you pay nothing.",
  },
};
