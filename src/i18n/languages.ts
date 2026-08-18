/**
 * Every language the app ships, in the order a tie is broken.
 *
 * Its own module, rather than a constant in `./index`, because the plural table
 * is keyed by this type and `./index` imports the plural table: a language added
 * without a plural rule then fails to compile instead of throwing on a device.
 * `./index` re-exports both names, so no caller imports this file directly.
 */
export const LANGUAGES = [
  "en",
  "en-GB",
  "en-AU",
  "en-CA",
  "de",
  "fr",
  "fr-CA",
  "it",
  "es",
  "es-MX",
  "pt-BR",
  "nl",
  "sv",
  "pl",
  "ja",
  "ko",
] as const;

export type Language = (typeof LANGUAGES)[number];
