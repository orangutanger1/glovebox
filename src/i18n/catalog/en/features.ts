import type { Fragment } from "../types";

/**
 * The feature list, read by the features screen.
 *
 * Keyed by feature id rather than by position, so a row cannot be described
 * one way in the list and another in the badge beside it.
 */
export const features: Fragment = {
  "features.history.title": "Every service, kept forever",
  "features.history.subtitle":
    "Date, odometer, cost and notes, with deleted rows tombstoned rather than dropped.",

  "features.due.title": "Due by date and by distance",
  "features.due.subtitle": "Whichever comes first, counted from the intervals for each service.",

  "features.reminders.title": "One reminder per service",
  "features.reminders.subtitle": "On the day it comes due, and nothing else ever.",

  "features.export.title": "Export everything as CSV",
  "features.export.subtitle":
    "Free forever for everyone, so your records are never hostage to a subscription.",

  "features.costs.title": "See what it's costing you",
  "features.costs.subtitle":
    "Totals by vehicle, by service and by month, added up from the costs you log.",

  "features.garage.title": "Unlimited vehicles",
  "features.garage.subtitle": "Every car, van and truck you own, tracked in one place.",

  "features.intervals.title": "Servicing on your terms",
  "features.intervals.subtitle":
    "Set the intervals to match how you actually drive, and keep the history a buyer will pay for.",
};
