import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Chip } from "../../src/design/Chip";
import { tokens } from "../../src/design/tokens";
import { listVehicles } from "../../src/db/vehicles";
import { addRecord } from "../../src/db/records";
import { setOnboardingStep } from "../../src/onboarding";

const TYPES = [
  "Oil Change",
  "Tire Rotation",
  "Brake Inspection",
  "Air Filter",
  "Inspection",
  "Something else",
];

// Approximate answers are allowed. "Not sure" skips the record entirely — the
// safe direction to be wrong in, since the app then treats the service as due now.
const WHEN: { label: string; daysAgo: number | null }[] = [
  { label: "Just now", daysAgo: 0 },
  { label: "Last month", daysAgo: 30 },
  { label: "3 months ago", daysAgo: 90 },
  { label: "6 months ago", daysAgo: 180 },
  { label: "Not sure", daysAgo: null },
];

export default function OnboardingService() {
  const router = useRouter();
  const [type, setType] = useState<string | null>(null);

  function advance() {
    setOnboardingStep("ready");
    router.push("/onboarding/ready");
  }

  function onSkip() {
    advance();
  }

  function onPickWhen(daysAgo: number | null) {
    if (type !== null && daysAgo !== null) {
      const vehicle = listVehicles()[0];
      const performed = new Date();
      performed.setDate(performed.getDate() - daysAgo);
      addRecord({
        vehicle_id: vehicle.id,
        service_type: type === "Something else" ? "Other" : type,
        performed_at: performed.toISOString(),
        odometer: vehicle.odometer,
      });
    }
    advance();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.color.bg }}>
      <View style={{ flex: 1, padding: tokens.space.md, gap: tokens.space.lg }}>
        <Pressable onPress={onSkip} style={{ alignSelf: "flex-end" }}>
          <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>Skip</Text>
        </Pressable>

        {type === null ? (
          <>
            <Text style={{ ...tokens.text.title, color: tokens.color.text }}>
              What did you last get done?
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: tokens.space.sm }}>
              {TYPES.map((t) => (
                <Chip key={t} label={t} selected={false} onPress={() => setType(t)} />
              ))}
            </View>
            <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
              Tap one. You can log the rest anytime.
            </Text>
          </>
        ) : (
          <>
            <Text style={{ ...tokens.text.title, color: tokens.color.text }}>
              When was the {type.toLowerCase()}?
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: tokens.space.sm }}>
              {WHEN.map((w) => (
                <Chip
                  key={w.label}
                  label={w.label}
                  selected={false}
                  onPress={() => onPickWhen(w.daysAgo)}
                />
              ))}
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
