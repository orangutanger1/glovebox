import type { Language } from "./languages";

/**
 * Plural category selection, as data, for the languages the app ships.
 *
 * `Intl.PluralRules` does not exist on iOS. Hermes implements exactly three Intl
 * constructors on Apple platforms — `Collator`, `DateTimeFormat` and
 * `NumberFormat` (hermes/lib/Platform/Intl/PlatformIntlApple.mm) — so
 * `new Intl.PluralRules(...)` threw "Intl.PluralRules is not a constructor" on
 * every device, took the JS thread down with it, and expo-updates turned the
 * unhandled error into an abort. Node has full ICU, so the suite never saw it:
 * build 1.0(11) was rejected in review for crashing on launch, first on the
 * sixth onboarding screen and then on every relaunch, because the flow resumes
 * on the screen it stopped on.
 *
 * The table answers on every runtime rather than only where the constructor is
 * missing, so the string a reviewer sees is the string a test asserted.
 * `tests/plural.test.ts` holds it to CLDR by comparing it against Node's own
 * `Intl.PluralRules` for every shipped language.
 */
export type PluralCategory = Intl.LDMLPluralRule;

/**
 * The operands CLDR's rules are written in terms of: `i` is the integer part,
 * `v` the count of visible fraction digits. CLDR also defines `f`, `t`, `e` and
 * `c`; none of the rules below needs them, and `e` (compact notation exponent)
 * is 0 for every number this app formats.
 */
function operands(count: number): { n: number; i: number; v: number } {
  const n = Math.abs(count);
  const fraction = String(n).split(".")[1];
  return { n, i: Math.floor(n), v: fraction ? fraction.length : 0 };
}

/**
 * The category Romance languages keep for round millions and nothing else — "3
 * millions de km". No count in this app reaches it today, and a table missing it
 * would be wrong the first day one does.
 */
function romanceMany(i: number, v: number): boolean {
  return v === 0 && i !== 0 && i % 1000000 === 0;
}

type Rule = (count: number) => PluralCategory;

/** one: i = 1 and v = 0. English, German, Dutch, Swedish. */
const germanic: Rule = (count) => {
  const { i, v } = operands(count);
  return i === 1 && v === 0 ? "one" : "other";
};

/** one: i = 0..1 — French and Portuguese both count zero as singular. */
const french: Rule = (count) => {
  const { i, v } = operands(count);
  if (i === 0 || i === 1) return "one";
  return romanceMany(i, v) ? "many" : "other";
};

/** one: n = 1 exactly, which makes "1,0 kilómetro" plural in Spanish. */
const spanish: Rule = (count) => {
  const { n, i, v } = operands(count);
  if (n === 1) return "one";
  return romanceMany(i, v) ? "many" : "other";
};

/** one: i = 1 and v = 0, and the Romance `many` above it. */
const italian: Rule = (count) => {
  const { i, v } = operands(count);
  if (i === 1 && v === 0) return "one";
  return romanceMany(i, v) ? "many" : "other";
};

/** Four categories, and any fraction is `other`. */
const polish: Rule = (count) => {
  const { i, v } = operands(count);
  if (v !== 0) return "other";
  if (i === 1) return "one";
  const tens = i % 10;
  const hundreds = i % 100;
  if (tens >= 2 && tens <= 4 && !(hundreds >= 12 && hundreds <= 14)) return "few";
  return "many";
};

/** Japanese and Korean do not inflect for number. */
const invariant: Rule = () => "other";

/**
 * Exhaustive by type: adding a language to `LANGUAGES` without a rule here is a
 * compile error, which is the only guard that runs before a build ships.
 */
const RULES: Record<Language, Rule> = {
  en: germanic,
  "en-GB": germanic,
  "en-AU": germanic,
  "en-CA": germanic,
  de: germanic,
  nl: germanic,
  sv: germanic,
  fr: french,
  "fr-CA": french,
  "pt-BR": french,
  it: italian,
  es: spanish,
  "es-MX": spanish,
  pl: polish,
  ja: invariant,
  ko: invariant,
};

export function selectPlural(language: Language, count: number): PluralCategory {
  // A stored language from a build that shipped one this build does not reads
  // English words already; it reads English plurals too rather than throwing.
  return (RULES[language] ?? germanic)(count);
}
