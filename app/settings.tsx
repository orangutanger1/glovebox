import { useCallback, useState } from "react";
import { Alert, Linking, Text } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Screen } from "../src/design/Screen";
import { Card } from "../src/design/Card";
import { ListRow } from "../src/design/ListRow";
import { Button } from "../src/design/Button";
import { useTheme, useThemeMode } from "../src/design/theme";
import { type ThemeMode } from "../src/design/themeState";
import { tokens } from "../src/design/tokens";
import { t, formatShortDate, getLanguage } from "../src/i18n";
import { LANGUAGE_NAMES } from "../src/i18n/names";
import { notifyLocaleChanged } from "../src/i18n/epoch";
import {
  changeDistanceUnit,
  convertDistance,
  getDistanceUnit,
  type DistanceUnit,
} from "../src/units";
import { distanceUnitLabel, formatDistance } from "../src/units/format";
import { exportAndShare } from "../src/export/share";
import { restore, isPro, presentPaywall, presentCustomerCenter } from "../src/purchases";
import { openFeedback } from "../src/feedback";
import { useIsPro } from "../src/purchases/useIsPro";
import { requestPermission, rescheduleAll, reminderStatus, type ReminderStatus } from "../src/notify";
import { resetOnboarding } from "../src/onboarding";
import { recordReviewEvent, maybeRequestReview } from "../src/review";

const THEME_NEXT: Record<ThemeMode, ThemeMode> = {
  system: "light",
  light: "dark",
  dark: "system",
};

// Spelled out rather than built from the mode, so every key this screen reads
// is greppable in the catalog.
const THEME_VALUE: Record<ThemeMode, string> = {
  system: "settings.theme.system",
  light: "settings.theme.light",
  dark: "settings.theme.dark",
};

export default function Settings() {
  const c = useTheme();
  const { mode, setMode } = useThemeMode();

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
      setMsg(t("settings.export.error"));
    }
  }

  // Granting permission is only half of turning reminders on. Onboarding
  // rebuilt the schedule afterwards and this screen did not, so enabling
  // reminders here armed precisely nothing until the next cold start.
  async function onReminders() {
    if (reminders?.permission === "denied") {
      // Nothing else can be done in-app: once iOS has a hard denial recorded,
      // requestPermissionsAsync returns denied without ever prompting again.
      Linking.openSettings().catch(() => setMsg(t("settings.reminders.openSettings")));
      return;
    }

    try {
      if (reminders?.permission === "granted" || (await requestPermission())) {
        await rescheduleAll();
        await refreshReminders();
        setMsg(t("settings.reminders.scheduled"));
      } else {
        await refreshReminders();
        setMsg(t("settings.reminders.denied"));
      }
    } catch {
      setMsg(t("settings.reminders.error"));
    }
  }

  // The next date is a second whole message rather than a suffix on the first:
  // where it lands in the sentence is the translator's decision, not ours.
  function reminderLabel(): string {
    if (!reminders || reminders.permission === "undetermined") return t("settings.reminders.enable");
    if (reminders.permission === "denied") return t("settings.reminders.blocked");
    if (reminders.count === 0) return t("settings.reminders.none");
    if (reminders.nextAt) {
      return t("settings.reminders.onNext", {
        count: reminders.count,
        date: formatShortDate(reminders.nextAt),
      });
    }
    return t("settings.reminders.on", { count: reminders.count });
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
      setMsg(t("settings.store.error"));
      return;
    }
    router.push("/intervals");
  }

  async function onUpgrade() {
    try {
      if (await presentPaywall()) {
        recordReviewEvent("purchase");
        setMsg(t("settings.pro.on"));
      }
    } catch {
      setMsg(t("settings.store.error"));
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
          setMsg(t("settings.offer.applied"));
        },
      });
    } catch {
      setMsg(t("settings.manage.error"));
    }
  }

  async function onRestore() {
    try {
      setMsg((await restore()) ? t("settings.restore.done") : t("settings.restore.none"));
    } catch {
      setMsg(t("settings.store.error"));
    }
  }

  // Replaying is for seeing the flow again, so it must not read as a reset —
  // it leaves every vehicle and record alone and adds one more vehicle on the
  // way through, which the confirmation says out loud before anything happens.
  function onReplayOnboarding() {
    Alert.alert(t("settings.replay.title"), t("settings.replay.body"), [
      { text: t("settings.replay.cancel"), style: "cancel" },
      {
        text: t("settings.replay.confirm"),
        onPress: () => {
          resetOnboarding();
          router.replace("/onboarding/welcome");
        },
      },
    ]);
  }

  /**
   * Switching units rewrites every stored reading, so the confirmation says the
   * number out loud before anything moves.
   *
   * The alternative — relabelling the digits and leaving them alone — would turn
   * a 51,771 mi car into a 51,771 km car and bring its next oil change due 5,000
   * kilometres later than it should. An app that promises an honest log cannot
   * quietly change what its numbers mean.
   */
  function onUnits() {
    const from = getDistanceUnit();
    const to: DistanceUnit = from === "mi" ? "km" : "mi";
    Alert.alert(
      t("settings.units.title", { unit: distanceUnitLabel(to) }),
      t("settings.units.body", {
        from: distanceUnitLabel(from),
        to: distanceUnitLabel(to),
        example: formatDistance(convertDistance(50000, from, to), to),
      }),
      [
        { text: t("settings.units.cancel"), style: "cancel" },
        {
          text: t("settings.units.confirm"),
          onPress: () => {
            changeDistanceUnit(to);
            // Every gauge, chip and due line on the stack was formatted in the
            // old unit; the remount is what rebuilds them.
            notifyLocaleChanged();
          },
        },
      ]
    );
  }

  return (
    <Screen title={t("settings.title")}>
      <Card>
        <Text style={{ ...tokens.text.body, color: c.inkMuted }}>
          {t("settings.privacy")}
        </Text>
      </Card>
      <Button label={t("settings.export")} onPress={onExport} />
      <Button label={t("settings.intervals")} variant="secondary" onPress={onIntervals} />
      <Button label={reminderLabel()} variant="secondary" onPress={onReminders} />
      {/* Held back until the entitlement resolves. Rendering the free rows in
          the meantime shows a paying subscriber an advert for what they already
          bought. */}
      {pro === true ? (
        <Button label={t("settings.manage")} variant="secondary" onPress={onManageSubscription} />
      ) : pro === false ? (
        <>
          <Button label={t("settings.upgrade")} variant="secondary" onPress={onUpgrade} />
          <Button label={t("settings.restore")} variant="secondary" onPress={onRestore} />
        </>
      ) : null}
      <Button
        label={t("settings.units", { unit: distanceUnitLabel() })}
        variant="secondary"
        onPress={onUnits}
      />
      <Button
        label={t("settings.language", { language: LANGUAGE_NAMES[getLanguage()] })}
        variant="secondary"
        onPress={() => router.push("/language")}
      />
      {/* No confirmation: nothing on disk is rewritten and one more tap undoes it. */}
      <Card>
        <ListRow
          title={t("settings.theme.label")}
          right={
            <Text style={{ ...tokens.text.body, color: c.inkMuted }}>
              {t(THEME_VALUE[mode])}
            </Text>
          }
          onPress={() => setMode(THEME_NEXT[mode])}
        />
      </Card>
      <Button label={t("settings.replay")} variant="secondary" onPress={onReplayOnboarding} />
      {msg ? (
        <Text style={{ ...tokens.text.body, color: c.inkMuted }}>{msg}</Text>
      ) : null}
    </Screen>
  );
}
