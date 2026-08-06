import { getState, setState } from "../db/state";
import { LANGUAGES, initLanguage, type Language } from "./index";

export const LANGUAGE_KEY = "app_language";

/**
 * The language the user picked, or null for "follow the phone".
 *
 * iOS offers a per-app language switch in Settings, so this row is not the only
 * way to change it — but the OS switch only lists the languages the bundle
 * declares (`CFBundleLocalizations` in app.json), and it sends the user out of
 * the app to find it. An owner who reads English in a German household, or who
 * wants to check what the app says in Polish before recommending it, gets to do
 * that here.
 *
 * An unrecognised stored value reads as null rather than being trusted: the row
 * outlives the release that wrote it, and a language we have since dropped must
 * degrade to the phone's choice instead of to the key `garage.title`.
 */
export function getLanguagePreference(): Language | null {
  const stored = getState(LANGUAGE_KEY);
  return LANGUAGES.find((l) => l === stored) ?? null;
}

export function setLanguagePreference(language: Language | "system"): void {
  setState(LANGUAGE_KEY, language);
}

/** Boot: the stored choice if there is one, otherwise whatever the phone asks
 *  for. Called once, before the first screen renders. */
export function bootLanguage(): Language {
  return initLanguage(getLanguagePreference());
}
