import { getDb } from "../db/client";
import { getState, setState } from "../db/state";
import { deviceRegion } from "../i18n/device";

export const DISTANCE_UNIT_KEY = "distance_unit";

import { defaultUnitFor, type DistanceUnit } from "./regions";

export { defaultUnitFor, type DistanceUnit } from "./regions";

export const DISTANCE_UNITS: readonly DistanceUnit[] = ["mi", "km"];

/** Exact, by definition: 1 international mile is 1.609344 km. */
export const KM_PER_MILE = 1.609344;

/**
 * The unit every distance in the app is stored and shown in.
 *
 * App-wide rather than per vehicle on purpose: `service_intervals` is keyed by
 * service type alone, so "oil change every 10,000" has exactly one meaning
 * across the garage and there is no honest way to give two cars different ones.
 *
 * The row is written once, at boot, by `initDistanceUnit`: the first launch
 * that finds it missing stores the phone's regional default, and every launch
 * after reads what is stored, so a user who changed it keeps their choice.
 *
 * A missing row *between* those two moments reads as `mi`, not as the region.
 * That case is the fatal-database path and the tests, where nothing has been
 * written, and the pre-setting install: this setting shipped on 2026-08-05,
 * one day after the first store build, so the readings such an install holds
 * were collected as miles and must not be relabelled on the way past.
 */
let cached: DistanceUnit | null = null;

export function getDistanceUnit(): DistanceUnit {
  // Read once, then answer from memory: this is called by every gauge, every
  // history row and every due line, and a SQLite round trip per rendered row is
  // a cost the garage screen pays on every scroll. The only writer is the
  // settings row, and it remounts the tree, so the cache cannot go stale.
  cached ??= getState(DISTANCE_UNIT_KEY) === "km" ? "km" : "mi";
  return cached;
}

export function setDistanceUnit(unit: DistanceUnit): void {
  setState(DISTANCE_UNIT_KEY, unit);
  cached = unit;
}

/** First launch picks a unit from the phone's region; every launch after that
 *  reads what is already stored, so a user who changed it keeps their choice. */
export function initDistanceUnit(): DistanceUnit {
  if (getState(DISTANCE_UNIT_KEY) === null) setDistanceUnit(defaultUnitFor(deviceRegion()));
  return getDistanceUnit();
}

export function convertDistance(value: number, from: DistanceUnit, to: DistanceUnit): number {
  if (from === to) return value;
  return Math.round(from === "mi" ? value * KM_PER_MILE : value / KM_PER_MILE);
}

/**
 * Switches the unit and rewrites every stored distance into it.
 *
 * Relabelling without converting is the tempting cheap version and it is a lie:
 * the 51,771 on the vehicle card would keep its digits and change its meaning,
 * and the oil change due at 56,771 would come due 5,000 kilometres after it
 * should have. So the numbers move. Odometers are whole units in both systems,
 * so each converted value is rounded once, here — an integer converted once and
 * shown forever, rather than a float re-derived at every render.
 *
 * The round trip is not exactly reversible (32,168 mi → 51,771 km → 32,168 mi
 * holds, but a value ending in an odd digit can land a unit off), which is the
 * cost of storing whole numbers and is why the settings row says out loud that
 * the readings are being converted.
 *
 * One transaction: a garage half in miles and half in kilometres, with
 * intervals in the third state, is not a state any screen can render honestly.
 */
export function changeDistanceUnit(to: DistanceUnit): void {
  const from = getDistanceUnit();
  if (from === to) return;

  const db = getDb();
  db.withTransactionSync(() => {
    const factor = to === "km" ? KM_PER_MILE : 1 / KM_PER_MILE;
    db.runSync(
      "UPDATE vehicles SET odometer = CAST(ROUND(odometer * ?) AS INTEGER) WHERE odometer IS NOT NULL",
      [factor]
    );
    db.runSync(
      "UPDATE vehicles SET odometer_dash = CAST(ROUND(odometer_dash * ?) AS INTEGER) WHERE odometer_dash IS NOT NULL",
      [factor]
    );
    db.runSync(
      "UPDATE service_records SET odometer = CAST(ROUND(odometer * ?) AS INTEGER) WHERE odometer IS NOT NULL",
      [factor]
    );
    db.runSync(
      "UPDATE service_intervals SET distance = CAST(ROUND(distance * ?) AS INTEGER) WHERE distance IS NOT NULL",
      [factor]
    );
    // Fills too. They were added after this function was written and were
    // left in the old unit, so a switch put the tank legs in miles under a
    // vehicle reading in kilometres.
    db.runSync("UPDATE fuel_entries SET odometer = CAST(ROUND(odometer * ?) AS INTEGER)", [
      factor,
    ]);
    setDistanceUnit(to);
  });
}
