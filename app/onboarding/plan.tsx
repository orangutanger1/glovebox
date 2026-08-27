import { useMemo, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { ListRow } from "../../src/design/ListRow";
import { Badge } from "../../src/design/Badge";
import { NotifyBanner } from "../../src/design/NotifyBanner";
import { tokens } from "../../src/design/tokens";
import { formatDate, t } from "../../src/i18n";
import { getDistanceUnit } from "../../src/units";
import { serviceName } from "../../src/schedule/names";
import {
  canAskPermission,
  nextReminder,
  requestPermission,
  rescheduleAll,
} from "../../src/notify";
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
 * Whether to ask is iOS's answer, not a flag this app keeps. The flag was the
 * second half of that bug: builds that deferred the prompt still stamped it, so
 * the tap that was supposed to raise the alert skipped the request entirely and
 * the button stayed silent forever.
 *
 * "Not now" is a real answer and nothing re-asks: the garage does not ask, and
 * Settings only asks when the user taps the reminders row themselves.
 * Reminders are half the product, and nagging for them is the other half of
 * the reviews this app was written against.
 *
 * Above the list is the notification itself, drawn as iOS will draw it, from
 * the reminder the app would schedule first: the same title and body strings
 * the scheduler passes to `scheduleNotificationAsync`, against this user's own
 * car, dated the day it will actually arrive. The ask is "may we send you
 * this", and until now the "this" was a sentence describing a message rather
 * than the message. It is absent, not faked, on a car whose services all have
 * mileage-only intervals: nothing would be scheduled, so nothing is shown.
 */
export default function OnboardingPlan() {
  const advance = useAdvance("plan");
  const { vehicle, vehicleName, plan } = useOnboardingFindings();
  const [busy, setBusy] = useState(false);
  // Scoped to the car this run owns, because a replay happens inside a garage
  // that already has reminders in it. The DB is not touched again while this
  // screen is up, and neither is the clock: one read at mount, like the
  // findings above it.
  const preview = useMemo(() => (vehicle ? nextReminder(vehicle.id) : undefined), [vehicle]);

  async function onRemindMe() {
    if (busy) return;
    setBusy(true);
    try {
      // Asked of iOS immediately before the request, so the alert appears on
      // this tap or the system has already refused to show one.
      if (await canAskPermission()) {
        const granted = await requestPermission();
        trackNotificationPermission(granted ? "granted" : "denied");
        // The service the quiz already logged has a due date; without this it
        // gets no notification until some later cold start, because the launch
        // that scheduled reminders ran before permission existed.
        if (granted) await rescheduleAll();
      } else {
        // Already granted, or hard-denied in a way no prompt can revisit. Both
        // are outcomes the funnel has to see, and neither is a decision made
        // here, so reminders are simply rebuilt against whatever iOS allows.
        await rescheduleAll();
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
      {preview && (
        <NotifyBanner
          title={t("system.notify.title", {
            vehicle: preview.vehicleName,
            service: serviceName(preview.serviceType),
          })}
          body={t("system.notify.body", { date: formatDate(preview.lastPerformedAt) })}
          when={formatDate(preview.dueAt)}
        />
      )}

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
