import { useState } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { Lamp } from "../../src/design/Lamp";
import { StepLamps } from "../../src/design/StepLamps";
import { tokens } from "../../src/design/tokens";
import { setOnboardingStep } from "../../src/onboarding";
import { previousRoute } from "../../src/onboarding/flow";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useOnboardingFindings } from "../../src/onboarding/usePlan";
import { useAdvance } from "../../src/onboarding/nav";

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
export default function OnboardingSymptoms() {
  const router = useRouter();
  const advance = useAdvance("symptoms");
  const { cards } = useOnboardingFindings();
  const [index, setIndex] = useState(0);

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
          label={index < cards.length - 1 ? "Continue" : "So what do I do"}
          onPress={onContinue}
        />
      }
      center
    >
      <Panel>
        <View style={{ flexDirection: "row" }}>
          <View style={{ width: 3, backgroundColor: tokens.color.red }} />
          <View style={{ flex: 1, padding: tokens.space.md, gap: tokens.space.md }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.space.sm }}>
              <Lamp lit size={14} />
              <Text style={{ ...tokens.text.legend, color: tokens.color.text }}>{card.legend}</Text>
            </View>
            <Text style={{ ...tokens.text.body, color: tokens.color.text }}>{card.body}</Text>
          </View>
        </View>
      </Panel>
    </OnboardingScreen>
  );
}
