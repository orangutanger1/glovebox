import { useMemo, useState } from "react";
import { Text } from "react-native";
import { Button } from "../../src/design/Button";
import { ChipRow } from "../../src/design/ChipRow";
import { tokens } from "../../src/design/tokens";
import { getVehicle, setOdometerEstimate } from "../../src/db/vehicles";
import { getAnswers, getOnboardingVehicleId, setAnswers } from "../../src/onboarding";
import { DISTANCE_PER_YEAR } from "../../src/onboarding/plan";
import { estimateOdometer } from "../../src/onboarding/estimate";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useAdvance } from "../../src/onboarding/nav";
import { trackQuizAnswer } from "../../src/analytics";
import type { DriveAnswer } from "../../src/onboarding/state";
import { t } from "../../src/i18n";
import { getDistanceUnit } from "../../src/units";
import { distanceUnitLabel, formatDistance } from "../../src/units/format";

/** Ranges, not a slider. Nobody knows their annual mileage to the mile, and a
 *  slider would ask them to pretend they do. */
const OPTIONS: readonly DriveAnswer[] = ["low", "average", "high", "very_high"];

export default function OnboardingDrive() {
  const advance = useAdvance("drive");
  // Persisted, so Back and Continue show the answer already given rather than
  // an unselected row of chips.
  const [drive, setDrive] = useState<DriveAnswer | null>(() => getAnswers().drive ?? null);
  // The ranges a metric driver is offered are round metric numbers rather than
  // converted ones, so the label comes from the unit and not from a conversion.
  const unit = getDistanceUnit();
  const options = useMemo(
    () => OPTIONS.map((value) => ({ value, label: t(`onboardingA.drive.${value}.${unit}`) })),
    [unit]
  );

  const vehicle = useMemo(() => {
    const ownedId = getOnboardingVehicleId();
    return ownedId ? getVehicle(ownedId) : null;
  }, []);
  const odometer = vehicle?.odometer;

  function onContinue() {
    if (!drive) return;
    setAnswers({ drive });
    // The previous question may have estimated the reading from the model year
    // and the national average. This is the answer that average was standing in
    // for, so the estimate is recomputed at the rate the user just gave: the
    // arithmetic is two multiplications and it is the difference between "an
    // average car of this age" and "a car of this age driven the way you drive".
    // Only an estimate is touched. A reading the user typed is theirs.
    if (vehicle?.odometer_estimated) {
      const refined = estimateOdometer(vehicle.year, DISTANCE_PER_YEAR[unit][drive]);
      if (refined !== undefined) setOdometerEstimate(vehicle.id, refined);
    }
    trackQuizAnswer("drive", { drive });
    advance();
  }

  return (
    <OnboardingScreen
      route="drive"
      title={t("onboardingA.drive.title")}
      subtitle={t("onboardingA.drive.subtitle")}
      footer={<Button label={t("onboardingA.continue")} onPress={onContinue} disabled={!drive} />}
    >
      <ChipRow
        legend={t("onboardingA.drive.legend", { unit: distanceUnitLabel(unit) })}
        options={options}
        selected={drive ? [drive] : []}
        onPress={setDrive}
      />

      {/* The answer is shown doing its job immediately. A projection the user
          can check against their own sense of the car is also the cheapest
          possible proof that the questions are not decorative. */}
      <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
        {drive && odometer !== undefined
          ? t("onboardingA.drive.projection", {
              distance: formatDistance(odometer + DISTANCE_PER_YEAR[unit][drive], unit),
            })
          : t("onboardingA.drive.caption")}
      </Text>
    </OnboardingScreen>
  );
}
