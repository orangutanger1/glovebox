import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "../../src/design/Button";
import { tokens } from "../../src/design/tokens";
import { requestPermission } from "../../src/notify";
import { presentPaywall } from "../../src/purchases";
import { completeOnboarding } from "../../src/onboarding";

export default function OnboardingReminders() {
  const router = useRouter();

  // Screen 7 (paywall) is a native RevenueCat modal, not a route — it is
  // presented here rather than as a separate screen in the stack.
  async function finish() {
    await presentPaywall();
    completeOnboarding();
    router.replace("/");
  }

  async function onRemindMe() {
    await requestPermission();
    await finish();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.color.bg }}>
      <View
        style={{ flex: 1, padding: tokens.space.md, gap: tokens.space.lg, justifyContent: "center" }}
      >
        <Text style={{ ...tokens.text.title, color: tokens.color.text }}>
          Want a reminder when it is due?
        </Text>
        <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
          One notification per service, on the day it comes due. Nothing else, ever.
        </Text>
      </View>
      <View style={{ padding: tokens.space.md, gap: tokens.space.md }}>
        <Button label="Remind me" onPress={onRemindMe} />
        <Pressable onPress={finish} style={{ alignItems: "center", paddingVertical: tokens.space.sm }}>
          <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>Not now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
