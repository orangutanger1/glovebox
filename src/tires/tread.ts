import type { DistanceUnit } from "../units";

/**
 * Tire tread depth, measured at a rotation.
 *
 * Stored in millimetres; read and typed in the unit the owner's gauge uses:
 * 32nds of an inch where the app counts miles, millimetres where it counts
 * kilometres. Two thresholds and no more: 4/32" (about 3 mm), where wet
 * braking falls off and most shops suggest replacing, and 2/32" (1.6 mm), the
 * legal minimum in the US and the EU.
 */
const MM_PER_32ND = 25.4 / 32;
export const TREAD_SOON_MM = 3.2;
export const TREAD_DUE_MM = 1.6;

export const TREAD_SERVICE = "Tire Rotation";

/** The typed figure, in the owner's unit, as millimetres. Blank or nonsense
 *  is no reading; a depth past new-tire tread (about 12/32" or 10 mm, with
 *  room for truck tires) is a typo, not a reading. */
export function parseTread(input: string, unit: DistanceUnit): number | undefined | null {
  const s = input.trim().replace(",", ".");
  if (s === "") return undefined;
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  const mm = unit === "mi" ? n * MM_PER_32ND : n;
  return mm > 20 ? null : Math.round(mm * 100) / 100;
}

/** "5/32″" or "4 mm". Rounded to what a gauge reads. */
export function formatTread(mm: number, unit: DistanceUnit): string {
  return unit === "mi" ? `${Math.round(mm / MM_PER_32ND)}/32″` : `${Math.round(mm * 10) / 10} mm`;
}

export function treadStatus(mm: number): "due" | "soon" | "ok" {
  if (mm <= TREAD_DUE_MM + 0.01) return "due";
  if (mm <= TREAD_SOON_MM + 0.01) return "soon";
  return "ok";
}

/** The newest reading among a car's records, or undefined. */
export function latestTread(
  records: { performed_at: string; tread_mm?: number }[]
): { mm: number; at: string } | undefined {
  let best: { mm: number; at: string } | undefined;
  for (const r of records) {
    if (r.tread_mm === undefined) continue;
    if (!best || r.performed_at > best.at) best = { mm: r.tread_mm, at: r.performed_at };
  }
  return best;
}
