import { useMemo, useState } from "react";
import { Text } from "react-native";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "../../../src/design/Screen";
import { Card } from "../../../src/design/Card";
import { Field } from "../../../src/design/Field";
import { Button } from "../../../src/design/Button";
import { tokens } from "../../../src/design/tokens";
import { getVehicle, renameVehicle, setOdometerReading } from "../../../src/db/vehicles";
import { rescheduleAll } from "../../../src/notify";
import { parseNumber } from "../../../src/format";
import { getDistanceUnit } from "../../../src/units";
import { distanceUnitLabel } from "../../../src/units/format";
import { t } from "../../../src/i18n";

/**
 * Editing a car: its name and its odometer.
 *
 * The garage had no way to rename. A name typed wrong in onboarding — or a
 * car sold and replaced, or "My car" left standing because the make was
 * skipped — could only be corrected by deleting the vehicle and adding a new
 * one, which is the one action in this app that takes a whole service history
 * out of reach. A typo cost the log.
 *
 * The name is the only part of a vehicle another screen shows: the garage row,
 * the detail header and every reminder read `name` and nothing else. The year,
 * make and model sit under the cluster as a spec line and are left alone here,
 * so an edit cannot quietly clear them.
 *
 * The odometer is here because every other write to it is a high-water mark.
 * That rule is right when the number arrives attached to a service — a job
 * logged at 40,000 on a car showing 84,000 must not wind the dash back — and
 * wrong when the number itself was the typo. A fill fat-fingered at 842,100
 * can be deleted and `rewindOdometer` takes the mark down with it; a reading
 * typed wrong into onboarding, or a fill corrected in place rather than
 * deleted, had no way off the dash at all. So this field writes through
 * `setOdometerReading`: set outright, down as well as up. Blank means "leave
 * it", the same as an untouched name; the form cannot set the reading to
 * nothing, and the 2026-09-17 audit found that a `rewindOdometer` that lands
 * on NULL is recoverable here in one field.
 *
 * The schedule is rebuilt on save. For the name because it is baked into the
 * notification text at scheduling time, and a reminder that arrives in three
 * weeks naming the old car is the app telling the owner their rename did not
 * take; for the odometer because the distance-based reminders are computed
 * from it.
 */
export default function EditVehicle() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const vehicle = useMemo(() => (id ? getVehicle(id) : null), [id]);
  const [name, setName] = useState(vehicle?.name ?? "");
  // The reading, so the user edits three digits rather than typing six.
  const [odometer, setOdometer] = useState(vehicle?.odometer ? String(vehicle.odometer) : "");
  const [error, setError] = useState("");

  const unit = getDistanceUnit();
  const trimmed = name.trim();

  function onSave() {
    if (!id || !trimmed) return;
    setError("");

    // Something typed that did not parse is refused, not dropped: a filled
    // field that came back `undefined` saved as "no change" would tell the
    // user their correction took when it did not. A minus sign is a typo.
    const odo = odometer.trim() ? parseNumber(odometer) : undefined;
    if (odometer.trim() && (odo === undefined || odo < 0)) {
      setError(t("vehicleForms.number.invalid"));
      return;
    }

    renameVehicle(id, trimmed);
    if (odo !== undefined && odo !== vehicle?.odometer) setOdometerReading(id, odo);
    rescheduleAll().catch(() => {});
    router.back();
  }

  return (
    <Screen
      title={t("vehicle.edit.title")}
      footer={
        <>
          {error ? (
            <Text style={{ ...tokens.text.body, color: tokens.color.red }}>{error}</Text>
          ) : null}
          <Button label={t("vehicleForms.new.save")} onPress={onSave} disabled={!trimmed} />
        </>
      }
    >
      <Stack.Screen options={{ title: t("vehicle.edit.title") }} />
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
        <Field
          label={t("vehicleForms.log.odometer", { unit: distanceUnitLabel(unit) })}
          value={odometer}
          onChangeText={setOdometer}
          keyboardType="numeric"
        />
        <Text style={{ ...tokens.text.legend, color: tokens.color.textMuted }}>
          {t("vehicle.edit.odometerHint")}
        </Text>
      </Card>
    </Screen>
  );
}
