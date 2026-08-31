import { useMemo } from "react";
import { t } from "../i18n";
import { vehicleSentenceName } from "../format";
import { getDistanceUnit } from "../units";
import { getVehicle, type Vehicle } from "../db/vehicles";
import { listRecords } from "../db/records";
import { getIntervals } from "../db/intervals";
import { getAnswers, getOnboardingVehicleId } from ".";
import { buildPlan, type Plan } from "./plan";
import { painCards, type PainCard } from "./pain";
import type { Answers } from "./state";

export type OnboardingFindings = {
  vehicle: Vehicle | null;
  /** Always a usable noun. A plain word for a car when the row is gone, so
   *  copy never reads "On your null, today." */
  vehicleName: string;
  /** The same car, named the way a sentence with "your" in front of it needs.
   *  See `vehicleSentenceName`: "Your My car" is the bug this exists for. */
  vehiclePhrase: string;
  plan: Plan;
  answers: Answers;
  cards: PainCard[];
};

/**
 * Everything the back half of onboarding renders, computed once per mount.
 *
 * Six screens in a row are views of the same three numbers, and they have to
 * agree: the results screen cannot say two services are due and the plan
 * screen list three. Reading and computing in one place also means the
 * expensive-looking part — twelve intervals against the record list — happens
 * once per screen rather than once per render.
 *
 * Every path into these screens has created a vehicle, but a resumed step is
 * persisted state and the car it names can have been deleted since. A null
 * vehicle produces an empty, honest plan rather than a crash on the screens
 * whose whole job is reassurance.
 */
export function readFindings(): OnboardingFindings {
  const ownedId = getOnboardingVehicleId();
  const vehicle = ownedId ? getVehicle(ownedId) : null;
  const vehicleName = vehicle?.name ?? t("pain.vehicleFallback");
  const vehiclePhrase = vehicleSentenceName(vehicleName);
  const answers = getAnswers();
  const plan = buildPlan({
    odometer: vehicle?.odometer,
    records: vehicle ? listRecords(vehicle.id) : [],
    intervals: getIntervals(),
    answers,
    unit: getDistanceUnit(),
  });
  return {
    vehicle,
    vehicleName,
    vehiclePhrase,
    plan,
    answers,
    cards: painCards({ plan, answers, vehicleName: vehiclePhrase }),
  };
}

/** Memoised per mount. Six screens read this and none of them re-read on a
 *  render; the underlying rows cannot change while the flow is on screen. */
export function useOnboardingFindings(): OnboardingFindings {
  return useMemo(readFindings, []);
}
