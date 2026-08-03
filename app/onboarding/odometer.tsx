import { useMemo, useState } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { Field } from "../../src/design/Field";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { OdometerRoll, randomOdometerReading } from "../../src/design/OdometerRoll";
import { tokens } from "../../src/design/tokens";
import { getVehicle, setOdometerIfHigher } from "../../src/db/vehicles";
import { setOnboardingStep, getOnboardingVehicleId } from "../../src/onboarding";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { parseNumber } from "../../src/format";

export default function OnboardingOdometer() {
  const router = useRouter();
  const [odometer, setOdometer] = useState("");
  // Drawn once per mount, not per render — the drums must not re-roll every
  // time the user types a digit into the field below them.
  const demo = useMemo(() => randomOdometerReading(), []);

  const miles = parseNumber(odometer);
  const valid = miles !== undefined && miles >= 0;

  function onContinue() {
    if (!valid) return;
    const ownedId = getOnboardingVehicleId();
    const vehicle = ownedId ? getVehicle(ownedId) : null;
    // The placeholder on this very field shows "84,210", so a user copying its
    // format produced NaN and silently lost their reading.
    if (vehicle) setOdometerIfHigher(vehicle.id, miles);
    setOnboardingStep("service");
    router.push("/onboarding/service");
  }

  return (
    <OnboardingScreen
      step={2}
      title="How many miles on it?"
      footer={<Button label="Continue" onPress={onContinue} disabled={!valid} />}
    >
      <Panel>
        {/* Drums above the field the user is about to type into: the screen
            shows the thing it is asking them to go and read, and shows it
            moving. This was a dimmed photograph — static, decoded a frame
            late, and faded to half strength so it would stop out-shouting the
            only interactive element on the screen. */}
        <OdometerRoll value={demo} />
        <View style={{ padding: tokens.space.md }}>
          <Field
            label="Odometer"
            value={odometer}
            onChangeText={setOdometer}
            keyboardType="numeric"
            placeholder="84,210"
            autoFocus
          />
        </View>
      </Panel>
      <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
        Used to work out what is due by mileage, not just by date. A rough number is fine — you can
        correct it any time you log a service.
      </Text>
    </OnboardingScreen>
  );
}
