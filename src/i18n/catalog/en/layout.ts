import type { Fragment } from "../types";

/**
 * The root stack: the accessibility titles behind each route, and the one screen
 * that appears when the database will not open.
 *
 * The fatal screen is the reason this fragment cannot wait for the database. It
 * renders before `getDb()` has succeeded, so the language behind these five
 * strings is the phone's, not the stored preference — a user whose records will
 * not open should at least be told so in their own language.
 */
export const layout: Fragment = {
  "layout.garage": "Garage",
  "layout.settings": "Settings",
  "layout.intervals": "Service intervals",
  "layout.addVehicle": "Add vehicle",
  "layout.vehicle": "Vehicle",
  "layout.logService": "Log a service",
  "layout.fatal.retry": "Try again",
  "layout.fatal.title": "Wrenchy could not open your records.",
  "layout.fatal.body":
    "Nothing was deleted, and the database was restored to its last good state. Reopen the app. If this keeps happening, contact support before reinstalling, because reinstalling is what would actually lose the records.",
};
