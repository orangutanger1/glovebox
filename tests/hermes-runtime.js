/**
 * Shapes the test runtime like the one the app actually ships on.
 *
 * Node has full ICU. iOS Hermes implements exactly three Intl constructors —
 * `Collator`, `DateTimeFormat` and `NumberFormat`
 * (hermes/lib/Platform/Intl/PlatformIntlApple.mm) — so a suite running on Node's
 * Intl grades the app against a runtime no user has. That gap is what shipped
 * build 1.0(11): `t()` built an `Intl.PluralRules`, which does not exist on the
 * device, and the app was rejected in review for crashing on launch.
 *
 * Deleting the missing constructors here means any new call to one of them fails
 * in the suite instead of in App Review. Option coverage inside the three that
 * remain is narrower on Hermes than on Node and cannot be emulated this way, so
 * `DateTimeFormat` and `NumberFormat` are still worth keeping to their plainest
 * options.
 *
 * The real implementations stay reachable on `globalThis.ICU`, which is how the
 * plural table is graded against CLDR in tests/plural.test.ts.
 */
const MISSING_ON_HERMES = [
  "PluralRules",
  "DisplayNames",
  "RelativeTimeFormat",
  "ListFormat",
  "Segmenter",
];

globalThis.ICU = { PluralRules: Intl.PluralRules };

for (const name of MISSING_ON_HERMES) delete Intl[name];
