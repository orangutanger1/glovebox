import type { Fragment } from "../types";

/**
 * The symptom cards and the answer to each one, keyed by card id.
 *
 * Legend, headline, body and fix are four keys under the same id because the
 * symptoms screen and the screen after it render two halves of one card, and a
 * translator who sees them apart cannot keep the promise matched to the
 * complaint. Every body is one whole sentence pair in one value: the source
 * wrapped them across two lines, which is a formatting accident, not a seam a
 * translation can be cut along.
 */
export const pain: Fragment = {
  "pain.overdue.legend": "Past due",
  "pain.overdue.headline": {
    one: "One service is already overdue",
    other: "{count} services are already overdue",
  },
  "pain.overdue.body":
    "On your {vehicle}, today. Nothing on the dashboard is going to mention it, because the light comes on after the damage rather than before it.",
  "pain.overdue.fix":
    "Every service counted down by date and by distance, and flagged before the number goes negative.",

  "pain.blind.legend": "No record",
  "pain.blind.headline": {
    one: "{count} of {total} services has nothing on file",
    other: "{count} of {total} services have nothing on file",
  },
  "pain.blind.body":
    "Wrenchy cannot prove what it has never seen, and neither can you. Until something says otherwise, every one of them is treated as due.",
  "pain.blind.fix": "Log one and its whole schedule starts. Thirty seconds each, once.",

  "pain.memory.legend": "From memory",
  "pain.memory.headline": "The only copy is in your head",
  "pain.memory.body":
    "You said you go by memory. Memory holds up right until the question \u201cwhen exactly?\u201d is asked at the counter, at resale, or with a light on at 70.",
  "pain.memory.fix":
    "Every service you log is written to this phone and stays there. No account to lose it behind.",

  "pain.nothing.legend": "Untracked",
  "pain.nothing.headline": "Nothing about this car is written down",
  "pain.nothing.body":
    "Not the last oil change, not the odometer reading it happened at. The car is keeping the only record, and the way it tells you is by failing.",
  "pain.nothing.fix":
    "One tap logs a service. From then on the history exists somewhere other than the car.",

  "pain.receipts.legend": "In the glovebox",
  "pain.receipts.headline": "A glovebox is not an index",
  "pain.receipts.body":
    "Receipts prove a service happened. They do not tell you what is due next, they are not in any order, and thermal paper fades to blank.",
  "pain.receipts.fix": "The same receipts as dated rows you can sort, search, and export as CSV.",

  "pain.spreadsheet.legend": "In a spreadsheet",
  "pain.spreadsheet.headline": "A spreadsheet cannot tap you on the shoulder",
  "pain.spreadsheet.body":
    "It holds the history fine. It just never opens itself, and the one thing you need from it is a warning you did not think to go looking for.",
  "pain.spreadsheet.fix": "The same rows, plus one notification on the day a service comes due.",

  "pain.dealer.legend": "At the shop",
  "pain.dealer.headline": "The shop\u2019s records are the shop\u2019s",
  "pain.dealer.body":
    "Complete right up until you change shops, move, or sell the car, and visible to the person writing your estimate rather than to you.",
  "pain.dealer.fix": "Your own copy, on your own phone, exportable whenever you want it.",

  "pain.bills.legend": "The bill",
  "pain.bills.headline": "Deferred maintenance is not saved money",
  "pain.bills.body":
    "It is the same money later, with a tow in front of it. The jobs that fail expensively are the cheap ones nobody was counting.",
  "pain.bills.fix": "Every interval counted down, so the cheap job stays a cheap job.",

  "pain.missed.legend": "The miss",
  "pain.missed.headline": "Nothing reminds you until it is late",
  "pain.missed.body":
    "A service is never missed on purpose. It is missed on an ordinary Tuesday, and then again the week after, and the odometer keeps going.",
  "pain.missed.fix": "One notification per service, on the day it comes due. Nothing else, ever.",

  "pain.records.legend": "The proof",
  "pain.records.headline": "Unproven service is unperformed service",
  "pain.records.body":
    "A warranty claim, a resale, an argument with a shop: every one of them asks for the record, not for your recollection of it.",
  "pain.records.fix":
    "A dated log you can export as CSV. Free forever, for everyone, subscriber or not.",

  "pain.resale.legend": "Resale",
  "pain.resale.headline": "A full history is worth more than a clean one",
  "pain.resale.body":
    "The buyer discounts what you cannot show them, and so does the dealer taking it in trade. The car is only worth what you can prove about it.",
  "pain.resale.fix":
    "Export the whole history to CSV and hand it over. None of it is locked behind the subscription.",

  "pain.upsell.legend": "The counter",
  "pain.upsell.headline": "They know your history. You do not.",
  "pain.upsell.body":
    "\u201cWhen was your last brake service?\u201d is not a question to be guessing at while somebody quotes you for one.",
  "pain.upsell.fix": "The date and the odometer reading, pulled up at the counter in two taps.",

  // Stands in for a car whose row has been deleted, and lands mid-sentence in
  // "On your {vehicle}, today" — so it is a common noun, not a product name.
  "pain.vehicleFallback": "car",
};
