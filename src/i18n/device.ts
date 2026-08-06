import type * as Localization from "expo-localization";

/**
 * The phone's own answer to "who are you and where are you", in one module.
 *
 * `expo-localization` is required lazily, the same way `expo-store-review` is in
 * src/review: the logic test project runs in plain Node, and a top-level import
 * of a native module would take the whole schedule/plan/catalog suite down with
 * it. Loading it inside the call also means a device that somehow has no
 * localization module still renders — in English, which is the base catalog.
 */
function localization(): typeof Localization | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require("expo-localization");
  } catch {
    return null;
  }
}

/** The user's preferred languages, most-preferred first, as BCP-47 tags. */
export function deviceLanguageTags(): string[] {
  try {
    const locales = localization()?.getLocales() ?? [];
    return locales
      .map((l) => l.languageTag)
      .filter((tag): tag is string => typeof tag === "string" && tag.length > 0);
  } catch {
    return [];
  }
}

/**
 * The region the phone is set to — "DE", "US" — which is a different question
 * from its language. A British expat in Berlin reads English and drives a car
 * whose odometer counts kilometres, so the unit default and the inspection
 * cadence follow the region while the words follow the language.
 */
export function deviceRegion(): string | null {
  try {
    return localization()?.getLocales()[0]?.regionCode ?? null;
  } catch {
    return null;
  }
}
