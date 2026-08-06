import type { Fragment } from "../types";

/**
 * The feature list, read by the features screen and by the free landing.
 *
 * Keyed by feature id rather than by position so the two screens, which show
 * overlapping subsets of the same list, cannot end up describing one row two
 * ways.
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

  "features.garage.title": "More than one vehicle",
  "features.garage.subtitle": "The whole garage, each with its own schedule.",

  "features.intervals.title": "Your own service intervals",
  "features.intervals.subtitle": "Override any of them when the manual disagrees with the defaults.",
};
