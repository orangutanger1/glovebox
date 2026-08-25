import { View, Text } from "react-native";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { ListRow } from "../../src/design/ListRow";
import { Badge } from "../../src/design/Badge";
import { tokens } from "../../src/design/tokens";
import { t } from "../../src/i18n";
import { freeFeatures } from "../../src/onboarding/features";
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
      title={t("offer.free.title")}
      subtitle={t("offer.free.subtitle", { count: plan.items.length, vehicle: vehicleName })}
      footer={<Button label={t("offer.free.cta")} onPress={() => finish("free")} />}
    >
      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.xs }}>
          {freeFeatures().map((feature) => (
            <ListRow
              key={feature.id}
              title={feature.title}
              subtitle={feature.subtitle}
              right={<Badge label={t("offer.badge.free")} tone="ok" />}
            />
          ))}
        </View>
      </Panel>

      <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
        {t("offer.free.caption")}
      </Text>
    </OnboardingScreen>
  );
}
