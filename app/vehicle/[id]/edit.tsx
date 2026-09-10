import { useMemo, useState } from "react";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "../../../src/design/Screen";
import { Card } from "../../../src/design/Card";
import { Field } from "../../../src/design/Field";
import { Button } from "../../../src/design/Button";
import { getVehicle, renameVehicle } from "../../../src/db/vehicles";
import { rescheduleAll } from "../../../src/notify";
import { t } from "../../../src/i18n";

/**
 * Renaming a car.
 *
 * The garage had no way to do this. A name typed wrong in onboarding — or a
 * car sold and replaced, or "My car" left standing because the make was
 * skipped — could only be corrected by deleting the vehicle and adding a new
 * one, which is the one action in this app that takes a whole service history
 * out of reach. A typo cost the log.
 *
 * One field, because the name is the only part of a vehicle another screen
 * shows: the garage row, the detail header and every reminder read `name` and
 * nothing else. The year, make and model sit under the cluster as a spec line
 * and are left alone here, so a rename cannot quietly clear them.
 *
 * The schedule is rebuilt on save. Not because the dates move — they do not —
 * but because the name is baked into the notification text at scheduling time,
 * and a reminder that arrives in three weeks naming the old car is the app
 * telling the owner their rename did not take.
 */
export default function EditVehicle() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const vehicle = useMemo(() => (id ? getVehicle(id) : null), [id]);
  const [name, setName] = useState(vehicle?.name ?? "");

  const trimmed = name.trim();

  function onSave() {
    if (!id || !trimmed) return;
    renameVehicle(id, trimmed);
    rescheduleAll().catch(() => {});
    router.back();
  }

  return (
    <Screen
      title={t("vehicle.rename.title")}
      footer={
        <Button label={t("vehicleForms.new.save")} onPress={onSave} disabled={!trimmed} />
      }
    >
      <Stack.Screen options={{ title: t("vehicle.rename.title") }} />
      <Card>
        <Field
          label={t("vehicleForms.new.name")}
          value={name}
          onChangeText={setName}
          placeholder={t("vehicleForms.new.namePlaceholder")}
          autoFocus
          autoCapitalize="words"
          autoCorrect={false}
        />
      </Card>
    </Screen>
  );
}
