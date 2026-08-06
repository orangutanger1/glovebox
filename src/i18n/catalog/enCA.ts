import type { Fragment } from "./types";

/**
 * Canadian English (en-CA) as an overlay on `en`.
 *
 * The thinnest overlay in the set, deliberately. Canadian spelling sits on the
 * US side of every word this catalog actually uses ("tire", "check", no -our or
 * -re words in any value) and on the British side of "kilometres", which the
 * English source already spells that way — so nothing here is a spelling fix.
 * What differs is what a Canadian owner is on the hook for:
 *
 * - `service.Inspection`: there is no national or (for passenger cars in most
 *   provinces) provincial periodic roadworthiness test. Nothing falls due by
 *   law, so this cannot be named like a deadline the way MOT or TÜV can. It is
 *   "Safety Inspection" — the pre-sale / out-of-province / peace-of-mind check
 *   an owner books, and the wording an owner already recognises from a safety
 *   standards certificate.
 * - `service.Registration`: the recurring paperwork is the annual plate/sticker
 *   renewal, so it is named as the renewal rather than as registering. "Plate
 *   Renewal" over "Registration Renewal" because it is what owners say ("my
 *   plates are due") and it stays chip-length.
 * - `pain.memory.body`: "a light on at 70" is a US mph cruising speed. On a
 *   km/h cluster 70 is a city arterial; 100 is the highway.
 * - `intervals.intro`: "the climate you drive in" is where a Canadian owner
 *   comes to add the seasonal tire changeover, so it names the winter directly.
 */
export const enCA: Fragment = {
  "intervals.intro":
    "How often each service comes due. Change any of them to match your own car, the manual, the winters you drive through, or how hard you use it.",

  "pain.memory.body":
    "You said you go by memory. Memory holds up right until the question \u201cwhen exactly?\u201d is asked at the counter, at resale, or with a light on at 100.",

  "service.Registration": "Plate Renewal",
  "service.Inspection": "Safety Inspection",
};
