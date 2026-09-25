import { getDb } from "./client";
import { getState, setState } from "./state";
import { latest } from "../checkin";
import type { Vehicle } from "./vehicles";

const key = (vehicleId: string) => `odometer_read_at:${vehicleId}`;

/** Stamped whenever the owner answers a check-in, including "no change": a
 *  car that has not moved has still been read. */
export function markOdometerRead(vehicleId: string, at: Date = new Date()): void {
  setState(key(vehicleId), at.toISOString());
}

/**
 * When the app last learned this car's reading: an answered check-in, a
 * service logged with a mileage, a fill-up, or the day the car was added.
 * Whichever is latest is what the next check-in counts a month from, so an
 * owner who logs fuel every week is never asked for a number they just gave.
 */
export function lastReadingAt(vehicle: Pick<Vehicle, "id" | "created_at">): string {
  const record = getDb().getFirstSync<{ at: string | null }>(
    `SELECT MAX(performed_at) AS at FROM service_records
     WHERE vehicle_id = ? AND deleted_at IS NULL AND odometer IS NOT NULL`,
    [vehicle.id]
  );
  const fill = getDb().getFirstSync<{ at: string | null }>(
    `SELECT MAX(filled_at) AS at FROM fuel_entries
     WHERE vehicle_id = ? AND deleted_at IS NULL`,
    [vehicle.id]
  );
  return (
    latest(getState(key(vehicle.id)), record?.at, fill?.at, vehicle.created_at) ??
    vehicle.created_at
  );
}
