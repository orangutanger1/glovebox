import { useMemo, useState } from "react";
import { View, Text } from "react-native";
import { Field } from "../../src/design/Field";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { tokens } from "../../src/design/tokens";
import { createVehicle, getVehicle, updateVehicleIdentity } from "../../src/db/vehicles";
import { getOnboardingVehicleId, setOnboardingVehicleId } from "../../src/onboarding";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useAdvance } from "../../src/onboarding/nav";
import { parseNumber, vehicleDisplayName } from "../../src/format";
import { t } from "../../src/i18n";

/** A model year, not a number. 1900 rules out a mistyped odometer reading in
 *  this field; +2 allows next year's cars, which are on sale this year. */
const MIN_YEAR = 1900;
const MAX_YEAR = new Date().getFullYear() + 2;

export default function OnboardingVehicle() {
  const advance = useAdvance("vehicle");

  /**
   * The car this run of onboarding has already written, if the user is here a
   * second time.
   *
   * Going back is a real move in this flow, and Continue pushes a fresh copy
   * of the next screen rather than waking the old one, so nothing typed here
   * survived in component state. The answer does survive in the database,
   * which is the only copy that matters, so the fields are filled from it.
   */
  const saved = useMemo(() => {
    const ownedId = getOnboardingVehicleId();
    return ownedId ? getVehicle(ownedId) : null;
  }, []);

  const [year, setYear] = useState(saved?.year ? String(saved.year) : "");
  const [make, setMake] = useState(saved?.make ?? "");
  const [model, setModel] = useState(saved?.model ?? "");
  // Errors are held back until the field is left or Continue is pressed:
  // "1" on the way to "1998" is not a mistake and must not be shouted at.
  const [yearTouched, setYearTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const parts = {
    year: parseNumber(year),
    make: make.trim() || undefined,
    model: model.trim() || undefined,
  };

  // Every field is required. Skip used to be the way past this screen and it
  // wrote a vehicle called "My car" with no year, make, model or mileage: a
  // garage entry that looks broken and that the schedule cannot reason about.
  const yearOk = parts.year !== undefined && parts.year >= MIN_YEAR && parts.year <= MAX_YEAR;
  const valid = yearOk && parts.make !== undefined && parts.model !== undefined;

  // An out-of-range year used to do nothing at all: Continue stayed disabled
  // and nothing on screen said why, so "09" or "78" read as a dead button.
  // Continue is now always pressable and answers with the reason.
  const yearMessage = (() => {
    if (!year.trim()) return t("onboardingA.vehicle.yearMissing");
    if (parts.year === undefined || !/^\d+$/.test(year.trim())) {
      return t("onboardingA.vehicle.yearDigits");
    }
    // Years are passed as strings: a model year is a label, not a quantity, and
    // `t` groups the numbers it is handed — "1,900" is not a year.
    if (parts.year < MIN_YEAR) {
      return t("onboardingA.vehicle.yearMin", { min: String(MIN_YEAR), value: year.trim() });
    }
    if (parts.year > MAX_YEAR) return t("onboardingA.vehicle.yearMax", { max: String(MAX_YEAR) });
    return "";
  })();
  const showYearError = (yearTouched || submitted) && yearMessage !== "";
  const missingMessage = t("onboardingA.vehicle.required");

  function onContinue() {
    if (!valid) {
      setSubmitted(true);
      return;
    }
    // There is no separate name field any more: the name IS the parts. Asking
    // for both meant the user typed "Civic" twice, and year/make/model were
    // then rendered nowhere. `name` is the only field the garage list and the
    // vehicle header ever show. A nickname is offered later, from the vehicle
    // screen, which is the point at which a second car makes one useful.
    const identity = { name: vehicleDisplayName(parts), ...parts };
    // Stepping back to this screen and forward again must correct the car, not
    // add a second one to the garage, but only the car this run of onboarding
    // created. Reaching for the first vehicle in the garage instead is how
    // "Replay onboarding" came to rename a car the user had owned for a year.
    const ownedId = getOnboardingVehicleId();
    const existing = ownedId ? getVehicle(ownedId) : null;
    if (existing) updateVehicleIdentity(existing.id, identity);
    else setOnboardingVehicleId(createVehicle(identity).id);

    advance();
  }

  return (
    <OnboardingScreen
      route="vehicle"
      title={t("onboardingA.vehicle.title")}
      footer={<Button label={t("onboardingA.continue")} onPress={onContinue} />}
    >
      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.md }}>
          <Field
            label={t("onboardingA.vehicle.year")}
            value={year}
            onChangeText={setYear}
            keyboardType="numeric"
            placeholder={t("onboardingA.vehicle.yearPlaceholder")}
            autoFocus={saved === null}
            onBlur={() => setYearTouched(true)}
            error={showYearError ? yearMessage : undefined}
          />
          <View style={{ flexDirection: "row", gap: tokens.space.md }}>
            <View style={{ flex: 1 }}>
              <Field
                label={t("onboardingA.vehicle.make")}
                value={make}
                onChangeText={setMake}
                placeholder={t("onboardingA.vehicle.makePlaceholder")}
                error={submitted && parts.make === undefined ? missingMessage : undefined}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label={t("onboardingA.vehicle.model")}
                value={model}
                onChangeText={setModel}
                placeholder={t("onboardingA.vehicle.modelPlaceholder")}
                error={submitted && parts.model === undefined ? missingMessage : undefined}
              />
            </View>
          </View>
        </View>
      </Panel>

      {/* Year and Make/Model used to sit in three equal columns, which squeezed
          "Model" to a few characters on a small phone. Year gets its own row,
          because it is a four-digit readout rather than a word. */}
      <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
        {valid
          ? t("onboardingA.vehicle.saved", { name: vehicleDisplayName(parts) })
          : t("onboardingA.vehicle.hint")}
      </Text>
    </OnboardingScreen>
  );
}
