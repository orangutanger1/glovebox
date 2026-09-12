import * as Notifications from "expo-notifications";
import { SchedulableTriggerInputTypes } from "expo-notifications";
import { serviceName } from "../schedule/names";
import { formatDate, t } from "../i18n";
import { vehicleSentenceName } from "../format";
import { tNamed } from "../onboarding";
import { collectReminders } from "./collect";
import { selectReminders } from "./select";
import { scheduleOnboardingNudges } from "./resume";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

export { MAX_SCHEDULED, selectReminders, type Reminder } from "./select";
export { collectReminders, nextReminder, nextReminders } from "./collect";
export { scheduleOnboardingNudges, cancelOnboardingNudges, RESUME_NUDGE_IDS } from "./resume";

export type ReminderStatus = {
  permission: "granted" | "denied" | "undetermined";
  count: number;
  nextAt?: string;
};

export async function requestPermission(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Whether asking iOS would actually put an alert on the glass.
 *
 * iOS is the only honest record of this. The app used to keep its own flag and
 * skip the request whenever the flag was set, which is how "Turn on reminders"
 * came to do nothing visible: an earlier build stamped the flag on a screen
 * that only recorded an intention and deferred the real prompt, so the tap that
 * promises the alert found the flag already set and asked for nothing. A local
 * flag can only ever be a guess about a fact the system already holds.
 *
 * `canAskAgain` is false once the user has denied, and `requestPermissionsAsync`
 * would return denied without prompting in that case anyway; this just means the
 * caller can tell "nothing will appear" from "nothing appeared".
 */
export async function canAskPermission(): Promise<boolean> {
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  return status !== "granted" && canAskAgain;
}

/**
 * Clears and rebuilds every scheduled notification from the current records.
 * Cheap enough to call after any write; avoids drift between DB and OS state.
 */
export async function rescheduleAll(): Promise<void> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  // Rebuilt here rather than only where onboarding grants permission, because
  // this function clears the queue: any other caller — a logged service, a cold
  // start — would otherwise silently delete the nudges an unfinished flow is
  // relying on. A no-op once onboarding is done.
  await scheduleOnboardingNudges();

  for (const reminder of selectReminders(collectReminders(), Date.now())) {
    await Notifications.scheduleNotificationAsync({
      content: {
        // Addressed to the driver by name where the app has one. The name is
        // baked in at schedule time rather than at delivery time, which is the
        // only option iOS gives — a pending notification is a fixed string —
        // and is harmless here: `rescheduleAll` runs on every launch and after
        // every write, so a name typed today is in every reminder by tomorrow.
        // The service leads, because it is the payload and the title is the
        // line iOS truncates: a name, a user-typed vehicle and "Brake
        // Inspection" ran to seventy-odd characters against the forty iOS
        // gives, and the word that fell off the end was always the service.
        // The car moves to the body, which gets two lines and is not competing
        // with the driver's name for them.
        title: tNamed("system.notify.title", {
          service: serviceName(reminder.serviceType),
        }),
        body: t("system.notify.body", {
          vehicle: vehicleSentenceName(reminder.vehicleName),
          date: formatDate(reminder.lastPerformedAt),
        }),
      },
      trigger: { type: SchedulableTriggerInputTypes.DATE, date: new Date(reminder.dueAt) },
    });
  }
}

/**
 * What iOS is actually holding, as opposed to what the app believes it
 * scheduled. Settings shows this so that "are my reminders working" has an
 * answer that does not involve waiting six months for one to fire.
 */
export async function reminderStatus(): Promise<ReminderStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  const permission =
    status === "granted" ? "granted" : status === "denied" ? "denied" : "undetermined";

  if (permission !== "granted") return { permission, count: 0 };

  const pending = await Notifications.getAllScheduledNotificationsAsync();
  const times = pending
    .map((n) => {
      const trigger = n.trigger as { date?: number | string } | null;
      return trigger?.date === undefined ? NaN : new Date(trigger.date).getTime();
    })
    .filter((t) => !Number.isNaN(t))
    .sort((a, b) => a - b);

  return {
    permission,
    count: pending.length,
    nextAt: times.length ? new Date(times[0]).toISOString() : undefined,
  };
}
