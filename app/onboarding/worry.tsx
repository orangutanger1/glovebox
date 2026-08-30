import { useMemo, useState } from "react";
import { Button } from "../../src/design/Button";
import { ChipRow } from "../../src/design/ChipRow";
import { t } from "../../src/i18n";
import { getAnswers, setAnswers } from "../../src/onboarding";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useAdvance } from "../../src/onboarding/nav";
import { trackQuizAnswer, trackStepBlocked } from "../../src/analytics";
import { WORRY_ANSWERS, type WorryAnswer } from "../../src/onboarding/state";

const LABEL_KEYS: Record<WorryAnswer, string> = {
  bills: "onboardingB.worry.bills",
  missed: "onboardingB.worry.missed",
  records: "onboardingB.worry.records",
  resale: "onboardingB.worry.resale",
  upsell: "onboardingB.worry.upsell",
};

/**
 * The last question, and now a required one.
 *
 * It decides which three findings the flow shows next, and every screen in
 * onboarding is mandatory: an empty answer sent the user into the argument
 * built from their car alone, which is the weakest version of it available.
 * Continue stays shut until one chip is on, and the chips are multi-select, so
 * the cost of the requirement is a single tap.
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
    if (worries.length === 0) return;
    // Stored in the question's order rather than the tap order: the findings
    // screen reads down this list, and two users who picked the same three
    // things should be shown the same three things.
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
      footer={
        <Button
          label={t("onboardingB.continue")}
          onPress={onContinue}
          disabled={worries.length === 0}
          onBlockedPress={() => trackStepBlocked("worry", "unanswered")}
        />
      }
    >
      <ChipRow options={options} selected={worries} onPress={toggle} />
    </OnboardingScreen>
  );
}
