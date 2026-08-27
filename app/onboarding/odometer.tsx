import { useMemo, useState } from "react";
import { View, Text } from "react-native";
import { Field } from "../../src/design/Field";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { OdometerRoll, randomOdometerReading } from "../../src/design/OdometerRoll";
import { tokens } from "../../src/design/tokens";
import { getVehicle, setOdometerEstimate, setOdometerReading } from "../../src/db/vehicles";
import { getOnboardingVehicleId } from "../../src/onboarding";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useAdvance } from "../../src/onboarding/nav";
import { trackQuizAnswer, trackVehicleEntry } from "../../src/analytics";
import { parseNumber } from "../../src/format";
import { AVERAGE_DISTANCE_PER_YEAR, estimateOdometer } from "../../src/onboarding/estimate";
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
 * It carries an "I'll add it later" again, and the funnel is why it came back.
 * The escape hatch was removed on the argument that an estimate is "a guess
 * standing in for the one number the schedule is built on, offered at the top
 * of the flow where the cheaper answer is the one everybody takes". The second
 * half of that turned out to be the finding rather than the objection: of the
 * five people who ever reached this screen while the hatch existed, four took
 * it. Removing it did not convert those four into people who walk out to the
 * driveway; it converted them into a hard gate two questions into the app,
 * with a numeric keyboard and a dead Continue button.
 *
 * So the estimate is offered, and everything that made it honest is still
 * here: it is stored flagged (`odometer_estimated`), every gauge in the app
 * labels it "(est.)", `drive` refines it with the mileage band on the very
 * next screen, and any real reading the owner ever enters retires it. An
 * estimate the user can see and correct beats an accurate number from a user
 * who left.
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
  // Drawn once per mount, not per render: the drums must not re-roll every
  // time the user types a digit into the field below them.
  const demo = useMemo(() => randomOdometerReading(), []);

  const unit = getDistanceUnit();
  const reading = parseNumber(odometer);
  const valid = reading !== undefined && reading >= 0;

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

  /**
   * "I'll add it later": estimate from the model year and move on.
   *
   * Written flagged, so it is arithmetic everywhere it is displayed and the
   * next screen is free to refine it. A year is always present — the drum on
   * the previous screen cannot produce an empty one — but `estimateOdometer`
   * returns undefined without one, and in that case nothing is written at all
   * rather than a zero being invented. An absent reading is a state every
   * screen downstream already handles.
   */
  function onLater() {
    const ownedId = getOnboardingVehicleId();
    const vehicle = ownedId ? getVehicle(ownedId) : null;
    const estimate = vehicle
      ? estimateOdometer(vehicle.year, AVERAGE_DISTANCE_PER_YEAR[unit])
      : undefined;
    if (vehicle && estimate !== undefined) setOdometerEstimate(vehicle.id, estimate);
    trackVehicleEntry("odometer", "skipped");
    trackQuizAnswer("odometer", { given: false });
    advance();
  }

  return (
    <OnboardingScreen
      route="odometer"
      title={t(`onboardingA.odometer.title.${unit}`)}
      footer={
        <View style={{ gap: tokens.space.sm }}>
          <Button label={t("onboardingA.continue")} onPress={onContinue} disabled={!valid} />
          {/* Secondary, and underneath: the typed reading is still the answer
              the app wants, so the hatch is visible without competing with it.
              It is not a text link — the flow has no other text links, and the
              one screen that hid its escape in caption-sized grey text is the
              screen this data came from. */}
          <Button
            label={t("onboardingA.odometer.later")}
            variant="secondary"
            onPress={onLater}
          />
        </View>
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
        {t("onboardingA.odometer.caption")}
      </Text>
    </OnboardingScreen>
  );
}
