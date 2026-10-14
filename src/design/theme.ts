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
 * Inside arm A only, and for now only on a build that pins it (the
 * `design-v2-check` EAS profile): how v2 reaches users is decided after the
 * `app_design` read. Read at render time, like `isRedesign`.
 */
const V2_PIN = process.env.EXPO_PUBLIC_DESIGN_V2;

export function isDesignV2(): boolean {
  return V2_PIN === "1" && isRedesign();
}

/** Test seam: forget the cached arm so a test can switch it. */
export function resetDesignCache(): void {
  cached = undefined;
}
