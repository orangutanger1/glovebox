import type { Fragment } from "../types";

/**
 * The end of onboarding — features, plan, paywall, the exit offer — plus the
 * winback launch, which makes the same offer to a returning user.
 *
 * They share one namespace because they share one argument: the two screens
 * that describe the offer must describe the same thing in the same words, and
 * a translator editing them in two fragments will eventually edit only one.
 *
 * No sentence here names a price or a period. StoreKit localises both per
 * storefront and the offering is a dashboard edit away; the card draws the
 * figures, and the sentences say "for less" and "at the offer price".
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

  // The exit offer: a yearly plan for less than the first screen asked. No
  // number in the sentence — the card shows both prices in StoreKit's own
  // strings. "Limited time" is true of the screen: it is the one place the
  // price is offered, and the flow does not come back to it.
  "offer.deal.title": "Limited time offer.",
  "offer.deal.title.named": "{name}, a limited time offer.",
  "offer.trial.cta": "Claim your offer",
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

  "offer.winback.title": "You stopped logging.",
  "offer.winback.decline": "Just take me to my garage",
  "offer.winback.body":
    "Your records are exactly where you left them. Nothing expired, nothing was deleted, and nothing needs setting up again.",
  "offer.winback.feedback": "Tell us what went wrong",
  "offer.winback.feedbackNote": "A short form, opens in Safari",
  "offer.winback.caption": "Or give it one more go: a year of Pro at the offer price. Cancel anytime.",
};
