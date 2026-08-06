import type { Fragment } from "../types";

/**
 * One vehicle: the cluster, what is due, the service history, and the delete.
 *
 * The history row has a key per combination of the facts it can show rather
 * than a separator glued between them in the screen. The middot is punctuation,
 * which a translator has to be able to change, and a row assembled in code
 * cannot be reordered for a language that dates differently.
 */
export const vehicle: Fragment = {
  "vehicle.title": "Vehicle",

  "vehicle.odometer": "Odometer",
  "vehicle.odometer.notSet": "Not set",
  "vehicle.lastService": "Last service",
  "vehicle.lastService.none": "None yet",

  "vehicle.due": "Due now",
  "vehicle.history": "History",
  "vehicle.history.empty": "No service logged yet. Log the last thing you had done.",

  // `{distance}` is formatted and unit-labelled before it gets here.
  "vehicle.over": "{distance} over",
  "vehicle.dueOn": "due {date}",
  "vehicle.dueNow": "due now",
  "vehicle.dueSoon": "due soon",

  "vehicle.badge.overdue": "Overdue",
  "vehicle.badge.soon": "Soon",

  "vehicle.row.dateDistance": "{date} · {distance}",
  "vehicle.row.dateCost": "{date} · {cost}",
  "vehicle.row.dateDistanceCost": "{date} · {distance} · {cost}",

  "vehicle.swipe.delete": "Delete",
  "vehicle.serviceDeleted": "Service deleted",
  "vehicle.undo": "Undo",
  "vehicle.logService": "Log a service",

  "vehicle.deleteVehicle": "Delete vehicle",
  "vehicle.delete.title": "Delete {name}?",
  "vehicle.delete.body":
    "It leaves your garage along with its service history. Records already exported stay in that file.",
  "vehicle.delete.cancel": "Cancel",
  "vehicle.delete.confirm": "Delete",
};
