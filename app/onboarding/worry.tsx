import { useState } from "react";
import { Text } from "react-native";
import { Button } from "../../src/design/Button";
import { ChipRow } from "../../src/design/ChipRow";
import { tokens } from "../../src/design/tokens";
import { getAnswers, setAnswers } from "../../src/onboarding";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useAdvance } from "../../src/onboarding/nav";
import { WORRY_ANSWERS, type WorryAnswer } from "../../src/onboarding/state";

const LABELS: Record<WorryAnswer, string> = {
  bills: "Surprise repair bills",
  missed: "Missing a service",
  records: "Losing the records",
  resale: "Resale value",
  upsell: "Getting upsold",
};

/** Built from the canonical order so the chips, the stored answer and the
 *  symptom cards can never disagree about what comes first. */
const OPTIONS = WORRY_ANSWERS.map((value) => ({ value, label: LABELS[value] }));

export default function OnboardingWorry() {
  const advance = useAdvance("worry");
  // The last question, and the one most likely to be revisited: it decides
  // which findings the rest of the flow shows. It comes back filled in.
  const [worries, setWorries] = useState<WorryAnswer[]>(() => getAnswers().worries ?? []);

  function toggle(value: WorryAnswer) {
    setWorries((current) =>
      current.includes(value) ? current.filter((w) => w !== value) : [...current, value]
    );
  }

  function onContinue() {
    if (worries.length === 0) return;
    // Stored in the question's order rather than the tap order: the findings
    // screen reads down this list, and two users who picked the same three
    // things should be shown the same three things.
    setAnswers({ worries: WORRY_ANSWERS.filter((w) => worries.includes(w)) });
    advance();
  }

  return (
    <OnboardingScreen
      route="worry"
      title="What are you trying to avoid?"
      subtitle="Pick as many as apply, since this decides what the app puts in front of you."
      footer={
        <Button label="Continue" onPress={onContinue} disabled={worries.length === 0} />
      }
    >
      <ChipRow options={OPTIONS} selected={worries} onPress={toggle} />
      <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
        Last one, and the next screen is about your car rather than about the app.
      </Text>
    </OnboardingScreen>
  );
}
