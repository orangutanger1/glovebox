import { listVehicles } from "../db/vehicles";
import { listRecords } from "../db/records";
import { getIntervals } from "../db/intervals";
import { nextDue } from "../schedule";
import { selectReminders, type Reminder } from "./select";

/**
 * What the app would schedule right now, read from the records.
 *
 * Split out of `../notify` for the same reason `./select` was: that module
 * calls `setNotificationHandler` at import time, so anything that only wants
 * to *know* the next reminder — the onboarding preview, a test — had to drag
 * expo-notifications in behind it.
 */

/**
 * Every service that has a due date, across every vehicle — or across one,
 * which is what the onboarding preview needs: a replay runs in a garage that
 * already holds other cars, and the soonest reminder in the whole garage is
 * frequently not about the car the flow is talking about.
 */
export function collectReminders(vehicleId?: string): Reminder[] {
  const intervals = getIntervals();
  const out: Reminder[] = [];

  for (const vehicle of listVehicles()) {
    if (vehicleId && vehicle.id !== vehicleId) continue;
    const records = listRecords(vehicle.id);
    const latestByType = new Map<string, (typeof records)[number]>();
    for (const r of records) {
      if (!latestByType.has(r.service_type))
        latestByType.set(r.service_type, r);
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

/**
 * The ones that would fire first, soonest first, or an empty list.
 *
 * Empty is a real answer and the only honest one on a car whose services all
 * have mileage-only intervals: there is no next notification, and a screen
 * that showed a specimen one anyway would be advertising a message the app has
 * no intention of sending.
 */
export function nextReminders(
  vehicleId?: string,
  limit: number = 1,
  now: number = Date.now(),
): Reminder[] {
  return selectReminders(collectReminders(vehicleId), now, limit);
}

/** The single soonest, which is what a preview of one message needs. */
export function nextReminder(
  vehicleId?: string,
  now: number = Date.now(),
): Reminder | undefined {
  return nextReminders(vehicleId, 1, now)[0];
}
