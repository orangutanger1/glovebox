import { useMemo, useState } from "react";
import { Text } from "react-native";
import { Button } from "../../src/design/Button";
import { ChipRow } from "../../src/design/ChipRow";
import { tokens } from "../../src/design/tokens";
import { getVehicle } from "../../src/db/vehicles";
import { getAnswers, getOnboardingVehicleId, setAnswers } from "../../src/onboarding";
import { MILES_PER_YEAR } from "../../src/onboarding/plan";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useAdvance } from "../../src/onboarding/nav";
import type { DriveAnswer } from "../../src/onboarding/state";

/** Ranges, not a slider. Nobody knows their annual mileage to the mile, and a
 *  slider would ask them to pretend they do. */
const OPTIONS: readonly { value: DriveAnswer; label: string }[] = [
  { value: "low", label: "Under 5,000" },
  { value: "average", label: "5,000 to 10,000" },
  { value: "high", label: "10,000 to 15,000" },
  { value: "very_high", label: "Over 15,000" },
];

export default function OnboardingDrive() {
  const advance = useAdvance("drive");
  // Persisted, so Back and Continue show the answer already given rather than
  // an unselected row of chips.
  const [drive, setDrive] = useState<DriveAnswer | null>(() => getAnswers().drive ?? null);

  const odometer = useMemo(() => {
    const ownedId = getOnboardingVehicleId();
    return (ownedId ? getVehicle(ownedId) : null)?.odometer;
  }, []);

  function onContinue() {
    if (!drive) return;
    setAnswers({ drive });
    advance();
  }

  return (
    <OnboardingScreen
      route="drive"
      title="How far do you drive it?"
      subtitle="Roughly, since this is the number that turns a mileage interval into a date."
      footer={<Button label="Continue" onPress={onContinue} disabled={!drive} />}
    >
      <ChipRow
        legend="Miles a year"
        options={OPTIONS}
        selected={drive ? [drive] : []}
        onPress={setDrive}
      />

      {/* The answer is shown doing its job immediately. A projection the user
          can check against their own sense of the car is also the cheapest
          possible proof that the questions are not decorative. */}
      <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
        {drive && odometer !== undefined
          ? `At that rate this car reads about ${(odometer + MILES_PER_YEAR[drive]).toLocaleString()} mi this time next year.`
          : "Used to date the services that come due by mileage rather than by the calendar."}
      </Text>
    </OnboardingScreen>
  );
}
