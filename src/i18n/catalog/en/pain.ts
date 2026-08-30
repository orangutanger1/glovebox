import type { Fragment } from "../types";

/**
 * The symptom cards and the answer to each one, keyed by card id.
 *
 * Legend, headline, body and fix are four keys under the same id because the
 * symptoms screen and the screen after it render two halves of one card, and a
 * translator who sees them apart cannot keep the promise matched to the
 * complaint. Bodies and fixes are deliberately one line each. They used to run
 * to a sentence pair, and a user three screens from the paywall does not read
 * the second sentence — the headline is the argument and the line under it is
 * the proof, so anything past that is length the reader pays for and skips.
 * Each value is one whole string; the wrapping is a formatting accident, not a
 * seam a translation can be cut along.
 */
export const pain: Fragment = {
  "pain.overdue.legend": "Past due",
  "pain.overdue.headline": {
    one: "One service is already overdue",
    other: "{count} services are already overdue",
  },
  "pain.overdue.body": "On your {vehicle}, today. The dash warns you after the damage, not before.",
  "pain.overdue.fix": "Counted down by date and by distance, flagged before it goes negative.",

  "pain.blind.legend": "No record",
  "pain.blind.headline": {
    one: "{count} of {total} services has nothing on file",
    other: "{count} of {total} services have nothing on file",
  },
  "pain.blind.body": "Until something says otherwise, every one of them is treated as due.",
  "pain.blind.fix": "Log one and its whole schedule starts. Thirty seconds, once.",

  "pain.memory.legend": "From memory",
  "pain.memory.headline": "The only copy is in your head",
  "pain.memory.body": "Memory holds up right until someone asks “when exactly?” at the counter.",
  "pain.memory.fix": "Written to this phone and kept there. No account to lose it behind.",

  "pain.nothing.legend": "Untracked",
  "pain.nothing.headline": "Nothing about this car is written down",
  "pain.nothing.body": "The car is keeping the only record, and the way it tells you is by failing.",
  "pain.nothing.fix": "One tap logs a service. The history then exists outside the car.",

  "pain.receipts.legend": "In the glovebox",
  "pain.receipts.headline": "A glovebox is not an index",
  "pain.receipts.body": "Receipts prove a service happened. They never say what is due next.",
  "pain.receipts.fix": "The same receipts as dated rows you can sort, search and export.",

  "pain.spreadsheet.legend": "In a spreadsheet",
  "pain.spreadsheet.headline": "A spreadsheet cannot tap you on the shoulder",
  "pain.spreadsheet.body": "It holds the history fine. It just never opens itself to warn you.",
  "pain.spreadsheet.fix": "The same rows, plus a notification the day a service comes due.",

  "pain.dealer.legend": "At the shop",
  "pain.dealer.headline": "The shop\u2019s records are the shop\u2019s",
  "pain.dealer.body": "Complete until you change shops, move or sell, and visible to them, not to you.",
  "pain.dealer.fix": "Your own copy, on your own phone, exportable whenever you want it.",

  "pain.bills.legend": "The bill",
  "pain.bills.headline": "Deferred maintenance is not saved money",
  "pain.bills.body": "It is the same money later, with a tow in front of it.",
  "pain.bills.fix": "Every interval counted down, so the cheap job stays cheap.",

  "pain.missed.legend": "The miss",
  "pain.missed.headline": "Nothing reminds you until it is late",
  "pain.missed.body": "Nothing is missed on purpose. It is missed on an ordinary Tuesday.",
  "pain.missed.fix": "One notification per service, on the day it comes due. Nothing else.",

  "pain.records.legend": "The proof",
  "pain.records.headline": "Unproven service is unperformed service",
  "pain.records.body": "A warranty claim, a resale, an argument with a shop: each asks for the record.",
  "pain.records.fix": "A dated log, exportable as CSV. Free forever, for everyone.",

  "pain.resale.legend": "Resale",
  "pain.resale.headline": "A full history is worth more than a clean one",
  "pain.resale.body": "The buyer discounts what you cannot show them. So does the dealer.",
  "pain.resale.fix": "Export the whole history and hand it over. Nothing locked behind Pro.",

  "pain.upsell.legend": "The counter",
  "pain.upsell.headline": "They know your history. You do not.",
  "pain.upsell.body": "Not a question to be guessing at while somebody quotes you for one.",
  "pain.upsell.fix": "The date and the odometer reading, pulled up at the counter in two taps.",

  // Stands in for a car whose row has been deleted, and lands mid-sentence in
  // "On your {vehicle}, today" — so it is a common noun, not a product name.
  "pain.vehicleFallback": "car",
};
