import { useState } from "react";
import { View, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "../../../src/design/Screen";
import { Card } from "../../../src/design/Card";
import { Chip } from "../../../src/design/Chip";
import { Field } from "../../../src/design/Field";
import { Button } from "../../../src/design/Button";
import { tokens } from "../../../src/design/tokens";
import { getVehicle } from "../../../src/db/vehicles";
import { addRecord } from "../../../src/db/records";
import { rescheduleAll } from "../../../src/notify";
import { parseNumber, parseDateInput } from "../../../src/format";

// The six people actually log. Everything else lives behind "Other".
const COMMON = [
  "Oil Change",
  "Tire Rotation",
  "Brake Inspection",
  "Air Filter",
  "Inspection",
  "Other",
];

const WHEN = [
  { label: "Today", days: 0 },
  { label: "Yesterday", days: 1 },
];

// The two chips cover the common case in one tap; anything older is typed.
// Sentinel rather than a magic number of days, so "custom" can never collide
// with a real offset.
const CUSTOM = "custom";

export default function LogService() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const vehicle = getVehicle(id);

  const [type, setType] = useState("Oil Change");
  const [daysAgo, setDaysAgo] = useState<number | typeof CUSTOM>(0);
  const [dateText, setDateText] = useState("");
  // Prefilled so the user edits three digits instead of typing six. This field
  // gets autofocus, not the type chips — the chips are already answered.
  const [odometer, setOdometer] = useState(vehicle?.odometer ? String(vehicle.odometer) : "");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function onSave() {
    if (saving) return;
    setSaving(true);
    setError("");

    let performed: Date;
    if (daysAgo === CUSTOM) {
      const parsed = parseDateInput(dateText);
      if (!parsed) {
        // Both rejections named, because "invalid date" leaves the user
        // retyping the same thing: the shape may be fine and the day still
        // impossible, or the date may simply not have happened yet.
        setError("Enter a past date as MM/DD/YYYY — 3/14/2026.");
        setSaving(false);
        return;
      }
      performed = parsed;
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
      setError("Could not save. Your entry is still here. Try again.");
      setSaving(false);
      return;
    }

    // The record is already committed. Everything past this point is a nicety,
    // and a notification that fails to schedule must never be reported to the
    // user as a lost service record.
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    rescheduleAll().catch(() => {});
    router.back();
  }

  return (
    <Screen
      title="Log a service"
      footer={
        <>
          {error ? (
            <Text style={{ ...tokens.text.body, color: tokens.color.red }}>{error}</Text>
          ) : null}
          <Button label="Save" onPress={onSave} disabled={saving} />
        </>
      }
    >
      <Card>
        <Text style={{ ...tokens.text.legend, color: tokens.color.textMuted }}>What</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: tokens.space.sm }}>
          {COMMON.map((t) => (
            <Chip key={t} label={t} selected={t === type} onPress={() => setType(t)} />
          ))}
        </View>
      </Card>
      <Card>
        <Text style={{ ...tokens.text.legend, color: tokens.color.textMuted }}>When</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: tokens.space.sm }}>
          {WHEN.map((w) => (
            <Chip
              key={w.label}
              label={w.label}
              selected={daysAgo === w.days}
              onPress={() => setDaysAgo(w.days)}
            />
          ))}
          <Chip
            label="Other date"
            selected={daysAgo === CUSTOM}
            onPress={() => setDaysAgo(CUSTOM)}
          />
        </View>
        {daysAgo === CUSTOM ? (
          <Field
            label="Date"
            value={dateText}
            onChangeText={setDateText}
            placeholder="MM/DD/YYYY"
          />
        ) : null}
      </Card>
      <Card>
        <Field
          label="Odometer"
          value={odometer}
          onChangeText={setOdometer}
          keyboardType="numeric"
          autoFocus
        />
        <Field label="Cost (optional)" value={cost} onChangeText={setCost} keyboardType="numeric" />
        <Field label="Notes (optional)" value={notes} onChangeText={setNotes} />
      </Card>
    </Screen>
  );
}
