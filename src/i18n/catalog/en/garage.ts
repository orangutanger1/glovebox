import type { Fragment } from "../types";

/**
 * The garage list: one card per vehicle, its worst-status readout, and the two
 * actions underneath.
 *
 * The status label and its detail are two keys rather than one sentence because
 * the card renders them as a legend and a readout in separate lines — they are
 * never read as a sentence, so joining them would only take word order away
 * from the translator.
 */
export const garage: Fragment = {
  "garage.title": "Garage",
  "garage.logService": "Log a service",
  "garage.addVehicle": "Add vehicle",
  "garage.empty": "No vehicles yet. Add one and Wrenchy starts keeping its records.",
  "garage.storeUnreachable": "Could not reach the store. Try again on a better connection.",

  "garage.badge.overdue": "Overdue",
  "garage.badge.dueSoon": "Due soon",

  "garage.odometer": "Odometer",
  "garage.odometer.notSet": "Not set",
  // The same gauge, on a reading the app worked out from the model year rather
  // than one the owner read off the dash. Said in the legend, not next to the
  // number, which is a distance and would read as part of it.
  "garage.odometer.estimated": "Odometer (est.)",

  // `{distance}` arrives already formatted and already carrying the reader's
  // unit, so this message never mentions one.
  "garage.over": "{distance} over",
  "garage.dueNow": "due now",
  "garage.dueSoon": "due soon",
  "garage.onSchedule": "on schedule",

  "garage.noSchedule": "No schedule yet",
  "garage.noSchedule.detail": "logged, not tracked",
  "garage.nothingLogged": "Nothing logged",
  "garage.nothingLogged.detail": "add a service",

  "garage.openHistory": "Open history",
  "garage.openAndLog": "Open and log a service",
};
