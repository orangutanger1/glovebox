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
  "offer.features.subtitle":
    "Everything lives in one file on this phone, with no account and no server.",

  "offer.plan.title": "Here is the plan.",
  "offer.plan.subtitle": {
    one: "{count} service on a schedule for your {vehicle}, counted by date and by distance.",
    other: "{count} services on a schedule for your {vehicle}, counted by date and by distance.",
  },
  "offer.plan.cta": "Turn on reminders",
  "offer.plan.decline": "Not now",
  "offer.plan.status.due": "Due",
  "offer.plan.status.soon": "Soon",
  "offer.plan.status.ok": "OK",
  "offer.plan.note": "One notification per service on the day it comes due.",
  "offer.plan.noteMore": {
    one: "Plus {count} more further out, and one notification per service on the day it comes due.",
    other:
      "Plus {count} more further out, and one notification per service on the day it comes due.",
  },

  "offer.notify.title": "Never miss a service.",
  "offer.notify.decline": "Do it later",

  "offer.paywall.title": "Cars don’t warn you. This does.",
  "offer.paywall.subtitle":
    "Every service and every odometer reading, on record. The mechanic sees a log, not a guess.",
  "offer.paywall.cta": "Keep my car on record",
  "offer.paywall.vehicle": "On record",
  "offer.paywall.scheduled": "Now tracked",
  "offer.paywall.services": { one: "service", other: "services" },
  "offer.paywall.dueNow": "Overdue today",
  "offer.paywall.nextUp": "Next warning",
  "offer.paywall.none": "None",
  "offer.paywall.caption":
    "Everything you just set up is already saved on this phone. No account, no server, nothing sent anywhere.",

  "offer.trial.title": { one: "Try it for {count} day.", other: "Try it for {count} days." },
  "offer.trial.subtitle": {
    one: "Take {count} day of Pro for nothing and decide once your car has actually told you something.",
    other:
      "Take {count} days of Pro for nothing and decide once your car has actually told you something.",
  },
  "offer.trial.cta": { one: "Start my {count} free day", other: "Start my {count} free days" },
  "offer.trial.decline": "No thanks, show me the free app",
  "offer.trial.caption": "Cancel in Settings before it ends and you pay nothing.",

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
