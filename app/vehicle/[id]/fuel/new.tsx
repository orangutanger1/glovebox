import { useState } from "react";
import { View, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "../../../../src/design/Screen";
import { Card } from "../../../../src/design/Card";
import { Chip } from "../../../../src/design/Chip";
import { Field } from "../../../../src/design/Field";
import { Button } from "../../../../src/design/Button";
import { DateWheel } from "../../../../src/design/DateWheel";
import { tokens } from "../../../../src/design/tokens";
import { getVehicle } from "../../../../src/db/vehicles";
import { addFuelEntry, listFuelEntries } from "../../../../src/db/fuel";
import { rescheduleAll } from "../../../../src/notify";
import { recordReviewEvent, maybeRequestReview } from "../../../../src/review";
import { track } from "../../../../src/analytics";
import { parseNumber, dateFromParts, partsFromDate } from "../../../../src/format";
import { t } from "../../../../src/i18n";
import { getDistanceUnit } from "../../../../src/units";
import { distanceUnitLabel } from "../../../../src/units/format";
import { volumeUnitLabel } from "../../../../src/fuel/format";

const WHEN = [
  { key: "fuel.form.today", days: 0 },
  { key: "fuel.form.yesterday", days: 1 },
];

/** Sentinel rather than a magic number of days, so "custom" can never collide
 *  with a real offset. Same shape as the service form. */
const CUSTOM = "custom";

/**
 * Four controls, in pump order: odometer, volume, total paid, filled-the-tank.
 *
 * The order is the argument. A driver logs this standing at the pump with the
 * receipt in the other hand, and a form that asks for anything before the two
 * numbers on the display in front of them is a form they stop using by the
 * third week. Target is under twenty seconds; that is the whole retention case
 * for the feature, and the reason the cost field is optional.
 */
export default function LogFuel() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const vehicle = getVehicle(id);

  // Empty, with the last reading as the placeholder, and it gets the autofocus:
  // it is the field the pump is already showing them.
  //
  // It used to be prefilled with the reading — "edit three digits, not six".
  // After any fill the reading IS the previous fill's odometer, the one value
  // that yields no figure: zero distance, and `vehicleSeries` folds the volume
  // into the tank after it. A driver who saved the default untouched logged
  // exactly that, and the 2026-09-17 audit found the test documenting it as
  // deliberate. The six digits stay on the glass to copy from; they are no
  // longer what Save submits.
  const [odometer, setOdometer] = useState("");
  const lastReading = vehicle?.odometer === undefined ? undefined : String(vehicle.odometer);
  const [volume, setVolume] = useState("");
  const [cost, setCost] = useState("");
  // On by default, matching the column default, so a row written by a user who
  // never touched the toggle is honest rather than merely present.
  const [full, setFull] = useState(true);
  const [daysAgo, setDaysAgo] = useState<number | typeof CUSTOM>(0);
  const [customDate, setCustomDate] = useState(() => partsFromDate(new Date()));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const unit = getDistanceUnit();

  async function onSave() {
    if (saving) return;
    const odo = parseNumber(odometer);
    const vol = parseNumber(volume);
    // Both columns are NOT NULL, for a reason the user can be told: a fill
    // missing either can never produce a figure, and it would corrupt the tank
    // after it too. Refused here rather than thrown at the driver by SQLite.
    if (odo === undefined || odo < 0 || vol === undefined || vol <= 0) {
      setError(t("fuel.form.needOdometer"));
      return;
    }
    // The previous fill's reading, exactly. Live rows only: a fill deleted at
    // this reading is not the previous fill, and the odometer really can read
    // this now. Newest-by-odometer first is the order `listFuelEntries` reads.
    const previous = listFuelEntries(id)[0];
    if (previous && previous.odometer === odo) {
      setError(t("fuel.form.sameOdometer"));
      return;
    }

    setSaving(true);
    setError("");

    let filled: Date;
    if (daysAgo === CUSTOM) {
      // No validation branch left: the wheels cannot be parked on a date that
      // doesn't exist or hasn't happened.
      filled = dateFromParts(customDate);
    } else {
      filled = new Date();
      filled.setDate(filled.getDate() - daysAgo);
      // Noon local, the same as every other date this app stores: a row
      // written at 9pm in New York serialises to the next UTC day, and the
      // CSV and the monthly chart read the day straight off that string.
      filled.setHours(12, 0, 0, 0);
    }

    const price = parseNumber(cost);
    // Refused rather than dropped: a cost that was typed and did not parse
    // used to land as NULL, and the fill then read as unpriced forever.
    if (cost.trim() && price === undefined) {
      setError(t("vehicleForms.number.invalid"));
      setSaving(false);
      return;
    }
    if (price !== undefined && price < 0) {
      setError(t("fuel.form.error"));
      setSaving(false);
      return;
    }
    try {
      addFuelEntry({
        vehicle_id: id,
        filled_at: filled.toISOString(),
        odometer: odo,
        volume: vol,
        cost: price,
        full,
      });
    } catch {
      // Never clear the form on failure. The user's typing is the thing we protect.
      setError(t("fuel.form.error"));
      setSaving(false);
      return;
    }

    // The row is committed. Everything past this point is a nicety, and a
    // notification that failed to schedule must never be reported to the user
    // as a lost fill-up.
    //
    // `full` rides along as a property: the partial rate is the only way to
    // find out whether the toggle is understood at all, and a toggle nobody
    // understands quietly poisons every figure the feature draws.
    track("fuel_logged", { full, priced: price !== undefined });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    // A fill moves the odometer, and every mileage-based reminder is derived
    // from it — the same reason logging a service reschedules.
    rescheduleAll().catch(() => {});
    recordReviewEvent("log_service");
    router.back();

    // Deferred past the pop so StoreKit presents onto a screen that has settled
    // rather than one mid-transition.
    setTimeout(() => void maybeRequestReview(), 1200);
  }

  return (
    <Screen
      title={t("fuel.form.title")}
      footer={
        <>
          {error ? (
            <Text style={{ ...tokens.text.body, color: tokens.color.red }}>{error}</Text>
          ) : null}
          <Button label={t("fuel.form.save")} onPress={onSave} disabled={saving} />
        </>
      }
    >
      <Card>
        <Field
          label={t("fuel.form.odometer", { unit: distanceUnitLabel(unit) })}
          value={odometer}
          placeholder={lastReading}
          onChangeText={setOdometer}
          keyboardType="numeric"
          autoFocus
        />
        <Field
          label={t("fuel.form.volume", { unit: volumeUnitLabel() })}
          value={volume}
          onChangeText={setVolume}
          keyboardType="numeric"
        />
        <Field
          label={t("fuel.form.cost")}
          value={cost}
          onChangeText={setCost}
          keyboardType="numeric"
        />
      </Card>
      <Card>
        {/* A chip rather than a switch: every other binary choice in this app is
            one, and the hint underneath is what makes the default defensible —
            a user who tops up and leaves it on gets a wrong figure otherwise. */}
        <Chip label={t("fuel.form.full")} selected={full} onPress={() => setFull(!full)} />
        <Text style={{ ...tokens.text.caption, color: tokens.color.textFaint }}>
          {t("fuel.form.fullHint")}
        </Text>
      </Card>
      <Card>
        <Text style={{ ...tokens.text.legend, color: tokens.color.textMuted }}>
          {t("fuel.form.when")}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: tokens.space.sm }}>
          {WHEN.map((w) => (
            <Chip
              key={w.key}
              label={t(w.key)}
              selected={daysAgo === w.days}
              onPress={() => setDaysAgo(w.days)}
            />
          ))}
          <Chip
            label={t("fuel.form.otherDate")}
            selected={daysAgo === CUSTOM}
            onPress={() => setDaysAgo(CUSTOM)}
          />
        </View>
        {daysAgo === CUSTOM ? <DateWheel value={customDate} onChange={setCustomDate} /> : null}
      </Card>
    </Screen>
  );
}
