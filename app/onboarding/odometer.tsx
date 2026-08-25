import { useMemo, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Field } from "../../src/design/Field";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { OdometerRoll, randomOdometerReading } from "../../src/design/OdometerRoll";
import { tokens } from "../../src/design/tokens";
import { getVehicle, setOdometerEstimate, setOdometerReading } from "../../src/db/vehicles";
import { getOnboardingVehicleId } from "../../src/onboarding";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useAdvance } from "../../src/onboarding/nav";
import { AVERAGE_DISTANCE_PER_YEAR, estimateOdometer } from "../../src/onboarding/estimate";
import { trackQuizAnswer, trackVehicleEntry } from "../../src/analytics";
import { parseNumber } from "../../src/format";
import { t } from "../../src/i18n";
import { getDistanceUnit } from "../../src/units";
import { distanceUnitLabel, formatDistance } from "../../src/units/format";

/**
 * The odometer, and the way past it.
 *
 * This was a mandatory number on the third tap of the flow. The honest answer
 * to "how many miles on it?" is very often "I am not near the car", and the
 * screen's answer to that was a disabled button, so a user who could not
 * comply had nowhere to go but out of the app.
 *
 * "I'll add it later" costs the app almost nothing, because the model year is
 * already known and the average car covers a knowable distance a year. The
 * estimate is stored as an estimate: the row carries a flag, every gauge that
 * shows the reading says "(est.)", the next question refines it from the
 * annual-mileage band the user picks, and the first real reading of any kind
 * clears it. A guess the app owns up to is worth more than a blank column, and
 * far more than a user who left.
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
  // An estimate is deliberately not poured into the field. It is the app's
  // arithmetic, not the user's answer, and prefilling it would turn the next
  // Continue into a typed reading that nobody ever read off a dash.
  const [odometer, setOdometer] = useState(
    saved?.odometer == null || saved.odometer_estimated ? "" : String(saved.odometer)
  );
  // Drawn once per mount, not per render: the drums must not re-roll every
  // time the user types a digit into the field below them.
  const demo = useMemo(() => randomOdometerReading(), []);

  const unit = getDistanceUnit();
  const reading = parseNumber(odometer);
  const valid = reading !== undefined && reading >= 0;

  // Shown on the deferral itself rather than after it. A user handing the app
  // permission to guess is owed the guess before they agree to it.
  const estimate = estimateOdometer(saved?.year, AVERAGE_DISTANCE_PER_YEAR[unit]);

  function onContinue() {
    if (!valid) {
      trackVehicleEntry("odometer", "invalid");
      return;
    }
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

  function onLater() {
    const ownedId = getOnboardingVehicleId();
    const vehicle = ownedId ? getVehicle(ownedId) : null;
    // A car with no model year has nothing to count from, so there is nothing
    // to store and the column stays empty. Every screen after this already
    // handles an absent reading, because a resumed flow has always had one.
    if (vehicle && estimate !== undefined) setOdometerEstimate(vehicle.id, estimate);
    trackVehicleEntry("odometer", "skipped");
    trackQuizAnswer("odometer", { given: false, estimated: estimate !== undefined });
    advance();
  }

  return (
    <OnboardingScreen
      route="odometer"
      title={t(`onboardingA.odometer.title.${unit}`)}
      footer={
        <>
          <Button label={t("onboardingA.continue")} onPress={onContinue} disabled={!valid} />
          <Pressable
            onPress={onLater}
            style={{ alignItems: "center", paddingVertical: tokens.space.sm }}
          >
            <Text style={{ ...tokens.text.legend, color: tokens.color.textMuted }}>
              {t("onboardingA.odometer.later")}
            </Text>
          </Pressable>
        </>
      }
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
        {estimate === undefined
          ? t("onboardingA.odometer.caption")
          : t("onboardingA.odometer.laterCaption", {
              distance: formatDistance(estimate, unit),
            })}
      </Text>
    </OnboardingScreen>
  );
}
