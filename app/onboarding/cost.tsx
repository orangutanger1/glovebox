import { View, Text } from "react-native";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { Gauge } from "../../src/design/Gauge";
import { tokens } from "../../src/design/tokens";
import { formatNumber, t } from "../../src/i18n";
import { formatMoney } from "../../src/money";
import { getDistanceUnit } from "../../src/units";
import { formatDistance } from "../../src/units/format";
import { MAINTENANCE_RATE, ROADSIDE, maintenanceCost } from "../../src/onboarding/cost";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useOnboardingFindings } from "../../src/onboarding/usePlan";
import { useAdvance } from "../../src/onboarding/nav";

/**
 * What the problem costs, immediately after the screens that named it.
 *
 * This is the only screen in the flow carrying a figure that is not the user's
 * own, and it carries two. The rule the rest of the flow follows is written at
 * the top of `pain.ts` — nothing invented, nothing sourced to a study that does
 * not exist — and the way this screen keeps it is by printing where both
 * numbers came from, in the reader's own language, on the glass. A statistic
 * the user cannot go and check is indistinguishable from one we made up, and
 * the app has spent nine screens earning the opposite impression.
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

  return (
    <OnboardingScreen
      route="cost"
      title={t("onboardingC.cost.title", {
        cost: formatMoney(cost.perYear, MAINTENANCE_RATE.currency),
      })}
      subtitle={t("onboardingC.cost.subtitle", {
        distance: formatDistance(plan.distancePerYear, unit),
      })}
      footer={<Button label={t("onboardingC.cost.continue")} onPress={advance} />}
    >
      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.md }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Gauge
              legend={t("onboardingC.cost.perYear")}
              value={formatMoney(cost.perYear, MAINTENANCE_RATE.currency)}
            />
            <Gauge
              // "Over five years" is written out rather than counted. The
              // horizon is AAA's own and is a constant, and a plural key for a
              // number that is always five is four categories of nothing.
              legend={t("onboardingC.cost.fiveYears")}
              value={formatMoney(cost.overFiveYears, MAINTENANCE_RATE.currency)}
              align="right"
            />
          </View>

          {/* The second figure, and the one that is about not maintaining the
              car rather than about maintaining it. It is left as AAA's claim,
              quoted, rather than restated as ours: AAA is the body that
              answered the calls and the only one in a position to say what
              caused them. */}
          <Text style={{ ...tokens.text.body, color: tokens.color.text }}>
            {t("onboardingC.cost.roadside", {
              calls: formatNumber(ROADSIDE.calls),
              year: ROADSIDE.year,
              percent: ROADSIDE.towingAndBatteryPct,
            })}
          </Text>

          {/* Not decoration. Both figures are attributed here, with the edition
              and the year, so the number on this screen can be chased to the
              page it was read from. */}
          <Text style={{ ...tokens.text.caption, color: tokens.color.textFaint }}>
            {t("onboardingC.cost.source", {
              rate: `${MAINTENANCE_RATE.source} ${MAINTENANCE_RATE.edition}`,
              roadside: `${ROADSIDE.source} ${ROADSIDE.publishedAt.slice(0, 4)}`,
              currency: MAINTENANCE_RATE.currency,
            })}
          </Text>
        </View>
      </Panel>
    </OnboardingScreen>
  );
}
