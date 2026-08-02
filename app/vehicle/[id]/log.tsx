import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Screen } from "../../../src/design/Screen";
import { Card } from "../../../src/design/Card";
import { Field } from "../../../src/design/Field";
import { Button } from "../../../src/design/Button";
import { tokens } from "../../../src/design/tokens";
import { addRecord } from "../../../src/db/records";
import { DEFAULT_INTERVALS } from "../../../src/schedule";
import { rescheduleAll } from "../../../src/notify";

const TYPES = Object.keys(DEFAULT_INTERVALS);

export default function LogService() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [type, setType] = useState(TYPES[0]);
  const [odometer, setOdometer] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  async function onSave() {
    try {
      addRecord({
        vehicle_id: id,
        service_type: type,
        performed_at: new Date().toISOString(),
        odometer: odometer ? Number(odometer) : undefined,
        cost: cost ? Number(cost) : undefined,
        notes: notes.trim() || undefined,
      });
      await rescheduleAll();
      router.back();
    } catch (e) {
      // Never clear the form on failure. The user's typing is the thing we protect.
      setError("Could not save. Your entry is still here — try again.");
    }
  }

  return (
    <Screen title="Log service">
      <Card>
        <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>Service</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: tokens.space.sm }}>
          {TYPES.map((t) => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              style={{
                paddingHorizontal: tokens.space.sm,
                paddingVertical: 6,
                borderRadius: tokens.radius.sm,
                borderWidth: 1,
                borderColor: t === type ? tokens.color.accent : tokens.color.border,
                backgroundColor: t === type ? tokens.color.accent + "22" : "transparent",
              }}
            >
              <Text style={{ ...tokens.text.caption, color: tokens.color.text }}>{t}</Text>
            </Pressable>
          ))}
        </View>
      </Card>
      <Card>
        <Field label="Mileage" value={odometer} onChangeText={setOdometer} keyboardType="numeric" />
        <Field label="Cost" value={cost} onChangeText={setCost} keyboardType="numeric" />
        <Field label="Notes" value={notes} onChangeText={setNotes} />
      </Card>
      {error ? <Text style={{ color: tokens.color.due }}>{error}</Text> : null}
      <Button label="Save" onPress={onSave} />
    </Screen>
  );
}
