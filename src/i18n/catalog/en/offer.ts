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
  "offer.notify.body": "Last done {date}.",
  "offer.plan.status.due": "Due",
  "offer.plan.status.soon": "Soon",
  "offer.plan.status.ok": "OK",
  "offer.plan.status.noRecord": "No record",

  "offer.paywall.title": "Never miss a service.",
  "offer.paywall.title.named": "{name}, never miss a service.",
  "offer.paywall.subtitle": "Every service and every reading, on record.",
  "offer.paywall.vehicle": "On record",
  "offer.paywall.scheduled": "Now tracked",
  "offer.paywall.services": { one: "service", other: "services" },
  "offer.paywall.dueNow": "Overdue today",
  "offer.paywall.nextUp": "Next warning",
  "offer.paywall.none": "None",
  // The three benefit rows on the paywall, built from this user's own plan.
  // They replace the four gauges: the same numbers, read as sentences, on the
  // one screen where the reader is deciding rather than glancing.
  "offer.paywall.point.tracked.title": "{vehicle} on record",
  "offer.paywall.point.tracked.subtitle": {
    one: "{count} service tracked, by date and by distance",
    other: "{count} services tracked, by date and by distance",
  },
  "offer.paywall.point.due.title": {
    one: "{count} service overdue today",
    other: "{count} services overdue today",
  },
  "offer.paywall.point.due.subtitle": "Next warning {date}",
  "offer.paywall.point.due.noNext": "No warning needed yet",
  // Drawn in place of the overdue row when nothing is overdue, which on a
  // fresh install is always: the user has logged nothing yet, so "nothing
  // overdue today" was the app congratulating them on an empty record.
  "offer.paywall.point.history.title": "A full history when you sell",
  "offer.paywall.point.history.subtitle": "Every service, cost and reading, kept forever and exportable.",
  "offer.paywall.point.reminders.title": "A reminder before each service",
  "offer.paywall.point.reminders.subtitle": "On the day it comes due, and never a nag.",

  "offer.trial.title": {
    one: "Your first {count} day costs less.",
    other: "Your first {count} days cost less.",
  },
  "offer.trial.title.named": {
    one: "{name}, your first {count} day costs less.",
    other: "{name}, your first {count} days cost less.",
  },
  // Under the title, with the two prices StoreKit returned. It is the one
  // sentence on the screen that says what the offer is before the reader
  // reaches the card.
  "offer.trial.subtitle": {
    one: "Everything in Pro for {intro} your first {count} day, then {price} per week. Cancel anytime.",
    other: "Everything in Pro for {intro} your first {count} days, then {price} per week. Cancel anytime.",
  },
  "offer.trial.cta": "Claim your offer now",
  // The old wording sent the decliner to "the free app". There is no free app
  // to send them to any more, and a link promising one would be the last thing
  // read before the wall it actually leads to.
  "offer.trial.decline": "I’d rather pay full price",
  // The trial screen's own list, and deliberately not the paywall's. That one
  // is three features with a sentence under each, in front of a price. This is
  // everything the trial opens, so it has to be readable at a glance: a tick
  // and at most five words a line, down the page.
  "offer.trial.gets.reminders": "Reminders before every service",
  "offer.trial.gets.due": "Due by date and distance",
  "offer.trial.gets.history": "Every service kept forever",
  "offer.trial.gets.costs": "See what your car costs",
  "offer.trial.gets.garage": "Unlimited vehicles",
  "offer.trial.gets.intervals": "Your own service schedules",
  "offer.trial.gets.export": "Export everything as CSV",
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
