import { t } from "../i18n";

/**
 * The social-proof beat, done without any.
 *
 * The structure this flow follows puts a reviews screen between the pitch and
 * the plan, and for a good reason: nobody believes an app describing itself.
 * The usual contents are a five-star wall and a user count, and Wrenchy has
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
  /**
   * Theme tallies over the negative subset. A review can hit more than one.
   *
   * The id is the theme's name in `research/reviews.py`, and it is what keeps a
   * count tied to the words for it and to Wrenchy's answer: those are copy and
   * live in the catalog, while the tally is a fact about the corpus.
   */
  themes: [
    { id: "records", count: 179 },
    { id: "price", count: 87 },
    { id: "account", count: 83 },
    { id: "crashes", count: 59 },
  ],
} as const;

export type ReviewThemeId = (typeof REVIEW_EVIDENCE.themes)[number]["id"];

/** What the tally counts, in the reader's language. */
export function reviewThemeLabel(id: ReviewThemeId): string {
  return t(`evidence.${id}.label`);
}

/** What Wrenchy does about that tally. */
export function evidenceAnswer(id: ReviewThemeId): string {
  return t(`evidence.${id}.answer`);
}
