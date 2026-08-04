import { useState } from "react";
import { Text } from "react-native";
import { Button } from "../../src/design/Button";
import { ChipRow } from "../../src/design/ChipRow";
import { tokens } from "../../src/design/tokens";
import { setAnswers } from "../../src/onboarding";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useAdvance } from "../../src/onboarding/nav";
import type { TrackingAnswer } from "../../src/onboarding/state";

const OPTIONS: readonly { value: TrackingAnswer; label: string }[] = [
  { value: "memory", label: "Memory" },
  { value: "receipts", label: "Receipts in the car" },
  { value: "spreadsheet", label: "A spreadsheet" },
  { value: "dealer", label: "My shop keeps it" },
  { value: "nothing", label: "Nothing at all" },
];

/**
 * The one question with no right answer, and the one that decides most of what
 * the user sees next: each option has its own finding on the symptoms screen
 * and its own answer on the screen after it. Someone with a spreadsheet does
 * not need to be told their records could be lost; they need to be told a
 * spreadsheet cannot notify them.
 */
export default function OnboardingTracking() {
  const advance = useAdvance("tracking");
  const [tracking, setTracking] = useState<TrackingAnswer | null>(null);

  function onContinue() {
    if (!tracking) return;
    setAnswers({ tracking });
    advance();
  }

  return (
    <OnboardingScreen
      route="tracking"
      title="How do you keep track today?"
      subtitle="Whatever it is, it is more than most people do."
      footer={<Button label="Continue" onPress={onContinue} disabled={!tracking} />}
    >
      <ChipRow
        legend="Today"
        options={OPTIONS}
        selected={tracking ? [tracking] : []}
        onPress={setTracking}
      />
      <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
        Whatever you pick, Glovebox exports everything you log as a CSV. It is free, and it stays
        free, so this is never the last app your records live in.
      </Text>
    </OnboardingScreen>
  );
}
