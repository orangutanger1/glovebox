import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { ListRow } from "../../src/design/ListRow";
import { Badge } from "../../src/design/Badge";
import { tokens } from "../../src/design/tokens";
import { t } from "../../src/i18n";
import { getDistanceUnit } from "../../src/units";
import { serviceName } from "../../src/schedule/names";
import { requestPermission, rescheduleAll } from "../../src/notify";
import { hasAskedNotifyPermission, markAskedNotifyPermission } from "../../src/notify/prompt";
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
 * The prompt fires here, on the tap. It was briefly deferred to the first mount
 * of the garage, on the theory that a system modal one screen ahead of the
 * money ask was one modal too many; what that produced was a user tapping
 * "Turn on reminders", being shown nothing at all, and then meeting the iOS
 * alert three screens later after the paywall, on a screen they had not asked
 * anything from. The permission belongs to the button that promises it.
 *
 * "Not now" is a real answer and nothing re-asks: the garage does not ask, and
 * Settings only asks when the user taps the reminders row themselves.
 * Reminders are half the product, and nagging for them is the other half of
 * the reviews this app was written against.
 */
export default function OnboardingPlan() {
  const advance = useAdvance("plan");
  const { vehicleName, plan } = useOnboardingFindings();
  const [busy, setBusy] = useState(false);

  async function onRemindMe() {
    if (busy) return;
    setBusy(true);
    // Stamped before the prompt is awaited: iOS shows its alert once per
    // install, and a force quit with it on the glass must not buy a second one.
    const first = !hasAskedNotifyPermission();
    markAskedNotifyPermission();
    try {
      if (first) {
        const granted = await requestPermission();
        trackNotificationPermission(granted ? "granted" : "denied");
        // The service the quiz already logged has a due date; without this it
        // gets no notification until some later cold start, because the launch
        // that scheduled reminders ran before permission existed.
        if (granted) await rescheduleAll();
      }
    } catch {
      // Unavailable, which is not a denial and is not the user's answer
      // either. The app works without notifications.
    }
    advance();
  }

  function onDecline() {
    // "Not now" spends nothing: iOS grants one prompt and this user has not
    // been shown it, so Settings can still offer reminders on a later tap.
    // Reported from here, because this is the real outcome for this user and
    // no system answer will ever arrive to attribute it to.
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
          <Button label={t("offer.plan.cta")} onPress={onRemindMe} disabled={busy} />
          <Pressable
            onPress={onDecline}
            disabled={busy}
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
