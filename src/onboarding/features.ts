/**
 * What the app does, and which half of it costs money.
 *
 * One list, because two screens read from it and they must not disagree. The
 * features screen shows all of it with a Free/Pro badge on every row; the free
 * landing at the end of the flow shows only the free rows, and a row that
 * drifted between the two would be a promise made before the paywall and
 * withdrawn after it.
 */
export type Feature = { title: string; subtitle: string; pro?: boolean };

export const FEATURES: readonly Feature[] = [
  {
    title: "Every service, kept forever",
    subtitle: "Date, mileage, cost and notes, with deleted rows tombstoned rather than dropped.",
  },
  {
    title: "Due by date and by mileage",
    subtitle: "Whichever comes first, counted from the intervals for each service.",
  },
  {
    title: "One reminder per service",
    subtitle: "On the day it comes due, and nothing else ever.",
  },
  {
    title: "Export everything as CSV",
    subtitle: "Free forever for everyone, so your records are never hostage to a subscription.",
  },
  {
    title: "More than one vehicle",
    subtitle: "The whole garage, each with its own schedule.",
    pro: true,
  },
  {
    title: "Your own service intervals",
    subtitle: "Override any of them when the manual disagrees with the defaults.",
    pro: true,
  },
];

export const FREE_FEATURES: readonly Feature[] = FEATURES.filter((f) => !f.pro);
