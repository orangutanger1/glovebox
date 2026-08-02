import { useState } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { Field } from "../../src/design/Field";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { tokens } from "../../src/design/tokens";
import { createVehicle, listVehicles, updateVehicleIdentity } from "../../src/db/vehicles";
import { setOnboardingStep } from "../../src/onboarding";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { parseNumber, vehicleDisplayName } from "../../src/format";

/** A model year, not a number. 1900 rules out a mistyped odometer reading in
 *  this field; +2 allows next year's cars, which are on sale this year. */
const MIN_YEAR = 1900;
const MAX_YEAR = new Date().getFullYear() + 2;

export default function OnboardingVehicle() {
  const router = useRouter();
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  // Errors are held back until the field is left or Continue is pressed —
  // "1" on the way to "1998" is not a mistake and must not be shouted at.
  const [yearTouched, setYearTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const parts = {
    year: parseNumber(year),
    make: make.trim() || undefined,
    model: model.trim() || undefined,
  };

  // Every field is required. Skip used to be the way past this screen and it
  // wrote a vehicle called "My car" with no year, make, model or mileage — a
  // garage entry that looks broken and that the schedule cannot reason about.
  const yearOk = parts.year !== undefined && parts.year >= MIN_YEAR && parts.year <= MAX_YEAR;
  const valid = yearOk && parts.make !== undefined && parts.model !== undefined;

  // An out-of-range year used to do nothing at all: Continue stayed disabled
  // and nothing on screen said why, so "09" or "78" read as a dead button.
  // Continue is now always pressable and answers with the reason.
  const yearMessage = (() => {
    if (!year.trim()) return "Enter the model year.";
    if (parts.year === undefined || !/^\d+$/.test(year.trim())) {
      return "Year must be four digits — 2014.";
    }
    if (parts.year < MIN_YEAR) return `Year must be ${MIN_YEAR} or later — 2014, not ${year.trim()}.`;
    if (parts.year > MAX_YEAR) return `Year can't be later than ${MAX_YEAR}.`;
    return "";
  })();
  const showYearError = (yearTouched || submitted) && yearMessage !== "";
  const missingMessage = "Required.";

  function onContinue() {
    if (!valid) {
      setSubmitted(true);
      return;
    }
    // There is no separate name field any more: the name IS the parts. Asking
    // for both meant the user typed "Civic" twice, and year/make/model were
    // then rendered nowhere — `name` is the only field the garage list and the
    // vehicle header ever show. A nickname is offered later, from the vehicle
    // screen, which is the point at which a second car makes one useful.
    const identity = { name: vehicleDisplayName(parts), ...parts };
    // Stepping back to this screen and forward again must correct the car, not
    // add a second one to the garage.
    const existing = listVehicles()[0];
    if (existing) updateVehicleIdentity(existing.id, identity);
    else createVehicle(identity);

    setOnboardingStep("odometer");
    router.push("/onboarding/odometer");
  }

  return (
    <OnboardingScreen
      step={1}
      title="What are you driving?"
      footer={<Button label="Continue" onPress={onContinue} />}
    >
      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.md }}>
          <Field
            label="Year"
            value={year}
            onChangeText={setYear}
            keyboardType="numeric"
            placeholder="2014"
            autoFocus
            onBlur={() => setYearTouched(true)}
            error={showYearError ? yearMessage : undefined}
          />
          <View style={{ flexDirection: "row", gap: tokens.space.md }}>
            <View style={{ flex: 1 }}>
              <Field
                label="Make"
                value={make}
                onChangeText={setMake}
                placeholder="Honda"
                error={submitted && parts.make === undefined ? missingMessage : undefined}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Field
                label="Model"
                value={model}
                onChangeText={setModel}
                placeholder="Civic"
                error={submitted && parts.model === undefined ? missingMessage : undefined}
              />
            </View>
          </View>
        </View>
      </Panel>

      {/* Year and Make/Model used to sit in three equal columns, which squeezed
          "Model" to a few characters on a small phone. Year gets its own row —
          it is a four-digit readout, not a word. */}
      <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
        {valid
          ? `Saved as "${vehicleDisplayName(parts)}". You can rename it later.`
          : "Year, make and model — all three, so reminders can name the car."}
      </Text>
    </OnboardingScreen>
  );
}
