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
import { planItemLine } from "../../src/onboarding/plan";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useOnboardingFindings } from "../../src/onboarding/usePlan";
import { useAdvance } from "../../src/onboarding/nav";

/** Four rows is the most that fits above the fold with the gauges. The rest of
 *  the plan is shown in full three screens later, once it has been earned. */
const SHOWN = 4;

/** The list row's red stripe is keyed to "overdue"; the plan calls the same
 *  state "due", which is what the badge prints. One map, stated once. */
const ROW_STATUS = { due: "overdue", soon: "soon", ok: "ok" } as const;

/** The badge prints a word, the plan branches on an identifier, and the two
 *  cannot be the same string once the word is translated. */
const BADGE_KEY = {
  due: "onboardingC.results.status.due",
  soon: "onboardingC.results.status.soon",
  ok: "onboardingC.results.status.ok",
} as const;

/**
 * The payoff. Everything above the fold here is the user's own car, computed
 * from what they typed ninety seconds ago, and it is the first time the app
 * has told them something they did not already know.
 *
 * It is deliberately not a score. "Your car's health is 62" is a number the
 * app cannot honestly compute and the kind of gamification the design language
 * rules out; a count of what is overdue is a fact, and it is the fact the rest
 * of the flow argues from.
 */
export default function OnboardingResults() {
  const advance = useAdvance("results");
  const { vehicleName, plan } = useOnboardingFindings();
  const unit = getDistanceUnit();

  const pastDue = plan.items.filter((i) => i.status === "due" && i.logged).length;

  // `plan.dueNow` folds in every service that has never been logged, and
  // "eleven services are overdue" to somebody who has told us about one of
  // them is our model talking, not their car. The headline counts only what
  // has a history behind it; the gauges below carry the rest, next to the
  // "on file" count that explains where the difference comes from.
  const title =
    pastDue > 0
      ? t("onboardingC.results.overdue", { count: pastDue })
      : plan.dueNow > 0
        ? t("onboardingC.results.noneLogged")
        : plan.soon > 0
          ? t("onboardingC.results.noneYet")
          : t("onboardingC.results.clear");

  return (
    <OnboardingScreen
      route="results"
      title={title}
      subtitle={t("onboardingC.results.subtitle", {
        vehicle: vehicleName,
        distance: formatDistance(plan.distancePerYear, unit),
      })}
      footer={<Button label={t("onboardingC.results.continue")} onPress={advance} />}
    >
      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.md }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Gauge
              legend={t("onboardingC.results.dueNow")}
              value={formatNumber(plan.dueNow)}
              lamp={plan.dueNow > 0}
            />
            <Gauge legend={t("onboardingC.results.soon")} value={formatNumber(plan.soon)} />
            <Gauge
              legend={t("onboardingC.results.onFile")}
              value={t("onboardingC.results.onFileValue", {
                logged: plan.logged,
                total: plan.items.length,
              })}
              align="right"
            />
          </View>

          <View style={{ gap: tokens.space.xs }}>
            {plan.items.slice(0, SHOWN).map((item) => (
              <ListRow
                key={item.type}
                title={serviceName(item.type)}
                subtitle={planItemLine(item, unit)}
                status={ROW_STATUS[item.status]}
                right={<Badge label={t(BADGE_KEY[item.status])} tone={item.status} />}
              />
            ))}
          </View>
        </View>
      </Panel>
    </OnboardingScreen>
  );
}
