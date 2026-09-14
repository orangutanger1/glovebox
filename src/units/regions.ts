export type DistanceUnit = "mi" | "km";

/**
 * The three storefronts whose drivers read miles off the dashboard.
 *
 * The United States, the United Kingdom, and Myanmar are the only places where
 * road distance is posted in miles; Liberia's signs are metric. Everywhere else
 * a car's odometer counts kilometres, and asking a German owner to enter 51,771
 * of something his cluster has never shown him is the version of this app that
 * gets deleted on the first screen.
 *
 * Its own module, with no database behind it, so the fuel units can share the
 * list: `src/fuel/units` carried a second copy that had drifted to two regions,
 * and the pure fuel tests cannot load `./index` — it opens SQLite at import.
 */
const MILE_REGIONS: Record<string, true> = { US: true, GB: true, MM: true };

export function defaultUnitFor(region: string | null | undefined): DistanceUnit {
  return region && MILE_REGIONS[region.toUpperCase()] ? "mi" : "km";
}
