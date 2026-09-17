import { View } from "react-native";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { Gauge } from "../../src/design/Gauge";
import { ListRow } from "../../src/design/ListRow";
import { Badge } from "../../src/design/Badge";
import { tokens } from "../../src/design/tokens";
import { formatNumber, t } from "../../src/i18n";
import { serviceName } from "../../src/schedule/names";
import { getDistanceUnit } from "../../src/units";
import { formatDistance } from "../../src/units/format";
import { planBadge, planItemLine, planRowStatus, type PlanItem } from "../../src/onboarding/plan";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useOnboardingFindings } from "../../src/onboarding/usePlan";
import { useAdvance } from "../../src/onboarding/nav";

/** Four rows is the most that fits above the fold with the gauges. The full
 *  plan is shown three screens later, once it has been earned. */
const SHOWN = 4;

/** The badge prints a word, the plan branches on an identifier, and the two
 *  cannot be the same string once the word is translated. A service with no
 *  history is not "No record" here — on a fresh install that is every row, and
 *  a page of "No record" tells the user what they already know. It is the
 *  service the app starts watching today. */
const BADGE_KEY = {
  due: "onboardingC.results.status.due",
  soon: "onboardingC.results.status.soon",
  ok: "onboardingC.results.status.ok",
  noRecord: "onboardingC.schedule.status.fresh",
} as const;

/**
 * The payoff, on one page.
 *
 * It replaced two. "results" led with a count of what was overdue, which on a
 * fresh install — one service logged, or none — came out as "12 services have
 * no record yet": true, obvious, and the app's model talking rather than the
 * car. "outlook" then projected the next twelve months from that same nothing.
 * Both were built for a car with a history, and the flow has never once shown
 * them one.
 *
 * What the app honestly knows ninety seconds in is: which services it now
 * watches for this car, which of them it has anything on file for, and where
 * the odometer lands in a year at the rate the user just stated. That is the
 * page. Where there *is* a history, the overdue count still leads — that is
 * the one thing worth interrupting with.
 *
 * It is deliberately not a score. "Your car's health is 62" is a number the
 * app cannot honestly compute, and the kind of gamification the design
 * language rules out. Every figure here is a count or a projection the
 * scheduler already makes.
 */
export default function OnboardingSchedule() {
  const advance = useAdvance("schedule");
  const { vehiclePhrase, plan } = useOnboardingFindings();
  const unit = getDistanceUnit();

  const title =
    plan.pastDue > 0
      ? t("onboardingC.results.overdue", { count: plan.pastDue })
      : t("onboardingC.schedule.title", { count: plan.items.length });

  // The rows with a history first, worst first, as `plan.items` already
  // orders them; then the ones the app starts from today. The user's own
  // facts before the app's promises.
  const rows = [...plan.items.filter((i) => i.logged), ...plan.items.filter((i) => !i.logged)].slice(0, SHOWN);

  return (
    <OnboardingScreen
      route="schedule"
      title={title}
      subtitle={t("onboardingC.results.subtitle", {
        vehicle: vehiclePhrase,
        distance: formatDistance(plan.distancePerYear, unit),
      })}
      footer={<Button label={t("onboardingC.results.continue")} onPress={advance} />}
    >
      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.md }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Gauge
              legend={t("onboardingC.schedule.onWatch")}
              value={formatNumber(plan.items.length)}
              lamp={plan.pastDue > 0}
            />
            <Gauge
              legend={t("onboardingC.results.onFile")}
              value={t("onboardingC.results.onFileValue", {
                logged: plan.logged,
                total: plan.items.length,
              })}
              align="right"
            />
          </View>
          {/* The one projection on the page, and the only one the app can make
              from the answers alone: the reading typed two minutes ago plus the
              rate picked one question later. A car with no reading gets no
              row rather than a distance nobody supplied. */}
          {plan.projectedOdometer !== undefined ? (
            <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
              <Gauge
                legend={t("onboardingC.outlook.odometer")}
                value={formatDistance(plan.odometer ?? 0, unit)}
              />
              <Gauge
                legend={t("onboardingC.outlook.projected")}
                value={formatDistance(plan.projectedOdometer, unit)}
                align="right"
              />
            </View>
          ) : null}

          <View style={{ gap: tokens.space.xs }}>
            {rows.map((item) => {
              const badge = planBadge(item);
              return (
                <ListRow
                  key={item.type}
                  title={serviceName(item.type)}
                  subtitle={line(item)}
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

  /** "Nothing on file" is the garage's line for an unlogged row, and the right
   *  one there. Here it is the same sentence as the badge beside it. */
  function line(item: PlanItem): string {
    return item.logged ? planItemLine(item, unit) : t("onboardingC.schedule.line.fresh");
  }
}
