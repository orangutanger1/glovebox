import { listVehicles } from "../db/vehicles";
import { listRecords } from "../db/records";
import { getIntervals } from "../db/intervals";
import { dueStates } from "../schedule/due";
import { selectReminders, type Reminder } from "./select";
import { lastReadingAt } from "../db/checkin";
import { datedDocuments } from "../db/documents";
import { MAX_CHECKINS, nextCheckinAt } from "../checkin";
import { expiryAlerts, type DocumentKind } from "../documents";

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
  const now = new Date().toISOString();
  const out: Reminder[] = [];

  for (const vehicle of listVehicles()) {
    if (vehicleId && vehicle.id !== vehicleId) continue;
    // A service with only a mileage interval produces no dueAt and so never
    // notifies. There is no live odometer to trigger from; its due state is
    // shown in the app instead. The unit and odometer are not passed for the
    // same reason: nothing here reads the distance status.
    for (const s of dueStates({
      records: listRecords(vehicle.id),
      intervals,
      unit: "mi",
      now,
    })) {
      if (!s.dueAt) continue;
      out.push({
        vehicleName: vehicle.name,
        serviceType: s.type,
        dueAt: s.dueAt,
        lastPerformedAt: s.last.performed_at,
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

export type CheckinReminder = { vehicleId: string; vehicleName: string; at: string };

/**
 * One odometer check-in per car, soonest first, for at most `MAX_CHECKINS`
 * cars. See `../checkin` for why the date steps a month at a time.
 */
export function collectCheckins(now: number = Date.now()): CheckinReminder[] {
  return listVehicles()
    .map((v) => ({ vehicleId: v.id, vehicleName: v.name, at: nextCheckinAt(lastReadingAt(v), now) }))
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime())
    .slice(0, MAX_CHECKINS);
}

export type DocumentReminder = {
  documentId: string;
  vehicleId: string;
  vehicleName: string;
  kind: DocumentKind;
  issuer?: string;
  expiresAt: string;
  daysLeft: number;
  at: string;
};

/** Every future expiry alert across the garage, soonest first. */
export function collectDocumentAlerts(now: number = Date.now()): DocumentReminder[] {
  const out: DocumentReminder[] = [];
  for (const d of datedDocuments()) {
    for (const alert of expiryAlerts(d.expires_at, now)) {
      out.push({
        documentId: d.id,
        vehicleId: d.vehicle_id,
        vehicleName: d.vehicle_name,
        kind: d.kind,
        issuer: d.issuer,
        expiresAt: d.expires_at!,
        daysLeft: alert.daysLeft,
        at: alert.at,
      });
    }
  }
  return out.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
}
