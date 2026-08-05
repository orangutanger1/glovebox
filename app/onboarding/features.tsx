import { View } from "react-native";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { ListRow } from "../../src/design/ListRow";
import { Badge } from "../../src/design/Badge";
import { tokens } from "../../src/design/tokens";
import { FEATURES } from "../../src/onboarding/features";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useAdvance } from "../../src/onboarding/nav";

/**
 * What the app is, and — the part that matters two screens before a paywall —
 * which half of it costs money.
 *
 * Saying so here rather than letting the paywall be the first mention is not
 * generosity. The complaint the review corpus returns most often after data
 * loss is the price, and almost all of that is people discovering the boundary
 * after they had committed to the app. A user who reads "free" against four of
 * six rows and then sees a price has been told the truth in the right order.
 */
export default function OnboardingFeatures() {
  const advance = useAdvance("features");

  return (
    <OnboardingScreen
      route="features"
      title="What you are getting."
      subtitle="Everything lives in one file on this phone, with no account and no server."
      footer={<Button label="Continue" onPress={advance} />}
    >
      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.xs }}>
          {FEATURES.map((feature) => (
            <ListRow
              key={feature.title}
              title={feature.title}
              subtitle={feature.subtitle}
              right={<Badge label={feature.pro ? "Pro" : "Free"} tone={feature.pro ? "soon" : "ok"} />}
            />
          ))}
        </View>
      </Panel>
    </OnboardingScreen>
  );
}
