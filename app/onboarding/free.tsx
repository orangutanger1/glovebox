import { View, Text } from "react-native";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { ListRow } from "../../src/design/ListRow";
import { Badge } from "../../src/design/Badge";
import { tokens } from "../../src/design/tokens";
import { FREE_FEATURES } from "../../src/onboarding/features";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useOnboardingFindings } from "../../src/onboarding/usePlan";
import { useFinish } from "../../src/onboarding/nav";

/**
 * The last screen, and the only one that offers to start for nothing.
 *
 * It exists because the free door had to be moved, not removed. It used to sit
 * under the paywall button as a text link, where it was a free alternative
 * printed next to a price and read by everybody who had not already decided to
 * pay. Now a user reaches it by declining the subscription and then declining
 * the trial, so the two asks are made against no cheaper option on the glass,
 * and the free start is offered to the people who were never going to convert
 * on this session anyway.
 *
 * What it is not is a punishment or a fourth ask. There is no price on it, no
 * "are you sure", and no locked rows: the four things listed are free forever,
 * they are the same four rows the features screen already badged Free, and the
 * plan the user built in the quiz is waiting behind the button. Pro is one
 * line at the bottom, stated once, because a user who declined twice has
 * answered and the app's own review corpus is full of people leaving over
 * being asked a third time.
 */
export default function OnboardingFree() {
  const finish = useFinish();
  const { vehicleName, plan } = useOnboardingFindings();

  return (
    <OnboardingScreen
      route="free"
      title="Start in free mode."
      subtitle={`Your ${vehicleName} and its ${plan.items.length} scheduled services are already saved on this phone. Free mode keeps all of it.`}
      footer={<Button label="Start with the free app" onPress={finish} />}
    >
      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.xs }}>
          {FREE_FEATURES.map((feature) => (
            <ListRow
              key={feature.title}
              title={feature.title}
              subtitle={feature.subtitle}
              right={<Badge label="Free" tone="ok" />}
            />
          ))}
        </View>
      </Panel>

      <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
        One car, no account, no ads and no trial running in the background. Pro adds the rest of
        the garage and your own intervals whenever you want it, from Settings.
      </Text>
    </OnboardingScreen>
  );
}
