import * as Notifications from "expo-notifications";
import { SchedulableTriggerInputTypes } from "expo-notifications";
import { listVehicles } from "../db/vehicles";
import { listRecords } from "../db/records";
import { nextDue } from "../schedule";
import { getIntervals } from "../db/intervals";
import { serviceName } from "../schedule/names";
import { formatDate, t } from "../i18n";
import { selectReminders, type Reminder } from "./select";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

export { MAX_SCHEDULED, selectReminders, type Reminder } from "./select";

export type ReminderStatus = {
  permission: "granted" | "denied" | "undetermined";
  count: number;
  nextAt?: string;
};

/** Every service that has a due date, across every vehicle. */
function collectReminders(): Reminder[] {
  const intervals = getIntervals();
  const out: Reminder[] = [];

  for (const vehicle of listVehicles()) {
    const records = listRecords(vehicle.id);
    const latestByType = new Map<string, (typeof records)[number]>();
    for (const r of records) {
      if (!latestByType.has(r.service_type)) latestByType.set(r.service_type, r);
    }

    for (const [serviceType, record] of latestByType) {
      const interval = intervals[serviceType];
      if (!interval) continue;
      // A service with only a mileage interval produces no dueAt and so never
      // notifies. There is no live odometer to trigger from; its due state is
      // shown in the app instead.
      const { dueAt } = nextDue({
        lastPerformedAt: record.performed_at,
        lastOdometer: record.odometer,
        interval,
      });
      if (!dueAt) continue;
      out.push({
        vehicleName: vehicle.name,
        serviceType,
        dueAt,
        lastPerformedAt: record.performed_at,
      });
    }
  }

  return out;
}

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

  for (const reminder of selectReminders(collectReminders(), Date.now())) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: t("system.notify.title", {
          vehicle: reminder.vehicleName,
          service: serviceName(reminder.serviceType),
        }),
        body: t("system.notify.body", { date: formatDate(reminder.lastPerformedAt) }),
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
