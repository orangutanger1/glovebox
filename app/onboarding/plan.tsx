import { View, Text, Pressable } from "react-native";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { ListRow } from "../../src/design/ListRow";
import { Badge } from "../../src/design/Badge";
import { tokens } from "../../src/design/tokens";
import { t } from "../../src/i18n";
import { getDistanceUnit } from "../../src/units";
import { serviceName } from "../../src/schedule/names";
import { setNotifyIntent } from "../../src/notify/intent";
import { trackNotificationPermission } from "../../src/analytics";
import { planItemLine } from "../../src/onboarding/plan";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useOnboardingFindings } from "../../src/onboarding/usePlan";
import { useAdvance } from "../../src/onboarding/nav";

const ROW_STATUS = { due: "overdue", soon: "soon", ok: "ok" } as const;

/** The status is a state name the schedule computes, not copy — it reaches the
 *  faceplate through a key so no language is stuck with the English word. */
const STATUS_LABEL = {
  due: "offer.plan.status.due",
  soon: "offer.plan.status.soon",
  ok: "offer.plan.status.ok",
} as const;

/** The whole schedule is real, but a screen with twelve rows on it is a
 *  document, not a plan. The rest is one line of arithmetic underneath. */
const SHOWN = 6;

/**
 * The plan, and the notification soft-ask.
 *
 * These are one screen because the permission only makes sense next to the
 * thing it delivers: iOS gives an app exactly one system prompt, opt-in
 * collapses when it fires without context, and "allow notifications?" on its
 * own screen is context-free by construction. Here the user is looking at six
 * dated services when they are asked whether they want to be told about them.
 *
 * What the screen no longer does is fire the system prompt. That happened here,
 * one screen before the money ask, so the iOS alert landed on a user who was
 * about to be shown a price and the two modal decisions queued up behind each
 * other. Both buttons now record an intention and move on; the garage acts on
 * it once onboarding is over. The user's choice is unchanged, and so is the
 * context they make it in.
 *
 * "Not now" is a real answer and does not re-ask, from here or from the
 * garage. Reminders are half the product, and nagging for them is the other
 * half of the reviews this app was written against.
 */
export default function OnboardingPlan() {
  const advance = useAdvance("plan");
  const { vehicleName, plan } = useOnboardingFindings();

  function onRemindMe() {
    setNotifyIntent("yes");
    advance();
  }

  function onDecline() {
    setNotifyIntent("no");
    // The real outcome for this user, reported from the place it happened.
    // Nothing will ever ask them again, so there is no later event to wait
    // for and no system answer to attribute this to.
    trackNotificationPermission("deferred");
    advance();
  }

  const remaining = plan.items.length - SHOWN;
  const unit = getDistanceUnit();

  return (
    <OnboardingScreen
      route="plan"
      title={t("offer.plan.title")}
      subtitle={t("offer.plan.subtitle", { count: plan.items.length, vehicle: vehicleName })}
      footer={
        <>
          <Button label={t("offer.plan.cta")} onPress={onRemindMe} />
          <Pressable
            onPress={onDecline}
            style={{ alignItems: "center", paddingVertical: tokens.space.sm }}
          >
            <Text style={{ ...tokens.text.legend, color: tokens.color.textMuted }}>
              {t("offer.plan.decline")}
            </Text>
          </Pressable>
        </>
      }
    >
      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.xs }}>
          {plan.items.slice(0, SHOWN).map((item) => (
            <ListRow
              key={item.type}
              title={serviceName(item.type)}
              subtitle={planItemLine(item, unit)}
              status={ROW_STATUS[item.status]}
              right={<Badge label={t(STATUS_LABEL[item.status])} tone={item.status} />}
            />
          ))}
        </View>
      </Panel>

      <Text style={{ ...tokens.text.caption, color: tokens.color.textMuted }}>
        {remaining > 0 ? t("offer.plan.noteMore", { count: remaining }) : t("offer.plan.note")}
      </Text>
    </OnboardingScreen>
  );
}
