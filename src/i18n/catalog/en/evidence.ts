import type { Fragment } from "../types";

/**
 * The review themes and Wrenchy's answer to each, for the reviews screen.
 *
 * A label is what the tally beside it counts, so it has to stay a description
 * of other people's complaints rather than become a claim of our own; the
 * answer under it is the only sentence on that screen speaking for the app.
 * They are keyed by the theme id the tallies are computed under in
 * `research/reviews.py`, which is what keeps a count and its words together.
 */
export const evidence: Fragment = {
  "evidence.records.label": "lost records, failed syncs, no way to get the data out",
  "evidence.records.answer": "SQLite on your phone, and the whole log comes out as a CSV.",

  "evidence.price.label": "the price, the paywall, or what it turned out to cost",
  "evidence.price.answer":
    "One subscription, nothing else to buy. Every car, every record.",

  "evidence.account.label": "an account and a login before anything worked",
  "evidence.account.answer": "No account. There is nothing to log into.",

  "evidence.crashes.label": "crashes, freezes, and files that would not open",
  "evidence.crashes.answer":
    "Your records sit in a database on the phone, not in a file that can fail to open.",
};
