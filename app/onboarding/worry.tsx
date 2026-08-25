import { useMemo, useState } from "react";
import { Text } from "react-native";
import { Button } from "../../src/design/Button";
import { ChipRow } from "../../src/design/ChipRow";
import { tokens } from "../../src/design/tokens";
import { t } from "../../src/i18n";
import { getAnswers, setAnswers } from "../../src/onboarding";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useAdvance } from "../../src/onboarding/nav";
import { trackQuizAnswer } from "../../src/analytics";
import { WORRY_ANSWERS, type WorryAnswer } from "../../src/onboarding/state";

const LABEL_KEYS: Record<WorryAnswer, string> = {
  bills: "onboardingB.worry.bills",
  missed: "onboardingB.worry.missed",
  records: "onboardingB.worry.records",
  resale: "onboardingB.worry.resale",
  upsell: "onboardingB.worry.upsell",
};

/**
 * The last question, and the one that used to open on a dead button.
 *
 * Continue was disabled until something was picked, which put a refusal on the
 * final step of the quiz for the entirely reasonable answer "none of these
 * bother me especially". Nothing downstream needed the refusal: `painCards`
 * reads an empty worry set as no preference and fills the three cards from the
 * user's own plan and their tracking answer, which are facts about their car
 * rather than a mood. An empty answer is an answer, and it is now allowed to
 * be one.
 */
export default function OnboardingWorry() {
  const advance = useAdvance("worry");
  // The last question, and the one most likely to be revisited: it decides
  // which findings the rest of the flow shows. It comes back filled in.
  const [worries, setWorries] = useState<WorryAnswer[]>(() => getAnswers().worries ?? []);

  /** Built from the canonical order so the chips, the stored answer and the
   *  symptom cards can never disagree about what comes first. */
  const options = useMemo(
    () => WORRY_ANSWERS.map((value) => ({ value, label: t(LABEL_KEYS[value]) })),
    []
  );

  function toggle(value: WorryAnswer) {
    setWorries((current) =>
      current.includes(value) ? current.filter((w) => w !== value) : [...current, value]
    );
  }

  function onContinue() {
    // Stored in the question's order rather than the tap order: the findings
    // screen reads down this list, and two users who picked the same three
    // things should be shown the same three things. An empty list is written as
    // one and read back as "not answered", which is exactly what it means: no
    // strong preference, so the cards come from the car.
    const chosen = WORRY_ANSWERS.filter((w) => worries.includes(w));
    setAnswers({ worries: chosen });
    trackQuizAnswer("worry", { worries: chosen });
    advance();
  }

  return (
    <OnboardingScreen
      route="worry"
      title={t("onboardingB.worry.title")}
      subtitle={t("onboardingB.worry.subtitle")}
      footer={<Button label={t("onboardingB.continue")} onPress={onContinue} />}
    >
      <ChipRow options={options} selected={worries} onPress={toggle} />
      <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
        {worries.length === 0
          ? t("onboardingB.worry.optional")
          : t("onboardingB.worry.caption")}
      </Text>
    </OnboardingScreen>
  );
}
