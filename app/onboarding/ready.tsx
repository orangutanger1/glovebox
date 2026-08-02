import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "../../src/design/Button";
import { tokens } from "../../src/design/tokens";
import { listVehicles } from "../../src/db/vehicles";
import { listRecords } from "../../src/db/records";
import { nextDue, DEFAULT_INTERVALS } from "../../src/schedule";
import { setOnboardingStep } from "../../src/onboarding";

const HEADLINE_TYPES = ["Oil Change", "Tire Rotation", "Brake Inspection"];

export default function OnboardingReady() {
  const router = useRouter();
  const vehicle = listVehicles()[0];
  const records = listRecords(vehicle.id);

  function onContinue() {
    setOnboardingStep("reminders");
    router.push("/onboarding/reminders");
  }

  const lines = HEADLINE_TYPES.map((type) => {
    const record = records.find((r) => r.service_type === type);
    if (!record) return { type, line: "not logged yet" };
    const due = nextDue({
      lastPerformedAt: record.performed_at,
      lastOdometer: record.odometer,
      interval: DEFAULT_INTERVALS[type],
    });
    const parts: string[] = [];
    if (due.dueAt) parts.push(`due ${new Date(due.dueAt).toLocaleDateString()}`);
    if (due.dueOdometer) parts.push(`${due.dueOdometer.toLocaleString()} mi`);
    return { type, line: parts.join(" · ") || "not logged yet" };
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.color.bg }}>
      <View
        style={{ flex: 1, padding: tokens.space.md, gap: tokens.space.lg, justifyContent: "center" }}
      >
        <Text style={{ ...tokens.text.title, color: tokens.color.text }}>
          Done. Here is what Glovebox knows.
        </Text>
        <Text style={{ ...tokens.text.body, ...tokens.text.numeric, color: tokens.color.textMuted }}>
          {vehicle.name}
          {vehicle.odometer ? ` · ${vehicle.odometer.toLocaleString()} mi` : ""}
        </Text>
        <View style={{ gap: tokens.space.sm }}>
          {lines.map((l) => (
            <View
              key={l.type}
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ ...tokens.text.body, color: tokens.color.text }}>{l.type}</Text>
              <Text
                style={{ ...tokens.text.body, ...tokens.text.numeric, color: tokens.color.textMuted }}
              >
                {l.line}
              </Text>
            </View>
          ))}
        </View>
        <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
          Whichever comes first, date or mileage.
        </Text>
      </View>
      <View style={{ padding: tokens.space.md }}>
        <Button label="Continue" onPress={onContinue} />
      </View>
    </SafeAreaView>
  );
}
