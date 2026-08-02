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

  return (
    <Screen title="Settings">
      <Card>
        <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
          Your records live on this phone only. No account, no server. Export any time.
        </Text>
      </Card>
      <Button label="Export all records (CSV)" onPress={() => exportAndShare()} />
      <Button
        label="Enable reminders"
        variant="secondary"
        onPress={async () => setMsg((await requestPermission()) ? "Reminders on." : "Reminders denied.")}
      />
      <Button
        label="Restore purchases"
        variant="secondary"
        onPress={async () => setMsg((await restore()) ? "Pro restored." : "No purchase found.")}
      />
      {msg ? <Text style={{ color: tokens.color.textMuted }}>{msg}</Text> : null}
    </Screen>
  );
}
