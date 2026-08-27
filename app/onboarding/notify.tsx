import { useMemo, useState } from "react";
import { View, Text, Pressable } from "react-native";
import { Button } from "../../src/design/Button";
import { PhoneNotify, type NotifyRotation } from "../../src/design/PhoneNotify";
import { tokens } from "../../src/design/tokens";
import { formatDate, t } from "../../src/i18n";
import { serviceName } from "../../src/schedule/names";
import {
  canAskPermission,
  requestPermission,
  rescheduleAll,
} from "../../src/notify";
import { trackNotificationPermission } from "../../src/analytics";
import { OnboardingScreen } from "../../src/onboarding/Screen";
import { useOnboardingFindings } from "../../src/onboarding/usePlan";
import { useAdvance } from "../../src/onboarding/nav";

/**
 * The notification soft-ask, on its own screen.
 *
 * It used to ride on top of the plan, and the two shared a screen on the theory
 * that a permission only makes sense next to the thing it delivers. What that
 * produced was a banner dropping in and lifting away over a list the user was
 * trying to read — an animation competing with the schedule beneath it for the
 * same attention. Split out, the ask is the whole screen: a handset held up in
 * the middle of the glass with a reminder on its lock screen, the headline
 * under it, and the two answers at the foot.
 *
 * The banner does not arrive and leave. A drop-in is the truthful animation for
 * "a notification is an event", but that argument belongs to a screen the user
 * is doing something else on; here the handset is the subject, so it holds still
 * and the service on it cycles instead — oil change, air filter, inspection —
 * so the reader reads the promise against a handful of the services it covers
 * rather than one.
 *
 * The strings are the scheduler's own, rendered against this user's own car by
 * name, so "Your {vehicle}'s {service} is due" is the sentence iOS would really
 * put on the glass. The services are the common ones the app ships an opinion
 * about rather than this car's logged history: the quiz logs one service, and a
 * rotation of one is not a rotation. This screen sells what reminders are; the
 * plan on the screen after it is where this car's own dated schedule lands.
 *
 * The prompt fires here, on the tap that promises it. iOS grants exactly one
 * system prompt and opt-in collapses when it fires without context, so the
 * request is asked of iOS immediately before it is made: the alert appears on
 * this tap, or the system has already refused to show one. "Do it later" is a
 * real answer and nothing re-asks — Settings offers reminders on a later tap,
 * and iOS still holds the one unused prompt for it.
 */

/** The services the handset cycles through — the common ones the app ships an
 *  opinion about, in the reader's language via `serviceName`. */
const ROTATION = [
  "Oil Change",
  "Air Filter",
  "Inspection",
  "Tire Rotation",
  "Brake Inspection",
];

/** A plausible "last done" for each rotated service, in days back, so the body
 *  line reads like a real reminder rather than every card claiming the same
 *  date. Illustrative, not this car's record. */
const LAST_DONE_DAYS = [150, 220, 300, 95, 260];

const DAY_MS = 24 * 60 * 60 * 1000;

export default function OnboardingNotify() {
  const advance = useAdvance("notify");
  const { vehicleName } = useOnboardingFindings();
  const [busy, setBusy] = useState(false);

  const messages = useMemo<NotifyRotation[]>(
    () =>
      ROTATION.map((type, i) => ({
        title: t("system.notify.title", {
          vehicle: vehicleName,
          service: serviceName(type),
        }),
        body: t("system.notify.body", {
          date: formatDate(new Date(Date.now() - LAST_DONE_DAYS[i] * DAY_MS).toISOString()),
        }),
        when: t("system.notify.when.now"),
      })),
    [vehicleName],
  );

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
    // "Do it later" spends nothing: iOS grants one prompt and this user has not
    // been shown it, so Settings can still offer reminders on a later tap.
    trackNotificationPermission("deferred");
    advance();
  }

  return (
    <OnboardingScreen
      route="notify"
      center
      footer={
        <>
          <Button
            label={t("offer.plan.cta")}
            onPress={onRemindMe}
            disabled={busy}
          />
          <Pressable
            onPress={onDecline}
            disabled={busy}
            style={{ alignItems: "center", paddingVertical: tokens.space.sm }}
          >
            <Text style={{ ...tokens.text.legend, color: tokens.color.textMuted }}>
              {t("offer.notify.decline")}
            </Text>
          </Pressable>
        </>
      }
    >
      <View style={{ alignItems: "center", gap: tokens.space.xl }}>
        <PhoneNotify messages={messages} date={formatDate(new Date().toISOString())} />
        <Text
          style={{
            ...tokens.text.hero,
            color: tokens.color.text,
            textAlign: "center",
          }}
        >
          {t("offer.notify.title")}
        </Text>
      </View>
    </OnboardingScreen>
  );
}
