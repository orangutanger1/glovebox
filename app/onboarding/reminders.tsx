import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Button } from "../../src/design/Button";
import { tokens } from "../../src/design/tokens";
import { requestPermission, rescheduleAll } from "../../src/notify";
import { presentPaywall } from "../../src/purchases";
import { completeOnboarding } from "../../src/onboarding";

export default function OnboardingReminders() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // Screen 7 (paywall) is a native RevenueCat modal, not a route — it is
  // presented here rather than as a separate screen in the stack.
  async function finish() {
    if (busy) return;
    setBusy(true);
    try {
      await presentPaywall();
    } catch {
      // A paywall that fails to present — no API key in the build, no network,
      // products not yet fetchable from the store — must not strand the user.
      // The onboarding step is persisted, so throwing here would leave them
      // reopening the app into the same dead screen forever.
    }
    completeOnboarding();
    router.replace("/");
  }

  async function onRemindMe() {
    if (busy) return;
    try {
      // Reminders are scheduled at launch, but at launch permission had not
      // been granted yet and rescheduleAll bailed out. Without this call the
      // service just logged during onboarding gets no notification until some
      // later cold start.
      if (await requestPermission()) await rescheduleAll();
    } catch {
      // Denied or unavailable. The app works without notifications.
    }
    await finish();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: tokens.color.housing }}>
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
        <Button label="Remind me" onPress={onRemindMe} disabled={busy} />
        <Pressable
          onPress={finish}
          disabled={busy}
          style={{ alignItems: "center", paddingVertical: tokens.space.sm }}
        >
          <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>Not now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
