import { useEffect, useState } from "react";
import { Image, View, Text } from "react-native";
import { Button } from "../../src/design/Button";
import { NotifyShade } from "../../src/design/NotifyShade";
import { tokens } from "../../src/design/tokens";
import { t } from "../../src/i18n";
import {
  canAskPermission,
  reminderStatus,
  requestPermission,
  rescheduleAll,
} from "../../src/notify";
import { trackNotificationPermission } from "../../src/analytics";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useOnboardingFindings } from "../../src/onboarding/usePlan";
import { useAdvance } from "../../src/onboarding/nav";

const NOTIFICATION = require("../../assets/onboarding/notification.png");

/**
 * The notification soft-ask, shown as the notification it is asking to send.
 *
 * The ask and the message are one screen because the permission only makes
 * sense next to the thing it delivers: iOS grants an app exactly one system
 * prompt, opt-in collapses when it fires without context, and "allow
 * notifications?" on a screen of its own is context-free by construction.
 *
 * What sits on the glass is a picture of the reminder, seated in a dimmed
 * notification stack with the permission's current state stamped under it. The
 * art is a still of the real thing: the sentence on it is `system.notify.title`
 * and `system.notify.body` — the exact two lines the scheduler sends — over the
 * app's own icon, so nothing is promised here that the app does not deliver.
 *
 * It is a fixed image rather than a live render of this car's next reminder,
 * which is a deliberate trade. A live banner is personalised and honest to the
 * row, and it is also blank for the car whose services all carry mileage-only
 * intervals, ragged at the long vehicle names, and different on every device.
 * The still is the same on all of them. What it costs is the localisation: the
 * art is English, and a French user reads a French screen with an English
 * banner on it until a per-locale still exists.
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
  const { vehiclePhrase, plan } = useOnboardingFindings();
  const [busy, setBusy] = useState(false);
  const [granted, setGranted] = useState<boolean | null>(null);

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
      <View style={{ gap: tokens.space.lg }}>
        <NotifyShade>
          {/* Sized by its own aspect ratio, so the stack keeps its proportions
              on every width rather than being letterboxed into a fixed box. */}
          <Image
            source={NOTIFICATION}
            style={{ width: "100%", aspectRatio: 1100 / 248 }}
            resizeMode="contain"
            accessibilityIgnoresInvertColors
            accessibilityLabel={t("offer.notify.title")}
          />
        </NotifyShade>
        {granted === false ? <RemindersOff /> : null}
      </View>
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
