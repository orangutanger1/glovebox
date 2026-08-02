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

export default function LogService() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const vehicle = getVehicle(id);

  const [type, setType] = useState("Oil Change");
  const [daysAgo, setDaysAgo] = useState(0);
  // Prefilled so the user edits three digits instead of typing six. This field
  // gets autofocus, not the type chips — the chips are already answered.
  const [odometer, setOdometer] = useState(vehicle?.odometer ? String(vehicle.odometer) : "");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  async function onSave() {
    try {
      const performed = new Date();
      performed.setDate(performed.getDate() - daysAgo);
      addRecord({
        vehicle_id: id,
        service_type: type,
        performed_at: performed.toISOString(),
        odometer: odometer ? Number(odometer) : undefined,
        cost: cost ? Number(cost) : undefined,
        notes: notes.trim() || undefined,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await rescheduleAll();
      router.back();
    } catch (e) {
      // Never clear the form on failure. The user's typing is the thing we protect.
      setError("Could not save. Your entry is still here. Try again.");
    }
  }

  return (
    <Screen title="Log a service">
      <Card>
        <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>WHAT</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: tokens.space.sm }}>
          {COMMON.map((t) => (
            <Chip key={t} label={t} selected={t === type} onPress={() => setType(t)} />
          ))}
        </View>
      </Card>
      <Card>
        <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>WHEN</Text>
        <View style={{ flexDirection: "row", gap: tokens.space.sm }}>
          {WHEN.map((w) => (
            <Chip
              key={w.label}
              label={w.label}
              selected={daysAgo === w.days}
              onPress={() => setDaysAgo(w.days)}
            />
          ))}
        </View>
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
      {error ? <Text style={{ ...tokens.text.body, color: tokens.color.due }}>{error}</Text> : null}
      <Button label="Save" onPress={onSave} />
    </Screen>
  );
}
