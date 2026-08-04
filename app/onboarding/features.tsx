import { View } from "react-native";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { ListRow } from "../../src/design/ListRow";
import { Badge } from "../../src/design/Badge";
import { tokens } from "../../src/design/tokens";
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
const FEATURES: { title: string; subtitle: string; pro?: boolean }[] = [
  {
    title: "Every service, kept forever",
    subtitle: "Date, mileage, cost and notes. Deleted rows are tombstoned, never dropped.",
  },
  {
    title: "Due by date and by mileage",
    subtitle: "Whichever comes first, counted from the intervals for each service.",
  },
  {
    title: "One reminder per service",
    subtitle: "On the day it comes due. Nothing else, ever.",
  },
  {
    title: "Export everything as CSV",
    subtitle: "Free forever, for everyone. Your records are never hostage to a subscription.",
  },
  {
    title: "More than one vehicle",
    subtitle: "The whole garage, each with its own schedule.",
    pro: true,
  },
  {
    title: "Your own service intervals",
    subtitle: "Override any of them when the manual disagrees with the defaults.",
    pro: true,
  },
];

export default function OnboardingFeatures() {
  const advance = useAdvance("features");

  return (
    <OnboardingScreen
      route="features"
      title="What you are getting."
      subtitle="No account. No server. Everything lives in one file on this phone."
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
