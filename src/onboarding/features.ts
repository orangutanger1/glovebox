import { t } from "../i18n";

/**
 * What the app does, in one list, so a capability cannot be described one way
 * before the paywall and another way after it.
 *
 * Every row used to carry a Free/Pro badge, and the `pro` flag that drove it
 * survived the free tier by a release: with nothing free left, "which half
 * costs money" has one answer and a flag saying so is a flag that can only be
 * wrong. Each row now carries both shapes of its own copy instead — a title
 * and a sentence where there is room for them, and a line of at most five
 * words for the lists that sit under an offer.
 */
export type FeatureId = (typeof ROWS)[number]["id"];

export type Feature = { id: FeatureId; title: string; subtitle: string; line: string };

/**
 * The gating, which is a product decision, kept here; the words, which are a
 * translation, kept in the catalog under each id. Reading them at call time
 * rather than at import is what lets a row be written in the language the
 * screen is actually rendering in.
 */
const ROWS = [
  { id: "history" },
  { id: "due" },
  { id: "reminders" },
  { id: "export" },
  { id: "costs" },
  { id: "garage" },
  { id: "intervals" },
] as const;

export function features(): Feature[] {
  return ROWS.map((row) => ({
    ...row,
    title: t(`features.${row.id}.title`),
    subtitle: t(`features.${row.id}.subtitle`),
    line: t(`offer.trial.gets.${row.id}`),
  }));
}
