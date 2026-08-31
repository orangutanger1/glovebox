import { useCallback, useState } from "react";
import { Alert, Linking, Text, View } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Screen } from "../src/design/Screen";
import { Card } from "../src/design/Card";
import { Panel } from "../src/design/Surface";
import { ListRow } from "../src/design/ListRow";
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
        <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>
          {t("settings.privacy")}
        </Text>
      </Card>

      {/* Sections, not a stack of full-width buttons. Every row here was a
          primary-looking control of the same weight, so "Export all records"
          and "Language: English (US)" shouted equally loudly and the screen
          read as a debug menu. Grouped under legends, a row is a place to go
          and the panel it sits in says what kind of thing it changes. */}
      <Section legend={t("settings.section.data")}>
        <ListRow title={t("settings.export")} onPress={onExport} right={<Chevron />} />
        <ListRow title={t("settings.intervals")} onPress={onIntervals} right={<Chevron />} />
      </Section>

      <Section legend={t("settings.section.reminders")}>
        <ListRow
          title={reminderLabel()}
          onPress={onReminders}
          // A blocked permission is a fault the user has to go and clear in
          // iOS Settings, and it is the one row on this screen that is not
          // simply a destination.
          status={reminders?.permission === "denied" ? "overdue" : undefined}
          right={<Chevron />}
        />
      </Section>

      {/* Held back until the entitlement resolves. Rendering the free rows in
          the meantime shows a paying subscriber an advert for what they already
          bought. */}
      {pro === null ? null : (
        <Section legend={t("settings.section.membership")}>
          {pro ? (
            <ListRow title={t("settings.manage")} onPress={onManageSubscription} right={<Chevron />} />
          ) : (
            <>
              <ListRow title={t("settings.upgrade")} onPress={onUpgrade} right={<Chevron />} />
              <ListRow title={t("settings.restore")} onPress={onRestore} right={<Chevron />} />
            </>
          )}
        </Section>
      )}

      <Section legend={t("settings.section.preferences")}>
        <ListRow
          title={t("settings.units", { unit: distanceUnitLabel() })}
          onPress={onUnits}
          right={<Chevron />}
        />
        <ListRow
          title={t("settings.language", { language: LANGUAGE_NAMES[getLanguage()] })}
          onPress={() => router.push("/language")}
          right={<Chevron />}
        />
        <ListRow title={t("settings.replay")} onPress={onReplayOnboarding} right={<Chevron />} />
      </Section>

      {msg ? (
        <Text style={{ ...tokens.text.body, color: tokens.color.textMuted }}>{msg}</Text>
      ) : null}
    </Screen>
  );
}

/** A legend and the panel of rows it names. */
function Section({ legend, children }: { legend: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: tokens.space.sm }}>
      <Text style={{ ...tokens.text.legend, color: tokens.color.textFaint }}>{legend}</Text>
      <Panel>
        <View style={{ padding: tokens.space.md, gap: tokens.space.xs }}>{children}</View>
      </Panel>
    </View>
  );
}

/** The trailing mark on a row that opens something. Same glyph the garage card
 *  uses, so "this goes somewhere" looks the same in both places. */
function Chevron() {
  return <Text style={{ ...tokens.text.body, color: tokens.color.textFaint }}>›</Text>;
}
