import { useState } from "react";
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Field } from "../../src/design/Field";
import { Button } from "../../src/design/Button";
import { tokens } from "../../src/design/tokens";
import { createVehicle } from "../../src/db/vehicles";
import { setOnboardingStep } from "../../src/onboarding";

export default function OnboardingVehicle() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");

  function advance() {
    setOnboardingStep("odometer");
    router.push("/onboarding/odometer");
  }

  // A vehicle row is what makes the app usable — a user who skips still gets one.
  function onSkip() {
    createVehicle({ name: "My car" });
    advance();
  }

  function onContinue() {
    createVehicle({
      name: name.trim() || "My car",
      year: year ? Number(year) : undefined,
      make: make.trim() || undefined,
      model: model.trim() || undefined,
    });
    advance();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.color.bg }}>
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
          What are you driving?
        </Text>
        <Field label="Name it" value={name} onChangeText={setName} placeholder="Civic" autoFocus />
        <View style={{ flexDirection: "row", gap: tokens.space.sm }}>
          <View style={{ flex: 1 }}>
            <Field label="Year" value={year} onChangeText={setYear} keyboardType="numeric" />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Make" value={make} onChangeText={setMake} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Model" value={model} onChangeText={setModel} />
          </View>
        </View>
        <View style={{ flex: 1 }} />
        <Button label="Continue" onPress={onContinue} />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
