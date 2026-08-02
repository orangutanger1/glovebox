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
