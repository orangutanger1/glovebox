import * as Notifications from "expo-notifications";
import { SchedulableTriggerInputTypes } from "expo-notifications";
import { listVehicles } from "../db/vehicles";
import { listRecords } from "../db/records";
import { nextDue } from "../schedule";
import { getIntervals } from "../db/intervals";
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
        title: `${reminder.vehicleName}: ${reminder.serviceType} due`,
        body: `Last done ${reminder.lastPerformedAt.slice(0, 10)}.`,
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
