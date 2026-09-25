import type { Fragment } from "../types";

/**
 * The monthly odometer check-in: its notification and its one-field screen.
 *
 * "Odometer", never "mileage": the same copy has to read right to a driver
 * whose dash counts kilometres, and the unit itself only ever arrives as
 * `{unit}`.
 */
export const checkin: Fragment = {
  "checkin.title": "Odometer check",
  "checkin.notify.title": "Time for an odometer check",
  "checkin.notify.title.named": "{name}, time for an odometer check",
  "checkin.notify.body": "{vehicle} · What does the odometer say? One number keeps your reminders on time.",
  "checkin.last": "Last reading, {date}",
  "checkin.field": "Odometer today ({unit})",
  "checkin.why": "Distance-based services, like oil changes, are worked out from this number.",
  "checkin.save": "Save reading",
  "checkin.same": "Hasn't changed",
  "checkin.lower":
    "That's below the last reading ({reading} {unit}). If that one was wrong, tap the car's name to fix it.",
  "checkin.gone": "This car is no longer in your garage.",
  "checkin.update": "Update odometer",
};
