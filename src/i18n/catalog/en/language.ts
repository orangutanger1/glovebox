import type { Fragment } from "../types";

/**
 * The language picker.
 *
 * The intro sentence makes a promise the rest of the app has to keep: picking a
 * language does not merely translate the labels, it changes which words the
 * service names use — an MOT in the UK, a TÜV in Germany, 車検 in Japan.
 */
export const language: Fragment = {
  "language.title": "Language",
  "language.intro":
    "Wrenchy follows your phone unless you pick a language here. Service names use the words garages use in that language.",
  "language.system": "System",
};
