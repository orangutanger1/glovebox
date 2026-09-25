/**
 * The glovebox: the papers a car carries and when each one lapses.
 *
 * Pure, so the arithmetic is testable in Node without the database or
 * expo-notifications behind it. The rows live in `../db/documents`.
 */

/** Every kind the form offers, in the order it offers them: the two every
 *  driver has to renew first, then the rest. `other` is last and is the only
 *  kind whose row is named by what the user typed rather than by the kind. */
export const DOCUMENT_KINDS = [
  "insurance",
  "registration",
  "inspection",
  "license",
  "warranty",
  "roadside",
  "other",
] as const;

export type DocumentKind = (typeof DOCUMENT_KINDS)[number];

export function isDocumentKind(value: unknown): value is DocumentKind {
  return typeof value === "string" && (DOCUMENT_KINDS as readonly string[]).includes(value);
}

/** How far ahead a lapse starts to show as "soon", on the car screen and in
 *  the first reminder. A month is the lead a renewal by post needs. */
export const EXPIRY_SOON_DAYS = 30;

/** The reminders a dated document earns: a month out, while there is still
 *  time to shop around, and a week out, for the one that was put off. */
export const EXPIRY_ALERT_DAYS = [30, 7] as const;

const DAY_MS = 24 * 60 * 60 * 1000;

export type ExpiryStatus = "expired" | "soon" | "ok";

/** Undefined for a document with no expiry: it has no status to show. */
export function expiryStatus(expiresAt: string | undefined, now: number): ExpiryStatus | undefined {
  if (!expiresAt) return undefined;
  const at = new Date(expiresAt).getTime();
  if (Number.isNaN(at)) return undefined;
  if (at < startOfDay(now)) return "expired";
  if (at - now <= EXPIRY_SOON_DAYS * DAY_MS) return "soon";
  return "ok";
}

export type ExpiryAlert = { at: string; daysLeft: number };

/**
 * When to remind about one document: 10:00 local, 30 and 7 days before it
 * lapses, dropping any that are already past. 10am rather than the time of
 * day the expiry happens to be stored at (noon): a reminder about paperwork is
 * one to act on, and the morning is when there is a day left to act in.
 */
export function expiryAlerts(expiresAt: string | undefined, now: number): ExpiryAlert[] {
  if (!expiresAt) return [];
  const expiry = new Date(expiresAt);
  if (Number.isNaN(expiry.getTime())) return [];
  const out: ExpiryAlert[] = [];
  for (const days of EXPIRY_ALERT_DAYS) {
    const at = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate() - days, 10, 0, 0, 0);
    if (at.getTime() > now) out.push({ at: at.toISOString(), daysLeft: days });
  }
  return out;
}

function startOfDay(now: number): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}
