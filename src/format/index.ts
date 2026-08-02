/**
 * Parsing for numbers the user typed by hand.
 *
 * `Number("84,210")` is `NaN`, and a `NaN` bound into SQLite lands as NULL —
 * so a mileage entered with the comma the placeholder itself shows would have
 * been silently dropped. Grouping characters and a leading `$` are stripped
 * before parsing, and anything that still isn't finite returns undefined
 * rather than poisoning a column.
 */
export function parseNumber(s: string): number | undefined {
  const cleaned = s.replace(/[,\s$]/g, "");
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
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
