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
import { trackQuizAnswer, trackStepBlocked, trackVehicleEntry } from "../../src/analytics";
import { parseNumber } from "../../src/format";
import { t } from "../../src/i18n";
import { getDistanceUnit } from "../../src/units";
import { distanceUnitLabel } from "../../src/units/format";

/**
 * The odometer.
 *
 * The reading is what dates every service that comes due by distance, so it is
 * asked for once, here, with the drums of an odometer above the field so the
 * screen shows the thing it is asking the user to go and read.
 *
 * There is no way past it. Every screen in this flow is mandatory now: the
 * reading is what dates half the schedule, and an "I'll add it later" here
 * bought a completed flow whose findings were computed from the app's own
 * arithmetic and presented as the user's car. The friction is one number off
 * the dash, and the estimate that used to stand in for it is still available
 * from the garage afterwards.
 */
export default function OnboardingOdometer() {
  const advance = useAdvance("odometer");
  // Read once, at mount. Stepping back from the next question and forward
  // again lands on a new copy of this screen, and it has to show the reading
  // the user already gave rather than an empty field.
  const saved = useMemo(() => {
    const ownedId = getOnboardingVehicleId();
    return ownedId ? getVehicle(ownedId) : null;
  }, []);
  // `== null`, not `=== undefined`: SQLite hands back a JSON null for a row
  // that has never had a reading, and `String(null)` put the literal text
  // "null" in the field on the first pass through this question.
  //
  // An estimate from an older build is not poured into the field either. It is
  // the app's arithmetic, not the user's answer, and prefilling it would turn
  // Continue into a typed reading that nobody ever read off a dash.
  const [odometer, setOdometer] = useState(
    saved?.odometer == null || saved.odometer_estimated ? "" : String(saved.odometer)
  );
  // What the drums show before there is anything to show: a plausible reading,
  // drawn once per mount so it does not re-roll on every render. The moment the
  // field holds a number, the drums are that number instead — two different
  // six-figure readings stacked on one screen is the app disagreeing with
  // itself about the only fact this screen exists to collect.
  const demo = useMemo(() => randomOdometerReading(), []);

  const unit = getDistanceUnit();
  const reading = parseNumber(odometer);
  const valid = reading !== undefined && reading >= 0;

  function onContinue() {
    // Kept as a guard, not as a reporter. The button is disabled whenever
    // `valid` is false, so this branch was unreachable and the `invalid` event
    // it used to emit has never once fired on a device. The odometer's refusals
    // are counted by `onBlockedPress` below, which is where the tap arrives.
    if (!valid) return;
    const ownedId = getOnboardingVehicleId();
    const vehicle = ownedId ? getVehicle(ownedId) : null;
    // Set outright rather than as a high-water mark. This field is the dash
    // reading itself, so a user who came back to fix an extra digit has to be
    // able to lower it. The placeholder is a grouped reading, so a user copying
    // its format produced NaN and silently lost their reading.
    if (vehicle) setOdometerReading(vehicle.id, reading);
    trackQuizAnswer("odometer", { given: true });
    advance();
  }

  return (
    <OnboardingScreen
      route="odometer"
      title={t(`onboardingA.odometer.title.${unit}`)}
      footer={
        <Button
          label={t("onboardingA.continue")}
          onPress={onContinue}
          disabled={!valid}
          // Two different failures wearing one greyed-out button: nothing typed
          // at all, and something typed that `parseNumber` would not take. The
          // second is a bug report — a grouped reading copied off the dash, a
          // decimal comma, a unit suffix — and it has to be separable from a
          // user who simply has not been out to the car yet.
          onBlockedPress={() =>
            trackStepBlocked("odometer", odometer.trim() === "" ? "empty" : "unparseable")
          }
        />
      }
    >
      <Panel>
        {/* Drums above the field, showing whatever the field holds. Until the
            user types, that is a specimen reading rolling into place — the
            screen shows the thing it is asking them to go and read, and shows
            it moving. From the first digit on, the drums are their number:
            a static demo above a filled-in field had the screen printing two
            different odometer readings at once. */}
        <OdometerRoll value={reading ?? demo} live={reading !== undefined} />
        <View style={{ padding: tokens.space.md }}>
          <Field
            label={t("onboardingA.odometer.field", { unit: distanceUnitLabel(unit) })}
            value={odometer}
            onChangeText={setOdometer}
            keyboardType="numeric"
            placeholder={t(`onboardingA.odometer.placeholder.${unit}`)}
            onFocus={() => trackVehicleEntry("odometer", "focused")}
          />
        </View>
      </Panel>
      <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
        {t("onboardingA.odometer.caption")}
      </Text>
    </OnboardingScreen>
  );
}
