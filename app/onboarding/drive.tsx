import { useMemo, useState } from "react";
import { Text } from "react-native";
import { Button } from "../../src/design/Button";
import { OptionCards } from "../../src/design/OptionCards";
import { tokens } from "../../src/design/tokens";
import { getAnswers, getOnboardingVehicleId, setAnswers } from "../../src/onboarding";
import { getVehicle } from "../../src/db/vehicles";
import { DISTANCE_PER_YEAR } from "../../src/onboarding/plan";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useAdvance } from "../../src/onboarding/nav";
import { trackQuizAnswer, trackStepBlocked } from "../../src/analytics";
import type { DriveAnswer } from "../../src/onboarding/state";
import { t } from "../../src/i18n";
import { getDistanceUnit } from "../../src/units";
import { distanceUnitLabel, formatDistance } from "../../src/units/format";

/** Ranges, not a slider. Nobody knows their annual mileage to the mile, and a
 *  slider would ask them to pretend they do. Four of them, stacked as cards:
 *  the ranges are ordered, and an ordered set of answers has to be readable
 *  top to bottom or the order is not information. */
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
    trackQuizAnswer("drive", { drive });
    advance();
  }

  return (
    <OnboardingScreen
      route="drive"
      title={t("onboardingA.drive.title")}
      footer={
        <Button
          label={t("onboardingA.continue")}
          onPress={onContinue}
          disabled={!drive}
          onBlockedPress={() => trackStepBlocked("drive", "unanswered")}
        />
      }
    >
      <OptionCards
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
