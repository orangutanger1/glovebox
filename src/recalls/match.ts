/**
 * The pure half of the recall lookup: turning what the owner typed into the
 * make and model NHTSA files recalls under, and NHTSA's rows into ours.
 *
 * Kept free of the database and the network so it runs under the logic tests.
 */

/** A recall as the vehicle screen draws it. Text is NHTSA's own, in English. */
export type Recall = {
  campaign: string;
  /** NHTSA's component path's first segment, e.g. "Air bags". */
  component: string;
  summary: string;
  consequence: string;
  remedy: string;
  /** ISO date NHTSA received the report, when it parsed. */
  reportedAt: string | null;
  /** NHTSA's "park it" advisory: do not drive until fixed. */
  parkIt: boolean;
};

/** Spellings owners type that NHTSA files under another name. */
const MAKE_ALIASES: Record<string, string> = {
  CHEVY: "CHEVROLET",
  VW: "VOLKSWAGEN",
  MERCEDES: "MERCEDES-BENZ",
  MERCEDESBENZ: "MERCEDES-BENZ",
  BENZ: "MERCEDES-BENZ",
  "LAND ROVER": "LAND ROVER",
  LANDROVER: "LAND ROVER",
  ALFA: "ALFA ROMEO",
  DODGERAM: "RAM",
};

/** Upper case, diacritics folded, punctuation and spaces dropped: "F-150" and
 *  "f150" and "F 150" are one model. */
export function squash(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

/** The make to ask NHTSA about. */
export function nhtsaMake(typed: string): string {
  const upper = typed.normalize("NFD").replace(/\p{Diacritic}/gu, "").trim().toUpperCase();
  return MAKE_ALIASES[upper] ?? MAKE_ALIASES[squash(upper)] ?? upper;
}

/**
 * NHTSA's name for the model the owner typed, from the models it lists for
 * that make and year — or null when nothing is a confident match.
 *
 * A model NHTSA does not list returns zero recalls, which is indistinguishable
 * from a clean record. Matching against the list first is what lets the screen
 * say "no recalls" only when it actually asked about this car. Exact (after
 * squashing) wins; otherwise one listed model that starts with what was typed
 * ("Civic" → "CIVIC", "Silverado" → "SILVERADO 1500" only if it is the only
 * Silverado). Anything ambiguous is no match.
 */
export function matchModel(typed: string, listed: readonly string[]): string | null {
  const want = squash(typed);
  if (!want) return null;
  const unique = Array.from(new Set(listed));
  const exact = unique.find((m) => squash(m) === want);
  if (exact) return exact;
  const prefixed = unique.filter((m) => squash(m).startsWith(want));
  return prefixed.length === 1 ? prefixed[0] : null;
}

type NhtsaRecall = {
  NHTSACampaignNumber?: string;
  Component?: string;
  Summary?: string;
  Consequence?: string;
  Remedy?: string;
  ReportReceivedDate?: string;
  parkIt?: boolean;
};

/** "15/09/2015" (NHTSA's day-first date) to ISO, or null. */
function parseReported(s: string | undefined): string | null {
  const m = s?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const d = new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1]), 12));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function sentenceCase(s: string): string {
  const lower = s.trim().toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** NHTSA's rows, newest first, one per campaign. */
export function toRecalls(rows: readonly NhtsaRecall[]): Recall[] {
  const seen = new Set<string>();
  const out: Recall[] = [];
  for (const r of rows) {
    const campaign = r.NHTSACampaignNumber ?? "";
    if (!campaign || seen.has(campaign)) continue;
    seen.add(campaign);
    out.push({
      campaign,
      component: sentenceCase((r.Component ?? "").split(":")[0] || "Other"),
      summary: (r.Summary ?? "").trim(),
      consequence: (r.Consequence ?? "").trim(),
      remedy: (r.Remedy ?? "").trim(),
      reportedAt: parseReported(r.ReportReceivedDate),
      parkIt: r.parkIt === true,
    });
  }
  return out.sort((a, b) => (b.reportedAt ?? "").localeCompare(a.reportedAt ?? ""));
}
