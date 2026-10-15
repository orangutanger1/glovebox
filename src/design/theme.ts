import { getState } from "../db/state";

/**
 * Whether this install sees the redesign (arm A of `app_design`, registered in
 * src/experiments).
 *
 * Reads the experiment's row directly rather than through `getVariant`: the
 * experiments module imports analytics, which imports the purchases SDK, and
 * every button in the app would then carry that weight (and every screen test
 * a RevenueCat mock).
 *
 * Read at render time, never at module scope: the arm is written in the root
 * layout's boot effect, after the first modules — and the first frame — have
 * already been evaluated. A style map built at import would freeze every fresh
 * install into the classic look.
 *
 * Cached once the row exists, because the row is written once and never
 * changes, and buttons render often enough that a SQLite read per render adds
 * up. A missing row is not cached: it is "not assigned yet" on the very first
 * frame of a fresh install, and "classic" for everyone else.
 */
export const DESIGN_KEY = "experiment.app_design";

let cached: boolean | undefined;

/**
 * Test builds only: the `redesign-check` EAS profile pins an arm so a phone that
 * already has the app — and so has no `app_design` row and would stay classic —
 * can look at arm A. Inlined at bundle time; unset for every store build.
 */
const PINNED = process.env.EXPO_PUBLIC_APP_DESIGN;

export function isRedesign(): boolean {
  if (PINNED === "redesign" || PINNED === "classic") return PINNED === "redesign";
  if (cached !== undefined) return cached;
  let raw: string | null;
  try {
    raw = getState(DESIGN_KEY);
  } catch {
    return false;
  }
  if (raw === null) return false;
  cached = raw === "redesign";
  return cached;
}

/**
 * Arm A's second look (docs/superpowers/plans/2026-10-13-app-design-v2.md).
 * Folded into arm A from 1.3.1 (DECISIONS, `app_design`, 2026-10-14), so it is
 * simply arm A. Kept as its own name so v2's styling stays easy to find.
 */
export function isDesignV2(): boolean {
  return isRedesign();
}

/** Test seam: forget the cached arm so a test can switch it. */
export function resetDesignCache(): void {
  cached = undefined;
}
