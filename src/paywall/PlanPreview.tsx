import { View, Text } from "react-native";
import { Panel } from "../design/Surface";
import { ListRow } from "../design/ListRow";
import { Badge } from "../design/Badge";
import { tokens } from "../design/tokens";
import { t } from "../i18n";
import { serviceName } from "../schedule/names";
import { nextUp, planBadge, planItemLine, planRowStatus, type Plan, type PlanItem } from "../onboarding/plan";
import type { DistanceUnit } from "../units";

/** One row open, two locked, then a count. Three rows is what fits above
 *  the pinned price list on the smallest phone without pushing the list of
 *  what Pro includes off the glass entirely. */
const LOCKED = 2;

const BADGE_KEY = {
  due: "onboardingC.results.status.due",
  soon: "onboardingC.results.status.soon",
  ok: "onboardingC.results.status.ok",
  noRecord: "onboardingC.schedule.status.fresh",
} as const;

/**
 * The first reminder this car will get, and the rest of its plan behind the
 * subscription.
 *
 * "I want to try it first" was the second answer to "what stopped you?", and
 * most readers closed this screen within a few seconds of the close
 * appearing: they left before they had seen anything the app does. A free
 * trial answers that with a week in which a maintenance log shows nothing,
 * and the short plans already cancel most. This answers it on the page: the
 * one service the app can date from what the user told it, with its date,
 * and the next ones by name.
 *
 * The locked rows hide nothing that is not there. They carry no blurred
 * figure — on a fresh install most of them have no date to hide — only the
 * service's name and what Pro does for it, which is true of every row.
 */
export function PlanPreview({
  plan,
  vehicleName,
  unit,
}: {
  plan: Plan;
  vehicleName: string;
  unit: DistanceUnit;
}) {
  const open = previewOpen(plan);
  if (!open) return null;
  const rest = [...plan.items.filter((i) => i.logged), ...plan.items.filter((i) => !i.logged)].filter(
    (i) => i !== open
  );
  const locked = rest.slice(0, LOCKED);
  const more = rest.length - locked.length;
  const badge = planBadge(open);

  return (
    <View style={{ gap: tokens.space.sm }}>
      <Text style={{ ...tokens.text.legend, color: tokens.color.textFaint }}>
        {t("offer.paywall.preview.legend", { vehicle: vehicleName })}
      </Text>
      <Panel>
        <View style={{ padding: tokens.space.sm, gap: tokens.space.xs }}>
          <ListRow
            title={serviceName(open.type)}
            subtitle={open.logged ? planItemLine(open, unit) : t("onboardingC.schedule.line.fresh")}
            // Never dimmed: this is the row the page is about. Red only when
            // the service is genuinely past its interval.
            status={planRowStatus(open) === "overdue" ? "overdue" : undefined}
            right={<Badge label={t(BADGE_KEY[badge.state])} tone={badge.tone} />}
          />
          {locked.map((item) => (
            <ListRow
              key={item.type}
              title={serviceName(item.type)}
              subtitle={t("offer.paywall.preview.locked")}
              status="ok"
              right={<Badge label={t("offer.badge.pro")} tone="ok" />}
            />
          ))}
          {more > 0 ? (
            <Text
              style={{
                ...tokens.text.caption,
                color: tokens.color.textMuted,
                paddingHorizontal: tokens.space.sm,
                paddingTop: tokens.space.xs,
              }}
            >
              {t("offer.paywall.preview.more", { count: more })}
            </Text>
          ) : null}
        </View>
      </Panel>
    </View>
  );
}

/**
 * The row shown in full. An overdue service with a history comes first — it
 * is the one thing worth interrupting with. Otherwise the soonest dated one,
 * which on a fresh install is the service the quiz asked about. A user who
 * answered "not sure" has nothing dated, and gets the first watched service
 * with the line that says it is watched from today.
 */
export function previewOpen(plan: Plan): PlanItem | undefined {
  if (plan.pastDue > 0) return plan.items.find((i) => i.logged && i.status === "due");
  return nextUp(plan) ?? plan.items.find((i) => i.logged) ?? plan.items[0];
}
