import { useMemo, useState } from "react";
import { Button } from "../../src/design/Button";
import { OptionCards } from "../../src/design/OptionCards";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useAdvance } from "../../src/onboarding/nav";
import { trackStepBlocked } from "../../src/analytics";
import { SOURCES, getSource, recordSource, type Source } from "../../src/survey";
import { t } from "../../src/i18n";

/**
 * "How did you hear about us?" One answer, one tap, then Continue.
 *
 * Answered the same way as every question in the quiz, so it reads as one of
 * them rather than as a survey bolted onto the end. "Other" is the last card
 * and it is an answer: the question must never be the reason a user stops.
 */
export default function OnboardingSource() {
  const advance = useAdvance("source");
  // Persisted, so Back shows the answer already given.
  const [source, setSource] = useState<Source | null>(() => getSource());
  const options = useMemo(
    () => SOURCES.map((value) => ({ value, label: t(`survey.source.${value}`) })),
    []
  );

  function onContinue() {
    if (!source) return;
    recordSource(source);
    advance();
  }

  return (
    <OnboardingScreen
      route="source"
      title={t("survey.source.title")}
      footer={
        <Button
          label={t("onboardingA.continue")}
          onPress={onContinue}
          disabled={!source}
          onBlockedPress={() => trackStepBlocked("source", "unanswered")}
        />
      }
    >
      <OptionCards options={options} selected={source ? [source] : []} onPress={setSource} />
    </OnboardingScreen>
  );
}
