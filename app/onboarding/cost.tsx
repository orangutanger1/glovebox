import { useCallback, useState } from "react";
import { View, Text } from "react-native";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { Segments } from "../../src/design/Segments";
import { tokens } from "../../src/design/tokens";
import { formatNumber, t } from "../../src/i18n";
import { formatMoney } from "../../src/money";
import { getDistanceUnit } from "../../src/units";
import { formatDistance } from "../../src/units/format";
import { MAINTENANCE_RATE, ROADSIDE, maintenanceCost } from "../../src/onboarding/cost";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useOnboardingFindings } from "../../src/onboarding/usePlan";
import { useAdvance } from "../../src/onboarding/nav";

/** The horizon AAA publishes its own five-year figure over, and therefore the
 *  number of blocks in the meter. It is not a knob: change it and the total the
 *  screen fills to stops being the total the source line credits. */
const YEARS = 5;

/**
 * What the problem costs, immediately after the screens that named it.
 *
 * This is the only screen in the flow carrying a figure that is not the user's
 * own, and it carries two. The rule the rest of the flow follows is written at
 * the top of `pain.ts` — nothing invented, nothing sourced to a study that does
 * not exist — and the way this screen keeps it is by printing where both
 * numbers came from. A statistic the user cannot go and check is
 * indistinguishable from one we made up, and the app has spent nine screens
 * earning the opposite impression.
 *
 * The attribution is at the very bottom of the page, in the smallest type the
 * system has, directly above the button. It used to be the fourth paragraph
 * inside the panel, which put a URL-length sentence in the middle of the
 * argument: a source line has to be present and has to lose every fight for
 * attention with the figure it is vouching for.
 *
 * What replaced the paragraphs is the arithmetic drawn — and what replaced that
 * is the arithmetic happening.
 *
 * The first version drew the two figures as two bars on one scale, a year
 * against AAA's own five-year horizon. Every reading of that picture is the
 * same reading: the short bar is a fifth of the long one, which is a fact about
 * the number five and not about this car. The five years are now five blocks in
 * one meter and they fill a year at a time, with the running total counting up
 * beside them. Nothing is asserted that the bars did not assert; the difference
 * is that the reader watches the same money get spent five times instead of
 * being shown its sum. The roadside statistic is a readout and one line, not the
 * three sentences it was.
 *
 * Neither figure is asserted as a fact about this car. AAA's rate is what the
 * average American driver spends per mile on maintenance, repairs and tyres;
 * what makes it worth a screen is the multiplication, because the mileage it is
 * multiplied by is the one the user gave three screens ago and the one every
 * due date in the flow is projected at.
 *
 * The money stays in US dollars whatever the phone's currency is, and the
 * screen says so. Converting eleven cents a mile into the reader's currency
 * would mean inventing an exchange rate and a local labour market in one step,
 * which is exactly the kind of number this file exists to avoid.
 */
export default function OnboardingCost() {
  const advance = useAdvance("cost");
  const { plan } = useOnboardingFindings();
  const unit = getDistanceUnit();
  const cost = maintenanceCost(plan.distancePerYear, unit);

  // How many years the meter has filled so far, and therefore what the readout
  // above it says. It ends on the published five-year figure rather than on
  // five times the yearly one, so the number the screen finishes on is the one
  // the source line vouches for and not an accumulation that rounds past it.
  const [years, setYears] = useState(0);
  const onStep = useCallback((filled: number) => setYears(filled), []);
  const running =
    years >= YEARS ? cost.overFiveYears : Math.round((cost.overFiveYears / YEARS) * years);

  return (
    <OnboardingScreen
      route="cost"
      title={t("onboardingC.cost.title", {
        cost: formatMoney(cost.perYear, MAINTENANCE_RATE.currency),
      })}
      subtitle={t("onboardingC.cost.subtitle", {
        distance: formatDistance(plan.distancePerYear, unit),
      })}
      footer={
        <>
          {/* Attribution, at the very bottom of the page. Both figures are
              named here with their edition and year, so the numbers above can
              be chased to the page they were read from. */}
          <Text style={{ ...tokens.text.footnote, color: tokens.color.textFaint }}>
            {t("onboardingC.cost.source", {
              rate: `${MAINTENANCE_RATE.source} ${MAINTENANCE_RATE.edition}`,
              roadside: `${ROADSIDE.source} ${ROADSIDE.publishedAt.slice(0, 4)}`,
              currency: MAINTENANCE_RATE.currency,
            })}
          </Text>
          <Button label={t("onboardingC.cost.continue")} onPress={advance} />
        </>
      }
    >
      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.lg }}>
          {/* The total, then the years it is made of. The legend names the
              horizon, the readout is the money, and the meter under them is
              where that money comes from — one block a year, filling. */}
          <View style={{ gap: tokens.space.sm }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: tokens.space.sm,
              }}
            >
              <View style={{ gap: tokens.space.xs }}>
                <Text style={{ ...tokens.text.legend, color: tokens.color.textFaint }}>
                  {t("onboardingC.cost.fiveYears")}
                </Text>
                <Text
                  style={{
                    ...tokens.text.readout,
                    ...tokens.text.numeric,
                    fontSize: 34,
                    lineHeight: 38,
                    color: tokens.color.text,
                  }}
                >
                  {formatMoney(running, MAINTENANCE_RATE.currency)}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: tokens.space.xs }}>
                <Text style={{ ...tokens.text.legend, color: tokens.color.textFaint }}>
                  {t("onboardingC.cost.perYear")}
                </Text>
                <Text
                  style={{
                    ...tokens.text.readout,
                    ...tokens.text.numeric,
                    color: tokens.color.textMuted,
                  }}
                >
                  {formatMoney(cost.perYear, MAINTENANCE_RATE.currency)}
                </Text>
              </View>
            </View>
            {/* Not an alarm. This is money the car costs whoever owns it and
                whatever they do about it, and a red meter here would be the app
                calling ordinary maintenance a fault. */}
            <Segments count={YEARS} onStep={onStep} />
          </View>

          {/* The second figure, and the one that is about not maintaining the
              car rather than about maintaining it. A readout and a legend, so
              the number is the thing on the glass; the claim that maintenance
              would have prevented these calls is AAA's own, and the source
              line at the foot of the page is where it is credited. */}
          <View style={{ borderTopWidth: 1, borderTopColor: tokens.color.hairline }} />
          <View style={{ gap: tokens.space.xs }}>
            <Text
              style={{
                ...tokens.text.readout,
                ...tokens.text.numeric,
                color: tokens.color.red,
              }}
            >
              {t("onboardingC.cost.roadsidePercent", {
                percent: formatNumber(ROADSIDE.towingAndBatteryPct),
              })}
            </Text>
            <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
              {t("onboardingC.cost.roadside", {
                calls: formatNumber(ROADSIDE.calls),
                year: ROADSIDE.year,
              })}
            </Text>
          </View>
        </View>
      </Panel>
    </OnboardingScreen>
  );
}
