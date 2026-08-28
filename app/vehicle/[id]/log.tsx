import { useState } from "react";
import { View, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "../../../src/design/Screen";
import { Card } from "../../../src/design/Card";
import { Chip } from "../../../src/design/Chip";
import { Field } from "../../../src/design/Field";
import { Button } from "../../../src/design/Button";
import { DateWheel } from "../../../src/design/DateWheel";
import { useTheme } from "../../../src/design/theme";
import { tokens } from "../../../src/design/tokens";
import { getVehicle } from "../../../src/db/vehicles";
import { addRecord } from "../../../src/db/records";
import { rescheduleAll } from "../../../src/notify";
import { recordReviewEvent, maybeRequestReview } from "../../../src/review";
import { parseNumber, dateFromParts, partsFromDate } from "../../../src/format";
import { t } from "../../../src/i18n";
import { getDistanceUnit } from "../../../src/units";
import { distanceUnitLabel } from "../../../src/units/format";
import { serviceOptions } from "../../../src/schedule/names";

// The six people actually log. Everything else lives behind "Other". These are
// the stored identifiers, not the chip copy: the label comes from the schedule
// catalog so this list never has to hold a second, drifting copy of it.
const COMMON = [
  "Oil Change",
  "Tire Rotation",
  "Brake Inspection",
  "Air Filter",
  "Inspection",
  "Other",
];

const WHEN = [
  { key: "vehicleForms.log.today", days: 0 },
  { key: "vehicleForms.log.yesterday", days: 1 },
];

// The two chips cover the common case in one tap; anything older is typed.
// Sentinel rather than a magic number of days, so "custom" can never collide
// with a real offset.
const CUSTOM = "custom";

export default function LogService() {
  const c = useTheme();

  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const vehicle = getVehicle(id);

  // The first chip is the default, so the two cannot drift apart.
  const [type, setType] = useState(COMMON[0]);
  const [daysAgo, setDaysAgo] = useState<number | typeof CUSTOM>(0);
  // Opens on today, so the wheels start somewhere true and the user rolls back
  // from it rather than building a date from nothing.
  const [customDate, setCustomDate] = useState(() => partsFromDate(new Date()));
  // Prefilled so the user edits three digits instead of typing six. This field
  // gets autofocus, not the type chips — the chips are already answered.
  const [odometer, setOdometer] = useState(vehicle?.odometer ? String(vehicle.odometer) : "");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const unit = getDistanceUnit();
  const services = serviceOptions().filter((s) => COMMON.includes(s.type));

  async function onSave() {
    if (saving) return;
    setSaving(true);
    setError("");

    let performed: Date;
    if (daysAgo === CUSTOM) {
      // No validation branch left: the wheels cannot be parked on a date that
      // doesn't exist or hasn't happened.
      performed = dateFromParts(customDate);
    } else {
      performed = new Date();
      performed.setDate(performed.getDate() - daysAgo);
    }

    try {
      addRecord({
        vehicle_id: id,
        service_type: type,
        performed_at: performed.toISOString(),
        odometer: parseNumber(odometer),
        cost: parseNumber(cost),
        notes: notes.trim() || undefined,
      });
    } catch {
      // Never clear the form on failure. The user's typing is the thing we protect.
      setError(t("vehicleForms.log.error"));
      setSaving(false);
      return;
    }

    // The record is already committed. Everything past this point is a nicety,
    // and a notification that fails to schedule must never be reported to the
    // user as a lost service record.
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    rescheduleAll().catch(() => {});
    recordReviewEvent("log_service");
    router.back();

    // The app's whole job, just done, on a user who has done it before —
    // maybeRequestReview only fires above the score threshold, which no single
    // save can reach. Deferred past the pop so StoreKit presents onto a screen
    // that has settled rather than one mid-transition.
    setTimeout(() => void maybeRequestReview(), 1200);
  }

  return (
    <Screen
      title={t("vehicleForms.log.title")}
      footer={
        <>
          {error ? (
            <Text style={{ ...tokens.text.body, color: c.overdue }}>{error}</Text>
          ) : null}
          <Button label={t("vehicleForms.log.save")} onPress={onSave} disabled={saving} />
        </>
      }
    >
      <Card>
        <Text style={{ ...tokens.text.caption, color: c.inkMuted }}>
          {t("vehicleForms.log.what")}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: tokens.space.sm }}>
          {services.map((s) => (
            <Chip
              key={s.type}
              label={s.label}
              selected={s.type === type}
              onPress={() => setType(s.type)}
            />
          ))}
        </View>
      </Card>
      <Card>
        <Text style={{ ...tokens.text.caption, color: c.inkMuted }}>
          {t("vehicleForms.log.when")}
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
            label={t("vehicleForms.log.otherDate")}
            selected={daysAgo === CUSTOM}
            onPress={() => setDaysAgo(CUSTOM)}
          />
        </View>
        {daysAgo === CUSTOM ? (
          <DateWheel value={customDate} onChange={setCustomDate} />
        ) : null}
      </Card>
      <Card>
        <Field
          label={t("vehicleForms.log.odometer", { unit: distanceUnitLabel(unit) })}
          value={odometer}
          onChangeText={setOdometer}
          keyboardType="numeric"
          autoFocus
        />
        <Field
          label={t("vehicleForms.log.cost")}
          value={cost}
          onChangeText={setCost}
          keyboardType="numeric"
        />
        <Field label={t("vehicleForms.log.notes")} value={notes} onChangeText={setNotes} />
      </Card>
    </Screen>
  );
}
