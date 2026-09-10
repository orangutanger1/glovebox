import { View } from "react-native";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { Gauge } from "../../src/design/Gauge";
import { ListRow } from "../../src/design/ListRow";
import { Badge } from "../../src/design/Badge";
import { tokens } from "../../src/design/tokens";
import { formatDate, formatNumber, t } from "../../src/i18n";
import { serviceName } from "../../src/schedule/names";
import { getDistanceUnit } from "../../src/units";
import { formatDistance } from "../../src/units/format";
import { buildOutlook } from "../../src/onboarding/outlook";
import { planBadge, planItemLine, planRowStatus } from "../../src/onboarding/plan";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useOnboardingFindings } from "../../src/onboarding/usePlan";
import { useAdvance } from "../../src/onboarding/nav";

/** The status word beside a row. Same four states the results screen prints,
 *  keyed the same way: the badge shows a word, the plan branches on an
 *  identifier, and those cannot be the same string once it is translated. */
const BADGE_KEY = {
  due: "onboardingC.results.status.due",
  soon: "onboardingC.results.status.soon",
  ok: "onboardingC.results.status.ok",
  noRecord: "onboardingC.results.status.noRecord",
} as const;

/** Three rows. This screen is a projection, not the schedule — the full plan
 *  is two screens further on, where it has been earned. */
const SHOWN = 3;

/**
 * The next twelve months.
 *
 * The screen before this one is the car as it stands, which is a fact a user
 * can act on once and be finished with. This is the argument that it recurs:
 * at the rate they just told us they drive, here is where the odometer lands
 * by this time next year, and here is how many services arrive in between.
 * It is the case for a reminder rather than a look at the dash, which is why
 * the notification ask is the screen immediately after it.
 *
 * There is no score on it. The results screen already refuses to print one and
 * the reason holds here — "your car's health is 62" is a number the app cannot
 * honestly compute, and a percentage assembled out of due dates would be the
 * one invented figure in a flow built entirely from the user's own answers.
 * Every number here is a count or a projection the scheduler already makes.
 *
 * A car with no odometer reading, or whose services all carry mileage-only
 * intervals, has less to project: the gauge falls back to the count alone
 * rather than printing a distance nobody supplied.
 */
export default function OnboardingOutlook() {
  const advance = useAdvance("outlook");
  const { vehiclePhrase, plan } = useOnboardingFindings();
  const unit = getDistanceUnit();
  const outlook = buildOutlook(plan);

  // Rows worth showing: the dated ones, soonest first. `plan.items` is sorted
  // worst-first for the results screen, which is the wrong order for a
  // forecast — a forecast reads forwards.
  const upcoming = plan.items
    .filter((item) => item.dueAt)
    .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime())
    .slice(0, SHOWN);

  return (
    <OnboardingScreen
      route="outlook"
      title={t("onboardingC.outlook.title")}
      subtitle={t("onboardingC.outlook.subtitle", {
        vehicle: vehiclePhrase,
        distance: formatDistance(outlook.distancePerYear, unit),
      })}
      footer={<Button label={t("onboardingC.outlook.continue")} onPress={advance} />}
    >
      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.md }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Gauge
              legend={t("onboardingC.outlook.dueWithinYear")}
              value={formatNumber(outlook.dueWithinYear)}
              lamp={outlook.alreadyDue > 0}
            />
            <Gauge
              legend={t("onboardingC.outlook.nextUp")}
              value={
                outlook.next?.dueAt
                  ? formatDate(outlook.next.dueAt)
                  : t("onboardingC.outlook.none")
              }
              align="right"
            />
          </View>
          {outlook.projectedOdometer !== undefined ? (
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Gauge
                legend={t("onboardingC.outlook.odometer")}
                value={formatDistance(plan.odometer ?? 0, unit)}
              />
              <Gauge
                legend={t("onboardingC.outlook.projected")}
                value={formatDistance(outlook.projectedOdometer, unit)}
                align="right"
              />
            </View>
          ) : null}

          <View style={{ gap: tokens.space.xs }}>
            {upcoming.map((item) => {
              const badge = planBadge(item);
              return (
                <ListRow
                  key={item.type}
                  title={serviceName(item.type)}
                  subtitle={planItemLine(item, unit)}
                  status={planRowStatus(item)}
                  right={<Badge label={t(BADGE_KEY[badge.state])} tone={badge.tone} />}
                />
              );
            })}
          </View>
        </View>
      </Panel>
    </OnboardingScreen>
  );
}
