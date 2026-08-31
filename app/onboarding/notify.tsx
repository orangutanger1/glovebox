import { useEffect, useMemo, useState } from "react";
import { View, Text } from "react-native";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { ListRow } from "../../src/design/ListRow";
import { Badge } from "../../src/design/Badge";
import { NotifyBanner } from "../../src/design/NotifyBanner";
import { NotifyShade } from "../../src/design/NotifyShade";
import { tokens } from "../../src/design/tokens";
import { formatDate, formatDueIn, t } from "../../src/i18n";
import { vehicleSentenceName } from "../../src/format";
import { getDistanceUnit } from "../../src/units";
import { serviceName } from "../../src/schedule/names";
import {
  canAskPermission,
  nextReminder,
  reminderStatus,
  requestPermission,
  rescheduleAll,
} from "../../src/notify";
import { trackNotificationPermission } from "../../src/analytics";
import { planBadge, planItemLine, planRowStatus } from "../../src/onboarding/plan";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useOnboardingFindings } from "../../src/onboarding/usePlan";
import { useAdvance } from "../../src/onboarding/nav";

/** The status is a state name the schedule computes, not copy: it reaches the
 *  faceplate through a key so no language is stuck with the English word. */
const STATUS_LABEL = {
  due: "offer.plan.status.due",
  soon: "offer.plan.status.soon",
  ok: "offer.plan.status.ok",
  noRecord: "offer.plan.status.noRecord",
} as const;

/** The whole schedule is real, but a screen with twelve rows on it is a
 *  document, not a plan. The subtitle counts the rest. */
const SHOWN = 6;

/**
 * The notification soft-ask, shown as the notification it is asking to send.
 *
 * The ask and the message are one screen because the permission only makes
 * sense next to the thing it delivers: iOS grants an app exactly one system
 * prompt, opt-in collapses when it fires without context, and "allow
 * notifications?" on a screen of its own is context-free by construction.
 *
 * What sits on the glass is the app's own first reminder, drawn in the system's
 * appearance and seated in a dimmed notification stack, with the permission's
 * current state stamped under it. It is not a specimen: the title, the body and
 * the arrival are rendered from `nextReminder` through the same catalog keys the
 * scheduler will use, against this car's own records — so the user is looking at
 * the exact sentence iOS will show them, and there is nothing here the app does
 * not intend to send.
 *
 * A car whose services all carry mileage-only intervals has no next
 * notification, and no honest banner to draw. That screen falls back to the
 * dated schedule the quiz computed, worst first, which is the same evidence in
 * the only form that car can support.
 *
 * The prompt fires here, on the tap that promises it, asked of iOS immediately
 * before the request: the alert appears on this tap, or the system has already
 * refused to show one. There is no "Do it later": every screen in the flow is
 * mandatory, and the deferral was a second decline on a screen the system
 * already gives the user one — iOS's own alert has "Don't Allow" on it, and a
 * user who taps that is through to the paywall with reminders off and nothing
 * re-asking.
 */
export default function OnboardingNotify() {
  const advance = useAdvance("notify");
  const { vehicle, vehiclePhrase, plan } = useOnboardingFindings();
  const [busy, setBusy] = useState(false);
  const [granted, setGranted] = useState<boolean | null>(null);

  const unit = getDistanceUnit();
  // The soonest reminder this car would actually produce, read once: the
  // records cannot change while the flow is on screen.
  const reminder = useMemo(() => nextReminder(vehicle?.id), [vehicle?.id]);

  // Whether the stamp under the banner says reminders are off. Null until iOS
  // answers, and nothing is printed on a guess.
  useEffect(() => {
    let live = true;
    reminderStatus()
      .then((status) => live && setGranted(status.permission === "granted"))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, []);

  async function onRemindMe() {
    if (busy) return;
    setBusy(true);
    try {
      // Asked of iOS immediately before the request, so the alert appears on
      // this tap or the system has already refused to show one.
      if (await canAskPermission()) {
        const isGranted = await requestPermission();
        trackNotificationPermission(isGranted ? "granted" : "denied");
        // The service the quiz already logged has a due date; without this it
        // gets no notification until some later cold start, because the launch
        // that scheduled reminders ran before permission existed.
        if (isGranted) await rescheduleAll();
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

  return (
    <OnboardingScreen
      route="notify"
      title={t("offer.notify.title")}
      subtitle={t("offer.plan.subtitle", {
        count: plan.items.length,
        vehicle: vehiclePhrase,
      })}
      footer={<Button label={t("offer.plan.cta")} onPress={onRemindMe} disabled={busy} />}
    >
      {reminder ? (
        <View style={{ gap: tokens.space.lg }}>
          <NotifyShade>
            <NotifyBanner
              title={t("system.notify.title", {
                vehicle: vehicleSentenceName(reminder.vehicleName),
                service: serviceName(reminder.serviceType),
              })}
              body={t("system.notify.body", {
                date: formatDate(reminder.lastPerformedAt),
              })}
              when={formatDueIn(reminder.dueAt)}
            />
          </NotifyShade>
          {granted === false ? <RemindersOff /> : null}
        </View>
      ) : (
        <Panel>
          <View style={{ padding: tokens.space.md, gap: tokens.space.xs }}>
            {plan.items.slice(0, SHOWN).map((item) => {
              const badge = planBadge(item);
              return (
                <ListRow
                  key={item.type}
                  title={serviceName(item.type)}
                  subtitle={planItemLine(item, unit)}
                  status={planRowStatus(item)}
                  right={<Badge label={t(STATUS_LABEL[badge.state])} tone={badge.tone} />}
                />
              );
            })}
          </View>
        </Panel>
      )}
    </OnboardingScreen>
  );
}

/**
 * The stamp under the banner while iOS is not delivering any of this.
 *
 * Red, and the app's only use of it that is not an overdue service, because it
 * is the same class of fact: something the car needs is not going to reach the
 * driver. It disappears the moment permission exists, so the state is never
 * asserted about a system that has already agreed.
 */
function RemindersOff() {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: tokens.space.sm,
      }}
    >
      <View
        style={{
          width: 8,
          height: 8,
          borderRadius: 4,
          backgroundColor: tokens.color.red,
        }}
      />
      <Text style={{ ...tokens.text.legend, color: tokens.color.red }}>
        {t("offer.notify.off")}
      </Text>
    </View>
  );
}
