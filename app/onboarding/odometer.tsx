import { useState } from "react";
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Field } from "../../src/design/Field";
import { Button } from "../../src/design/Button";
import { tokens } from "../../src/design/tokens";
import { listVehicles, setOdometerIfHigher } from "../../src/db/vehicles";
import { setOnboardingStep } from "../../src/onboarding";
import { parseNumber } from "../../src/format";

export default function OnboardingOdometer() {
  const router = useRouter();
  const [odometer, setOdometer] = useState("");

  function advance() {
    setOnboardingStep("service");
    router.push("/onboarding/service");
  }

  function onSkip() {
    advance();
  }

  function onContinue() {
    const vehicle = listVehicles()[0];
    // The placeholder on this very field shows "84,210", so a user copying its
    // format produced NaN and silently lost their reading.
    const miles = parseNumber(odometer);
    if (vehicle && miles !== undefined) {
      setOdometerIfHigher(vehicle.id, miles);
    }
    advance();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.color.housing }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, padding: tokens.space.md, gap: tokens.space.lg }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <Pressable onPress={onSkip} style={{ alignSelf: "flex-end" }}>
          <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>Skip</Text>
        </Pressable>
        <Text style={{ ...tokens.text.title, color: tokens.color.text }}>
          How many miles on it?
        </Text>
        <Field
          label="Odometer"
          value={odometer}
          onChangeText={setOdometer}
          keyboardType="numeric"
          placeholder="84,210"
          autoFocus
        />
        <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
          Used to work out what is due by mileage, not just by date.
          {"\n"}Then reminders will use dates only, if skipped.
        </Text>
        <View style={{ flex: 1 }} />
        <Button label="Continue" onPress={onContinue} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
