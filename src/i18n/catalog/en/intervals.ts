import type { Fragment } from "../types";

/**
 * The service interval editor, the second half of Pro.
 *
 * A schedule reads as one sentence per shape it can take — months, a distance,
 * or both — because the separator between the two halves and the order they
 * come in are the translator's call, and the distance arrives already formatted
 * in the unit the user chose.
 */
export const intervals: Fragment = {
  "intervals.title": "Service intervals",
  "intervals.intro":
    "How often each service comes due. Change any of them to match your own car, the manual, the climate you drive in, or how hard you use it.",
  "intervals.custom": "CUSTOM",

  "intervals.untracked": "not tracked",
  "intervals.months": { one: "{count} month", other: "{count} months" },
  "intervals.monthsAndDistance": {
    one: "{count} month · {distance}",
    other: "{count} months · {distance}",
  },

  "intervals.help":
    "Due whichever comes first. Leave a box empty to ignore it, so distance only or months only is a valid schedule. Clear both to go back to the default ({default}).",
  "intervals.field.months": "Every (months)",
  "intervals.field.distance": "Every ({unit})",
  "intervals.error.positive": "Use whole numbers above zero, or leave a box empty to ignore it.",
  "intervals.save": "Save interval",
  "intervals.cancel": "Cancel",
};
