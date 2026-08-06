import type { Fragment } from "../types";

/**
 * The service types, keyed by the English identifier the database stores.
 *
 * `service.Inspection` is the most important string in the app's localization
 * and the least literal. It is not "inspection" anywhere: a British owner books
 * an MOT, a German a TÜV, a Frenchman a contrôle technique, a Japanese owner
 * 車検. The cadence behind it is regional too and lives in `INSPECTION_MONTHS`
 * in src/schedule. Translating this key as the dictionary word for "inspection"
 * would produce a reminder no owner recognises as the thing the law makes them
 * do — which is the single strongest reason this app gets opened twice a year.
 *
 * `service.Registration` has the same shape: road tax in the UK, Kfz-Steuer in
 * Germany, vignette in Switzerland. Translators are told to name the local
 * document, not the American one.
 */
export const service: Fragment = {
  "service.Oil Change": "Oil Change",
  "service.Tire Rotation": "Tire Rotation",
  "service.Brake Inspection": "Brake Inspection",
  "service.Air Filter": "Air Filter",
  "service.Cabin Air Filter": "Cabin Air Filter",
  "service.Wiper Blades": "Wiper Blades",
  "service.Battery Check": "Battery Check",
  "service.Coolant Flush": "Coolant Flush",
  "service.Transmission Fluid": "Transmission Fluid",
  "service.Spark Plugs": "Spark Plugs",
  "service.Registration": "Registration",
  "service.Inspection": "Inspection",
  "service.Other": "Other",
};
