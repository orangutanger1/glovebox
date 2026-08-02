import { useState } from "react";
import { useRouter } from "expo-router";
import { Screen } from "../../src/design/Screen";
import { Card } from "../../src/design/Card";
import { Field } from "../../src/design/Field";
import { Button } from "../../src/design/Button";
import { createVehicle } from "../../src/db/vehicles";

export default function NewVehicle() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [odometer, setOdometer] = useState("");

  function onSave() {
    if (!name.trim()) return;
    createVehicle({
      name: name.trim(),
      odometer: odometer ? Number(odometer) : undefined,
    });
    router.back();
  }

  return (
    <Screen title="Add vehicle">
      <Card>
        <Field label="Name" value={name} onChangeText={setName} placeholder="2019 Civic" />
        <Field
          label="Current mileage"
          value={odometer}
          onChangeText={setOdometer}
          keyboardType="numeric"
          placeholder="50000"
        />
      </Card>
      <Button label="Save" onPress={onSave} disabled={!name.trim()} />
    </Screen>
  );
}
