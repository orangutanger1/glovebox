import { View, Text } from "react-native";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { Gauge } from "../../src/design/Gauge";
import { ListRow } from "../../src/design/ListRow";
import { Badge } from "../../src/design/Badge";
import { tokens } from "../../src/design/tokens";
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

  const pastDue = plan.items.filter((i) => i.status === "due" && i.logged).length;
  const next = plan.items.find((i) => i.dueAt !== undefined);
  const title =
    pastDue > 0
      ? `${pastDue === 1 ? "One service is" : `${pastDue} services are`} already overdue.`
      : plan.soon > 0
        ? "Nothing is overdue yet."
        : "Nothing is overdue, and nothing is close.";

  return (
    <OnboardingScreen
      route="results"
      title={title}
      subtitle={`Worked out for your ${vehicleName} from ${plan.milesPerYear.toLocaleString()} miles a year and what you have logged.`}
      footer={<Button label="Continue" onPress={advance} />}
    >
      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.md }}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Gauge legend="Due now" value={String(plan.dueNow)} lamp={plan.dueNow > 0} />
            <Gauge legend="Soon" value={String(plan.soon)} />
            <Gauge
              legend="On file"
              value={`${plan.logged} / ${plan.items.length}`}
              align="right"
            />
          </View>

          <View style={{ gap: tokens.space.xs }}>
            {plan.items.slice(0, SHOWN).map((item) => (
              <ListRow
                key={item.type}
                title={item.type}
                subtitle={planItemLine(item)}
                status={ROW_STATUS[item.status]}
                right={<Badge label={item.status} tone={item.status} />}
              />
            ))}
          </View>
        </View>
      </Panel>

      <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
        {next?.dueAt
          ? `Whichever comes first, date or mileage. The next one lands ${new Date(next.dueAt).toLocaleDateString()}.`
          : "Whichever comes first, date or mileage."}
      </Text>
    </OnboardingScreen>
  );
}
