import { View, Text } from "react-native";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { Lamp } from "../../src/design/Lamp";
import { tokens } from "../../src/design/tokens";
import { t } from "../../src/i18n";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useOnboardingFindings } from "../../src/onboarding/usePlan";
import { useAdvance } from "../../src/onboarding/nav";

/**
 * The answer to the three screens before it, in the same order, from the same
 * objects. A generic "here is what the app does" list would have been easier
 * and would have thrown away the only advantage this flow has: the user has
 * just read three specific complaints about their own situation, and this
 * screen replies to those three rather than to an imagined average user.
 *
 * Every lamp is out. It is the same panel as the symptoms screen with the
 * alarms cleared, which is the entire argument made without a sentence.
 *
 * The Free/Pro capability grid used to sit underneath. It is gone: printing
 * the boundary here taught a user who has not yet seen a price that there is
 * one to avoid, and named the free tier as a place they could settle. The
 * paywall is where the split belongs. What is left is the reply to the three
 * complaints and nothing else, which is also what makes the screen fit a
 * phone.
 */
export default function OnboardingHelp() {
  const advance = useAdvance("help");
  const { cards } = useOnboardingFindings();

  return (
    <OnboardingScreen
      route="help"
      title={t("onboardingC.help.title")}
      subtitle={t("onboardingC.help.subtitle")}
      footer={
        <Button label={t("onboardingC.help.continue")} onPress={advance} />
      }
    >
      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.md }}>
          {cards.map((card) => (
            <View key={card.id} style={{ gap: tokens.space.xs }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: tokens.space.sm,
                }}
              >
                <Lamp lit={false} size={10} />
                <Text
                  style={{
                    ...tokens.text.legend,
                    color: tokens.color.textMuted,
                  }}
                >
                  {card.legend}
                </Text>
              </View>
              <Text style={{ ...tokens.text.body, color: tokens.color.text }}>
                {card.fix}
              </Text>
            </View>
          ))}
        </View>
      </Panel>
    </OnboardingScreen>
  );
}
