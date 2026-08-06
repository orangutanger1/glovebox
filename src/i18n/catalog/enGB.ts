import type { Fragment } from "./types";

/**
 * British English (en-GB), an overlay over `en` — only the keys a UK owner would
 * read as somebody else's English.
 *
 * Three decisions a reviewer would otherwise question:
 *
 * `service.Inspection` is **MOT**. Nobody in the UK books an "inspection"; the
 * test has a name, and that name is what the reminder has to say.
 *
 * `service.Registration` is **Road Tax**, not "Vehicle Tax". GOV.UK has called
 * it vehicle tax (Vehicle Excise Duty) for years and the paper disc is gone, but
 * every owner still says, searches and reminds themselves about road tax. This
 * is a reminder list, not a government form, so the recognisable name wins.
 *
 * "Garage" is the split that costs the most keys. In the UK a garage is where
 * you park or where the car gets serviced — never your own collection of cars —
 * so the US sense is renamed to **my cars** (`garage.title`, `layout.garage`,
 * and every sentence that pointed at that screen by name), and the workshop
 * sense is given the word back where American English said "shop"
 * (`pain.dealer.*`, `onboardingB.tracking.dealer`). Keeping both senses would
 * have left the nav label and the prose describing it out of step.
 *
 * The UK reads miles, so `unit.*`, every `.mi` value and every number are left
 * exactly as the base language has them.
 */
export const enGB: Fragment = {
  // Spelling.
  "service.Tire Rotation": "Tyre Rotation",

  // The legal test and the recurring paperwork, by their UK names.
  "service.Registration": "Road Tax",
  "service.Inspection": "MOT",

  // "Garage" as the user's own cars: renamed, and with it every sentence that
  // referred to that screen.
  "garage.title": "My cars",
  "layout.garage": "My cars",
  "vehicle.delete.body":
    "It leaves your list of cars along with its service history. Records already exported stay in that file.",
  "features.garage.subtitle": "Every car you own, each with its own schedule.",
  "offer.paywall.title": "Your car is set up.",
  "offer.paywall.subtitle":
    "The plan below is yours either way, and Pro is room for the rest of your cars plus your own intervals.",
  "offer.free.caption":
    "One car, no account, no ads and no trial running in the background. Pro adds room for the rest of your cars and your own intervals whenever you want it, from Settings.",
  "offer.winback.decline": "Just take me to my cars",

  // "Garage" as the workshop, which is where American English said "shop". A UK
  // garage writes you a quote, not an estimate.
  "onboardingB.tracking.dealer": "My garage keeps it",
  "pain.dealer.legend": "At the garage",
  "pain.dealer.headline": "The garage\u2019s records are the garage\u2019s",
  "pain.dealer.body":
    "Complete right up until you change garages, move, or sell the car, and visible to the person writing your quote rather than to you.",
  "pain.records.body":
    "A warranty claim, a resale, an argument with a garage: every one of them asks for the record, not for your recollection of it.",

  // A car is serviced and the visit is a service, so that is the noun a headline
  // about skipping one should use; "deferred maintenance" is US finance
  // vocabulary. A car taken in against another is part-exchanged.
  "pain.bills.headline": "A skipped service is not saved money",
  "pain.resale.body":
    "The buyer discounts what you cannot show them, and so does the dealer taking it in part-exchange. The car is only worth what you can prove about it.",
};
