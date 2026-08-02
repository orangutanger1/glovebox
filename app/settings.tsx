import { useState } from "react";
import { Text } from "react-native";
import { Screen } from "../src/design/Screen";
import { Card } from "../src/design/Card";
import { Button } from "../src/design/Button";
import { tokens } from "../src/design/tokens";
import { exportAndShare } from "../src/export/share";
import { restore } from "../src/purchases";
import { requestPermission } from "../src/notify";

export default function Settings() {
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
      {msg ? (
        <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>{msg}</Text>
      ) : null}
    </Screen>
  );
}
