import { useState } from "react";
import { Alert, Text } from "react-native";
import { useRouter } from "expo-router";
import { Screen } from "../src/design/Screen";
import { Card } from "../src/design/Card";
import { Button } from "../src/design/Button";
import { tokens } from "../src/design/tokens";
import { exportAndShare } from "../src/export/share";
import { restore } from "../src/purchases";
import { requestPermission } from "../src/notify";
import { resetOnboarding } from "../src/onboarding";

export default function Settings() {
  const router = useRouter();
  const [msg, setMsg] = useState("");

  // Every one of these calls out to the OS or to RevenueCat and can reject.
  // An unhandled rejection here left the user tapping a button that did
  // nothing and said nothing.
  async function onExport() {
    try {
      await exportAndShare();
    } catch {
      setMsg("Could not open the share sheet. Your records are unchanged.");
    }
  }

  async function onReminders() {
    try {
      setMsg((await requestPermission()) ? "Reminders on." : "Reminders denied.");
    } catch {
      setMsg("Could not ask for notification permission.");
    }
  }

  async function onRestore() {
    try {
      setMsg((await restore()) ? "Pro restored." : "No purchase found.");
    } catch {
      setMsg("Could not reach the store. Try again on a better connection.");
    }
  }

  // Replaying is for seeing the flow again, so it must not read as a reset —
  // it leaves every vehicle and record alone and adds one more vehicle on the
  // way through, which the confirmation says out loud before anything happens.
  function onReplayOnboarding() {
    Alert.alert(
      "Replay onboarding?",
      "Your vehicles and records are kept. Walking the flow again adds another vehicle, which you can delete afterwards.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Replay",
          onPress: () => {
            resetOnboarding();
            router.replace("/onboarding/welcome");
          },
        },
      ]
    );
  }

  return (
    <Screen title="Settings">
      <Card>
        <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
          Your records live on this phone only. No account, no server. Export any time — export is
          never gated.
        </Text>
      </Card>
      <Button label="Export all records (CSV)" onPress={onExport} />
      <Button label="Enable reminders" variant="secondary" onPress={onReminders} />
      <Button label="Restore purchases" variant="secondary" onPress={onRestore} />
      <Button label="Replay onboarding" variant="secondary" onPress={onReplayOnboarding} />
      {msg ? (
        <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>{msg}</Text>
      ) : null}
    </Screen>
  );
}
