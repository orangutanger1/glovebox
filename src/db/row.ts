/**
 * Normalising a SQLite row into the shape its TypeScript type claims.
 *
 * Every row type in this app declares its nullable columns optional
 * (`odometer?: number`), and the driver returns `null` for an empty one. The
 * cast at the query site made the two look identical and they are not:
 * `vehicle.odometer === undefined` is false on a NULL, so a car with no
 * reading rendered the literal string "null" into the onboarding field and
 * threw on `plan.odometer.toLocaleString()` one screen later.
 *
 * Reads normalise once, here, rather than every consumer remembering to write
 * `== null`. Mutating in place is deliberate: these objects were just built by
 * the driver for this caller, and a list of a few hundred records has no
 * reason to be copied to delete a key.
 */
export function row<T extends object>(value: T | null | undefined): T | null {
  if (!value) return null;
  for (const key of Object.keys(value)) {
    if ((value as Record<string, unknown>)[key] === null) {
      delete (value as Record<string, unknown>)[key];
    }
  }
  return value;
}

export function rows<T extends object>(values: T[]): T[] {
  for (const value of values) row(value);
  return values;
}
