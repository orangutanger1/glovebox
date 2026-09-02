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

  // Volume and efficiency, under the same rule and for the same reason. The
  // abbreviations themselves are not translated: "mpg" and "L/100km" are what a
  // driver reads on a pump and in a spec sheet in every one of these markets.
  "unit.gal": "{value} gal",
  "unit.litre": "{value} L",
  "unit.gal.label": "gal",
  "unit.litre.label": "L",
  "unit.mpg": "{value} mpg",
  "unit.l100km": "{value} L/100km",
  "unit.mpg.label": "mpg",
  "unit.l100km.label": "L/100km",
};
