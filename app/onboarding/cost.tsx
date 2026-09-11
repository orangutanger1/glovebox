import { View, Text } from "react-native";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { tokens } from "../../src/design/tokens";
import { formatNumber, t } from "../../src/i18n";
import { OVERDUE } from "../../src/onboarding/cost";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useAdvance } from "../../src/onboarding/nav";

/**
 * The one screen carrying a figure that is not the user's own.
 *
 * It used to carry three. The headline was money — this driver's mileage at
 * AAA's published rate per mile — with a five-year meter filling under it and
 * AAA's roadside breakdown beneath that. All three were real and all three were
 * cited, and the screen still did not say anything: what a car costs to keep is
 * what it costs whoever owns it, logged or not, so a reader shown that number
 * asks what it is being compared to and the honest answer is nothing. It was an
 * argument for a cheaper car. The roadside figure was the consequence of a
 * claim the screen was not making, and a meter counting somebody's money up to
 * a five-year total was the most elaborate thing on the page defending the
 * weakest idea on it.
 *
 * What is left is the one number that is about this app's actual subject: 41%
 * of cars on the road are behind on at least one major service. It is CARFAX's
 * count of service records rather than a survey, and it is the headline because
 * it is the only outside fact in the flow that describes the problem the user
 * is being offered a fix for.
 *
 * Under it, the same release's two familiar services — tire rotations and oil
 * changes — so the headline lands as something a driver can picture rather than
 * as a percentage. Then one sentence about the app, claiming the only thing the
 * app can prove it does: it puts a date on each service and says so before the
 * date passes. No saving is asserted; see the note on `OVERDUE`.
 *
 * The attribution is at the very bottom, in the smallest type the system has,
 * directly above the button. A source line has to be present and has to lose
 * every fight for attention with the figure it is vouching for.
 */
export default function OnboardingCost() {
  const advance = useAdvance("cost");

  return (
    <OnboardingScreen
      route="cost"
      title={t("onboardingC.cost.title", { percent: formatNumber(OVERDUE.behindPct) })}
      footer={
        <>
          {/* Attribution, at the very bottom of the page. Named with its year,
              so the figures above can be chased to the release they were read
              from. */}
          <Text style={{ ...tokens.text.footnote, color: tokens.color.textFaint }}>
            {t("onboardingC.cost.source", {
              overdue: `${OVERDUE.source} ${OVERDUE.publishedAt.slice(0, 4)}`,
            })}
          </Text>
          <Button label={t("onboardingC.cost.continue")} onPress={advance} />
        </>
      }
    >
      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.lg }}>
          {/* The headline in the two shapes a driver already thinks in. Not an
              alarm colour: these are ordinary services that ordinary people are
              late for, and painting them red would make being a month behind on
              a tire rotation look like a fault light. */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: tokens.space.md,
            }}
          >
            <Figure
              legend={t("onboardingC.cost.tireRotations")}
              percent={OVERDUE.tireRotationPct}
            />
            <Figure
              legend={t("onboardingC.cost.oilChanges")}
              percent={OVERDUE.oilChangePct}
              align="right"
            />
          </View>

          {/* What the figures have to do with the app, in the app's own words
              and about the one thing it actually does. Body weight and full
              contrast: it is the conclusion of the page, not a footnote to it,
              and the footnote is already at the bottom of the screen. */}
          <View style={{ borderTopWidth: 1, borderTopColor: tokens.color.hairline }} />
          <Text style={{ ...tokens.text.body, color: tokens.color.text }}>
            {t("onboardingC.cost.tracked")}
          </Text>
        </View>
      </Panel>
    </OnboardingScreen>
  );
}

/** A legend over a percentage, which is the readout shape the rest of the app
 *  uses for every number a user reads. */
function Figure({
  legend,
  percent,
  align = "left",
}: {
  legend: string;
  percent: number;
  align?: "left" | "right";
}) {
  return (
    <View
      style={{
        gap: tokens.space.xs,
        flex: 1,
        alignItems: align === "right" ? "flex-end" : "flex-start",
      }}
    >
      <Text style={{ ...tokens.text.legend, color: tokens.color.textFaint, textAlign: align }}>
        {legend}
      </Text>
      <Text
        style={{
          ...tokens.text.readout,
          ...tokens.text.numeric,
          color: tokens.color.text,
        }}
      >
        {t("onboardingC.cost.percent", { percent: formatNumber(percent) })}
      </Text>
    </View>
  );
}
