import { useState } from "react";
import { View } from "react-native";
import { Button } from "../../src/design/Button";
import { Panel } from "../../src/design/Surface";
import { ListRow } from "../../src/design/ListRow";
import { Badge } from "../../src/design/Badge";
import { tokens } from "../../src/design/tokens";
import { t } from "../../src/i18n";
import { getDistanceUnit } from "../../src/units";
import { serviceName } from "../../src/schedule/names";
import {
  canAskPermission,
  requestPermission,
  rescheduleAll,
} from "../../src/notify";
import { trackNotificationPermission } from "../../src/analytics";
import { planItemLine } from "../../src/onboarding/plan";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useOnboardingFindings } from "../../src/onboarding/usePlan";
import { useAdvance } from "../../src/onboarding/nav";

const ROW_STATUS = { due: "overdue", soon: "soon", ok: "ok" } as const;

/** The status is a state name the schedule computes, not copy: it reaches the
 *  faceplate through a key so no language is stuck with the English word. */
const STATUS_LABEL = {
  due: "offer.plan.status.due",
  soon: "offer.plan.status.soon",
  ok: "offer.plan.status.ok",
} as const;

/** The whole schedule is real, but a screen with twelve rows on it is a
 *  document, not a plan. The subtitle counts the rest. */
const SHOWN = 6;

/**
 * The notification soft-ask, over this car's own dated schedule.
 *
 * The ask and the list are one screen because the permission only makes sense
 * next to the thing it delivers: iOS grants an app exactly one system prompt,
 * opt-in collapses when it fires without context, and "allow notifications?"
 * on a screen of its own is context-free by construction. Here the user is
 * looking at six dated services when they are asked whether they want to be
 * told about them, and "Never miss a service." is the promise those six rows
 * are the evidence for.
 *
 * The list is the schedule the quiz computed, worst first, with the status the
 * scheduler assigned on the right. It is this car's, not a mockup: a phone
 * drawn in the middle of the glass with an invented reminder on it sold what a
 * notification looks like, which is the one thing the user already knows.
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
  const { vehicleName, plan } = useOnboardingFindings();
  const [busy, setBusy] = useState(false);

  const unit = getDistanceUnit();

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

  return (
    <OnboardingScreen
      route="notify"
      title={t("offer.notify.title")}
      subtitle={t("offer.plan.subtitle", {
        count: plan.items.length,
        vehicle: vehicleName,
      })}
      footer={<Button label={t("offer.plan.cta")} onPress={onRemindMe} disabled={busy} />}
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
    </OnboardingScreen>
  );
}
