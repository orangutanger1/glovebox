import { t } from "../i18n";

/**
 * What the app does, and which half of it costs money.
 *
 * One list, because two screens read from it and they must not disagree. The
 * features screen shows all of it with a Free/Pro badge on every row; the free
 * landing at the end of the flow shows only the free rows, and a row that
 * drifted between the two would be a promise made before the paywall and
 * withdrawn after it.
 */
export type FeatureId = (typeof ROWS)[number]["id"];

export type Feature = { id: FeatureId; title: string; subtitle: string; pro?: boolean };

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
  { id: "garage", pro: true },
  { id: "intervals", pro: true },
] as const;

export function features(): Feature[] {
  return ROWS.map((row) => ({
    ...row,
    title: t(`features.${row.id}.title`),
    subtitle: t(`features.${row.id}.subtitle`),
  }));
}

export function freeFeatures(): Feature[] {
  return features().filter((f) => !f.pro);
}
