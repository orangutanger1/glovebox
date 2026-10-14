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
  "onboardingC.cost.tireRotations": "Behind on tyre rotations",

  // The legal test and the recurring paperwork, by their UK names.
  "service.Registration": "Road Tax",
  "service.Inspection": "MOT",

  "vehicle.body.wagon": "Estate",

  // "Garage" as the user's own cars: renamed, and with it every sentence that
  // referred to that screen.
  "garage.title": "My cars",
  "layout.garage": "My cars",
  "redesign.tab.garage": "My cars",
  "vehicle.delete.body":
    "It leaves your list of cars along with its service history. Records already exported stay in that file.",
  "features.garage.subtitle": "Every car, van and lorry you own, tracked in one place.",
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
  // The glovebox, in this market's words.
  "documents.kind.registration": "V5C logbook",
  "documents.kind.inspection": "MOT certificate",
  "documents.kind.license": "Driving licence",
  "documents.empty": "Insurance, V5C, MOT and more, with a reminder before they expire.",

  // explain
  "explain.difficulty.shop": "Garage job",
  "explain.Oil Change.diy": "Doable with a jack, a drain pan and a filter wrench. Most people use a garage, which takes about half an hour.",
  "explain.Tire Rotation.what": "Moving each tyre to a different corner of the car so they all wear evenly.",
  "explain.Tire Rotation.why": "The front tyres wear faster. Rotating them makes a set last noticeably longer and keeps the grip even.",
  "explain.Tire Rotation.diy": "Possible with axle stands, but most tyre centres do it quickly, often free if you bought the tyres there.",
  "explain.Brake Inspection.diy": "Leave it to a garage unless you've done brakes before.",
  "explain.Air Filter.diy": "Usually a few clips and no tools, about five minutes. Garages often charge a lot for it.",
  "explain.Wiper Blades.what": "The rubber blades that clear the windscreen.",
  "explain.Wiper Blades.diy": "They clip on. Many motor factors and car parts shops fit them for free.",
  "explain.Battery Check.diy": "Many garages and car parts shops test batteries for free in a few minutes.",
  "explain.Coolant Flush.diy": "Leave it to a garage. Never open the radiator cap on a hot engine.",
  "explain.Transmission Fluid.what": "The oil that lubricates and cools the gearbox.",
  "explain.Transmission Fluid.diy": "A garage job. Some cars say the fluid is “lifetime”. Your manual says whether yours really is.",
  "explain.Registration.what": "Vehicle tax (VED), paid every year or by monthly Direct Debit.",
  "explain.Registration.why": "An untaxed car can be clamped or impounded and earns an automatic fine, even parked on the road.",
  "explain.Registration.diy": "Done on GOV.UK in a few minutes with the reference from your V5C. Save the confirmation in your glovebox documents.",
  "explain.Inspection.what": "The MOT: the yearly test of safety and emissions every car needs from its third year.",
  "explain.Inspection.why": "Driving without a valid MOT can mean a fine of up to £1,000, and it can void your insurance.",
  "explain.Inspection.diy": "Done at an MOT test centre. Fix any warning lights first, since many of them are an automatic fail.",
};
