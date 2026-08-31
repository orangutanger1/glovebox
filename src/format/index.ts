import { t } from "../i18n";

/** Trailing distance units, in the languages the app ships. Stripped only from
 *  the end of the string, and only as a whole token: removing letters wherever
 *  they appear would turn "about 80k" into 80. */
const UNIT_SUFFIX =
  /[ \u00A0\u202F\u2009]*(?:mi|mi\.|mls|miles?|km|kms|kilometers?|kilometres?|milhas|millas|milles|meilen|mijl|mil|km\/h)\.?$/iu;

/** Everything a locale uses to group thousands that is not "." or ",": the
 *  ASCII space, NBSP, narrow NBSP and thin space (fr, pl, sv, ru), and the
 *  apostrophes de-CH and it-CH use. */
const SPACING = /[\s\u00A0\u202F\u2009'\u2019\u02BC]/g;

/**
 * Parsing for numbers the user typed by hand.
 *
 * `Number("84,210")` is `NaN`, and a `NaN` bound into SQLite lands as NULL —
 * so a mileage entered with the comma the placeholder itself shows would have
 * been silently dropped.
 *
 * The comma was only ever half the problem, and the half that was left is
 * worse, because it fails quietly instead of loudly. `formatNumber` prints a
 * German reader's odometer as "84.210" and a French reader's as "84 210", and
 * the placeholder under the field shows them exactly that — so the two most
 * likely things those users can type were a silent 84.21 and a rejection. The
 * odometer screen counts the rejection as `unparseable`; nothing counted the
 * 84.21, which is the same reading lost with a plausible number left in its
 * place.
 *
 * So the separators are resolved by position rather than assumed:
 *
 * - Spacing characters and apostrophes are grouping in every locale that uses
 *   them, and are simply removed.
 * - With both "." and "," present, the last one is the decimal separator and
 *   the other is grouping — true for every locale, in both directions.
 * - With one kind present more than once it is grouping ("1.234.567").
 * - With one kind present once, three digits after it means grouping ("84,210",
 *   "84.210") and anything else means a decimal ("1299,50", "84210.5").
 *
 * Anything with a letter still in it after a trailing unit is stripped is
 * rejected rather than coerced: "about 80k" is not 80, and `Number` would
 * otherwise take "1e5" and "0x20" as readings nobody typed.
 */
export function parseNumber(s: string): number | undefined {
  const cleaned = s
    .trim()
    .replace(/^[$£€¥]/, "")
    .replace(UNIT_SUFFIX, "")
    .replace(SPACING, "");
  if (!cleaned) return undefined;
  if (!/^[+-]?[\d.,]+$/.test(cleaned)) return undefined;

  const sign = cleaned.startsWith("-") ? -1 : 1;
  const digits = cleaned.replace(/^[+-]/, "");

  const lastDot = digits.lastIndexOf(".");
  const lastComma = digits.lastIndexOf(",");
  const dots = (digits.match(/\./g) ?? []).length;
  const commas = (digits.match(/,/g) ?? []).length;

  let decimalAt = -1;
  if (dots > 0 && commas > 0) {
    decimalAt = Math.max(lastDot, lastComma);
  } else if (dots + commas === 1) {
    const at = dots === 1 ? lastDot : lastComma;
    // Exactly three trailing digits is the grouped form the app itself prints;
    // any other run is a fraction the user meant.
    if (digits.length - at - 1 !== 3) decimalAt = at;
  }

  const whole = (decimalAt === -1 ? digits : digits.slice(0, decimalAt)).replace(/[.,]/g, "");
  const fraction = decimalAt === -1 ? "" : digits.slice(decimalAt + 1);
  // A separator with nothing after it is a half-typed number rather than a
  // reading — "84," is a user mid-keystroke. Nothing *before* it is fine:
  // ".50" is how a cost under a unit gets typed.
  if (decimalAt !== -1 && !fraction) return undefined;
  if (/[.,]/.test(fraction)) return undefined;

  const n = Number(`${whole || "0"}.${fraction || "0"}`);
  return Number.isFinite(n) ? sign * n : undefined;
}

/**
 * The label a vehicle is known by everywhere in the app.
 *
 * Onboarding used to ask for a name AND a year/make/model, which meant the
 * user typed "Civic" twice and the year/make/model were then displayed
 * nowhere — `name` is the only field the garage list and the vehicle header
 * ever render. The parts now produce the name, so the three fields that were
 * write-only become the thing you actually see.
 *
 * A nickname, once one exists, wins outright: someone who called it "the
 * truck" does not want it renamed to "2014 Ford F-150" behind their back.
 */
export function vehicleDisplayName(v: {
  nickname?: string;
  year?: number;
  make?: string;
  model?: string;
}): string {
  const nickname = v.nickname?.trim();
  if (nickname) return nickname;

  const parts = [v.year?.toString(), v.make?.trim(), v.model?.trim()].filter(
    (p): p is string => Boolean(p)
  );
  return parts.length > 0 ? parts.join(" ") : t("system.vehicle.fallback");
}

export type DateParts = { year: number; month: number; day: number };

/** Day count for a 1-12 month. Day 0 of the next month is the last of this one. */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/**
 * Snap wheel positions to a date that exists and has already happened.
 *
 * Three independent wheels can name February 31st — leaving the month wheel on
 * February while the day wheel sits at 31 has to land on the 28th, not roll
 * forward into March the way `new Date` would. A future date is pulled back to
 * today for the same reason the typed field rejected one: the work cannot have
 * been done yet.
 */
export function clampDateParts(p: DateParts, max: Date = new Date()): DateParts {
  const month = Math.min(12, Math.max(1, p.month));
  const day = Math.min(daysInMonth(p.year, month), Math.max(1, p.day));
  const capped = { year: max.getFullYear(), month: max.getMonth() + 1, day: max.getDate() };
  const asNumber = (d: DateParts) => d.year * 10000 + d.month * 100 + d.day;
  const clamped = { year: p.year, month, day };
  return asNumber(clamped) > asNumber(capped) ? capped : clamped;
}

/** Noon local, for the same reason `parseDateInput` returns noon: a record
 *  stored at midnight local lands on the previous day once serialised to UTC. */
export function dateFromParts(p: DateParts): Date {
  return new Date(p.year, p.month - 1, p.day, 12, 0, 0, 0);
}

/** "Sep 14" — for dates shown beside a label rather than in a record. The name
 *  stays here because screens already import it from this module; the date logic
 *  lives with the rest of the locale formatting. */
export { formatShortDate as shortDate } from "../i18n";

export function partsFromDate(d: Date): DateParts {
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

/**
 * Parsing for a service date the user typed by hand.
 *
 * `new Date("2/30/2026")` rolls forward to March 2nd rather than failing, so
 * every field is checked against the date that came back — a typo has to be
 * rejected, not silently filed under the wrong day.
 *
 * The result is noon local, not midnight: a record stored at midnight local
 * lands on the previous calendar day once it is serialised to UTC, and the
 * history list reads the date straight off the UTC string.
 *
 * Accepts `M/D`, `M/D/YY`, `M/D/YYYY` and `YYYY-MM-DD`. A bare `M/D` means the
 * most recent one — this year if it has already happened, otherwise last year.
 * Future dates are rejected: you cannot have had the work done yet.
 */
export function parseDateInput(input: string, today: Date = new Date()): Date | undefined {
  const s = input.trim();
  if (!s) return undefined;

  let year: number, month: number, day: number;

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(s);
  const slash = /^(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2}|\d{4}))?$/.exec(s);

  if (iso) {
    [year, month, day] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
  } else if (slash) {
    month = Number(slash[1]);
    day = Number(slash[2]);
    if (slash[3] === undefined) {
      year = today.getFullYear();
    } else if (slash[3].length === 2) {
      year = 2000 + Number(slash[3]);
    } else {
      year = Number(slash[3]);
    }
  } else {
    return undefined;
  }

  const built = (y: number) => new Date(y, month - 1, day, 12, 0, 0, 0);
  // Compared by calendar day, not by clock: noon today is "in the future"
  // against a 9am now, and today is the single most likely thing typed.
  const cutoff = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23, 59, 59, 999
  ).getTime();
  const inFuture = (x: Date) => x.getTime() > cutoff;
  let d = built(year);
  // Round-trip check: anything Date normalised away (2/30, month 13) is a typo.
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) {
    return undefined;
  }

  // A bare M/D that hasn't happened yet this year means last year, not a
  // typo — "12/28" typed in January is the oil change three weeks ago.
  if (slash && slash[3] === undefined && inFuture(d)) {
    d = built(year - 1);
  }

  return inFuture(d) ? undefined : d;
}
