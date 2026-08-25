import type { DistanceUnit } from "../units";

/**
 * A reading for the user who does not want to go and look at the dash.
 *
 * The odometer question was a hard-required text field two screens into the
 * flow, and the honest answer to "how many miles on it?" is often "I am on a
 * bus, I will check later". The screen now offers to work it out, and this is
 * the arithmetic: how far an average car of that model year has been driven.
 *
 * 13,500 a year is the US average annual distance per vehicle. It is a
 * deliberately separate number from `UNSTATED_DISTANCE_PER_YEAR` in `plan.ts`,
 * which is the rate the plan projects *future* distance at when the drive
 * question was never reached. This one is a lifetime average applied backwards
 * over the age of the car; that one is next year's mileage for a user we know
 * nothing about, and it is set low on purpose so a projected due date arrives
 * later rather than sooner. Two different jobs, two numbers.
 *
 * The metric figure is the same distance, rounded to a number a European driver
 * recognises rather than a conversion of an American one.
 */
export const AVERAGE_DISTANCE_PER_YEAR: Record<DistanceUnit, number> = { mi: 13500, km: 21700 };

/** Estimates are rounded to this, so the readout cannot be mistaken for a
 *  reading. "112,500" is obviously somebody's arithmetic; "112,483" is a lie. */
const ROUND_TO = 500;

/**
 * What a car of this model year has probably covered, at the given rate.
 *
 * `undefined` when there is no model year to count from: the estimate is age
 * times a rate, and without an age there is nothing to multiply. Every path
 * into this asks for the year first, so that case is a deleted row rather than
 * a user, and an absent reading is something every screen downstream already
 * handles.
 *
 * A model year ahead of the calendar is a new car, not a negative age: cars are
 * sold as next year's model most of the year, and a 2027 bought today has
 * covered approximately nothing.
 */
export function estimateOdometer(
  year: number | undefined,
  distancePerYear: number,
  now: Date = new Date()
): number | undefined {
  if (year === undefined) return undefined;
  const age = Math.max(0, now.getFullYear() - year);
  return Math.round((age * distancePerYear) / ROUND_TO) * ROUND_TO;
}
