import type { Fragment } from "../types";

/**
 * The copy that is not on a screen: notifications iOS renders while the app is
 * closed, the CSV export's header row, the home-screen long-press menu, and the
 * name a vehicle falls back to when its parts are all blank.
 *
 * The CSV cells stay machine-readable — service types are identifiers, dates are
 * ISO, numbers are unformatted — because a spreadsheet built against last
 * month's export must still open this month's. Only the header row is
 * translated, which is the half a person actually reads.
 */
export const system: Fragment = {
  "system.notify.title": "Your {vehicle}\u2019s {service} is due",
  "system.notify.body": "Last done {date}.",

  "system.notify.when.today": "Today",
  "system.notify.when.tomorrow": "Tomorrow",
  "system.notify.when.now": "now",
  "system.notify.when.days": {
    one: "In {count} day",
    other: "In {count} days",
  },
  "system.notify.when.months": {
    one: "In {count} month",
    other: "In {count} months",
  },

  "system.csv.header.vehicle": "Vehicle",
  "system.csv.header.service": "Service",
  "system.csv.header.date": "Date",
  "system.csv.header.odometer": "Odometer ({unit})",
  "system.csv.header.cost": "Cost",
  "system.csv.header.notes": "Notes",
  "system.csv.header.deleted": "Deleted",
  "system.csv.cell.deleted": "deleted",

  "system.quickaction.trial.title": "Try Pro free",
  "system.quickaction.trial.subtitle": {
    one: "{count} day, then it renews unless you cancel",
    other: "{count} days, then it renews unless you cancel",
  },
  "system.quickaction.feedback.title": "Send feedback",
  "system.quickaction.feedback.subtitle": "Tell us what went wrong",

  "system.vehicle.fallback": "My car",
};
