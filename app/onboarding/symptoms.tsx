import { useState } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { Lamp } from "../../src/design/Lamp";
import { StepLamps } from "../../src/design/StepLamps";
import { useTheme } from "../../src/design/theme";
import { tokens } from "../../src/design/tokens";
import { t } from "../../src/i18n";
import { setOnboardingStep } from "../../src/onboarding";
import { previousRoute } from "../../src/onboarding/flow";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useOnboardingFindings } from "../../src/onboarding/usePlan";
import { useAdvance } from "../../src/onboarding/nav";
import { useDwell } from "../../src/onboarding/useDwell";

/**
 * The three findings, one at a time, on the app's only red screens.
 *
 * Three routes would have been simpler to write and worse to use: the cards
 * are chosen from the user's answers, so a route per card means three files
 * that each re-derive the same selection and disagree the moment one of them
 * is edited. One route with an index also lets Back move between cards instead
 * of throwing all three away.
 *
 * Red is otherwise reserved for overdue and destructive, and it is spent here
 * on purpose. This is the one moment in the app that is supposed to feel like
 * a warning lamp coming on, and if the flow used red anywhere else it would
 * not work here.
 */

/**
 * How long each card holds Continue before it goes live.
 *
 * The three cards share one route and one button position, so three fast taps
 * used to skip two findings without either of them being on the glass long
 * enough to read a headline. Short enough to be about the spam and not about
 * reading speed: a user who means to move on barely notices it, and a user who
 * is drumming on the glass sees the second and third card at all.
 */
const DWELL_MS = 800;

export default function OnboardingSymptoms() {
  const c = useTheme();

  const router = useRouter();
  const advance = useAdvance("symptoms");
  const { cards } = useOnboardingFindings();
  const [index, setIndex] = useState(0);
  const ready = useDwell(DWELL_MS, index);

  const card = cards[index];

  function onBack() {
    if (index > 0) {
      setIndex(index - 1);
      return;
    }
    const previous = previousRoute("symptoms");
    if (!previous) return;
    setOnboardingStep(previous);
    if (router.canGoBack()) router.back();
    else router.replace(`/onboarding/${previous}` as never);
  }

  function onContinue() {
    if (index < cards.length - 1) setIndex(index + 1);
    else advance();
  }

  return (
    <OnboardingScreen
      route="symptoms"
      tone="alarm"
      onBack={onBack}
      legend={<StepLamps step={index + 1} total={cards.length} />}
      title={card.headline}
      footer={
        <Button
          label={t(
            index < cards.length - 1 ? "onboardingC.symptoms.next" : "onboardingC.symptoms.last"
          )}
          onPress={onContinue}
          disabled={!ready}
        />
      }
      center
    >
      <Panel>
        <View style={{ flexDirection: "row" }}>
          <View style={{ width: 3, backgroundColor: c.overdue }} />
          <View style={{ flex: 1, padding: tokens.space.md, gap: tokens.space.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.space.sm }}>
              <Lamp lit size={14} />
              <Text style={{ ...tokens.text.legend, color: c.ink }}>{card.legend}</Text>
            </View>
            <Text style={{ ...tokens.text.body, color: c.ink }}>{card.body}</Text>
          </View>
        </View>
      </Panel>
    </OnboardingScreen>
  );
}
