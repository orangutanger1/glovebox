import type { Entry, Fragment } from "../types";
import { evidence } from "./evidence";
import { features } from "./features";
import { fuel } from "./fuel";
import { garage } from "./garage";
import { insights } from "./insights";
import { intervals } from "./intervals";
import { language } from "./language";
import { layout } from "./layout";
import { offer } from "./offer";
import { onboardingA } from "./onboardingA";
import { onboardingB } from "./onboardingB";
import { onboardingC } from "./onboardingC";
import { pain } from "./pain";
import { plan } from "./plan";
import { service } from "./service";
import { settings } from "./settings";
import { subscribed } from "./subscribed";
import { system } from "./system";
import { unit } from "./unit";
import { vehicle } from "./vehicle";
import { vehicleForms } from "./vehicleForms";

/**
 * The English catalog: every string the app can put on the glass, assembled from
 * one fragment per screen or module.
 *
 * English is both a shipped language and the floor under every other one — `t`
 * falls back to this object key by key, so a translation that arrives late shows
 * an English sentence rather than a raw key. That makes this file the definition
 * of "complete": a language is finished when its key set equals this one, which
 * `tests/i18n.test.ts` checks rather than trusting a reviewer to count 380 keys.
 *
 * Fragments are spread in one flat namespace on purpose. Two fragments claiming
 * the same key would silently overwrite each other here, so the same test asserts
 * that the sum of the fragment sizes equals the size of the merge.
 */
export const FRAGMENTS: Record<string, Fragment> = {
  evidence,
  features,
  fuel,
  garage,
  insights,
  intervals,
  language,
  layout,
  offer,
  onboardingA,
  onboardingB,
  onboardingC,
  pain,
  plan,
  service,
  settings,
  subscribed,
  system,
  unit,
  vehicle,
  vehicleForms,
};

export const en: Record<string, Entry> = Object.assign({}, ...Object.values(FRAGMENTS)) as Record<
  string,
  Entry
>;
