/**
 * The social-proof beat, done without any.
 *
 * The structure this flow follows puts a reviews screen between the pitch and
 * the plan, and for a good reason: nobody believes an app describing itself.
 * The usual contents are a five-star wall and a user count, and Glovebox has
 * neither — it has not shipped. Inventing them would be the one thing the
 * product cannot survive, since the entire pitch is that your records are
 * safe here because nothing about this app is a trick.
 *
 * So the screen shows the reviews that do exist: the ones people left for the
 * apps they are currently using. `research/reviews.py` pulled them from the
 * App Store RSS feed and `research/reviews.json` still holds every one. The
 * counts below are the theme tallies over the 1-to-3-star subset, reproducible
 * from the repo:
 *
 *   cd research && python3 -c "..."   # see reviews.py THEMES, main()
 *
 * A count is a mention of the theme, not a verified incident, and the labels
 * say so. Nothing is quoted: those reviews were written about somebody else's
 * app, and lifting the words would be borrowing credibility as well as
 * evidence.
 */
export const REVIEW_EVIDENCE = {
  /** Reviews pulled, across the nine apps in `research/reviews.py`. */
  total: 1715,
  apps: 9,
  /** Of those, how many are one to three stars. */
  negative: 691,
  /** Theme tallies over the negative subset. A review can hit more than one. */
  themes: [
    { count: 179, label: "lost records, failed syncs, no way to get the data out" },
    { count: 87, label: "the price, the paywall, or what it turned out to cost" },
    { count: 83, label: "an account and a login before anything worked" },
    { count: 59, label: "crashes, freezes, and files that would not open" },
  ],
} as const;

/** What Glovebox does about each tally, in the same order. */
export const EVIDENCE_ANSWERS = [
  "SQLite on your phone. Export to CSV, free forever.",
  "Free tier is a whole usable app. One car, unlimited history.",
  "No account. There is nothing to log into.",
  "Deleted records are tombstoned, never dropped.",
] as const;
