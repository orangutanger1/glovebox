import { View, Text } from "react-native";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { Lamp } from "../../src/design/Lamp";
import { ListRow } from "../../src/design/ListRow";
import { Badge } from "../../src/design/Badge";
import { tokens } from "../../src/design/tokens";
import { t } from "../../src/i18n";
import { features } from "../../src/onboarding/features";
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
 * Underneath it, the whole app with the Free/Pro boundary printed on it. That
 * was its own screen, two before the paywall, and the split cost a tap to say
 * something this screen was already halfway through saying: the answer to the
 * user's three complaints is four rows that are free and two that are not, and
 * a reader who has to press Continue between the promise and its price reads
 * them as two claims instead of one. Saying it here rather than letting the
 * paywall be the first mention is still not generosity — the complaint the
 * review corpus returns most often after data loss is the price, and almost
 * all of that is people discovering the boundary after they had committed to
 * the app.
 */
export default function OnboardingHelp() {
  const advance = useAdvance("help");
  const { cards } = useOnboardingFindings();

  return (
    <OnboardingScreen
      route="help"
      title={t("onboardingC.help.title")}
      subtitle={t("onboardingC.help.subtitle")}
      footer={<Button label={t("onboardingC.help.continue")} onPress={advance} />}
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

      <View style={{ gap: tokens.space.xs }}>
        <Text style={{ ...tokens.text.heading, color: tokens.color.text }}>
          {t("offer.features.title")}
        </Text>
        <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
          {t("offer.features.subtitle")}
        </Text>
      </View>

      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.xs }}>
          {features().map((feature) => (
            <ListRow
              key={feature.id}
              title={feature.title}
              subtitle={feature.subtitle}
              right={
                <Badge
                  label={t(feature.pro ? "offer.badge.pro" : "offer.badge.free")}
                  tone={feature.pro ? "soon" : "ok"}
                />
              }
            />
          ))}
        </View>
      </Panel>
    </OnboardingScreen>
  );
}
