import { View, Text } from "react-native";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { Lamp } from "../../src/design/Lamp";
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
 * user's three complaints is four capabilities that are free and two that are
 * not, and a reader who has to press Continue between the promise and its
 * price reads them as two claims instead of one. Saying it here rather than
 * letting the paywall be the first mention is still not generosity — the
 * complaint the review corpus returns most often after data loss is the price,
 * and almost all of that is people discovering the boundary after they had
 * committed to the app.
 *
 * Those six were a single panel of six identical badge-on-the-right rows,
 * which is how a capability becomes a line item: the screen ran well past a
 * phone's height and nothing on it was emphasised over anything else. They are
 * tiles now, two to a row, each on its own faceplate with the badge leading.
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

      <View style={{ gap: tokens.space.xs }}>
        <Text style={{ ...tokens.text.heading, color: tokens.color.text }}>
          {t("offer.features.title")}
        </Text>
        <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
          {t("offer.features.subtitle")}
        </Text>
      </View>

      {/* Tiles, two to a row, rather than six full-width rows in one panel.
          Six identical rows is a spec sheet: the eye reads the shape once and
          stops, so the sixth capability is worth nothing and the screen is
          twice as tall as it needs to be. Paired, each capability is a face of
          its own with its own edge, the Pro pair lands as a block instead of
          as two more rows, and the whole boundary fits above the fold. */}
      <View
        style={{ flexDirection: "row", flexWrap: "wrap", gap: tokens.space.sm }}
      >
        {features().map((feature) => (
          <Panel key={feature.id} style={{ flexGrow: 1, flexBasis: "46%" }}>
            <View style={{ padding: tokens.space.md, gap: tokens.space.sm }}>
              <Badge
                label={t(feature.pro ? "offer.badge.pro" : "offer.badge.free")}
                tone={feature.pro ? "soon" : "ok"}
              />
              <Text
                style={{
                  ...tokens.text.body,
                  fontWeight: "600",
                  color: tokens.color.text,
                }}
              >
                {feature.title}
              </Text>
              <Text
                style={{
                  ...tokens.text.caption,
                  color: tokens.color.textMuted,
                }}
              >
                {feature.subtitle}
              </Text>
            </View>
          </Panel>
        ))}
      </View>
    </OnboardingScreen>
  );
}
