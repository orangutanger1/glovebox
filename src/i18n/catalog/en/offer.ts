import type { Fragment } from "../types";

/**
 * The end of onboarding — features, plan, paywall, the introductory offer —
 * plus the winback launch, which makes the same offer to a returning user.
 *
 * They share one namespace because they share one argument: the two screens
 * that name the introductory period must say the same number of days in the
 * same words, and a translator editing them in two fragments will eventually
 * edit only one of them.
 *
 * Every sentence carrying that length is a plural entry even though the
 * shipped value is never one day. The number comes from the RevenueCat
 * offering, not from the build, so a one-day intro is a dashboard edit away
 * and the languages with more than two forms need it regardless.
 *
 * No sentence here names a price. StoreKit localises and converts the
 * introductory price per storefront; the sheet one tap away is the only thing
 * that knows what this user will actually be charged.
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
  "offer.plan.status.due": "Due",
  "offer.plan.status.soon": "Soon",
  "offer.plan.status.ok": "OK",
  "offer.plan.status.noRecord": "No record",

  "offer.paywall.title": "Cars don’t warn you. This does.",
  "offer.paywall.title.named": "{name}, cars don’t warn you. This does.",
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

  "offer.trial.title": {
    one: "Your first {count} day costs less.",
    other: "Your first {count} days cost less.",
  },
  "offer.trial.title.named": {
    one: "{name}, your first {count} day costs less.",
    other: "{name}, your first {count} days cost less.",
  },
  "offer.trial.cta": {
    one: "Start my first {count} day",
    other: "Start my first {count} days",
  },
  // The old wording sent the decliner to "the free app". There is no free app
  // to send them to any more, and a link promising one would be the last thing
  // read before the wall it actually leads to.
  "offer.trial.decline": "No thanks",
  "offer.trial.legend": "How the offer runs",
  "offer.trial.now.title": "Today",
  "offer.trial.now.body": "Everything unlocks: your plan, your reminders, your full log.",
  "offer.trial.runs.title": "While it runs",
  "offer.trial.runs.body": "Every service your car is due for is watched, not remembered.",
  "offer.trial.ends.title": "When it ends",
  "offer.trial.ends.body": "It renews at the standard price. You decide before then.",

  "offer.winback.title": "You stopped logging.",
  "offer.winback.decline": "Just take me to my garage",
  "offer.winback.body":
    "Your records are exactly where you left them. Nothing expired, nothing was deleted, and nothing needs setting up again.",
  "offer.winback.feedback": "Tell us what went wrong",
  "offer.winback.feedbackNote": "A short form, opens in Safari",
  "offer.winback.caption": {
    one: "Or give it one more go: {count} day of Pro at the introductory price. Cancel before it ends and it stops there.",
    other:
      "Or give it one more go: {count} days of Pro at the introductory price. Cancel before they end and it stops there.",
  },
};
