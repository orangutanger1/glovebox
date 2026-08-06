import type { Fragment } from "../types";

/**
 * Distances, and nothing else.
 *
 * The value and its unit are one string per unit rather than a shared
 * "{value} {unit}" template, because the join is not universal: French puts a
 * non-breaking space before the unit, Japanese uses none at all, and a template
 * would force every language into the English spacing. The digits arrive already
 * grouped for the language.
 */
export const unit: Fragment = {
  "unit.mi": "{value} mi",
  "unit.km": "{value} km",
  "unit.mi.label": "mi",
  "unit.km.label": "km",
};
