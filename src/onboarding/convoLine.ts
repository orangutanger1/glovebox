import type { Mood } from "../mascot/mood";
import { getVehicle } from "../db/vehicles";
import { t } from "../i18n";
import { getOnboardingName, getOnboardingVehicleId } from ".";
import type { OnboardingRoute } from "./routes";

/**
 * What the car says at the top of each onboarding screen, in arm A of
 * `app_design`.
 *
 * Opal's onboarding is a conversation: the gem sits at the top of every
 * screen and answers what you just told it ("Hi, Morris."), then asks the next
 * thing. The car does the same. Its line reacts to the previous answer — the
 * name, the car — so the flow reads as someone listening rather than a form
 * being filled in; the question itself stays the screen's title.
 *
 * The mood follows the beat: happy while getting acquainted, a raised eyebrow
 * when it is about to ask for something (notifications, the mileage), worried
 * on the two outside figures and the exit offer, which are the flow's bad
 * news. Copy and look only — no screen's logic or order depends on this.
 */
export type Line = { mood: Mood; say: string | null };

const MOOD: Partial<Record<OnboardingRoute, Mood>> = {
  welcome: "happy",
  name: "happy",
  vehicle: "happy",
  odometer: "heads-up",
  notify: "heads-up",
  drive: "happy",
  service: "happy",
  cost: "worried",
  tracking: "happy",
  worry: "worried",
  source: "happy",
  analyzing: "heads-up",
  compare: "worried",
  reviews: "happy",
  paywall: "happy",
  offer: "worried",
};

export function convoLine(route: OnboardingRoute): Line {
  const mood = MOOD[route] ?? "happy";
  const name = getOnboardingName();
  const vehicleId = getOnboardingVehicleId();
  const car = vehicleId ? (getVehicle(vehicleId)?.name ?? null) : null;
  const key = `redesign.convo.${route}`;
  const vars = { name: name ?? "", car: car ?? "" };
  // Each line exists plain, and where it reads something back, with the thing
  // in it: a resumed flow can be missing the name or the car, and a sentence
  // with a hole in it is worse than the plain one.
  const named = route === "vehicle" || route === "paywall";
  const withCar = route === "odometer" || route === "paywall";
  let variant = key;
  if (named && name && withCar && car) variant = `${key}.both`;
  else if (named && name) variant = `${key}.named`;
  else if (withCar && car) variant = `${key}.car`;
  const say = t(variant, vars);
  // A key with no entry comes back as itself; such a screen just shows the car.
  return { mood, say: say === variant ? null : say };
}
