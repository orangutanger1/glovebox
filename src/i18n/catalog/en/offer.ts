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
  "offer.plan.status.due": "Due",
  "offer.plan.status.soon": "Soon",
  "offer.plan.status.ok": "OK",

  "offer.notify.title": "Never miss a service.",

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
  "offer.paywall.impact.warned": "You hear about a service before it is due, not after it costs you a repair.",
  "offer.paywall.impact.upsell": "You walk into the shop knowing what was done and when, so nothing gets sold to you twice.",
  "offer.paywall.impact.resale": "You hand the next owner a full log instead of a shrug, and it shows in the price.",

  "offer.trial.title": { one: "Try it for {count} day.", other: "Try it for {count} days." },
  "offer.trial.cta": { one: "Start my {count} free day", other: "Start my {count} free days" },
  "offer.trial.decline": "No thanks, show me the free app",

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
