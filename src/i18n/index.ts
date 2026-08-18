import { deviceLanguageTags } from "./device";
import { en } from "./catalog/en";
import { CATALOGS } from "./catalog";
import { LANGUAGES, type Language } from "./languages";
import { selectPlural } from "./plural";
import type { Entry, Fragment } from "./catalog/types";

export type { Entry, Fragment } from "./catalog/types";

export { LANGUAGES };
export type { Language };

/**
 * Languages whose speakers we ship a near neighbour to rather than nothing.
 *
 * A phone set to Portuguese (Portugal) or Austrian German would otherwise fall
 * all the way through to English; the Brazilian and German catalogs are wrong in
 * details for those readers and right about every word that matters.
 */
const NEAREST: Record<string, Language> = { pt: "pt-BR", nb: "sv", nn: "sv", da: "sv" };

export type Vars = Record<string, string | number>;

let active: Language = "en";
let merged: Record<string, Entry> = en;

/**
 * Picks the best shipped language for a list of BCP-47 tags, most-preferred
 * first — the exact tag if we ship it, then the base language, then a near
 * neighbour, then the next tag the user listed, and English if nothing matches.
 *
 * Tried in the order the phone lists them rather than the order we ship them:
 * iOS returns the user's preference order, and a phone set to Swiss German then
 * French wants German, not whichever of the two appears first in `LANGUAGES`.
 */
export function resolveLanguage(tags: readonly string[]): Language {
  for (const raw of tags) {
    const tag = raw.replace("_", "-");
    const exact = LANGUAGES.find((l) => l.toLowerCase() === tag.toLowerCase());
    if (exact) return exact;

    const base = tag.split("-")[0].toLowerCase();
    const baseMatch = LANGUAGES.find((l) => l.toLowerCase() === base);
    if (baseMatch) return baseMatch;

    const near = NEAREST[base];
    if (near) return near;
  }
  return "en";
}

/**
 * The catalog a language actually renders from: English underneath, the base
 * language over it, then the regional overlay on top.
 *
 * English underneath is what makes a missing key impossible. A translation that
 * lags a release shows the English sentence — the wrong language for one line,
 * which a user can still act on, instead of the raw key `garage.empty.title`,
 * which nobody can.
 */
function build(language: Language): Record<string, Entry> {
  const base = language.includes("-") ? (language.split("-")[0] as Language) : language;
  return {
    ...en,
    ...(base === "en" ? {} : (CATALOGS[base] ?? {})),
    ...(base === language ? {} : (CATALOGS[language] ?? {})),
  };
}

export function getLanguage(): Language {
  return active;
}

export function setLanguage(language: Language): void {
  active = language;
  merged = build(language);
}

/**
 * Resolves the language from the phone unless an explicit choice was stored.
 *
 * The stored choice is read by the caller rather than here, because this module
 * has to stay usable without a database — the notification scheduler and the
 * tests both call `t` with no SQLite in sight.
 */
export function initLanguage(override?: Language | null): Language {
  setLanguage(override ?? resolveLanguage(deviceLanguageTags()));
  return active;
}

const numberFormats: Record<string, Intl.NumberFormat> = {};

export function formatNumber(value: number): string {
  const key = active;
  numberFormats[key] ??= new Intl.NumberFormat(active);
  return numberFormats[key].format(value);
}

/**
 * Interpolation, in the one syntax the catalog uses: `{name}` placeholders.
 *
 * Numbers are formatted on the way in, so a Polish reader sees "51 771" and a
 * German "51.771" without every call site remembering to do it. This is also why
 * `count` is passed as a number and not pre-stringified — the plural category
 * and the printed digits both come from the same value.
 */
function fill(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => {
    const value = vars[name];
    if (value === undefined) return whole;
    return typeof value === "number" ? formatNumber(value) : value;
  });
}

export function t(key: string, vars?: Vars): string {
  const entry = merged[key] ?? en[key];

  // A key that exists in neither catalog is a bug in the caller, and rendering
  // the key is how it gets noticed in review instead of shipping a blank row.
  if (entry === undefined) return key;

  if (typeof entry === "string") return fill(entry, vars);

  const count = typeof vars?.count === "number" ? vars.count : 0;
  const category = selectPlural(active, count);
  return fill(entry[category] ?? entry.other, vars);
}

const dateFormats: Record<string, Intl.DateTimeFormat> = {};

function dateFormat(style: "short" | "long"): Intl.DateTimeFormat {
  const key = `${active}:${style}`;
  dateFormats[key] ??= new Intl.DateTimeFormat(
    active,
    style === "short"
      ? { month: "short", day: "numeric" }
      : { year: "numeric", month: "short", day: "numeric" }
  );
  return dateFormats[key];
}

/** "14 Sep" / "Sep 14" / "9月14日" — a date beside a label, where the year is
 *  noise because it is this year. */
export function formatShortDate(iso: string): string {
  return dateFormat("short").format(new Date(iso));
}

/**
 * "14 Sep 2026" — a date that is a fact about a service record.
 *
 * Three sites used to slice the ISO string instead (`2026-09-14`), which reads
 * as a date in no country and as a database column in every one.
 */
export function formatDate(iso: string): string {
  return dateFormat("long").format(new Date(iso));
}

/** Test seam: drops the memoised Intl objects so a language switch inside one
 *  process cannot answer with the previous locale's formatter. */
export function resetFormatters(): void {
  for (const map of [numberFormats, dateFormats] as Record<string, unknown>[]) {
    for (const key of Object.keys(map)) delete map[key];
  }
}

export type { Language as AppLanguage };
