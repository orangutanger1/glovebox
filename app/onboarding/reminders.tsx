import { useState } from "react";
import { Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "../../src/design/Button";
import { tokens } from "../../src/design/tokens";
import { requestPermission, rescheduleAll } from "../../src/notify";
import { presentPaywall } from "../../src/purchases";
import { completeOnboarding } from "../../src/onboarding";
import { recordReviewEvent } from "../../src/review";
import { OnboardingScreen } from "../../src/onboarding/Screen";

export default function OnboardingReminders() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // Screen 7 (paywall) is a native RevenueCat modal, not a route — it is
  // presented here rather than as a separate screen in the stack.
  async function finish() {
    if (busy) return;
    setBusy(true);
    try {
      // Recorded, never acted on. Nothing in onboarding may ask for a rating —
      // App Store Review Guideline 5.6.3 treats soliciting one before the user
      // has meaningfully used the app as manipulating the App Store, and Apple
      // rejects for it. This only banks the signal for a later happy moment.
      if (await presentPaywall()) recordReviewEvent("purchase");
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
    <OnboardingScreen
      step={5}
      center
      title="Want a reminder when it is due?"
      subtitle="One notification per service, on the day it comes due. Nothing else, ever."
      footer={
        <>
          <Button label="Remind me" onPress={onRemindMe} disabled={busy} />
          <Pressable
            onPress={finish}
            disabled={busy}
            style={{ alignItems: "center", paddingVertical: tokens.space.sm }}
          >
            <Text style={{ ...tokens.text.legend, color: tokens.color.textMuted }}>Not now</Text>
          </Pressable>
        </>
      }
    />
  );
}
