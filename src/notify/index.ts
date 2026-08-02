import * as Notifications from "expo-notifications";
import { SchedulableTriggerInputTypes } from "expo-notifications";
import { listVehicles } from "../db/vehicles";
import { listRecords } from "../db/records";
import { nextDue } from "../schedule";
import { getIntervals } from "../db/intervals";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: true,
  }),
});

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

  const intervals = getIntervals();

  for (const vehicle of listVehicles()) {
    const records = listRecords(vehicle.id);
    const latestByType = new Map<string, (typeof records)[number]>();
    for (const r of records) {
      if (!latestByType.has(r.service_type)) latestByType.set(r.service_type, r);
    }

    for (const [type, record] of latestByType) {
      const interval = intervals[type];
      if (!interval) continue;
      const { dueAt } = nextDue({
        lastPerformedAt: record.performed_at,
        lastOdometer: record.odometer,
        interval,
      });
      if (!dueAt) continue;
      const when = new Date(dueAt);
      if (when.getTime() <= Date.now()) continue;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: `${vehicle.name}: ${type} due`,
          body: `Last done ${record.performed_at.slice(0, 10)}.`,
        },
        trigger: { type: SchedulableTriggerInputTypes.DATE, date: when },
      });
    }
  }
}
