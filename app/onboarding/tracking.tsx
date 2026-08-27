import { useMemo, useState } from "react";
import { Button } from "../../src/design/Button";
import { ChipRow } from "../../src/design/ChipRow";
import { t } from "../../src/i18n";
import { getAnswers, setAnswers } from "../../src/onboarding";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useAdvance } from "../../src/onboarding/nav";
import { trackQuizAnswer } from "../../src/analytics";
import { TRACKING_ANSWERS, type TrackingAnswer } from "../../src/onboarding/state";

/** The answers are what gets stored and read back by the screens after this
 *  one, so the copy hangs off them rather than the other way round. */
const LABEL_KEYS: Record<TrackingAnswer, string> = {
  memory: "onboardingB.tracking.memory",
  receipts: "onboardingB.tracking.receipts",
  spreadsheet: "onboardingB.tracking.spreadsheet",
  dealer: "onboardingB.tracking.dealer",
  nothing: "onboardingB.tracking.nothing",
};

/**
 * The one question with no right answer, and the one that decides most of what
 * the user sees next: each option has its own finding on the symptoms screen
 * and its own answer on the screen after it. Someone with a spreadsheet does
 * not need to be told their records could be lost; they need to be told a
 * spreadsheet cannot notify them.
 */
export default function OnboardingTracking() {
  const advance = useAdvance("tracking");
  // Filled from what was already answered, so Back and Continue return the
  // user to their own choice instead of an empty row of chips.
  const [tracking, setTracking] = useState<TrackingAnswer | null>(
    () => getAnswers().tracking ?? null
  );

  // Built at render rather than at import, so the labels are in the language
  // that is active now and not the one loaded when this file was imported.
  const options = useMemo(
    () => TRACKING_ANSWERS.map((value) => ({ value, label: t(LABEL_KEYS[value]) })),
    []
  );

  function onContinue() {
    if (!tracking) return;
    setAnswers({ tracking });
    trackQuizAnswer("tracking", { tracking });
    advance();
  }

  return (
    <OnboardingScreen
      route="tracking"
      title={t("onboardingB.tracking.title")}
      footer={
        <Button label={t("onboardingB.continue")} onPress={onContinue} disabled={!tracking} />
      }
    >
      <ChipRow
        legend={t("onboardingB.tracking.legend")}
        options={options}
        selected={tracking ? [tracking] : []}
        onPress={setTracking}
      />
    </OnboardingScreen>
  );
}
