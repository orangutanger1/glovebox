import type { Fragment } from "./types";

/**
 * Australian English (en-AU), an overlay on `en`: only the keys an Australian
 * owner would read as somebody else's car.
 *
 * `service.Inspection` is **Roadworthy**. The legal check is state law, so it has
 * five names — NSW pink slip (officially an eSafety check), QLD safety
 * certificate, VIC/SA/WA/TAS roadworthy certificate — and only one of them reads
 * nationally: every Australian, in every state, says a car "needs a roadworthy".
 * A NSW-only "Pink Slip" would be noise in Melbourne. `service.Registration` is
 * **Rego**, the word on the renewal notice in speech everywhere.
 *
 * Periodic servicing here is a **log book service**, and the intervals come out
 * of the log book rather than out of "the manual" — so the two places English
 * cites the manual as the authority that overrides a default cite the log book.
 * "Shop" is American for a garage: an Australian takes the car to a workshop or
 * to their mechanic, and is handed a quote, not an estimate.
 *
 * The odometer reads in kilometres, so the one line of English copy that assumed
 * miles — a warning light coming on "at 70" — reads at 110, the open-road limit.
 * The `.mi`/`.km` keys themselves are already per-unit and are left alone.
 */
export const enAU: Fragment = {
  // Australians read their service schedule out of the log book; "the manual" is
  // the owner's handbook, which is not where the intervals are stamped.
  "features.intervals.subtitle": "Override any of them when the log book disagrees with the defaults.",
  "intervals.intro":
    "How often each service comes due. Change any of them to match your own car, the log book, the climate you drive in, or how hard you use it.",

  // A car sits in a garage here; it gets fixed at a workshop, by a mechanic —
  // and this app already calls the vehicle list the Garage.
  "language.intro":
    "Wrenchy follows your phone unless you pick a language here. Service names use the words mechanics use in that language.",

  // A workshop, or your mechanic — never a "shop".
  "onboardingB.tracking.dealer": "My mechanic keeps it",
  "pain.dealer.legend": "At the workshop",
  "pain.dealer.headline": "The workshop\u2019s records are the workshop\u2019s",
  "pain.dealer.body":
    "Complete right up until you change workshops, move, or sell the car, and visible to the person writing your quote rather than to you.",
  "pain.records.body":
    "A warranty claim, a resale, an argument with a workshop: every one of them asks for the record, not for your recollection of it.",

  // 70 mph is an American motorway. 110 km/h is the open-road limit here.
  "pain.memory.body":
    "You said you go by memory. Memory holds up right until the question \u201cwhen exactly?\u201d is asked at the counter, at resale, or with a light on at 110.",

  // "In trade" is American dealer-speak; here a car is taken as a trade-in.
  "pain.resale.body":
    "The buyer discounts what you cannot show them, and so does the dealer taking it as a trade-in.",

  "service.Tire Rotation": "Tyre Rotation",
  "service.Registration": "Rego",
  "service.Inspection": "Roadworthy",
};
