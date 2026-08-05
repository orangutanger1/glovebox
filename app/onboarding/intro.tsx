import { View } from "react-native";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { ListRow } from "../../src/design/ListRow";
import { tokens } from "../../src/design/tokens";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useAdvance } from "../../src/onboarding/nav";

/**
 * The contract screen: what is about to be asked, how long it takes, and where
 * the answers go.
 *
 * A quiz that starts without one is the pattern people have learned to close.
 * Naming the three things up front costs a tap and buys the six questions
 * after it, and the third line is the differentiator the app leads with
 * everywhere else: there is no account, so there is nowhere for any of this
 * to be sent.
 */
const ASKS = [
  {
    title: "What you are driving",
    subtitle: "Year, make, model, and what the odometer reads right now",
  },
  {
    title: "How you drive it",
    subtitle: "Miles a year, which is what turns a mileage interval into a date",
  },
  {
    title: "What you are trying to avoid",
    subtitle: "The bill, the missed service, or the paperwork nobody kept",
  },
];

export default function OnboardingIntro() {
  const advance = useAdvance("intro");

  return (
    <OnboardingScreen
      route="intro"
      title="Six questions about your car."
      subtitle="About a minute, and none of your answers leave this phone."
      footer={<Button label="Get started" onPress={advance} />}
    >
      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.xs }}>
          {ASKS.map((ask) => (
            <ListRow key={ask.title} title={ask.title} subtitle={ask.subtitle} />
          ))}
        </View>
      </Panel>
    </OnboardingScreen>
  );
}
