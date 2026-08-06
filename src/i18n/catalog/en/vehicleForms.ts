import type { Fragment } from "../types";

/**
 * The two forms a user types into: adding a vehicle and logging a service.
 *
 * Both odometer labels carry the unit as a placeholder rather than spelling it
 * out, because the label is read against a gauge the user set to miles or
 * kilometres and the word for the reading ("mileage") is only true in one of
 * them. The example numbers behind the placeholders are copy, not conversions:
 * a metric driver's odometer plausibly reads 80000, never 50000.
 */
export const vehicleForms: Fragment = {
  "vehicleForms.new.title": "Add vehicle",
  "vehicleForms.new.save": "Save",
  "vehicleForms.new.name": "Name",
  "vehicleForms.new.namePlaceholder": "2019 Civic",
  "vehicleForms.new.odometer": "Current odometer ({unit})",
  "vehicleForms.new.odometerPlaceholder.mi": "50000",
  "vehicleForms.new.odometerPlaceholder.km": "80000",

  "vehicleForms.log.title": "Log a service",
  "vehicleForms.log.save": "Save",
  "vehicleForms.log.error": "Could not save. Your entry is still here. Try again.",
  "vehicleForms.log.what": "What",
  "vehicleForms.log.when": "When",
  "vehicleForms.log.today": "Today",
  "vehicleForms.log.yesterday": "Yesterday",
  "vehicleForms.log.otherDate": "Other date",
  "vehicleForms.log.odometer": "Odometer ({unit})",
  "vehicleForms.log.cost": "Cost (optional)",
  "vehicleForms.log.notes": "Notes (optional)",
};
