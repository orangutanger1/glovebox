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
import { planBadge, planItemLine, planRowStatus } from "../../src/onboarding/plan";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useOnboardingFindings } from "../../src/onboarding/usePlan";
import { useAdvance } from "../../src/onboarding/nav";

/** Four rows is the most that fits above the fold with the gauges. The rest of
 *  the plan is shown in full three screens later, once it has been earned. */
const SHOWN = 4;

/** The badge prints a word, the plan branches on an identifier, and the two
 *  cannot be the same string once the word is translated. The stripe and the
 *  tone are `planBadge`/`planRowStatus`'s call, shared with the plan screen. */
const BADGE_KEY = {
  due: "onboardingC.results.status.due",
  soon: "onboardingC.results.status.soon",
  ok: "onboardingC.results.status.ok",
  noRecord: "onboardingC.results.status.noRecord",
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
  const { vehiclePhrase, plan } = useOnboardingFindings();
  const unit = getDistanceUnit();

  // `plan.dueNow` folds in every service that has never been logged, and
  // "eleven services are overdue" to somebody who has told us about one of
  // them is our model talking, not their car. The headline counts only what
  // has a history behind it.
  //
  // The screen used to answer that case with "Nothing you have logged is
  // overdue." over a red 9, which is the app contradicting itself in two lines:
  // the sentence was true and the number beside it said otherwise. The number
  // was the thing to fix. A service with no history is not overdue, it is
  // unrecorded, and both the gauge and the headline now say so.
  const title =
    plan.pastDue > 0
      ? t("onboardingC.results.overdue", { count: plan.pastDue })
      : plan.noRecord > 0
        ? t("onboardingC.results.noBaseline", { count: plan.noRecord })
        : plan.soon > 0
          ? t("onboardingC.results.noneYet")
          : t("onboardingC.results.clear");

  return (
    <OnboardingScreen
      route="results"
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
              legend={t("onboardingC.results.dueNow")}
              value={formatNumber(plan.pastDue)}
              lamp={plan.pastDue > 0}
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
            {plan.items.slice(0, SHOWN).map((item) => {
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
