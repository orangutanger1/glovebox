import type { Fragment } from "../types";

/**
 * The review themes and Glovebox's answer to each, for the reviews screen.
 *
 * A label is what the tally beside it counts, so it has to stay a description
 * of other people's complaints rather than become a claim of our own; the
 * answer under it is the only sentence on that screen speaking for the app.
 * They are keyed by the theme id the tallies are computed under in
 * `research/reviews.py`, which is what keeps a count and its words together.
 */
export const evidence: Fragment = {
  "evidence.records.label": "lost records, failed syncs, no way to get the data out",
  "evidence.records.answer": "SQLite on your phone. Export to CSV, free forever.",

  "evidence.price.label": "the price, the paywall, or what it turned out to cost",
  "evidence.price.answer": "Free tier is a whole usable app. One car, unlimited history.",

  "evidence.account.label": "an account and a login before anything worked",
  "evidence.account.answer": "No account. There is nothing to log into.",

  "evidence.crashes.label": "crashes, freezes, and files that would not open",
  "evidence.crashes.answer": "Deleted records are tombstoned, never dropped.",
};
