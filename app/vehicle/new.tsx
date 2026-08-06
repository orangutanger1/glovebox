import { useState } from "react";
import { useRouter } from "expo-router";
import { Screen } from "../../src/design/Screen";
import { Card } from "../../src/design/Card";
import { Field } from "../../src/design/Field";
import { Button } from "../../src/design/Button";
import { createVehicle } from "../../src/db/vehicles";
import { parseNumber } from "../../src/format";
import { t } from "../../src/i18n";
import { getDistanceUnit } from "../../src/units";
import { distanceUnitLabel } from "../../src/units/format";

export default function NewVehicle() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [odometer, setOdometer] = useState("");
  const unit = getDistanceUnit();

  function onSave() {
    if (!name.trim()) return;
    createVehicle({
      name: name.trim(),
      odometer: parseNumber(odometer),
    });
    router.back();
  }

  return (
    <Screen
      title={t("vehicleForms.new.title")}
      footer={
        <Button label={t("vehicleForms.new.save")} onPress={onSave} disabled={!name.trim()} />
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
          onChangeText={setOdometer}
          keyboardType="numeric"
          placeholder={t(`vehicleForms.new.odometerPlaceholder.${unit}`)}
        />
      </Card>
    </Screen>
  );
}
