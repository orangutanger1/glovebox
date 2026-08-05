import { useMemo, useState } from "react";
import { View, Text } from "react-native";
import { Field } from "../../src/design/Field";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { OdometerRoll, randomOdometerReading } from "../../src/design/OdometerRoll";
import { tokens } from "../../src/design/tokens";
import { getVehicle, setOdometerReading } from "../../src/db/vehicles";
import { getOnboardingVehicleId } from "../../src/onboarding";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useAdvance } from "../../src/onboarding/nav";
import { parseNumber } from "../../src/format";

export default function OnboardingOdometer() {
  const advance = useAdvance("odometer");
  // Read once, at mount. Stepping back from the next question and forward
  // again lands on a new copy of this screen, and it has to show the reading
  // the user already gave rather than an empty field.
  const saved = useMemo(() => {
    const ownedId = getOnboardingVehicleId();
    return ownedId ? getVehicle(ownedId) : null;
  }, []);
  const [odometer, setOdometer] = useState(
    saved?.odometer === undefined ? "" : String(saved.odometer)
  );
  // Drawn once per mount, not per render: the drums must not re-roll every
  // time the user types a digit into the field below them.
  const demo = useMemo(() => randomOdometerReading(), []);

  const miles = parseNumber(odometer);
  const valid = miles !== undefined && miles >= 0;

  function onContinue() {
    if (!valid) return;
    const ownedId = getOnboardingVehicleId();
    const vehicle = ownedId ? getVehicle(ownedId) : null;
    // Set outright rather than as a high-water mark. This field is the dash
    // reading itself, so a user who came back to fix an extra digit has to be
    // able to lower it. The placeholder shows "84,210", so a user copying its
    // format produced NaN and silently lost their reading.
    if (vehicle) setOdometerReading(vehicle.id, miles);
    advance();
  }

  return (
    <OnboardingScreen
      route="odometer"
      title="How many miles on it?"
      footer={<Button label="Continue" onPress={onContinue} disabled={!valid} />}
    >
      <Panel>
        {/* Drums above the field the user is about to type into: the screen
            shows the thing it is asking them to go and read, and shows it
            moving. This was a dimmed photograph: static, decoded a frame late,
            and faded to half strength so it would stop out-shouting the only
            interactive element on the screen. */}
        <OdometerRoll value={demo} />
        <View style={{ padding: tokens.space.md }}>
          <Field
            label="Odometer"
            value={odometer}
            onChangeText={setOdometer}
            keyboardType="numeric"
            placeholder="84,210"
            autoFocus={saved?.odometer === undefined}
          />
        </View>
      </Panel>
      <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
        A rough number is fine, and it is what dates the services that come due by mileage.
      </Text>
    </OnboardingScreen>
  );
}
