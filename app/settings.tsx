import { useCallback, useState } from "react";
import { Alert, Linking, Text } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Screen } from "../src/design/Screen";
import { Card } from "../src/design/Card";
import { Button } from "../src/design/Button";
import { tokens } from "../src/design/tokens";
import { shortDate } from "../src/format";
import { exportAndShare } from "../src/export/share";
import { restore, isPro, presentPaywall, presentCustomerCenter } from "../src/purchases";
import { openFeedback } from "../src/feedback";
import { useIsPro } from "../src/purchases/useIsPro";
import { requestPermission, rescheduleAll, reminderStatus, type ReminderStatus } from "../src/notify";
import { resetOnboarding } from "../src/onboarding";
import { recordReviewEvent, maybeRequestReview } from "../src/review";

export default function Settings() {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const pro = useIsPro();
  const [reminders, setReminders] = useState<ReminderStatus | null>(null);

  // Re-read on every focus: permission can be revoked in iOS Settings while
  // the app is backgrounded, and coming back to a stale "Reminders on" is the
  // exact lie this row exists to prevent.
  useFocusEffect(
    useCallback(() => {
      let live = true;
      reminderStatus()
        .then((s) => live && setReminders(s))
        .catch(() => live && setReminders(null));
      return () => {
        live = false;
      };
    }, [])
  );

  async function refreshReminders() {
    try {
      setReminders(await reminderStatus());
    } catch {
      setReminders(null);
    }
  }

  // Every one of these calls out to the OS or to RevenueCat and can reject.
  // An unhandled rejection here left the user tapping a button that did
  // nothing and said nothing.
  async function onExport() {
    try {
      await exportAndShare();
      // Someone who just pulled their whole history out has proved the
      // durability promise to themselves. That is the app at its most
      // convincing, so it counts as much as logging a service.
      recordReviewEvent("export");
      setTimeout(() => void maybeRequestReview(), 1200);
    } catch {
      setMsg("Could not open the share sheet. Your records are unchanged.");
    }
  }

  // Granting permission is only half of turning reminders on. Onboarding
  // rebuilt the schedule afterwards and this screen did not, so enabling
  // reminders here armed precisely nothing until the next cold start.
  async function onReminders() {
    if (reminders?.permission === "denied") {
      // Nothing else can be done in-app: once iOS has a hard denial recorded,
      // requestPermissionsAsync returns denied without ever prompting again.
      Linking.openSettings().catch(() =>
        setMsg("Open iOS Settings › Glovebox › Notifications to turn reminders back on.")
      );
      return;
    }

    try {
      if (reminders?.permission === "granted" || (await requestPermission())) {
        await rescheduleAll();
        await refreshReminders();
        setMsg("Reminders scheduled.");
      } else {
        await refreshReminders();
        setMsg("Reminders denied. You can turn them on in iOS Settings.");
      }
    } catch {
      setMsg("Could not ask for notification permission.");
    }
  }

  function reminderLabel(): string {
    if (!reminders || reminders.permission === "undetermined") return "Enable reminders";
    if (reminders.permission === "denied") return "Reminders blocked — open iOS Settings";
    if (reminders.count === 0) return "Reminders on — nothing due yet";
    const next = reminders.nextAt ? `, next ${shortDate(reminders.nextAt)}` : "";
    return `Reminders on — ${reminders.count} scheduled${next}`;
  }

  // Gated before the screen, the same way Add vehicle is: showing someone a
  // full interval editor and only refusing at Save is the version of this that
  // wastes their time.
  async function onIntervals() {
    try {
      if (!(await isPro())) {
        const purchased = await presentPaywall();
        if (!purchased) return;
        recordReviewEvent("purchase");
      }
    } catch {
      setMsg("Could not reach the store. Try again on a better connection.");
      return;
    }
    router.push("/intervals");
  }

  async function onUpgrade() {
    try {
      if (await presentPaywall()) {
        recordReviewEvent("purchase");
        setMsg("Pro is on. Thank you.");
      }
    } catch {
      setMsg("Could not reach the store. Try again on a better connection.");
    }
  }

  /**
   * Cancelling, switching between monthly and annual, and asking for a refund
   * all live in here. The entitlement listener behind useIsPro picks up
   * whatever happened inside the sheet, so there is nothing to refresh after.
   *
   * It is also the app's only exit interview. RevenueCat's cancel path can
   * carry a custom row and a promotional offer, both configured in the
   * dashboard — point the row at the feedback form and a leaving subscriber
   * gets the same two things the win-back screen offers a leaving free user.
   * A custom URL is handed to the app to open; RevenueCat does not open it.
   */
  async function onManageSubscription() {
    try {
      await presentCustomerCenter({
        onManagementOptionSelected: ({ url }) => {
          if (url) void openFeedback(url);
        },
        onPromotionalOfferSucceeded: () => {
          recordReviewEvent("purchase");
          setMsg("That offer is applied. Nothing else to do.");
        },
      });
    } catch {
      setMsg("Could not open subscription settings. Try again on a better connection.");
    }
  }

  async function onRestore() {
    try {
      setMsg((await restore()) ? "Pro restored." : "No purchase found.");
    } catch {
      setMsg("Could not reach the store. Try again on a better connection.");
    }
  }

  // Replaying is for seeing the flow again, so it must not read as a reset —
  // it leaves every vehicle and record alone and adds one more vehicle on the
  // way through, which the confirmation says out loud before anything happens.
  function onReplayOnboarding() {
    Alert.alert(
      "Replay onboarding?",
      "Your vehicles and records are kept. Walking the flow again adds another vehicle, which you can delete afterwards.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Replay",
          onPress: () => {
            resetOnboarding();
            router.replace("/onboarding/welcome");
          },
        },
      ]
    );
  }

  return (
    <Screen title="Settings">
      <Card>
        <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
          Your records live on this phone only. No account, no server. Export any time — export is
          never gated.
        </Text>
      </Card>
      <Button label="Export all records (CSV)" onPress={onExport} />
      <Button label="Service intervals" variant="secondary" onPress={onIntervals} />
      <Button label={reminderLabel()} variant="secondary" onPress={onReminders} />
      {/* Held back until the entitlement resolves. Rendering the free rows in
          the meantime shows a paying subscriber an advert for what they already
          bought. */}
      {pro === true ? (
        <Button label="Manage subscription" variant="secondary" onPress={onManageSubscription} />
      ) : pro === false ? (
        <>
          <Button label="Upgrade to Pro" variant="secondary" onPress={onUpgrade} />
          <Button label="Restore purchases" variant="secondary" onPress={onRestore} />
        </>
      ) : null}
      <Button label="Replay onboarding" variant="secondary" onPress={onReplayOnboarding} />
      {msg ? (
        <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>{msg}</Text>
      ) : null}
    </Screen>
  );
}
