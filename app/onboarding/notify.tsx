import { useEffect, useMemo, useState } from "react";
import { View, Text } from "react-native";
import { Panel } from "../../src/design/Surface";
import { ListRow } from "../../src/design/ListRow";
import { Badge } from "../../src/design/Badge";
import { NotifyBanner } from "../../src/design/NotifyBanner";
import { Button } from "../../src/design/Button";
import { NotifyShade } from "../../src/design/NotifyShade";
import { tokens } from "../../src/design/tokens";
import { formatDate, formatDueIn, t } from "../../src/i18n";
import { vehicleSentenceName } from "../../src/format";
import { getDistanceUnit } from "../../src/units";
import { serviceName } from "../../src/schedule/names";
import { planBadge, planItemLine, planRowStatus } from "../../src/onboarding/plan";
import {
  canAskPermission,
  nextReminder,
  reminderStatus,
  requestPermission,
  rescheduleAll,
} from "../../src/notify";
import { trackNotificationPermission } from "../../src/analytics";
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
 * What sits on the glass is the reminder itself, drawn in code and seated in a
 * dimmed notification stack with the permission's current state stamped under
 * it: `system.notify.title` and `system.notify.body`, the exact two lines the
 * scheduler sends, rendered from `nextReminder` against this car's own records.
 * Nothing is promised here that the app does not deliver.
 *
 * English used to get a fixed still of that banner instead, and every other
 * language the drawn one. The still went when the copy was restructured to stop
 * iOS truncating the service off the end of the title — a picture of a sentence
 * the app no longer sends is the one thing this screen cannot show. Drawing it
 * in every language was already the better half of that arrangement: it follows
 * the catalog, and a screen that says "12 services on a schedule" in French over
 * "Last done May 4th" is the app losing the reader's language mid-sentence.
 *
 * A car whose services all carry mileage-only intervals has no next
 * notification, and no honest banner to draw for it. That case falls back to
 * the dated schedule the quiz computed, worst first — the same evidence, in the
 * only form that car can support.
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
  // Once per mount — the records cannot change while the flow is on screen.
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
    } finally {
      // Released before we leave, because this screen stays mounted after we
      // do: the next question is pushed on top of it, so a Back from there
      // returns to this instance. A `busy` left standing there is a dead
      // button on the screen the user has just walked back to, with the only
      // way out being another Back and then a Continue.
      setBusy(false);
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
                service: serviceName(reminder.serviceType),
              })}
              body={t("system.notify.body", {
                vehicle: vehicleSentenceName(reminder.vehicleName),
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
