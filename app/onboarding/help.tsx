import { View, Text } from "react-native";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { Lamp } from "../../src/design/Lamp";
import { tokens } from "../../src/design/tokens";
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
 */
export default function OnboardingHelp() {
  const advance = useAdvance("help");
  const { cards } = useOnboardingFindings();

  return (
    <OnboardingScreen
      route="help"
      title="All three are the same problem."
      subtitle="Nothing is written down in a form that can warn you. That is the whole of what Glovebox does."
      footer={<Button label="Continue" onPress={advance} />}
    >
      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.lg }}>
          {cards.map((card) => (
            <View key={card.id} style={{ gap: tokens.space.xs }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: tokens.space.sm }}>
                <Lamp lit={false} size={10} />
                <Text style={{ ...tokens.text.legend, color: tokens.color.textMuted }}>
                  {card.legend}
                </Text>
              </View>
              <Text style={{ ...tokens.text.body, color: tokens.color.text }}>{card.fix}</Text>
            </View>
          ))}
        </View>
      </Panel>
    </OnboardingScreen>
  );
}
