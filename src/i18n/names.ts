import type { Language } from "./index";

/**
 * Each language written in itself.
 *
 * Endonyms, not translations: a Polish speaker hunting for their language in a
 * list scans for "Polski", and a list that says "Polish" in English is a list
 * they have to read in a language they may not have. This is also why these
 * strings are code and not catalog entries — "Deutsch" is "Deutsch" in every
 * language, so translating them would only create 16 chances to get it wrong.
 *
 * `Intl.DisplayNames` would compute the same table, but its data is not
 * guaranteed present on every Hermes build, and a settings list that renders
 * "en-GB" is worse than one that costs sixteen lines.
 */
export const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English (US)",
  "en-GB": "English (UK)",
  "en-AU": "English (Australia)",
  "en-CA": "English (Canada)",
  de: "Deutsch",
  fr: "Français",
  "fr-CA": "Français (Canada)",
  it: "Italiano",
  es: "Español",
  "es-MX": "Español (México)",
  "pt-BR": "Português (Brasil)",
  nl: "Nederlands",
  sv: "Svenska",
  pl: "Polski",
  ja: "日本語",
  ko: "한국어",
};
