import { useState } from "react";
import { Text } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../../src/design/Screen";
import { Card } from "../../src/design/Card";
import { Field } from "../../src/design/Field";
import { Button } from "../../src/design/Button";
import { tokens } from "../../src/design/tokens";
import { createVehicle } from "../../src/db/vehicles";
import { parseNumber } from "../../src/format";
import { t } from "../../src/i18n";
import { getDistanceUnit } from "../../src/units";
import { distanceUnitLabel } from "../../src/units/format";

export default function NewVehicle() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [odometer, setOdometer] = useState("");
  const [error, setError] = useState("");
  const unit = getDistanceUnit();

  function onSave() {
    if (!name.trim()) return;
    const reading = parseNumber(odometer);
    // Optional, but not silently optional: a reading that was typed and did
    // not parse, or a negative one, is refused rather than stored as nothing.
    if (odometer.trim() && (reading === undefined || reading < 0)) {
      setError(t("vehicleForms.number.invalid"));
      return;
    }
    createVehicle({
      name: name.trim(),
      odometer: reading,
    });
    router.back();
  }

  return (
    <Screen
      title={t("vehicleForms.new.title")}
      footer={
        <>
          {error ? (
            <Text style={{ ...tokens.text.body, color: tokens.color.red }}>{error}</Text>
          ) : null}
          <Button label={t("vehicleForms.new.save")} onPress={onSave} disabled={!name.trim()} />
        </>
      }
    >
      <Card>
        <Field
          label={t("vehicleForms.new.name")}
          value={name}
          onChangeText={setName}
          placeholder={t("vehicleForms.new.namePlaceholder")}
        />
        <Field
          label={t("vehicleForms.new.odometer", { unit: distanceUnitLabel(unit) })}
          value={odometer}
          onChangeText={(next) => {
            setError("");
            setOdometer(next);
          }}
          keyboardType="numeric"
          placeholder={t(`vehicleForms.new.odometerPlaceholder.${unit}`)}
        />
      </Card>
    </Screen>
  );
}
